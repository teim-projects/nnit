from rest_framework import serializers
from django.db import transaction
import random
from datetime import datetime

from .models import (
    Quotation,
    QuotationVersion,
    QuotationHighSideItem,
    QuotationLowSideItem,
)
from .models import ServiceMaster, QuotationServiceItem
from .terms_models import TermsMaster, QuotationTerms

# =====================================================
# HIGH SIDE SERIALIZER - Decoupled
# =====================================================
class QuotationHighSideItemSerializer(serializers.ModelSerializer):
    # Read from product_data JSON
    product_id = serializers.IntegerField(source="product_data.id", read_only=True)
    product_name = serializers.CharField(source="product_data.name", read_only=True)
    product_sku = serializers.CharField(source="product_data.sku", read_only=True)
    product_category = serializers.CharField(source="product_data.category", read_only=True)

    class Meta:
        model = QuotationHighSideItem
        fields = "__all__"
        read_only_fields = ("quotation_version", "base_amount", "gst_amount", "total_with_gst")


# =====================================================
# LOW SIDE SERIALIZER - Decoupled
# =====================================================
class QuotationLowSideItemSerializer(serializers.ModelSerializer):
    # Read from item_data JSON
    item_code = serializers.CharField(source="item_data.item_code", read_only=True)
    item_name = serializers.CharField(source="item_data.name", read_only=True)

    class Meta:
        model = QuotationLowSideItem
        fields = "__all__"
        read_only_fields = ("quotation_version", "base_amount", "gst_amount", "total_with_gst")


# =====================================================
# VERSION SERIALIZER
# =====================================================
class QuotationVersionSerializer(serializers.ModelSerializer):
    high_side_items = QuotationHighSideItemSerializer(many=True)
    low_side_items = QuotationLowSideItemSerializer(many=True)
    version_label = serializers.SerializerMethodField()
    version_number = serializers.SerializerMethodField()

    class Meta:
        model = QuotationVersion
        fields = "__all__"
        read_only_fields = (
            "quotation",
            "version_no",
            "is_active",
            "created_by",
            "subtotal",
            "cgst_amount",
            "sgst_amount",
            "igst_amount",
            "gst_amount",
            "total_amount",
            "grand_total",
        )

    def get_version_label(self, obj):
        return f"{obj.quotation.quotation_no}-R{obj.version_no}"

    def get_version_number(self, obj):
        """Return the integer version number for easy frontend display"""
        try:
            return int(obj.version_no.split("-R")[-1])
        except (ValueError, AttributeError):
            return 1


# =====================================================
# MAIN QUOTATION SERIALIZER
# =====================================================
class QuotationSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.name", read_only=True
    )
    customer_contact = serializers.CharField(
        source="customer.contact_number", read_only=True
    )
    
    branch_name = serializers.CharField(
        source="branch.name", read_only=True
    )
    branch_address = serializers.CharField(
        source="branch.address", read_only=True
    )
    branch_email = serializers.CharField(
        source="branch.email", read_only=True
    )
    
    site_name_detail = serializers.CharField(
        source="site.name", read_only=True
    )
    site_address = serializers.CharField(
        source="site.address", read_only=True
    )
    site_city = serializers.CharField(
        source="site.city", read_only=True
    )

    versions = QuotationVersionSerializer(many=True)
    terms = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = "__all__"
        read_only_fields = ("quotation_no",)

    def get_terms(self, obj):
        """Return terms for this quotation"""
        terms = QuotationTerms.objects.filter(quotation=obj).order_by('sequence')
        return QuotationTermsSerializer(terms, many=True).data

    # =====================================================
    # 🔥 CORE CALCULATION ENGINE
    # =====================================================
    def calculate_totals(self, version, high_items, low_items):
        version_subtotal = 0
        version_gst_total = 0
    
        # =============================
        # HIGH SIDE
        # =============================
        for item in high_items:
            qty = item["quantity"]
            price = item["unit_price"]
            gst_percent = item.get("gst_percent", 0)
            mathadi = item.get("mathadi_charges", 0)
            transport = item.get("transportation_charges", 0)
    
            base_amount = qty * price
            gst_value = (base_amount * gst_percent) / 100
            total_with_gst = base_amount + gst_value + mathadi + transport
    
            version_subtotal += base_amount + mathadi + transport
            version_gst_total += gst_value
    
            QuotationHighSideItem.objects.create(
                quotation_version=version,
                base_amount=base_amount,
                gst_amount=gst_value,
                total_with_gst=total_with_gst,
                **item
            )
    
        # =============================
        # LOW SIDE
        # =============================
        for item in low_items:
            qty = item["quantity"]
            price = item["unit_price"]
            gst_percent = item.get("gst_percent", 0)
            mathadi = item.get("mathadi_charges", 0)
    
            base_amount = qty * price
            gst_value = (base_amount * gst_percent) / 100
            total_with_gst = base_amount + gst_value + mathadi
    
            version_subtotal += base_amount + mathadi
            version_gst_total += gst_value
    
            QuotationLowSideItem.objects.create(
                quotation_version=version,
                base_amount=base_amount,
                gst_amount=gst_value,
                total_with_gst=total_with_gst,
                **item
            )
    
        # =============================
        # GST SPLIT
        # =============================
        if version.gst_type == "CGST_SGST":
            version.cgst_amount = version_gst_total / 2
            version.sgst_amount = version_gst_total / 2
            version.igst_amount = 0
        else:
            version.igst_amount = version_gst_total
            version.cgst_amount = 0
            version.sgst_amount = 0
    
        version.subtotal = version_subtotal
        version.gst_amount = version_gst_total
        version.total_amount = version_subtotal + version_gst_total
        version.grand_total = version.total_amount
    
        version.save()

    # =====================================================
    # CREATE
    # =====================================================
    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        versions_data = validated_data.pop("versions")
    
        version_data = versions_data[0]
        high_items = version_data.pop("high_side_items")
        low_items = version_data.pop("low_side_items")
        
        # Validate that we have at least one item
        if not high_items and not low_items:
            raise serializers.ValidationError("At least one item is required")
    
        # ======================================
        # STEP 1️⃣ CREATE QUOTATION FIRST
        # ======================================
        quotation = Quotation.objects.create(
            quotation_no="TEMP",
            **validated_data
        )
    
        # ======================================
        # STEP 2️⃣ BUILD NUMBER USING DB ID
        # ======================================
        now = datetime.now()
        year = str(now.year)[-2:]
        month = str(now.month).zfill(2)
        
        # Try to get AC type from first high side item if exists
        ac_code = "GEN"
        if high_items and high_items[0].get("product_data"):
            product_name = high_items[0]["product_data"].get("name", "")
            ac_code = product_name[:3].upper() if product_name else "GEN"
    
        quotation_no = f"KA/{ac_code}/{year}/{month}{quotation.id}"
        quotation.quotation_no = quotation_no
        quotation.save(update_fields=["quotation_no"])
    
        # ======================================
        # CREATE VERSION
        # ======================================
        version_no = f"{quotation.quotation_no}-R1"
        
        version = QuotationVersion.objects.create(
            quotation=quotation,
            version_no=version_no,
            is_active=True,
            created_by=request.user if request else None,
            **version_data
        )        
        
        self.calculate_totals(version, high_items, low_items)
    
        return quotation
    
    # =====================================================
    # UPDATE (CREATE NEW VERSION)
    # =====================================================
    @transaction.atomic
    def update(self, instance, validated_data):
        request = self.context.get("request")
        versions_data = validated_data.pop("versions")
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        old_version = instance.versions.filter(is_active=True).first()
        
        if old_version:
            old_version.is_active = False
            old_version.save()
            
            current_r = int(old_version.version_no.split("-R")[-1])
            next_r = current_r + 1
        else:
            next_r = 1
        
        new_version_no = f"{instance.quotation_no}-R{next_r}"

        version_data = versions_data[0]
        high_items = version_data.pop("high_side_items")
        low_items = version_data.pop("low_side_items")

        new_version = QuotationVersion.objects.create(
            quotation=instance,
            version_no=new_version_no,
            is_active=True,
            created_by=request.user if request else None,
            **version_data
        )

        self.calculate_totals(new_version, high_items, low_items)

        return instance


class ServiceMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceMaster
        fields = '__all__'


class QuotationServiceItemSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_type = serializers.CharField(source='service.service_type', read_only=True)
    category_name = serializers.CharField(source='service.category', read_only=True)
    subcategory_name = serializers.CharField(source='service.subcategory', read_only=True)
    
    class Meta:
        model = QuotationServiceItem
        fields = '__all__'
        read_only_fields = ['base_amount', 'gst_amount', 'total_with_gst']


class QuotationServiceItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationServiceItem
        fields = ['quotation_version', 'service', 'quantity', 'unit_price', 'description', 'gst_percentage', 'mathadi_charges', 'transportation_charges']
    
    def create(self, validated_data):
        service = validated_data['service']
        validated_data['unit'] = service.unit
        return super().create(validated_data)


# =====================================================
# SIMPLE QUOTATION SERIALIZER
# For the simple form: customer + parking product + qty + unit_price
# =====================================================
class SimpleQuotationSerializer(serializers.Serializer):
    customer = serializers.IntegerField()
    parking_product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    gst_percent = serializers.DecimalField(max_digits=5, decimal_places=2, default=18)
    terms_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        help_text="List of term IDs to attach to quotation"
    )

    @transaction.atomic
    def create(self, validated_data):
        from parking_products.models import ParkingProduct
        from lead_management.models import Customer
        request = self.context.get("request")

        customer = Customer.objects.get(pk=validated_data["customer"])
        parking_product = ParkingProduct.objects.get(pk=validated_data["parking_product_id"])
        quantity = validated_data["quantity"]
        unit_price = validated_data["unit_price"]
        gst_percent = validated_data.get("gst_percent", 18)

        # Build subject from parking product
        subject = f"{parking_product.product_name} - {parking_product.category.display_name}"

        # Create quotation
        quotation = Quotation.objects.create(
            quotation_no="TEMP",
            customer=customer,
            subject=subject,
            site_name="",
            thank_you_note="Thank you for choosing us. We look forward to serving you.",
        )

        # Build quotation number
        from datetime import datetime as dt
        now = dt.now()
        year = str(now.year)[-2:]
        month = str(now.month).zfill(2)
        code = parking_product.product_name[:3].upper() if parking_product.product_name else "PKG"
        quotation.quotation_no = f"KA/{code}/{year}/{month}{quotation.id}"
        quotation.save(update_fields=["quotation_no"])

        # Create version
        version = QuotationVersion.objects.create(
            quotation=quotation,
            version_no=f"{quotation.quotation_no}-R1",
            is_active=True,
            gst_type="CGST_SGST",
            created_by=request.user if request else None,
        )

        # Product data snapshot
        product_data = {
            "id": parking_product.id,
            "name": parking_product.product_name,
            "sku": parking_product.product_code or parking_product.product_name,
            "category": parking_product.category.display_name,
            "car_capacity": parking_product.car_capacity,
        }

        base_amount = float(quantity) * float(unit_price)
        gst_value = (base_amount * float(gst_percent)) / 100
        total_with_gst = base_amount + gst_value

        QuotationHighSideItem.objects.create(
            quotation_version=version,
            product_data=product_data,
            quantity=quantity,
            unit_price=unit_price,
            unit="NOS",
            gst_percent=gst_percent,
            mathadi_charges=0,
            transportation_charges=0,
            description="",
            hsn_sac="",
            base_amount=base_amount,
            gst_amount=gst_value,
            total_with_gst=total_with_gst,
        )

        # Update version totals
        half_gst = gst_value / 2
        version.subtotal = base_amount
        version.gst_amount = gst_value
        version.cgst_amount = half_gst
        version.sgst_amount = half_gst
        version.igst_amount = 0
        version.total_amount = base_amount + gst_value
        version.grand_total = base_amount + gst_value
        version.save()

        # Create Terms & Conditions for quotation
        terms_ids = validated_data.get('terms_ids', [])
        if terms_ids:
            for idx, term_id in enumerate(terms_ids, start=1):
                try:
                    master_term = TermsMaster.objects.get(pk=term_id, is_active=True)
                    QuotationTerms.objects.create(
                        quotation=quotation,
                        master_term=master_term,
                        title=master_term.title,
                        content=master_term.content,
                        sequence=idx,
                        is_customized=False
                    )
                except TermsMaster.DoesNotExist:
                    pass  # Skip invalid term IDs

        return quotation


# =====================================================
# TERMS & CONDITIONS SERIALIZERS
# =====================================================
class TermsMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = TermsMaster
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class QuotationTermsSerializer(serializers.ModelSerializer):
    master_term_title = serializers.CharField(source='master_term.title', read_only=True)
    
    class Meta:
        model = QuotationTerms
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class QuotationTermsBulkCreateSerializer(serializers.Serializer):
    """
    Serializer for bulk-creating quotation terms
    """
    quotation = serializers.IntegerField()
    terms = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of {master_term: id, sequence: int}"
    )

    def create(self, validated_data):
        quotation_id = validated_data['quotation']
        terms_data = validated_data['terms']
        
        # Delete existing terms for this quotation
        QuotationTerms.objects.filter(quotation_id=quotation_id).delete()
        
        # Created new terms
        created_terms = []
        for term_data in terms_data:
            master_term_id = term_data.get('master_term')
            sequence = term_data.get('sequence', 1)
            
            if master_term_id:
                master_term = TermsMaster.objects.get(pk=master_term_id)
                qt = QuotationTerms.objects.create(
                    quotation_id=quotation_id,
                    master_term=master_term,
                    title=master_term.title,
                    content=master_term.content,
                    sequence=sequence,
                    is_customized=False
                )
                created_terms.append(qt)
        
        return created_terms
