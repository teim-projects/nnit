"""
Complete reset of migrations for quotation, invoice, and AMC
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.base')
django.setup()

from django.db import connection

print("🔧 Resetting ALL migrations for quotation, invoice, and AMC...")

with connection.cursor() as cursor:
    # Delete ALL migration records for these apps
    print("1. Deleting migration records...")
    cursor.execute("DELETE FROM django_migrations WHERE app IN ('quotation', 'invoice', 'amc', 'inventory')")
    
    print("\n✅ Migration records cleared!")
    print("\nNow run:")
    print("  python manage.py migrate --fake")
