import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from lead_management.models import Customer
from parking_products.models import ParkingProduct
from product_management.models import Product

print("--- CUSTOMERS ---")
all_customers = Customer.objects.all()
print("Count in DB:", all_customers.count())
for c in all_customers:
    print(f"  ID: {c.id}, Name: '{c.name}', Phone: '{c.contact_number}', is_lead_only: {c.is_lead_only}")

print("\n--- PARKING PRODUCTS ---")
parking_prods = ParkingProduct.objects.all()
print("Count in DB:", parking_prods.count())
for p in parking_prods:
    print(f"  ID: {p.id}, Name: '{p.name}', Model Code: '{getattr(p, 'model_code', '')}'")

print("\n--- GENERIC PRODUCTS ---")
generic_prods = Product.objects.all()
print("Count in DB:", generic_prods.count())
for p in generic_prods:
    print(f"  ID: {p.id}, Name: '{p.name}'")
