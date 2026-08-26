import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings')
django.setup()

from amc.models import AMCContract
from service_management.models import ServiceRequest

print("\n" + "="*70)
print("AMC DATA CHECK - Calendar ke liye")
print("="*70)

# AMC Contracts
print("\n1. AMC CONTRACTS:")
print("-"*70)
amcs = AMCContract.objects.all().select_related('customer')
print(f"Total AMC Contracts: {amcs.count()}")

for amc in amcs:
    cust = amc.customer.company_name or amc.customer.name if amc.customer else "No Customer"
    print(f"\n  {amc.contract_id} | {cust}")
    print(f"  Product: {amc.product}")
    print(f"  Start: {amc.start_date} | End: {amc.end_date}")
    print(f"  Status: {amc.status}")

# Service Requests linked to AMC
print("\n\n2. SERVICE REQUESTS (AMC se linked):")
print("-"*70)
srs = ServiceRequest.objects.filter(amc_contract__isnull=False).select_related('amc_contract', 'customer')
print(f"Total Service Requests with AMC link: {srs.count()}")

if srs.count() > 0:
    for sr in srs[:10]:
        cust = sr.customer.company_name or sr.customer.name if sr.customer else "No Customer"
        contract = sr.amc_contract.contract_id if sr.amc_contract else "No Contract"
        print(f"\n  Service #{sr.id}")
        print(f"  Contract: {contract}")
        print(f"  Customer: {cust}")
        print(f"  Scheduled Date: {sr.scheduled_date}")
        print(f"  Is Allocated: {sr.is_allocated}")
else:
    print("\n  ❌ PROBLEM: Koi bhi Service Request AMC se linked nahi hai!")
    print("  Isliye calendar empty show ho raha hai.")
    print("\n  SOLUTION: AMC contracts ke liye service visits generate karna padega:")
    print("  1. Admin panel se ya")
    print("  2. API se 'generate-schedule' action call karke")

# Check if AMCs have service_requests relation
print("\n\n3. AMC CONTRACTS KE SERVICE REQUESTS:")
print("-"*70)
for amc in amcs:
    sr_count = amc.service_requests.count() if hasattr(amc, 'service_requests') else 0
    cust = amc.customer.company_name or amc.customer.name if amc.customer else "No Customer"
    print(f"  {amc.contract_id} ({cust}): {sr_count} service requests")
    if sr_count == 0:
        print(f"    ⚠️ Is contract ke liye services generate nahi hui hain!")

print("\n" + "="*70)
print("SUMMARY:")
print(f"  AMC Contracts: {amcs.count()}")
print(f"  Service Requests (AMC linked): {srs.count()}")
if srs.count() == 0:
    print("\n  ❌ SERVICE VISITS MISSING - Calendar empty rahega!")
    print("  ✅ FIX: Generate services for each AMC contract")
print("="*70 + "\n")
