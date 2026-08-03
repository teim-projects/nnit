import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from lead_management.models import Customer, lead_management
from django.contrib.auth import get_user_model

User = get_user_model()
admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()

requests_to_sync = [
    {'name': 'om', 'company': 'N/A', 'req': 'Site layout & boom barrier specs'},
    {'name': 'BHARAT MANOJ SHARMA', 'company': 'N/A', 'req': 'General arrangement drawing'},
    {'name': 'tiger', 'company': 'sqdqd', 'req': 'Site entrance layout'},
    {'name': 'rocy', 'company': 'tiger pvt.lld', 'req': 'Pit stack parking specs'}
]

for idx, item in enumerate(requests_to_sync, start=10):
    cust = Customer.objects.filter(name=item['name']).first()
    if not cust:
        cust = Customer.objects.create(
            name=item['name'],
            contact_number=f"98765432{idx}"
        )
    
    lead = lead_management.objects.filter(customer=cust).first()
    if not lead:
        lead = lead_management.objects.create(
            customer=cust,
            company_name=item['company'],
            requirements_details=item['req'],
            lead_source='other',
            is_sent=True,
            is_received=False,
            assign_to=admin_user
        )
    else:
        lead.is_sent = True
        lead.requirements_details = item['req']
        lead.save()

print("All 4 design requests successfully inserted and synced into Django Database!")
