from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from .models import Customer, lead_management, LeadFollowUp, LeadFAQ, LeadFollowUpFAQAnswer
from api.serializers import CustomUserDetailsSerializer
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class CustomerSerializer(serializers.ModelSerializer):
    total_leads = serializers.SerializerMethodField()
    active_leads = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = "__all__"
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_total_leads(self, obj):
        return obj.leads.count()
    
    def get_active_leads(self, obj):
        return obj.leads.exclude(status='closed').count()

    def validate_contact_number(self, value):
        value = value.strip()
        qs = Customer.objects.filter(contact_number=value)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError(
                "Customer with this contact number already exists."
            )
        return value


class LeadFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadFAQ
        fields = ["id", "question", "is_active", "sort_order"]


class LeadFollowUpFAQAnswerSerializer(serializers.ModelSerializer):
    faq_question = serializers.CharField(source="faq.question", read_only=True)

    class Meta:
        model = LeadFollowUpFAQAnswer
        fields = ["id", "faq", "faq_question", "answer"]
        read_only_fields = ["id", "faq_question"]


# ❌ REMOVED: LeadProductSerializer
# ❌ REMOVED: LeadProductReadSerializer
# ❌ REMOVED: LeadFollowUpProductSerializer


class LeadFollowUpSerializer(serializers.ModelSerializer):
    faq_answers = LeadFollowUpFAQAnswerSerializer(many=True, required=False)
    lead_customer_name = serializers.CharField(
        source="lead.customer.name",
        read_only=True
    )
    created_by_name = serializers.CharField(
        source="created_by.first_name",
        read_only=True
    )

    class Meta:
        model = LeadFollowUp
        fields = [
            "id",
            "lead",
            "lead_customer_name",
            "followup_date",
            "next_followup_date",
            "remarks",
            "discussion_notes",
            "status",
            "suggested_solution",
            "qualifying_info",
            "requirement_info",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
            "faq_answers",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        faq_data = validated_data.pop("faq_answers", [])

        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user

        followup = LeadFollowUp.objects.create(**validated_data)

        for item in faq_data:
            LeadFollowUpFAQAnswer.objects.create(followup=followup, **item)

        return followup

    @transaction.atomic
    def update(self, instance, validated_data):
        faq_data = validated_data.pop("faq_answers", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if faq_data is not None:
            instance.faq_answers.all().delete()
            for item in faq_data:
                LeadFollowUpFAQAnswer.objects.create(followup=instance, **item)

        return instance


class LeadSerializer(serializers.ModelSerializer):
    FIXED_SOURCES = [
        'google_ads', 'indiamart', 'bni', 'justdial', 'reference',
        'architect/interior_designe', 'builder', 'existing_customer',
        'scgt', 'ka_staff', 'other',
    ]

    customer_name = serializers.CharField(source="customer.name", read_only=True)
    customer_contact = serializers.CharField(source="customer.contact_number", read_only=True)
    customer_secondary_contact = serializers.CharField(source="customer.secondary_contact_number", read_only=True)
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    customer_secondary_email = serializers.EmailField(source="customer.secondary_email", read_only=True)
    customer_address = serializers.CharField(source="customer.address", read_only=True)
    customer_city = serializers.CharField(source="customer.city", read_only=True)
    customer_state = serializers.CharField(source="customer.state", read_only=True)
    customer_pincode = serializers.CharField(source="customer.pin_code", read_only=True)
    assign_to_details = CustomUserDetailsSerializer(source="assign_to", read_only=True)
    creatd_by_details = CustomUserDetailsSerializer(source="creatd_by", read_only=True)
    followups = LeadFollowUpSerializer(many=True, read_only=True)
    total_followups = serializers.SerializerMethodField()
    latest_followup = serializers.SerializerMethodField()

    class Meta:
        model = lead_management
        fields = [
            "id",
            "requirements_details",
            "lead_source",
            "lead_source_input",
            "status",
            "lead_type",
            "is_service_lead",
            "project_name",
            "project_adderess",
            "date",
            "enquiry_date",
            "followup_date",
            "last_followup_date",
            "remarks",
            "customer",
            "customer_name",
            "customer_contact",
            "customer_secondary_contact",
            "customer_email",
            "customer_secondary_email",
            "customer_address",
            "customer_city",
            "customer_state",
            "customer_pincode",
            "assign_to",
            "assign_to_details",
            "creatd_by",
            "creatd_by_details",
            "contact_person_name",
            "contact_person_number",
            "service_type",
            "is_qualified",
            "qualifying_answers",
            "followups",
            "total_followups",
            "latest_followup",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "date", "creatd_by", "created_at", "updated_at"]
    
    def get_total_followups(self, obj):
        return obj.followups.count()
    
    def get_latest_followup(self, obj):
        latest = obj.followups.first()
        if latest:
            return {
                "id": latest.id,
                "followup_date": latest.followup_date,
                "status": latest.status,
                "remarks": latest.remarks
            }
        return None

    @transaction.atomic
    def create(self, validated_data):
        lead = lead_management.objects.create(**validated_data)
        return lead

    @transaction.atomic
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def validate_lead_source(self, value):
        value = value.strip().lower()
        if value in self.FIXED_SOURCES:
            return value
        if value and value not in self.FIXED_SOURCES:
            return value
        raise serializers.ValidationError("Invalid lead source")