from django.contrib import admin
from .models import AMCContract, AMCCycle, AMCServiceSchedule, AMCServiceVisit, AMCRenewal


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


@admin.register(AMCServiceSchedule)
class AMCServiceScheduleAdmin(admin.ModelAdmin):
    list_display = ['amc_contract', 'service_date', 'is_completed', 'is_approved', 'reminder_sent', 'created_at']
    list_filter = ['is_completed', 'is_approved', 'reminder_sent', 'service_date']
    search_fields = ['amc_contract__contract_id', 'amc_contract__customer__name']
    readonly_fields = ['created_at', 'reminder_sent_at', 'completed_at', 'approved_at']


@admin.register(AMCServiceVisit)
class AMCServiceVisitAdmin(admin.ModelAdmin):
    list_display = ['amc_contract', 'service_date', 'allocation_status', 'product', 'auto_allocation_done', 'created_at']
    list_filter = ['allocation_status', 'auto_allocation_done', 'service_date']
    search_fields = ['amc_contract__contract_id', 'product__name', 'remarks']
    readonly_fields = ['created_at', 'updated_at', 'crm_service_created_at']
    filter_horizontal = ['technicians']


@admin.register(AMCRenewal)
class AMCRenewalAdmin(admin.ModelAdmin):
    list_display = ['amc_contract', 'status', 'customer_requested_at', 'admin_action_by', 'admin_action_at', 'created_at']
    list_filter = ['status', 'customer_requested_at', 'admin_action_at']
    search_fields = ['amc_contract__contract_id', 'customer_response', 'admin_notes']
    readonly_fields = ['created_at', 'updated_at', 'customer_requested_at', 'admin_action_at']
