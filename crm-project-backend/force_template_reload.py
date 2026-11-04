"""
Force template reload script for production
Run this to clear Django template cache
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.prod')
django.setup()

from django.template import engines
from django.core.cache import cache

print("=" * 60)
print("FORCING TEMPLATE RELOAD FOR PRODUCTION")
print("=" * 60)

# Clear Django cache
try:
    cache.clear()
    print("✓ Django cache cleared")
except Exception as e:
    print(f"⚠ Cache clear warning: {e}")

# Reset template engines
try:
    for engine in engines.all():
        engine.engine.template_loaders = []
    print("✓ Template loaders reset")
except Exception as e:
    print(f"⚠ Template loader warning: {e}")

# Clear Python bytecode
import glob
pyc_files = glob.glob('**/*.pyc', recursive=True)
pycache_dirs = glob.glob('**/__pycache__', recursive=True)

for f in pyc_files:
    try:
        os.remove(f)
    except:
        pass

for d in pycache_dirs:
    try:
        import shutil
        shutil.rmtree(d)
    except:
        pass

print(f"✓ Removed {len(pyc_files)} .pyc files")
print(f"✓ Removed {len(pycache_dirs)} __pycache__ directories")

print("\n" + "=" * 60)
print("✅ TEMPLATE CACHE CLEARED!")
print("=" * 60)
print("\nNow restart your production server:")
print("  - If using gunicorn: sudo systemctl restart gunicorn")
print("  - If using uwsgi: sudo systemctl restart uwsgi")
print("  - If using Apache: sudo systemctl restart apache2")
print("  - Manual: kill and restart the Python process")
print("=" * 60)
