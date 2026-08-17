from django.contrib import admin
from .models import AMCContract, AMCCycle


class AMCCycleInline(admin.TabularInline):
    model = AMCCycle
    extra = 0
    readonly_fields = ['cycle_number', 'created_at', 'created_by']


@admin.register(AMCContract)
class AMCContractAdmin(admin.ModelAdmin):
    list_display = ['contract_id', 'customer', 'product', 'amc_type', 'start_date', 'end_date', 'annual_value', 'status']
    list_filter = ['status', 'amc_type', 'payment_frequency', 'created_at']
    search_fields = ['contract_id', 'customer__name', 'customer__company_name', 'product', 'project_name']
    readonly_fields = ['contract_id', 'created_at', 'updated_at']
    inlines = [AMCCycleInline]


@admin.register(AMCCycle)
class AMCCycleAdmin(admin.ModelAdmin):
    list_display = ['amc_contract', 'cycle_number', 'start_date', 'end_date', 'annual_value', 'status']
    list_filter = ['status', 'payment_frequency']
    search_fields = ['amc_contract__contract_id', 'amc_contract__customer__name']
