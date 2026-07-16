#!/usr/bin/env python
"""Test if parking_products URLs are loaded"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from django.urls import get_resolver

print("=" * 60)
print("CHECKING PARKING PRODUCTS URLS")
print("=" * 60)

resolver = get_resolver()
print("\nAll URL patterns:")
for i, pattern in enumerate(resolver.url_patterns, 1):
    print(f"{i}. {pattern.pattern}")

print("\n" + "=" * 60)
print("Searching for 'parking' in URLs:")
parking_found = False
for pattern in resolver.url_patterns:
    if 'parking' in str(pattern.pattern):
        print(f"✅ FOUND: {pattern.pattern}")
        parking_found = True

if not parking_found:
    print("❌ NO parking URLs found!")
    print("\nTrying to import parking_products.urls...")
    try:
        from parking_products import urls as parking_urls
        print("✅ parking_products.urls imported successfully")
        print(f"   URLs in module: {parking_urls.urlpatterns}")
    except Exception as e:
        print(f"❌ Error importing parking_products.urls: {e}")

print("=" * 60)
