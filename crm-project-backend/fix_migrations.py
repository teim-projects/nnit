"""
Fix migrations by removing inventory dependencies
Run this with: python fix_migrations.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.base')
django.setup()

from django.db import connection

print("🔧 Fixing migrations...")

with connection.cursor() as cursor:
    # 1. Delete inventory migrations
    print("1. Removing inventory from django_migrations...")
    cursor.execute("DELETE FROM django_migrations WHERE app = 'inventory'")
    
    # 2. Drop inventory-related tables
    print("2. Dropping inventory tables...")
    tables_to_drop = [
        'amc_amcsparepart',
        'quotation_quotation_terms_conditions',
        'invoice_invoice_terms_conditions',
        'inventory_termsconditions',
        'inventory_termsconditiontype',
        'inventory_inventoryitem',
    ]
    
    for table in tables_to_drop:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            print(f"   ✓ Dropped {table}")
        except Exception as e:
            print(f"   ⚠ Could not drop {table}: {e}")
    
    # 3. Delete problematic migration entries
    print("3. Cleaning up migration entries...")
    cursor.execute("DELETE FROM django_migrations WHERE name LIKE '%0001_initial%' AND app IN ('quotation', 'invoice', 'amc')")
    cursor.execute("DELETE FROM django_migrations WHERE name LIKE '%0002_%' AND app IN ('quotation', 'invoice', 'amc')")
    cursor.execute("DELETE FROM django_migrations WHERE name LIKE '%0003_%' AND app IN ('amc')")

print("\n✅ Database cleaned!")
print("\nNext steps:")
print("1. Delete migration files manually:")
print("   - quotation/migrations/0001_initial.py")
print("   - quotation/migrations/0002_*.py")  
print("   - invoice/migrations/0001_initial.py")
print("   - invoice/migrations/0002_*.py")
print("   - amc/migrations/0001_initial.py")
print("   - amc/migrations/0002_*.py")
print("   - amc/migrations/0003_*.py")
print("\n2. Run: python manage.py makemigrations")
print("3. Run: python manage.py migrate --fake-initial")
