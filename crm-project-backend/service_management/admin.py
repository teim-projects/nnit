from django.contrib import admin
from .models import Technician, ServiceRequest


@admin.register(Technician)
class TechnicianAdmin(admin.ModelAdmin):
    list_display = ('technician_id', 'name', 'phone', 'specialization', 'status', 'experience_years', 'created_at')
    list_filter = ('status', 'specialization')
    search_fields = ('technician_id', 'name', 'phone', 'email', 'specialization')


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('service_id', 'title', 'service_type', 'customer', 'assigned_technician', 'priority', 'status', 'scheduled_date')
    list_filter = ('service_type', 'status', 'priority', 'scheduled_date')
    search_fields = ('service_id', 'title', 'description', 'customer__name', 'assigned_technician__name')
