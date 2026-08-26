import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from lead_management.models import Customer, lead_management
from lead_management.views import LeadViewSet, CustomerViewsets
from rest_framework.test import APIRequestFactory, force_authenticate

factory = APIRequestFactory()
request = factory.post('/lead/lead/import-bulk/', {
    "records": [
        {
            "Customer Name": "Test User Direct",
            "Contact Number": "9998887779",
            "Email": "testdirect@example.com",
            "Company Name": "Direct Site",
            "Lead Source": "website",
            "Status": "new"
        }
    ]
}, format='json')

from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.filter(is_superuser=True).first() or User.objects.first()
force_authenticate(request, user=user)

view = LeadViewSet.as_view({'post': 'import_bulk'})
response = view(request)
print("View Status Code:", response.status_code)
print("View Data:", response.data)
