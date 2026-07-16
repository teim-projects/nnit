from django.contrib import admin
from .models import ProductCategory, ParkingProduct, ProductConfiguration


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['display_name', 'name', 'description']
    ordering = ['display_name']


class ProductConfigurationInline(admin.TabularInline):
    model = ProductConfiguration
    extra = 1
    fields = ['variant_name', 'height', 'width', 'length', 'capacity', 'levels', 'price_modifier', 'is_active']


@admin.register(ParkingProduct)
class ParkingProductAdmin(admin.ModelAdmin):
    list_display = [
        'product_name', 'category', 'car_capacity', 'levels',
        'operation_type', 'pit_required', 'is_active', 'is_featured'
    ]
    list_filter = [
        'category', 'operation_type', 'automation_type',
        'pit_required', 'is_active', 'is_featured'
    ]
    search_fields = ['product_name', 'product_code', 'description']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    inlines = [ProductConfigurationInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('product_name', 'product_code', 'category', 'description')
        }),
        ('Technical Specifications', {
            'fields': (
                'levels', 'operation_type', 'automation_type',
                'pit_required', 'load_capacity'
            )
        }),
        ('Dimensions', {
            'fields': ('min_height', 'min_width', 'min_length', 'car_capacity')
        }),
        ('Additional Information', {
            'fields': ('features', 'advantages', 'specifications'),
            'classes': ('collapse',)
        }),
        ('Pricing & Media', {
            'fields': ('base_price', 'image_url', 'brochure_url')
        }),
        ('Status', {
            'fields': ('is_active', 'is_featured')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ProductConfiguration)
class ProductConfigurationAdmin(admin.ModelAdmin):
    list_display = [
        'product', 'variant_name', 'capacity', 'levels',
        'height', 'width', 'length', 'is_active'
    ]
    list_filter = ['is_active', 'product__category']
    search_fields = ['product__product_name', 'variant_name']
    autocomplete_fields = ['product']
