"""
Quick check to verify customers and products exist in database
Run: python check_data.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.base')
django.setup()

from lead_management.models import Customer
from parking_products.models import ParkingProduct

print("=" * 60)
print("📊 DATABASE CHECK")
print("=" * 60)

# Check Customers
print("\n1️⃣ CUSTOMERS:")
customer_count = Customer.objects.count()
print(f"   Total Customers: {customer_count}")

if customer_count > 0:
    print("\n   Sample Customers:")
    for customer in Customer.objects.all()[:5]:
        print(f"   ✓ ID: {customer.id} | Name: {customer.name} | Phone: {customer.contact_number}")
else:
    print("   ⚠️  No customers found in database!")
    print("   → Create customers first in lead management")

# Check Products
print("\n2️⃣ PARKING PRODUCTS:")
product_count = ParkingProduct.objects.count()
active_count = ParkingProduct.objects.filter(is_active=True).count()
print(f"   Total Products: {product_count}")
print(f"   Active Products: {active_count}")

if active_count > 0:
    print("\n   Sample Products:")
    for product in ParkingProduct.objects.filter(is_active=True)[:5]:
        category_name = product.category.display_name if product.category else "N/A"
        print(f"   ✓ ID: {product.id} | Name: {product.product_name} | Category: {category_name}")
else:
    print("   ⚠️  No active products found!")
    print("   → Create parking products first")

print("\n" + "=" * 60)
print("✅ ENDPOINTS READY:")
print("   GET /quotation/customer/")
print("   GET /quotation/products/")
print("=" * 60)

if customer_count > 0 and active_count > 0:
    print("\n🎉 All data looks good! Frontend should work now.")
else:
    print("\n⚠️  Add customers and products first!")
