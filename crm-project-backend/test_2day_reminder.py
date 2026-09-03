import os
import django
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from django.utils import timezone
from service_management.models import ServiceRequest, Technician, ServiceStatus, ServiceType
from lead_management.models import Customer
from amc.models import AMCContract, AMCServiceVisit
from service_management.notifications import process_all_2day_service_reminders

print("--- TESTING AMC SERVICE VISIT 2-DAY EMAIL REMINDER ---")

target_date = timezone.now().date() + timedelta(days=2)
print(f"Target Date (Today + 2 Days): {target_date}")

# Get test customer and tech
customer = Customer.objects.filter(is_lead_only=False).exclude(email='').first()
if not customer:
    customer = Customer.objects.create(name="Test Customer (Pooja)", email="bharatsharmaji885@gmail.com", contact_number="9876543210")

tech = Technician.objects.filter(status='active').exclude(email='').first()
if not tech:
    tech = Technician.objects.create(name="Test Technician (Bharat)", email="bharatsharmaji885@gmail.com", phone="9876543211")

# Create test AMC contract and AMCServiceVisit
amc_contract, _ = AMCContract.objects.get_or_create(
    contract_id="AMC-TEST-999",
    defaults={
        "customer": customer,
        "product": "2DP 101 Stacker Parking",
        "start_date": timezone.now().date(),
        "end_date": timezone.now().date() + timedelta(days=365),
        "assigned_technician": tech
    }
)

visit = AMCServiceVisit.objects.create(
    amc_contract=amc_contract,
    service_date=target_date,
    allocation_status='ALLOCATED'
)
visit.technicians.add(tech)

print(f"Created Test AMC Service Visit: Contract={amc_contract.contract_id}, Visit Date={visit.service_date}, Tech={tech.name}")

# Process reminders
summary = process_all_2day_service_reminders(target_date=target_date, force=True)

print("\n--- REMINDER SUMMARY ---")
print("Target Date:", summary['target_date'])
print("AMC Visits Processed:", summary['amc_visits_processed'])
print("Details:", summary['details'])

# Verify
visit.refresh_from_db()
print(f"\nVerification: visit.reminder_sent={visit.reminder_sent}, reminder_sent_at={visit.reminder_sent_at}")

# Clean up
visit.delete()
amc_contract.delete()
print("Cleaned up test AMC visit records.")
print("--- TEST COMPLETE ---")
