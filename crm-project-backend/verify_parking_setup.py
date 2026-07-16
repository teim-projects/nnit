#!/usr/bin/env python
"""Verify parking_products setup"""
import os
import sys

print("=" * 70)
print("PARKING PRODUCTS SETUP VERIFICATION")
print("=" * 70)

# Check 1: Module import
print("\n1. Checking if parking_products module can be imported...")
try:
    import parking_products
    print("   ✅ parking_products module imported successfully")
except ImportError as e:
    print(f"   ❌ Failed to import parking_products: {e}")
    sys.exit(1)

# Check 2: Models import
print("\n2. Checking models...")
try:
    from parking_products.models import ProductCategory, ParkingProduct
    print("   ✅ Models imported successfully")
except ImportError as e:
    print(f"   ❌ Failed to import models: {e}")
    sys.exit(1)

# Check 3: Views import
print("\n3. Checking views...")
try:
    from parking_products.views import ProductCategoryViewSet, ParkingProductViewSet
    print("   ✅ Views imported successfully")
except ImportError as e:
    print(f"   ❌ Failed to import views: {e}")
    sys.exit(1)

# Check 4: URLs import
print("\n4. Checking URLs...")
try:
    from parking_products import urls
    print(f"   ✅ URLs imported successfully")
    print(f"   Found {len(urls.urlpatterns)} URL pattern(s)")
except ImportError as e:
    print(f"   ❌ Failed to import URLs: {e}")
    sys.exit(1)

# Check 5: Settings
print("\n5. Checking Django settings...")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
import django
django.setup()

from django.conf import settings
if 'parking_products' in settings.INSTALLED_APPS:
    print("   ✅ parking_products is in INSTALLED_APPS")
else:
    print("   ❌ parking_products is NOT in INSTALLED_APPS")
    sys.exit(1)

# Check 6: URL configuration
print("\n6. Checking URL configuration...")
from django.urls import get_resolver
resolver = get_resolver()
parking_found = False
for pattern in resolver.url_patterns:
    if 'parking' in str(pattern.pattern):
        print(f"   ✅ Found parking URL: {pattern.pattern}")
        parking_found = True
        break

if not parking_found:
    print("   ❌ parking URL NOT found in Django URL configuration!")
    print("\n   This means:")
    print("   - The server needs to be restarted")
    print("   - OR there's a syntax error in krishna_air/urls.py")
    print("\n   Try:")
    print("   1. Stop Django server (Ctrl+C)")
    print("   2. Delete __pycache__ folders")
    print("   3. Run: python manage.py runserver")
    sys.exit(1)

# Check 7: Database tables
print("\n7. Checking database tables...")
try:
    from django.db import connection
    tables = connection.introspection.table_names()
    parking_tables = [t for t in tables if 'parking' in t or 'product_cat' in t]
    if parking_tables:
        print(f"   ✅ Found {len(parking_tables)} parking-related tables:")
        for table in parking_tables:
            print(f"      - {table}")
    else:
        print("   ⚠️  No parking tables found - migrations may not have run")
except Exception as e:
    print(f"   ❌ Error checking database: {e}")

print("\n" + "=" * 70)
print("VERIFICATION COMPLETE")
print("=" * 70)

if parking_found:
    print("\n✅ All checks passed! Parking products should be working.")
    print("\nTest URLs:")
    print("  http://localhost:8000/parking/categories/")
    print("  http://localhost:8000/parking/products/")
else:
    print("\n❌ Setup incomplete. Please restart Django server.")
