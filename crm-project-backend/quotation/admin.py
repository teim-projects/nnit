from django.contrib import admin
from .models import ServiceMaster, QuotationServiceItem
from .terms_models import TermsMaster, QuotationTerms

@admin.register(ServiceMaster)
class ServiceMasterAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'subcategory', 'service_type', 'unit', 'labor_rate', 'is_active']
    list_filter = ['service_type', 'is_active']
    search_fields = ['name', 'category', 'subcategory']
    ordering = ['category', 'sequence', 'name']

@admin.register(QuotationServiceItem)
class QuotationServiceItemAdmin(admin.ModelAdmin):
    list_display = ['service', 'quotation_version', 'quantity', 'unit', 'unit_price', 'total_with_gst']
    list_filter = ['service__service_type', 'created_at']
    search_fields = ['service__name', 'quotation_version__quotation__quotation_no']
    readonly_fields = ['base_amount', 'gst_amount', 'total_with_gst']


@admin.register(TermsMaster)
class TermsMasterAdmin(admin.ModelAdmin):
    list_display = ['sequence', 'title', 'is_active', 'is_default', 'created_at']
    list_filter = ['is_active', 'is_default', 'created_at']
    search_fields = ['title', 'content']
    ordering = ['sequence']
    list_editable = ['is_active', 'is_default']
    readonly_fields = ['created_at', 'updated_at', 'created_by']


@admin.register(QuotationTerms)
class QuotationTermsAdmin(admin.ModelAdmin):
    list_display = ['quotation', 'sequence', 'title', 'is_customized', 'created_at']
    list_filter = ['is_customized', 'created_at']
    search_fields = ['quotation__quotation_no', 'title', 'content']
    ordering = ['quotation', 'sequence']
    readonly_fields = ['created_at', 'updated_at']
