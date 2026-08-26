from rest_framework import serializers
from .models import ProductCategory, ParkingProduct, ProductConfiguration


class ProductCategorySerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductCategory
        fields = [
            'id', 'name', 'display_name', 'description', 
            'icon', 'is_active', 'products_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_products_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductConfigurationSerializer(serializers.ModelSerializer):
    space_required = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductConfiguration
        fields = [
            'id', 'variant_name', 'height', 'width', 'length',
            'capacity', 'levels', 'price_modifier', 'space_required',
            'is_active'
        ]
    
    def get_space_required(self, obj):
        return float(obj.width * obj.length)


class ParkingProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source='category',
        queryset=ProductCategory.objects.all(),
        write_only=True
    )
    configurations = ProductConfigurationSerializer(many=True, read_only=True)
    configuration_summary = serializers.SerializerMethodField()
    space_required = serializers.SerializerMethodField()
    display_image = serializers.ReadOnlyField()
    image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = ParkingProduct
        fields = [
            'id', 'product_name', 'product_code', 
            'category', 'category_id', 'category_name',
            'description', 'levels', 'operation_type', 'automation_type',
            'pit_required', 'load_capacity',
            'min_height', 'min_width', 'min_length',
            'car_capacity', 'features', 'advantages', 'specifications',
            'base_price', 'is_active', 'is_featured',
            'image', 'image_url', 'display_image', 'brochure_url',
            'configurations', 'configuration_summary', 'space_required',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'category']
    
    def validate_product_code(self, value):
        # Convert empty string to None so MySQL unique constraint doesn't
        # raise Duplicate entry '' for key 'product_code'
        if value is not None and str(value).strip() == "":
            return None
        return value or None

    def validate_base_price(self, value):
        # Convert empty string / falsy to None
        if value is None or str(value).strip() == "":
            return None
        return value

    def get_configuration_summary(self, obj):
        return obj.get_configuration_summary()
    
    def get_space_required(self, obj):
        return obj.total_space_required


class ParkingProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view"""
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    space_required = serializers.SerializerMethodField()
    display_image = serializers.ReadOnlyField()
    image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    configurations = ProductConfigurationSerializer(many=True, read_only=True)

    class Meta:
        model = ParkingProduct
        fields = [
            'id', 'product_name', 'product_code',
            'category', 'category_id', 'category_name', 'car_capacity', 'levels',
            'operation_type', 'automation_type', 'pit_required',
            'min_height', 'min_width', 'min_length',
            'space_required', 'base_price', 'specifications', 'configurations',
            'image', 'image_url', 'display_image',
            'is_active', 'is_featured'
        ]
    
    def get_space_required(self, obj):
        return obj.total_space_required


class ProductRecommendationSerializer(serializers.Serializer):
    """Serializer for product recommendation request"""
    site_location = serializers.CharField(required=False, allow_blank=True)
    cars_required = serializers.IntegerField(required=True, min_value=1)
    car_type = serializers.ChoiceField(
        choices=['sedan', 'suv', 'hatchback', 'mixed'],
        required=False
    )
    budget_range = serializers.CharField(required=False, allow_blank=True)
    basement_available = serializers.BooleanField(required=False)
    pit_possible = serializers.BooleanField(required=False)
    available_height = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2,
        required=False,
        allow_null=True
    )
    available_width = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    available_length = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    installation_timeline = serializers.CharField(required=False, allow_blank=True)


class RecommendedProductSerializer(serializers.ModelSerializer):
    """Serializer for recommended products with match score"""
    category_name = serializers.CharField(source='category.display_name', read_only=True)
    space_required = serializers.SerializerMethodField()
    match_score = serializers.IntegerField(read_only=True)
    match_reasons = serializers.ListField(read_only=True)
    
    class Meta:
        model = ParkingProduct
        fields = [
            'id', 'product_name', 'category_name',
            'car_capacity', 'levels', 'operation_type',
            'min_height', 'min_width', 'min_length',
            'space_required', 'pit_required',
            'features', 'advantages',
            'base_price', 'image_url',
            'match_score', 'match_reasons'
        ]
    
    def get_space_required(self, obj):
        return obj.total_space_required
