#!/usr/bin/env python
"""
Template Version Checker
Run this on live server to verify template changes
"""
import os
import sys

print("=" * 70)
print("TEMPLATE VERSION CHECKER")
print("=" * 70)

# Check if we're in the right directory
if not os.path.exists('manage.py'):
    print("❌ Error: Run this from crm-project-backend directory")
    sys.exit(1)

template_path = 'templates/pdf/quotation.html'

if not os.path.exists(template_path):
    print(f"❌ Template file not found: {template_path}")
    sys.exit(1)

print(f"\n✓ Found template: {template_path}")

# Read template and check for new styling
with open(template_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check for new font sizes
checks = {
    'Font size 15px': 'font-size: 15px' in content,
    'Font size 16px title': 'font-size: 16px' in content,
    'Margin 15px': 'margin-bottom: 15px' in content,
    'Line height 1.7': 'line-height: 1.7' in content,
    'Inline display': 'display: inline' in content,
    'Page break avoid': 'page-break-inside: avoid' in content,
}

print("\n" + "=" * 70)
print("CHECKING NEW STYLING FEATURES:")
print("=" * 70)

all_good = True
for check_name, result in checks.items():
    status = "✓" if result else "✗"
    print(f"{status} {check_name}: {'FOUND' if result else 'MISSING'}")
    if not result:
        all_good = False

print("=" * 70)

if all_good:
    print("\n✅ ALL CHANGES DETECTED - Template is updated!")
    print("\nIf PDF still shows old styling:")
    print("1. Clear browser cache (Ctrl+Shift+Del)")
    print("2. Restart application server")
    print("3. Clear Django cache: python manage.py shell -c 'from django.core.cache import cache; cache.clear()'")
else:
    print("\n❌ TEMPLATE NOT UPDATED - Old version detected!")
    print("\nTo fix:")
    print("1. Run: git pull origin bharat-new2")
    print("2. Verify branch: git branch")
    print("3. Check file: cat templates/pdf/quotation.html | grep 'font-size: 15px'")

print("=" * 70)

# Check last modification time
import datetime
mod_time = os.path.getmtime(template_path)
mod_date = datetime.datetime.fromtimestamp(mod_time)
print(f"\n📅 Last modified: {mod_date.strftime('%Y-%m-%d %H:%M:%S')}")

# Check Django cache settings
print("\n" + "=" * 70)
print("DJANGO CACHE CONFIGURATION:")
print("=" * 70)

try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.prod')
    import django
    django.setup()
    
    from django.conf import settings
    
    print(f"DEBUG mode: {settings.DEBUG}")
    print(f"Template loaders: {settings.TEMPLATES[0]['OPTIONS'].get('loaders', 'Default')}")
    
    if hasattr(settings, 'CACHES'):
        print(f"Cache backend: {settings.CACHES.get('default', {}).get('BACKEND', 'None')}")
    
except Exception as e:
    print(f"⚠ Could not check Django settings: {e}")

print("=" * 70)
