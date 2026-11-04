import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from lead_management.models import Customer

real_customers = Customer.objects.filter(is_lead_only=False).order_by('-id')
print(f"Real Customers (is_lead_only=False) Count: {real_customers.count()}")
for c in real_customers:
    print(f"  ID: {c.id}, Name: '{c.name}', Phone: '{c.contact_number}', is_lead_only: {c.is_lead_only}")
