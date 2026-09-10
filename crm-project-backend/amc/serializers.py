from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from lead_management.serializers import CustomerSerializer
from api.serializers import CustomUserDetailsSerializer
from .models import AMCContract, AMCCycle, AMCStatus

User = get_user_model()


class AMCCycleSerializer(serializers.ModelSerializer):
    created_by_details = CustomUserDetailsSerializer(source="created_by", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_frequency_display = serializers.CharField(source="get_payment_frequency_display", read_only=True)

    class Meta:
        model = AMCCycle
        fields = "__all__"


class SimpleTechnicianSerializer(serializers.ModelSerializer):
    class Meta:
        from service_management.models import Technician
        model = Technician
        fields = ('id', 'technician_id', 'name', 'phone', 'specialization', 'status')


class SimpleServiceRequestSerializer(serializers.ModelSerializer):
    assigned_technician_details = SimpleTechnicianSerializer(source="assigned_technician", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    service_type_display = serializers.CharField(source="get_service_type_display", read_only=True)

    class Meta:
        from service_management.models import ServiceRequest
        model = ServiceRequest
        fields = (
            'id', 'service_id', 'service_type', 'service_type_display', 'title',
            'product_name', 'description', 'status', 'status_display', 'priority',
            'scheduled_date', 'assigned_technician', 'assigned_technician_details',
            'service_cost', 'resolution_notes'
        )


class AMCContractSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source="customer", read_only=True)
    support_coordinator_details = CustomUserDetailsSerializer(
        source="support_coordinator",
        read_only=True
    )
    assigned_technician_details = SimpleTechnicianSerializer(
        source="assigned_technician",
        read_only=True
    )
    linked_service_details = SimpleServiceRequestSerializer(
        source="linked_service",
        read_only=True
    )
    created_by_details = CustomUserDetailsSerializer(
        source="created_by",
        read_only=True
    )
    cycles = AMCCycleSerializer(many=True, read_only=True)
    service_requests = SimpleServiceRequestSerializer(many=True, read_only=True)
    amc_type_display = serializers.CharField(source="get_amc_type_display", read_only=True)
    payment_frequency_display = serializers.CharField(source="get_payment_frequency_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = AMCContract
        fields = "__all__"
        read_only_fields = ('id', 'contract_id', 'created_at', 'updated_at')

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        if user and "created_by" not in validated_data:
            validated_data["created_by"] = user

        start_date = validated_data.get("start_date")
        end_date = validated_data.get("end_date")
        annual_value = validated_data.get("annual_value", 0.00)
        payment_frequency = validated_data.get("payment_frequency", "quarterly")

        amc = AMCContract.objects.create(**validated_data)

        # Create initial Cycle #1
        if start_date and end_date:
            today = timezone.now().date()
            if start_date > today:
                st = AMCStatus.SCHEDULED
            elif (end_date - today).days <= 30 and end_date >= today:
                st = AMCStatus.EXPIRING_SOON
            elif end_date < today:
                st = AMCStatus.EXPIRED
            else:
                st = AMCStatus.ACTIVE

            AMCCycle.objects.create(
                amc_contract=amc,
                cycle_number=1,
                start_date=start_date,
                end_date=end_date,
                annual_value=annual_value,
                payment_frequency=payment_frequency,
                status=st,
                remarks="Initial Contract Cycle",
                created_by=user
            )
            amc.sync_active_cycle_data()

        # Generate scheduled service visits & calculate per_visit_amount
        amc.generate_schedule()

        return amc

    @transaction.atomic
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update active cycle if dates/annual value changed on header
        active_cycle = instance.cycles.filter(status__in=[AMCStatus.ACTIVE, AMCStatus.EXPIRING_SOON, AMCStatus.SCHEDULED]).order_by('-cycle_number').first()
        if active_cycle:
            if "start_date" in validated_data and validated_data["start_date"]:
                active_cycle.start_date = validated_data["start_date"]
            if "end_date" in validated_data and validated_data["end_date"]:
                active_cycle.end_date = validated_data["end_date"]
            if "annual_value" in validated_data:
                active_cycle.annual_value = validated_data["annual_value"]
            if "payment_frequency" in validated_data:
                active_cycle.payment_frequency = validated_data["payment_frequency"]
            active_cycle.save()

        instance.sync_active_cycle_data()
        return instance




# ============================================================================
# NEW SERIALIZERS FOR SERVICE SCHEDULES, VISITS, AND RENEWALS
# ============================================================================

from .models import AMCServiceSchedule, AMCServiceVisit, AMCRenewal


class AMCServiceScheduleSerializer(serializers.ModelSerializer):
    """Serializer for AMC Service Schedule (planned dates)"""
    amc_contract_id = serializers.CharField(source='amc_contract.contract_id', read_only=True)
    customer_name = serializers.CharField(source='amc_contract.customer.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = AMCServiceSchedule
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'reminder_sent_at', 'completed_at', 'approved_at')


class AMCServiceVisitSerializer(serializers.ModelSerializer):
    """Serializer for AMC Service Visit (actual visits with technician allocation)"""
    amc_contract_id = serializers.CharField(source='amc_contract.contract_id', read_only=True)
    customer_name = serializers.CharField(source='amc_contract.customer.name', read_only=True)
    customer_details = CustomerSerializer(source='amc_contract.customer', read_only=True)
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    technician_details = SimpleTechnicianSerializer(source='technicians', many=True, read_only=True)
    
    crm_service_details = SimpleServiceRequestSerializer(source='crm_service', read_only=True)
    allocation_status_display = serializers.CharField(source='get_allocation_status_display', read_only=True)
    
    class Meta:
        model = AMCServiceVisit
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'crm_service_created_at')
    
    def validate(self, data):
        """Validate that service date is not in the past (unless rescheduling)"""
        service_date = data.get('service_date')
        if service_date and service_date < timezone.now().date():
            if not self.instance:  # Creating new visit
                raise serializers.ValidationError({
                    'service_date': 'Service date cannot be in the past'
                })
        return data


class AMCRenewalSerializer(serializers.ModelSerializer):
    """Serializer for AMC Renewal requests"""
    amc_contract_id = serializers.CharField(source='amc_contract.contract_id', read_only=True)
    customer_name = serializers.CharField(source='amc_contract.customer.name', read_only=True)
    customer_details = CustomerSerializer(source='amc_contract.customer', read_only=True)
    
    admin_action_by_name = serializers.CharField(source='admin_action_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    new_cycle_details = AMCCycleSerializer(source='new_cycle', read_only=True)
    
    class Meta:
        model = AMCRenewal
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'customer_requested_at', 'admin_action_at')


# ============================================================================
# DASHBOARD SERIALIZERS
# ============================================================================

class AMCDashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_contracts = serializers.IntegerField()
    active_contracts = serializers.IntegerField()
    expiring_soon = serializers.IntegerField()
    expired_contracts = serializers.IntegerField()
    renewal_requests_pending = serializers.IntegerField()
    upcoming_visits_count = serializers.IntegerField()
    visits_today = serializers.IntegerField()
    visits_this_week = serializers.IntegerField()


class CalendarEventSerializer(serializers.Serializer):
    """Serializer for calendar events"""
    title = serializers.CharField()
    start = serializers.DateField()
    end = serializers.DateField(required=False, allow_null=True)
    backgroundColor = serializers.CharField()
    borderColor = serializers.CharField()
    extendedProps = serializers.DictField()
