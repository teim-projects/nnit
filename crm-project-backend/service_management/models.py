from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from lead_management.models import Customer

User = get_user_model()


class TechnicianStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    INACTIVE = 'inactive', 'Inactive'
    ON_LEAVE = 'on_leave', 'On Leave'


class ServiceType(models.TextChoices):
    WARRANTY = 'warranty', 'Warranty Service'
    AMC = 'amc', 'AMC Service'
    NORMAL = 'normal', 'Normal Service'


class ServicePriority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class ServiceStatus(models.TextChoices):
    UNASSIGNED = 'unassigned', 'Unassigned'
    ASSIGNED = 'assigned', 'Assigned'
    IN_PROGRESS = 'in_progress', 'In Progress'
    ON_HOLD = 'on_hold', 'On Hold'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class Technician(models.Model):
    technician_id = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name="Technician ID")
    name = models.CharField(max_length=255, verbose_name="Technician Name")
    email = models.EmailField(blank=True, null=True, verbose_name="Email Address")
    phone = models.CharField(max_length=20, verbose_name="Phone / Mobile")
    specialization = models.CharField(
        max_length=100,
        default="General Maintenance",
        verbose_name="Specialization / Skill"
    )
    status = models.CharField(
        max_length=50,
        choices=TechnicianStatus.choices,
        default=TechnicianStatus.ACTIVE,
        verbose_name="Status"
    )
    experience_years = models.PositiveIntegerField(default=0, verbose_name="Experience (Years)")
    address = models.TextField(blank=True, null=True, verbose_name="Address")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    def generate_technician_id(self):
        last_tech = Technician.objects.order_by('-id').first()
        if last_tech and last_tech.technician_id:
            try:
                num = int(last_tech.technician_id.replace("TECH-", "").replace("TECH", ""))
                new_num = num + 1
            except ValueError:
                new_num = 1
        else:
            new_num = 1
        return f"TECH-{new_num:03d}"

    def save(self, *args, **kwargs):
        if not self.technician_id:
            self.technician_id = self.generate_technician_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.technician_id or ''} - {self.name} ({self.specialization})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Technician"
        verbose_name_plural = "Technicians"


class ServiceRequest(models.Model):
    service_id = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name="Service ID")
    service_type = models.CharField(
        max_length=50,
        choices=ServiceType.choices,
        default=ServiceType.NORMAL,
        verbose_name="Service Type"
    )
    amc_contract = models.ForeignKey(
        'amc.AMCContract',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='service_requests',
        verbose_name="AMC Contract"
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='service_requests',
        verbose_name="Customer"
    )
    product_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Product / Equipment"
    )
    title = models.CharField(max_length=255, verbose_name="Service Title / Subject")
    description = models.TextField(blank=True, null=True, verbose_name="Problem / Service Description")
    priority = models.CharField(
        max_length=50,
        choices=ServicePriority.choices,
        default=ServicePriority.MEDIUM,
        verbose_name="Priority"
    )
    status = models.CharField(
        max_length=50,
        choices=ServiceStatus.choices,
        default=ServiceStatus.UNASSIGNED,
        verbose_name="Status"
    )
    scheduled_date = models.DateField(blank=True, null=True, verbose_name="Scheduled Date")
    completion_date = models.DateTimeField(blank=True, null=True, verbose_name="Completion Date")
    assigned_technician = models.ForeignKey(
        Technician,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='assigned_services',
        verbose_name="Assigned Technician"
    )
    assigned_at = models.DateTimeField(blank=True, null=True, verbose_name="Assigned At")
    service_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        verbose_name="Service Cost (₹)"
    )
    resolution_notes = models.TextField(blank=True, null=True, verbose_name="Resolution Notes")
    before_service_photo = models.TextField(blank=True, null=True, verbose_name="Before Service Photo")
    after_service_photo = models.TextField(blank=True, null=True, verbose_name="After Service Photo")
    customer_signature = models.TextField(blank=True, null=True, verbose_name="Customer Signature")
    customer_approval = models.BooleanField(default=False, verbose_name="Customer Approved")
    is_allocated = models.BooleanField(default=False, verbose_name="Is Allocated")
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='created_services',
        verbose_name="Created By"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    def generate_service_id(self):
        prefix = "SRV-AMC" if self.service_type == ServiceType.AMC else "SRV"
        last_service = ServiceRequest.objects.filter(service_id__startswith=prefix).order_by('-id').first()
        if last_service and last_service.service_id:
            try:
                clean_str = last_service.service_id.replace("SRV-AMC-", "").replace("SRV-", "").replace("SRV", "")
                num = int(clean_str)
                new_num = num + 1
            except ValueError:
                new_num = 1
        else:
            new_num = 1
        return f"{prefix}-{new_num:04d}"

    def save(self, *args, **kwargs):
        if not self.service_id:
            self.service_id = self.generate_service_id()
        
        if not self.amc_contract:
            self.is_allocated = True
        
        # Auto update status when technician is assigned
        if self.assigned_technician and self.status == ServiceStatus.UNASSIGNED:
            self.status = ServiceStatus.ASSIGNED
            self.assigned_at = timezone.now()
        elif not self.assigned_technician and self.status == ServiceStatus.ASSIGNED:
            self.status = ServiceStatus.UNASSIGNED
            self.assigned_at = None

        # Auto set completion date when completed
        if self.status == ServiceStatus.COMPLETED and not self.completion_date:
            self.completion_date = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.service_id or ''} - {self.title} ({self.get_service_type_display()})"

    class Meta:
        ordering = ['-updated_at', '-created_at']
        verbose_name = "Service Request"
        verbose_name_plural = "Service Requests"
