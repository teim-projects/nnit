import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings')
django.setup()

from amc.models import AMCContract
from service_management.models import ServiceRequest
from datetime import datetime, timedelta

print("=" * 60)
print("AMC CALENDAR DATA CHECK")
print("=" * 60)

# Check AMC Contracts
print("\n1. AMC CONTRACTS:")
print("-" * 60)
amcs = AMCContract.objects.all()
print(f"Total AMC Contracts: {amcs.count()}")

for amc in amcs[:10]:
    customer_name = amc.customer.company_name or amc.customer.name if amc.customer else "No Customer"
    print(f"\n  Contract: {amc.contract_id}")
    print(f"  Customer: {customer_name}")
    print(f"  Product: {amc.product}")
    print(f"  Start: {amc.start_date}")
    print(f"  End: {amc.end_date}")
    print(f"  Status: {amc.status}")

# Check Service Requests with AMC
print("\n\n2. SERVICE REQUESTS (with AMC):")
print("-" * 60)
srs = ServiceRequest.objects.filter(amc_contract__isnull=False)
print(f"Total Service Requests with AMC: {srs.count()}")

for sr in srs[:10]:
    customer_name = sr.customer.company_name or sr.customer.name if sr.customer else "No Customer"
    contract = sr.amc_contract.contract_id if sr.amc_contract else "No Contract"
    print(f"\n  Service ID: {sr.id}")
    print(f"  Contract: {contract}")
    print(f"  Customer: {customer_name}")
    print(f"  Scheduled: {sr.scheduled_date}")
    print(f"  Allocated: {sr.is_allocated}")
    print(f"  Status: {sr.status}")

# Check what the API would return
print("\n\n3. CALENDAR EVENTS (what API returns):")
print("-" * 60)

events = []

# Scheduled services
srs = ServiceRequest.objects.filter(amc_contract__isnull=False).select_related('amc_contract', 'amc_contract__customer', 'customer')
for sr in srs:
    if sr.scheduled_date:
        if sr.customer:
            cust_name = sr.customer.company_name or sr.customer.name or "Customer"
        elif sr.amc_contract and sr.amc_contract.customer:
            cust_name = sr.amc_contract.customer.company_name or sr.amc_contract.customer.name or "Customer"
        else:
            cust_name = "Customer"
        
        contract_code = sr.amc_contract.contract_id if sr.amc_contract else "AMC-000"
        
        if sr.is_allocated:
            event_type = "Service Visit (Green)"
        else:
            event_type = "Scheduled Service (Blue)"
        
        events.append({
            'date': sr.scheduled_date,
            'type': event_type,
            'title': f"{event_type.split('(')[0].strip()} | {cust_name}",
            'contract': contract_code,
            'customer': cust_name
        })

# Contract expiries
for amc in AMCContract.objects.filter(end_date__isnull=False).select_related('customer'):
    cust_name = amc.customer.company_name or amc.customer.name if amc.customer else "Customer"
    events.append({
        'date': amc.end_date,
        'type': 'Contract Expiry (Red)',
        'title': f"Contract Expiry | {cust_name}",
        'contract': amc.contract_id or "AMC-000",
        'customer': cust_name
    })

# Renewal due
today = datetime.now().date()
expiring = AMCContract.objects.filter(
    end_date__gte=today,
    end_date__lte=today + timedelta(days=30),
    status__in=['active', 'expiring_soon']
).select_related('customer')

for amc in expiring:
    renewal_date = amc.end_date - timedelta(days=30)
    if renewal_date >= today:
        cust_name = amc.customer.company_name or amc.customer.name if amc.customer else "Customer"
        events.append({
            'date': renewal_date,
            'type': 'Renewal Due (Amber)',
            'title': f"Renewal Due | {cust_name}",
            'contract': amc.contract_id or "AMC-000",
            'customer': cust_name
        })

# Sort by date
events.sort(key=lambda x: x['date'] if x['date'] else datetime.now().date())

print(f"Total Events: {len(events)}")
for evt in events[:20]:
    print(f"\n  Date: {evt['date']}")
    print(f"  Type: {evt['type']}")
    print(f"  Title: {evt['title']}")
    print(f"  Contract: {evt['contract']}")
    print(f"  Customer: {evt['customer']}")

print("\n" + "=" * 60)
print("SUMMARY:")
print(f"  AMC Contracts: {amcs.count()}")
print(f"  Service Requests with AMC: {srs.count()}")
print(f"  Calendar Events: {len(events)}")
print("=" * 60)
