import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from lead_management.models import Customer

all_customers = Customer.objects.all()
real_customers = Customer.objects.filter(is_lead_only=False)
lead_only_customers = Customer.objects.filter(is_lead_only=True)

print(f"Total Customers in DB: {all_customers.count()}")
print(f"Real Customers (is_lead_only=False): {real_customers.count()}")
print(f"Lead-Only Customers (is_lead_only=True): {lead_only_customers.count()}")

for c in all_customers[:10]:
    print(f"ID: {c.id}, Name: '{c.name}', Phone: '{c.contact_number}', is_lead_only: {c.is_lead_only}")
