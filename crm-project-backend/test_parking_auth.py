"""
Test script to check parking_products authentication configuration
"""
import sys
import os
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from parking_products.views import (
    ProductCategoryViewSet,
    ParkingProductViewSet,
    ProductConfigurationViewSet,
    ProductRequirementViewSet
)

print("=" * 60)
print("PARKING PRODUCTS AUTHENTICATION CHECK")
print("=" * 60)

viewsets = [
    ('ProductCategoryViewSet', ProductCategoryViewSet),
    ('ParkingProductViewSet', ParkingProductViewSet),
    ('ProductConfigurationViewSet', ProductConfigurationViewSet),
    ('ProductRequirementViewSet', ProductRequirementViewSet),
]

for name, viewset in viewsets:
    print(f"\n{name}:")
    print(f"  Authentication Classes: {viewset.authentication_classes}")
    print(f"  Permission Classes: {viewset.permission_classes}")

print("\n" + "=" * 60)
print("If you see [<class 'rest_framework_simplejwt.authentication.JWTAuthentication'>]")
print("above, the configuration is correct.")
print("If you still get 401 errors, please RESTART the Django server!")
print("=" * 60)
