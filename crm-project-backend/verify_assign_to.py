import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from lead_management.models import lead_management

latest_lead = lead_management.objects.all().order_by('-id').first()
print("Latest Lead ID:", latest_lead.id)
print("Customer Name:", latest_lead.customer.name)
print("Created By:", latest_lead.creatd_by)
print("Assigned To:", latest_lead.assign_to)
