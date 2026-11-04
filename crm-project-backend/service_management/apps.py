from django.apps import AppConfig


class ServiceManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'service_management'

    def ready(self):
        from .scheduler import start_service_reminder_scheduler
        start_service_reminder_scheduler()
