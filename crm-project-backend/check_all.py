import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.base')
django.setup()

from lead_management.models import lead_management, Customer
from quotation.models import Quotation
from parking_products.models import ParkingProduct
from amc.models import ServiceManagementRecord

print("=== LIVE DATABASE COUNTS ===")
print("Leads:", lead_management.objects.count())
print("Customers:", Customer.objects.count())
print("Quotations:", Quotation.objects.count())
print("Products:", ParkingProduct.objects.count())
print("Services:", ServiceManagementRecord.objects.count())

print("\n--- SAMPLE QUOTATIONS ---")
for q in Quotation.objects.all()[:5]:
    amt = getattr(q, 'total_amount', None) or getattr(q, 'grand_total', 0)
    print(f"Quotation ID: {q.id} | Amount: {amt} | Customer: {getattr(q, 'customer_name', 'N/A')}")

print("\n--- SAMPLE LEADS ---")
for l in lead_management.objects.all()[:5]:
    cname = l.customer.name if l.customer else 'N/A'
    print(f"Lead ID: {l.id} | Customer: {cname} | Source: {l.lead_source} | Status: {l.status}")

print("\n--- SAMPLE CUSTOMERS ---")
for c in Customer.objects.all()[:5]:
    print(f"Customer ID: {c.id} | Name: {c.name} | Phone: {c.contact_number}")
