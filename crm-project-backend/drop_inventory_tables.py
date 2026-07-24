"""
Drop all inventory-related tables from database
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.base')
django.setup()

from django.db import connection

print("🗑️ Dropping inventory-related tables...\n")

tables_to_drop = [
    'quotation_quotation_terms_conditions',
    'invoice_invoice_terms_conditions',
    'inventory_termsconditions',
    'inventory_termsconditiontype',
    'inventory_inventoryitem',
]

with connection.cursor() as cursor:
    for table in tables_to_drop:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            print(f"✅ Dropped {table}")
        except Exception as e:
            print(f"⚠️ Could not drop {table}: {e}")

print("\n✅ Done!")
