from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from lead_management.models import Customer

User = get_user_model()


class AMCType(models.TextChoices):
    COMPREHENSIVE = 'comprehensive', 'Comprehensive'
    NON_COMPREHENSIVE = 'non_comprehensive', 'Non-Comprehensive'
    WARRANTY = 'warranty', '1 Year Warranty (4 Quarterly Free Services)'


class PaymentFrequency(models.TextChoices):
    ANNUAL = 'annual', 'Annual'
    QUARTERLY = 'quarterly', 'Quarterly'
    MONTHLY = 'monthly', 'Monthly'
    HALF_YEARLY = 'half_yearly', 'Half-Yearly'


class AMCStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    INACTIVE = 'inactive', 'Inactive'
    EXPIRING_SOON = 'expiring_soon', 'Expiring Soon'
    EXPIRED = 'expired', 'Expired'
    SCHEDULED = 'scheduled', 'Scheduled'
    RENEWED = 'renewed', 'Renewed'


class AMCContract(models.Model):
    contract_id = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name="Contract ID")
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='amc_contracts',
        verbose_name="Customer"
    )
    project_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Project Name")
    product = models.CharField(max_length=255, verbose_name="Product")
    amc_type = models.CharField(
        max_length=50,
        choices=AMCType.choices,
        default=AMCType.COMPREHENSIVE,
        verbose_name="AMC Type"
    )
    # Synced header fields from current active cycle
    start_date = models.DateField(blank=True, null=True, verbose_name="Start Date")
    end_date = models.DateField(blank=True, null=True, verbose_name="End Date")
    annual_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        verbose_name="Annual Value (₹)"
    )
    payment_frequency = models.CharField(
        max_length=50,
        choices=PaymentFrequency.choices,
        default=PaymentFrequency.QUARTERLY,
        verbose_name="Payment Frequency"
    )
    support_coordinator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='coordinated_amcs',
        verbose_name="Support Coordinator"
    )
    assigned_technician = models.ForeignKey(
        'service_management.Technician',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='assigned_amcs',
        verbose_name="Assigned Technician"
    )
    linked_service = models.ForeignKey(
        'service_management.ServiceRequest',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='linked_amc_contracts',
        verbose_name="Linked Service Call"
    )
    scope_of_support = models.TextField(blank=True, null=True, verbose_name="Scope of Support")
    per_visit_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        verbose_name="Per Visit Amount (₹)"
    )
    default_customer_contact = models.CharField(max_length=50, blank=True, null=True, verbose_name="Default Customer Contact")
    default_customer_address = models.TextField(blank=True, null=True, verbose_name="Default Customer Address")
    default_gps_location = models.URLField(blank=True, null=True, verbose_name="Default GPS Location")
    default_work_description = models.TextField(blank=True, null=True, verbose_name="Default Work Description")

    RENEWAL_CHOICES = [
        ("PENDING", "Pending"),
        ("REQUESTED", "Requested"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("NOT_RENEWED", "Not Renewed"),
    ]
    renewal_status = models.CharField(
        max_length=20,
        choices=RENEWAL_CHOICES,
        default="PENDING",
        verbose_name="Renewal Status"
    )
    renewal_requested_at = models.DateTimeField(null=True, blank=True, verbose_name="Renewal Requested At")

    status = models.CharField(
        max_length=50,
        choices=AMCStatus.choices,
        default=AMCStatus.ACTIVE,
        verbose_name="Status"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='amc_contracts_created',
        verbose_name="Created By"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    def generate_contract_id(self):
        last_amc = AMCContract.objects.order_by('-id').first()
        if last_amc and last_amc.contract_id:
            try:
                num = int(last_amc.contract_id.replace("AMC-", "").replace("AMC", ""))
                new_num = num + 1
            except ValueError:
                new_num = 1
        else:
            new_num = 1
        return f"AMC-{new_num:03d}"

    def sync_active_cycle_data(self):
        """Auto-evaluates cycle statuses against today's date and syncs active cycle info to contract header."""
        today = timezone.now().date()
        cycles = list(self.cycles.all().order_by('cycle_number'))
        if not cycles:
            return

        for cycle in cycles:
            if cycle.status == AMCStatus.INACTIVE:
                continue

            c_start = cycle.start_date
            c_end = cycle.end_date

            if c_end and c_end < today:
                if cycle.status != AMCStatus.EXPIRED:
                    cycle.status = AMCStatus.EXPIRED
                    cycle.save(update_fields=['status'])
            elif c_start and c_end and c_start <= today <= c_end:
                new_st = AMCStatus.EXPIRING_SOON if (c_end - today).days <= 30 else AMCStatus.ACTIVE
                if cycle.status != new_st:
                    cycle.status = new_st
                    cycle.save(update_fields=['status'])
            elif c_start and c_start > today:
                if cycle.status != AMCStatus.SCHEDULED:
                    cycle.status = AMCStatus.SCHEDULED
                    cycle.save(update_fields=['status'])

        # Pick active/running cycle or fallback to scheduled / latest
        active_cycle = self.cycles.filter(status__in=[AMCStatus.ACTIVE, AMCStatus.EXPIRING_SOON]).order_by('-cycle_number').first()
        if not active_cycle:
            active_cycle = self.cycles.filter(status=AMCStatus.SCHEDULED).order_by('cycle_number').first() or cycles[-1]

        if active_cycle:
            self.start_date = active_cycle.start_date
            self.end_date = active_cycle.end_date
            self.annual_value = active_cycle.annual_value
            self.payment_frequency = active_cycle.payment_frequency
            
            # If contract has been renewed with 2 or more cycles, mark status as RENEWED
            if len(cycles) > 1 and active_cycle.status != AMCStatus.INACTIVE:
                self.status = AMCStatus.RENEWED
            else:
                self.status = active_cycle.status

            super().save(update_fields=['start_date', 'end_date', 'annual_value', 'payment_frequency', 'status', 'updated_at'])

    def generate_warranty_services(self):
        """Generates 4 quarterly free ServiceRequest records for 1-Year Warranty contract."""
        if self.amc_type != AMCType.WARRANTY:
            return []

        from service_management.models import ServiceRequest, ServiceType, ServiceStatus, ServicePriority
        from datetime import timedelta

        base_start = self.start_date or timezone.now().date()
        created_services = []

        for q in range(1, 5):
            # Quarterly interval (~91 days per quarter)
            scheduled_d = base_start + timedelta(days=91 * q)
            title_str = f"Quarterly Free Warranty Service #{q} (Q{q})"

            existing = ServiceRequest.objects.filter(
                amc_contract=self,
                title__icontains=f"Warranty Service #{q}"
            ).first()

            if not existing:
                srv = ServiceRequest.objects.create(
                    service_type=ServiceType.WARRANTY,
                    amc_contract=self,
                    customer=self.customer,
                    product_name=self.product,
                    title=title_str,
                    description=f"Automated quarterly free warranty service visit Q{q} under 1-Year Warranty contract {self.contract_id or ''}.",
                    priority=ServicePriority.MEDIUM,
                    status=ServiceStatus.UNASSIGNED,
                    scheduled_date=scheduled_d,
                    service_cost=0.00,
                    created_by=self.created_by
                )
                created_services.append(srv)

        return created_services

    def generate_schedule(self):
        """
        Generates/syncs scheduled ServiceRequest visits based on payment frequency & contract dates.
        Calculates per_visit_amount = annual_value / total_visits.
        """
        if self.amc_type == AMCType.WARRANTY:
            return self.generate_warranty_services()

        from service_management.models import ServiceRequest, ServiceType, ServiceStatus, ServicePriority
        from dateutil.relativedelta import relativedelta

        base_start = self.start_date or timezone.now().date()

        freq = (self.payment_frequency or 'quarterly').lower()
        if freq == 'monthly':
            total_visits = 12
            month_step = 1
        elif freq == 'half_yearly':
            total_visits = 2
            month_step = 6
        elif freq == 'annual':
            total_visits = 1
            month_step = 12
        else:  # quarterly
            total_visits = 4
            month_step = 3

        ann_val = float(self.annual_value or 0)
        calc_per_visit = ann_val / total_visits if total_visits > 0 else 0
        self.per_visit_amount = calc_per_visit

        if self.pk:
            AMCContract.objects.filter(pk=self.pk).update(per_visit_amount=calc_per_visit)

        created_services = []

        for visit_num in range(1, total_visits + 1):
            scheduled_d = base_start + relativedelta(months=month_step * (visit_num - 1))
            title_str = f"Scheduled AMC Visit #{visit_num} ({self.get_payment_frequency_display() or freq.title()})"

            existing = ServiceRequest.objects.filter(
                amc_contract=self,
                title__icontains=f"AMC Visit #{visit_num}"
            ).first()

            if not existing:
                srv = ServiceRequest.objects.create(
                    service_type=ServiceType.AMC,
                    amc_contract=self,
                    customer=self.customer,
                    product_name=self.product,
                    title=title_str,
                    description=self.default_work_description or f"Scheduled AMC service visit #{visit_num} under contract {self.contract_id or ''}.",
                    priority=ServicePriority.MEDIUM,
                    status=ServiceStatus.UNASSIGNED,
                    is_allocated=False,
                    assigned_technician=self.assigned_technician,
                    scheduled_date=scheduled_d,
                    service_cost=calc_per_visit,
                    created_by=self.created_by
                )
                created_services.append(srv)
            else:
                created_services.append(existing)

        return created_services

    def save(self, *args, **kwargs):
        if not self.contract_id:
            self.contract_id = self.generate_contract_id()
        if self.start_date and not self.end_date:
            from dateutil.relativedelta import relativedelta
            from datetime import timedelta
            self.end_date = self.start_date + relativedelta(years=1) - timedelta(days=1)
        super().save(*args, **kwargs)

    def __str__(self):
        cust_name = getattr(self.customer, 'name', None) or getattr(self.customer, 'company_name', None) or 'No Customer' if self.customer else 'No Customer'
        return f"{self.contract_id or ''} - {cust_name} ({self.product})"

    class Meta:
        ordering = ['-updated_at', '-created_at']
        verbose_name = "AMC Contract"
        verbose_name_plural = "AMC Contracts"


class AMCCycle(models.Model):
    amc_contract = models.ForeignKey(
        AMCContract,
        on_delete=models.CASCADE,
        related_name='cycles',
        verbose_name="AMC Contract"
    )
    cycle_number = models.PositiveIntegerField(default=1, verbose_name="Cycle #")
    start_date = models.DateField(verbose_name="Start Date")
    end_date = models.DateField(verbose_name="End Date")
    annual_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        verbose_name="Annual Value (₹)"
    )
    payment_frequency = models.CharField(
        max_length=50,
        choices=PaymentFrequency.choices,
        default=PaymentFrequency.QUARTERLY,
        verbose_name="Payment Frequency"
    )
    status = models.CharField(
        max_length=50,
        choices=AMCStatus.choices,
        default=AMCStatus.ACTIVE,
        verbose_name="Status"
    )
    remarks = models.TextField(blank=True, null=True, verbose_name="Notes / Remarks")
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='amc_cycles_created',
        verbose_name="Created By"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")

    class Meta:
        ordering = ['-cycle_number']
        verbose_name = "AMC Cycle"
        verbose_name_plural = "AMC Cycles"

    def __str__(self):
        return f"{self.amc_contract.contract_id or 'AMC'} - Cycle #{self.cycle_number} ({self.status})"





# ============================================================================
# AMC SERVICE SCHEDULE - Planned service dates
# ============================================================================
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


# ============================================================================
# AMC SERVICE VISIT - Actual service records with technician allocation
# ============================================================================
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
            self.amc_contract.status = AMCStatus.EXPIRED
            self.amc_contract.save(update_fields=['status'])
    
    def __str__(self):
        contract_id = self.amc_contract.contract_id if self.amc_contract else "No Contract"
        product_name = self.product.name if self.product else "General"
        return f"{contract_id} - {self.service_date} - {product_name}"


# ============================================================================
# AMC RENEWAL - Track renewal requests
# ============================================================================
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
