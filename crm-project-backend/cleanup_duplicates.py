import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from lead_management.models import Customer, lead_management

# Fix Customer 9823012345 back to "Amit Patel"
c1 = Customer.objects.filter(contact_number="9823012345").first()
if c1:
    c1.name = "Amit Patel"
    c1.save()
    print("Fixed customer 9823012345 -> Amit Patel")

# Fix Customer 9890123456 back to "Sneha Deshmukh"
c2 = Customer.objects.filter(contact_number="9890123456").first()
if c2:
    c2.name = "Sneha Deshmukh"
    c2.save()
    print("Fixed customer 9890123456 -> Sneha Deshmukh")

# Clean up duplicate test leads created earlier during testing
if c1:
    c1_leads = list(lead_management.objects.filter(customer=c1).order_by('id'))
    if len(c1_leads) > 1:
        # Keep the latest lead, delete earlier test duplicates
        keep = c1_leads[-1]
        for l in c1_leads[:-1]:
            l.delete()
        print(f"Cleaned up {len(c1_leads) - 1} duplicate leads for {c1.name}, kept Lead #{keep.id}")

if c2:
    c2_leads = list(lead_management.objects.filter(customer=c2).order_by('id'))
    if len(c2_leads) > 1:
        # Keep the latest lead, delete earlier test duplicates
        keep = c2_leads[-1]
        for l in c2_leads[:-1]:
            l.delete()
        print(f"Cleaned up {len(c2_leads) - 1} duplicate leads for {c2.name}, kept Lead #{keep.id}")
