"""
Debug authentication issue on parking endpoints
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from parking_products.views import ProductCategoryViewSet
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.tokens import AccessToken
from api.models import CustomUser

# Create a test user
user = CustomUser.objects.filter(is_staff=True).first()
if not user:
    print("No staff users found in database!")
    exit(1)

print(f"Testing with user: {user.email}")

# Generate a token
token = AccessToken.for_user(user)
print(f"Token: {str(token)[:50]}...")

# Create a test request
factory = APIRequestFactory()
request = factory.get('/parking/categories/', HTTP_AUTHORIZATION=f'Bearer {str(token)}')

# Test authentication
view = ProductCategoryViewSet.as_view({'get': 'list'})

print("\nViewSet configuration:")
print(f"Authentication classes: {ProductCategoryViewSet.authentication_classes}")
print(f"Permission classes: {ProductCategoryViewSet.permission_classes}")

try:
    response = view(request)
    print(f"\nResponse status: {response.status_code}")
    if response.status_code == 401:
        print("STILL UNAUTHORIZED!")
        print(f"Response data: {response.data}")
    else:
        print("SUCCESS! Authentication working.")
except Exception as e:
    print(f"\nError: {e}")
