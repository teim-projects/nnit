"""
Generate service visits for existing AMC contracts
Run this to populate calendar with events
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings')
django.setup()

from amc.models import AMCContract

print("\n" + "="*70)
print("GENERATING SERVICE VISITS FOR AMC CONTRACTS")
print("="*70)

amcs = AMCContract.objects.all()
print(f"\nTotal AMC Contracts: {amcs.count()}")

total_services = 0

for amc in amcs:
    cust_name = amc.customer.company_name or amc.customer.name if amc.customer else "No Customer"
    print(f"\n{amc.contract_id} - {cust_name}")
    print(f"  Product: {amc.product}")
    print(f"  Frequency: {amc.payment_frequency}")
    print(f"  Date Range: {amc.start_date} to {amc.end_date}")
    
    # Check existing services
    existing_count = amc.service_requests.count() if hasattr(amc, 'service_requests') else 0
    print(f"  Existing Services: {existing_count}")
    
    if existing_count == 0:
        print(f"  ⚙️ Generating services...")
        try:
            # Call the generate_schedule method
            services = amc.generate_schedule()
            print(f"  ✅ Generated {len(services)} service visits!")
            total_services += len(services)
            
            # Show first few
            for srv in services[:3]:
                print(f"     - {srv.title} on {srv.scheduled_date}")
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
    else:
        print(f"  ℹ️ Services already exist, skipping...")
        total_services += existing_count

print("\n" + "="*70)
print(f"DONE! Total Services: {total_services}")
print("="*70)
print("\n✅ Ab calendar mein events dikhenge!")
print("   Frontend ko refresh karo (Ctrl+Shift+R)\n")
