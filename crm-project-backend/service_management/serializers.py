from rest_framework import serializers
from django.contrib.auth import get_user_model
from lead_management.serializers import CustomerSerializer
from api.serializers import CustomUserDetailsSerializer
from .models import Technician, ServiceRequest, ServiceStatus

User = get_user_model()


class TechnicianSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    active_services_count = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Technician
        fields = "__all__"
        read_only_fields = ('id', 'technician_id', 'created_at', 'updated_at')

    def get_active_services_count(self, obj):
        return obj.assigned_services.filter(
            status__in=[ServiceStatus.ASSIGNED, ServiceStatus.IN_PROGRESS]
        ).count()

    def sync_user_account(self, technician, password=None):
        try:
            from api.models import Role
            User = get_user_model()

            role_obj, _ = Role.objects.get_or_create(name="technician")

            user = None
            if technician.phone:
                user = User.objects.filter(mobile_no=technician.phone).first()
            if not user and technician.email:
                user = User.objects.filter(email=technician.email).first()

            if not user:
                user_kwargs = {
                    "mobile_no": technician.phone,
                    "email": technician.email or None,
                    "first_name": technician.name,
                    "role": role_obj,
                    "is_active": (technician.status == "active")
                }
                user = User.objects.create_user(password=password or "tech12345", **user_kwargs)
            else:
                user.role = role_obj
                user.first_name = technician.name
                if technician.email:
                    user.email = technician.email
                if technician.phone:
                    user.mobile_no = technician.phone
                user.is_active = (technician.status == "active")
                if password:
                    user.set_password(password)
                user.save()
        except Exception as e:
            print(f"Error syncing user account for technician: {e}")

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        technician = super().create(validated_data)
        self.sync_user_account(technician, password)
        return technician

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        technician = super().update(instance, validated_data)
        self.sync_user_account(technician, password)
        return technician


class SimpleAMCContractSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    assigned_technician_name = serializers.SerializerMethodField()

    class Meta:
        from amc.models import AMCContract
        model = AMCContract
        fields = (
            'id', 'contract_id', 'product', 'project_name', 'amc_type', 'status',
            'start_date', 'end_date', 'annual_value', 'payment_frequency',
            'scope_of_support', 'default_customer_contact', 'default_customer_address',
            'default_gps_location', 'default_work_description', 'customer_name',
            'assigned_technician', 'assigned_technician_name'
        )

    def get_customer_name(self, obj):
        if obj.customer:
            return getattr(obj.customer, 'company_name', None) or getattr(obj.customer, 'name', None) or str(obj.customer)
        return ""

    def get_assigned_technician_name(self, obj):
        if obj.assigned_technician:
            return getattr(obj.assigned_technician, 'name', None) or str(obj.assigned_technician)
        return ""


class ServiceRequestSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source="customer", read_only=True)
    amc_contract_details = SimpleAMCContractSerializer(source="amc_contract", read_only=True)
    assigned_technician_details = TechnicianSerializer(source="assigned_technician", read_only=True)
    created_by_details = CustomUserDetailsSerializer(source="created_by", read_only=True)
    
    service_type_display = serializers.CharField(source="get_service_type_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ServiceRequest
        fields = "__all__"
        read_only_fields = ('id', 'service_id', 'created_at', 'updated_at')

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated and "created_by" not in validated_data:
            validated_data["created_by"] = request.user

        # Auto-fetch and sync all details from AMC contract if linked
        amc_contract = validated_data.get("amc_contract")
        if amc_contract:
            if not validated_data.get("customer") and amc_contract.customer:
                validated_data["customer"] = amc_contract.customer
            if not validated_data.get("product_name") and amc_contract.product:
                validated_data["product_name"] = amc_contract.product
            if not validated_data.get("assigned_technician") and amc_contract.assigned_technician:
                validated_data["assigned_technician"] = amc_contract.assigned_technician
            if not validated_data.get("description"):
                validated_data["description"] = amc_contract.default_work_description or amc_contract.scope_of_support
            if not validated_data.get("service_cost") or validated_data.get("service_cost") == 0:
                validated_data["service_cost"] = amc_contract.annual_value

        return super().create(validated_data)

    def update(self, instance, validated_data):
        amc_contract = validated_data.get("amc_contract", instance.amc_contract)
        if amc_contract:
            if not validated_data.get("customer") and not instance.customer and amc_contract.customer:
                validated_data["customer"] = amc_contract.customer
            if not validated_data.get("product_name") and not instance.product_name and amc_contract.product:
                validated_data["product_name"] = amc_contract.product
            if not validated_data.get("assigned_technician") and not instance.assigned_technician and amc_contract.assigned_technician:
                validated_data["assigned_technician"] = amc_contract.assigned_technician

        return super().update(instance, validated_data)
