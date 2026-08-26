import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from amc.models import AMCContract, AMCServiceVisit, AMCRenewal
from service_management.models import ServiceRequest
from django.utils import timezone
from datetime import timedelta

print("=" * 80)
print("AMC CALENDAR DATA CHECK")
print("=" * 80)

# Check AMC Contracts
print("\n📋 AMC CONTRACTS:")
print("-" * 80)
amcs = AMCContract.objects.all()[:10]
if amcs:
    for amc in amcs:
        customer_name = amc.customer.name if hasattr(amc.customer, 'name') else amc.customer.company_name if hasattr(amc.customer, 'company_name') else 'Unknown'
        print(f"  {amc.contract_id} | {customer_name}")
        print(f"    Product: {amc.product}")
        print(f"    Start: {amc.start_date} | End: {amc.end_date}")
        print(f"    Status: {amc.status}")
        print(f"    Annual Value: ₹{amc.annual_value}")
        print()
else:
    print("  ❌ No AMC contracts found")

print(f"Total AMC Contracts: {AMCContract.objects.count()}")

# Check Service Requests linked to AMC
print("\n🔧 SERVICE REQUESTS (AMC-linked):")
print("-" * 80)
srs = ServiceRequest.objects.filter(amc_contract__isnull=False)[:10]
if srs:
    for sr in srs:
        print(f"  SR-{sr.id} | {sr.title}")
        print(f"    Date: {sr.scheduled_date}")
        print(f"    Allocated: {sr.is_allocated}")
        print(f"    Contract: {sr.amc_contract.contract_id if sr.amc_contract else 'None'}")
        print()
else:
    print("  ❌ No AMC service requests found")

print(f"Total AMC Service Requests: {ServiceRequest.objects.filter(amc_contract__isnull=False).count()}")

# Check AMC Service Visits
print("\n🏃 AMC SERVICE VISITS:")
print("-" * 80)
visits = AMCServiceVisit.objects.all()[:10]
if visits:
    for visit in visits:
        print(f"  Visit-{visit.id} | {visit.amc_contract.contract_id}")
        print(f"    Date: {visit.service_date}")
        print(f"    Status: {visit.allocation_status}")
        print()
else:
    print("  ❌ No AMC service visits found")

print(f"Total AMC Service Visits: {AMCServiceVisit.objects.count()}")

# Check calendar event generation logic
print("\n📅 CALENDAR EVENTS SIMULATION:")
print("-" * 80)
today = timezone.now().date()
next_30 = today + timedelta(days=30)

# Count events that should appear
scheduled_count = ServiceRequest.objects.filter(
    amc_contract__isnull=False,
    scheduled_date__isnull=False
).count()

expiry_count = AMCContract.objects.filter(end_date__isnull=False).count()

expiring_soon = AMCContract.objects.filter(
    end_date__gte=today,
    end_date__lte=next_30
).count()

print(f"  • Scheduled Service Events: {scheduled_count}")
print(f"  • Contract Expiry Events: {expiry_count}")
print(f"  • Renewal Due Events (next 30 days): {expiring_soon}")
print(f"  • Total Events Expected: {scheduled_count + expiry_count + expiring_soon}")

# Check renewal requests
print("\n🔄 RENEWAL REQUESTS:")
print("-" * 80)
renewals = AMCRenewal.objects.all()[:5]
if renewals:
    for renewal in renewals:
        print(f"  Renewal-{renewal.id} | Contract: {renewal.amc_contract.contract_id}")
        print(f"    Status: {renewal.status}")
        print()
else:
    print("  ❌ No renewal requests found")

print(f"Total Renewal Requests: {AMCRenewal.objects.count()}")

print("\n" + "=" * 80)
print("✅ CHECK COMPLETE")
print("=" * 80)
