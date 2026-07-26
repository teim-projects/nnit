from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()

# Customer
class Customer(models.Model):
    name = models.CharField(max_length=200)
    contact_number = models.CharField(max_length=20, blank=True, null=True, unique=True)
    secondary_contact_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    secondary_email = models.EmailField(blank=True, null=True)
    poc_name = models.CharField(max_length=200, blank=True, null=True)
    poc_contact_number = models.CharField(max_length=20, blank=True, null=True)
    land_line_no = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pin_code = models.CharField(max_length=10, blank=True, null=True)
    both_address_is_same = models.BooleanField(default=False)
    site_address = models.TextField(blank=True, null=True)
    site_city = models.CharField(max_length=100, blank=True, null=True)
    site_state = models.CharField(max_length=100, blank=True, null=True)
    site_pin_code = models.CharField(max_length=10, blank=True, null=True)
    gst = models.CharField(max_length=15, blank=True, null=True)
    pan = models.CharField(max_length=10, blank=True, null=True)
    # If True → created from a lead, not yet converted. Hidden from Customers page.
    # Becomes False only after "Convert to Customer" action.
    is_lead_only = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.email or self.contact_number or ''})"


# Lead source
class LeadSource(models.TextChoices):
    GOOGLE_ADS = 'google_ads', 'Google Ads'
    INDIAMART = 'indiamart', 'IndiaMART'
    BNI = 'bni', 'BNI'
    JUSTDIAL = 'justdial', 'Justdial'
    REFERENCE = 'reference', 'Reference'
    ARCHITECT_INTERIOR_DESIGNER = 'architect/interior_designer', 'Architect / Interior Designer'
    BUILDER = 'builder', 'Builder'
    EXISTING_CUSTOMER = 'existing_customer', 'Existing Customer'
    KA_STAFF = 'ka_staff', 'KA Staff'
    OTHER = 'other', 'Other'


# Lead status
class LeadStatus(models.TextChoices):
    OPEN = 'open', 'Open'
    CLOSED = 'closed', 'Closed'
    IN_PROCESS = 'in_process', 'In Process'


class ServiceType(models.TextChoices):
    SALES = "sales", "Sales"
    SERVICE = "service", "Service"
    BOTH = "both", "Both"


# Lead management
class lead_management(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='leads')
    requirements_details = models.TextField(blank=True)
    lead_type = models.CharField(max_length=200, blank=True, null=True)
    lead_source = models.CharField(max_length=200)
    is_service_lead = models.CharField(max_length=20, choices=ServiceType.choices, null=True, blank=True)
    service_type = models.JSONField(blank=True, null=True)
    lead_source_input = models.JSONField(blank=True, null=True)
    status = models.CharField(
        max_length=200,
        choices=LeadStatus.choices,
        default=LeadStatus.OPEN,
    )
    assign_to = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='lead_assignment')
    date = models.DateField(blank=True, null=True)
    enquiry_date = models.DateField(blank=True, null=True)
    followup_date = models.DateField(blank=True, null=True)
    last_followup_date = models.DateField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    project_name = models.CharField(max_length=100, blank=True, null=True)
    project_adderess = models.CharField(max_length=500, blank=True, null=True)
    creatd_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='lead_created')
    contact_person_name = models.CharField(max_length=200, blank=True, null=True)
    contact_person_number = models.CharField(max_length=20, blank=True, null=True)
    # Lead Qualifying Questions — set True by manager/admin after initial review
    is_qualified = models.BooleanField(default=False)
    # JSON: { "<faq_id>": "<answer_text>", ... }
    qualifying_answers = models.JSONField(blank=True, null=True, default=dict)
    # Customer conversion tracking
    is_converted = models.BooleanField(default=False)
    converted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Lead #{self.pk} - {self.customer.name or self.customer.email or self.customer.contact_number} - {self.get_status_display()}"

    def clean(self):
        if self.date and self.followup_date and self.followup_date < self.date:
            raise ValidationError({"followup_date": "followup_date cannot be before date."})

    def save(self, *args, **kwargs):
        # Only run full_clean on new instances (create), not on updates
        # Updates are validated at the serializer level
        if not self.pk:
            self.full_clean()
        super().save(*args, **kwargs)


# ❌ REMOVED: lead_product model (no longer needed)
# ❌ REMOVED: LeadFollowUpProduct model (no longer needed)

# Interaction type choices
class InteractionType(models.TextChoices):
    CALL = 'call', 'Call'
    WHATSAPP = 'whatsapp', 'WhatsApp'
    EMAIL = 'email', 'Email'
    VIDEO_CALL = 'video_call', 'Video Call'
    IN_PERSON = 'in_person', 'In-Person'
    DEMO = 'demo', 'Demo'
    SITE_VISIT = 'site_visit', 'Site Visit'


# Client Response/Sentiment choices
class ClientResponseType(models.TextChoices):
    VERY_POSITIVE = 'very_positive', 'Very Positive'
    POSITIVE = 'positive', 'Positive'
    NEUTRAL = 'neutral', 'Neutral'
    NEGATIVE = 'negative', 'Negative'
    NO_RESPONSE = 'no_response', 'No Response'
    CALL_BACK_LATER = 'call_back_later', 'Call Back Later'


# Follow-up status
class FollowUpStatus(models.TextChoices):
    COMPLETED = 'completed', 'Completed'
    PENDING = 'pending', 'Pending'
    SCHEDULED = 'scheduled', 'Scheduled'


# Car type choices
class CarType(models.TextChoices):
    SEDAN = 'sedan', 'Sedan'
    SUV = 'suv', 'SUV'
    HATCHBACK = 'hatchback', 'Hatchback'
    MIXED = 'mixed', 'Mixed'


# Yes/No choices
class YesNoChoice(models.TextChoices):
    YES = 'yes', 'Yes'
    NO = 'no', 'No'


# Lead Followup
class LeadFollowUp(models.Model):
    lead = models.ForeignKey(
        lead_management,
        on_delete=models.CASCADE,
        related_name='followups'
    )
    followup_date = models.DateField()
    followup_time = models.TimeField(blank=True, null=True)
    next_followup_date = models.DateField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    discussion_notes = models.TextField(blank=True, null=True)
    
    # Interaction details - matching form exactly
    interaction_type = models.CharField(
        max_length=20,
        choices=InteractionType.choices,
        default=InteractionType.CALL,
        help_text="Follow-up mode: Call, WhatsApp, Email, Video Call, In-Person, Demo, Site Visit"
    )
    client_response = models.CharField(
        max_length=20,
        choices=ClientResponseType.choices,
        default=ClientResponseType.NEUTRAL,
        help_text="Client's response sentiment"
    )
    followup_status = models.CharField(
        max_length=20,
        choices=FollowUpStatus.choices,
        default=FollowUpStatus.COMPLETED
    )
    
    # Conducted by and contacted person
    conducted_by = models.CharField(max_length=200, blank=True, null=True, help_text="Team member who conducted the follow-up")
    contacted_person = models.CharField(max_length=200, blank=True, null=True, help_text="Person contacted during follow-up")
    
    # Follow-up summary and commitments
    followup_summary = models.TextField(blank=True, null=True, help_text="Key discussion points and summary")
    client_commitment = models.TextField(blank=True, null=True, help_text="What the client committed to do")
    our_commitment = models.TextField(blank=True, null=True, help_text="What we committed to do")
    
    # Stage information
    previous_stage = models.CharField(max_length=100, blank=True, null=True)
    current_stage = models.CharField(max_length=100, blank=True, null=True)
    
    status = models.CharField(
        max_length=200,
        choices=LeadStatus.choices,
        default=LeadStatus.OPEN,
    )
    
    # Store product suggestions
    suggested_solution = models.JSONField(blank=True, null=True)
    
    # Store qualifying information from follow-up
    # qualifying_info structure:
    # {
    #   "decision_maker": "text",
    #   "budget_status": "text", 
    #   "timeline": "text",
    #   "competition": "text",
    #   "site_location": "text",
    #   "cars_required": "text",
    #   "car_type": "sedan|suv|hatchback|mixed",
    #   "budget_range": "text",
    #   "basement_available": "yes|no",
    #   "pit_possible": "yes|no",
    #   "installation_timeline": "text",
    #   "site_challenges": "text"
    # }
    qualifying_info = models.JSONField(blank=True, null=True, help_text="Qualifying questions: decision maker, budget, timeline, site details, etc.")
    
    # Store requirement information (optional)
    # requirement_info structure:
    # {
    #   "site_length": "text",
    #   "site_width": "text",
    #   "site_height": "text",
    #   "preferred_parking_type": "text",
    #   "automation_required": "text"
    # }
    requirement_info = models.JSONField(blank=True, null=True, help_text="Site requirements: length, width, height, parking type, automation")
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lead_followups_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-followup_date', '-created_at']

    def __str__(self):
        return f"Follow-up for Lead #{self.lead_id} on {self.followup_date}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        lead = self.lead
        lead.status = self.status
        lead.last_followup_date = self.followup_date
        lead.followup_date = self.next_followup_date or self.followup_date
        if self.remarks:
            lead.remarks = self.remarks
        # Use update_fields to bypass full_clean on the lead model
        lead_management.objects.filter(pk=lead.pk).update(
            status=lead.status,
            last_followup_date=lead.last_followup_date,
            followup_date=lead.followup_date,
            remarks=lead.remarks,
        )


# Lead FAQ
class LeadFAQ(models.Model):
    question = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.question


# Lead followupFAQAnswer
class LeadFollowUpFAQAnswer(models.Model):
    followup = models.ForeignKey(
        LeadFollowUp,
        on_delete=models.CASCADE,
        related_name='faq_answers'
    )
    faq = models.ForeignKey(
        LeadFAQ,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    answer = models.TextField(blank=True)

    class Meta:
        unique_together = ('followup', 'faq')

    def __str__(self):
        return f"Q: {self.faq.question} | Lead #{self.followup.lead_id}"