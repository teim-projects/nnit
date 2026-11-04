# NEW ENHANCED AMC MODELS
# This file contains the additional models to add to your existing amc/models.py

# Add these imports at the top of models.py:
from datetime import timedelta
from dateutil.relativedelta import relativedelta
import uuid

# Add this helper function after imports:
def generate_contract_number():
    """Generate unique contract number"""
    return f"AMC-{uuid.uuid4().hex[:8].upper()}"


# ADD THESE NEW MODELS to your amc/models.py (after AMCCycle model):

class AMCServiceSchedule(models.Model):
    """
    Planned/Scheduled AMC service dates.
    Created automatically when AMC contract is generated.
    """
    amc_contract = models.ForeignKey(
        'AMCContract',
        on_delete=models.CASCADE,
        related_name='service_schedules',
        verbose_name="AMC Contract"
    )
    service_date = models.DateField(verbose_name="Scheduled Service Date")
    
    # Reminder tracking
    reminder_sent = models.BooleanField(default=False, verbose_name="Reminder Email Sent")
    reminder_sent_at = models.DateTimeField(null=True, blank=True, verbose_name="Reminder Sent At")
    
    # Status tracking
    is_completed = models.BooleanField(default=False, verbose_name="Completed")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Completed At")
    
    is_approved = models.BooleanField(default=False, verbose_name="Approved by Admin")
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name="Approved At")
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_schedules',
        verbose_name="Approved By"
    )
    
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    
    class Meta:
        db_table = 'amc_service_schedules'
        ordering = ['service_date']
        verbose_name = "AMC Service Schedule"
        verbose_name_plural = "AMC Service Schedules"
        unique_together = ['amc_contract', 'service_date']
    
    def __str__(self):
        contract_id = self.amc_contract.contract_id if self.amc_contract else "No Contract"
        return f"{contract_id} - {self.service_date}"


class AMCServiceVisit(models.Model):
    """
    Actual service visit records.
    Created when service is allocated to technician.
    """
    ALLOCATION_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ALLOCATED', 'Allocated'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    amc_contract = models.ForeignKey(
        'AMCContract',
        on_delete=models.CASCADE,
        related_name='visits',
        verbose_name="AMC Contract"
    )
    service_date = models.DateField(verbose_name="Service Date")
    
    # Link to product if multi-product AMC
    product = models.ForeignKey(
        'product_management.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='amc_visits',
        verbose_name="Product"
    )
    
    # Technician assignment (can be multiple)
    technicians = models.ManyToManyField(
        'service_management.Technician',
        blank=True,
        related_name='amc_service_visits',
        verbose_name="Assigned Technicians"
    )
    
    # Link to CRM service request (when work is allocated)
    crm_service = models.ForeignKey(
        'service_management.ServiceRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='amc_visit_records',
        verbose_name="Linked Service Request"
    )
    crm_service_created_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Service Request Created At"
    )
    
    # Visit details
    allocation_status = models.CharField(
        max_length=20,
        choices=ALLOCATION_STATUS_CHOICES,
        default='PENDING',
        verbose_name="Allocation Status"
    )
    auto_allocation_done = models.BooleanField(
        default=False,
        verbose_name="Auto Allocated by System"
    )
    
    remarks = models.TextField(blank=True, null=True, verbose_name="Visit Remarks")
    allocation_cancelled_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name="Cancellation Reason"
    )
    
    # Rescheduling tracking
    rescheduled_from = models.DateField(
        null=True,
        blank=True,
        verbose_name="Original Date (if rescheduled)"
    )
    reschedule_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name="Reschedule Reason"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    
    class Meta:
        db_table = 'amc_service_visits'
        ordering = ['-service_date']
        verbose_name = "AMC Service Visit"
        verbose_name_plural = "AMC Service Visits"
    
    def stop_future_visits_for_product(self):
        """
        If product service is marked complete, cancel all future pending visits for same product.
        """
        if not self.product:
            return
        
        # Cancel future pending visits for this product
        AMCServiceVisit.objects.filter(
            amc_contract=self.amc_contract,
            product=self.product,
            service_date__gt=self.service_date,
            allocation_status='PENDING'
        ).update(
            allocation_status='CANCELLED',
            allocation_cancelled_reason='Auto-stopped: Product service completed'
        )
        
        # Check if all visits are done - if yes, mark contract as completed
        pending_visits = AMCServiceVisit.objects.filter(
            amc_contract=self.amc_contract,
            allocation_status='PENDING'
        ).exists()
        
        if not pending_visits:
            self.amc_contract.status = 'COMPLETED'
            self.amc_contract.save(update_fields=['status'])
    
    def __str__(self):
        contract_id = self.amc_contract.contract_id if self.amc_contract else "No Contract"
        product_name = self.product.product_name if self.product else "General"
        return f"{contract_id} - {self.service_date} - {product_name}"


class AMCRenewal(models.Model):
    """
    Track AMC renewal requests from customers.
    """
    RENEWAL_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('REQUESTED', 'Customer Requested Renewal'),
        ('APPROVED', 'Approved by Admin'),
        ('REJECTED', 'Rejected'),
        ('NOT_RENEWED', 'Customer Declined Renewal'),
        ('COMPLETED', 'Renewal Completed (New Cycle Created)'),
    ]
    
    amc_contract = models.ForeignKey(
        'AMCContract',
        on_delete=models.CASCADE,
        related_name='renewal_requests',
        verbose_name="AMC Contract"
    )
    
    status = models.CharField(
        max_length=20,
        choices=RENEWAL_STATUS_CHOICES,
        default='PENDING',
        verbose_name="Renewal Status"
    )
    
    # Customer response
    customer_requested_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Customer Requested At"
    )
    customer_response = models.TextField(
        blank=True,
        null=True,
        verbose_name="Customer Response/Notes"
    )
    
    # Admin action
    admin_action_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='amc_renewals_processed',
        verbose_name="Processed By"
    )
    admin_action_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Processed At"
    )
    admin_notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Admin Notes"
    )
    
    # New cycle details (if approved)
    new_cycle = models.ForeignKey(
        'AMCCycle',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='renewal_record',
        verbose_name="New Cycle Created"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    
    class Meta:
        db_table = 'amc_renewals'
        ordering = ['-created_at']
        verbose_name = "AMC Renewal Request"
        verbose_name_plural = "AMC Renewal Requests"
    
    def __str__(self):
        contract_id = self.amc_contract.contract_id if self.amc_contract else "No Contract"
        return f"{contract_id} - Renewal ({self.get_status_display()})"


# ADD THESE FIELDS TO EXISTING AMCContract MODEL:
# (Add these fields to your existing AMCContract class)

"""
# Add to AMCContract model:

# Email reminder tracking
reminder_15_days_sent = models.BooleanField(
    default=False,
    verbose_name="15-Day Reminder Sent"
)
reminder_15_days_sent_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="15-Day Reminder Sent At"
)
expiry_mail_sent = models.BooleanField(
    default=False,
    verbose_name="Expiry Mail Sent"
)
expiry_mail_sent_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="Expiry Mail Sent At"
)

# Service frequency (from old code)
frequency = models.CharField(
    max_length=20,
    blank=True,
    null=True,
    help_text="Service frequency: Monthly, Weekly, Fortnight, Daily, or number (1-12)"
)

# Add this property method to AMCContract:
@property
def next_service_date(self):
    '''Returns the next upcoming service date'''
    next_visit = self.visits.filter(
        service_date__gte=timezone.now().date(),
        allocation_status='PENDING'
    ).order_by('service_date').first()
    return next_visit.service_date if next_visit else None
"""
