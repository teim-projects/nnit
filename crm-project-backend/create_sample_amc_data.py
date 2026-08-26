"""
Create sample AMC data for testing calendar and dashboard
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from django.utils import timezone
from datetime import timedelta, date
from amc.models import AMCContract, AMCCycle, AMCType, PaymentFrequency, AMCStatus
from lead_management.models import Customer
from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 80)
print("CREATING SAMPLE AMC DATA FOR CALENDAR")
print("=" * 80)

# Get or create admin user
admin_user = User.objects.filter(is_superuser=True).first()
if not admin_user:
    print("⚠️  No admin user found. Creating one...")
    admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')

# Define sample customers
sample_customers = [
    {"name": "CHAND Industries", "email": "chand@example.com", "contact": "9876543210"},
    {"name": "Ganesh Enterprises", "email": "ganesh@example.com", "contact": "9876543211"},
    {"name": "Abhijit Tech Solutions", "email": "abhijit@example.com", "contact": "9876543212"},
    {"name": "Sagar Industries", "email": "sagar@example.com", "contact": "9876543213"},
    {"name": "Prashant Enterprises", "email": "prashant@example.com", "contact": "9876543214"},
]

# Create or get customers
customers = []
for cust_data in sample_customers:
    customer, created = Customer.objects.get_or_create(
        email=cust_data["email"],
        defaults={
            "name": cust_data["name"],
            "contact_number": cust_data["contact"],
            "address": "Mumbai, Maharashtra",
            "city": "Mumbai",
            "state": "Maharashtra",
            "is_lead_only": False,
        }
    )
    customers.append(customer)
    status = "✅ Created" if created else "📌 Exists"
    print(f"{status} Customer: {customer.name}")

print(f"\n{'='*80}")
print("CREATING AMC CONTRACTS WITH DIFFERENT SCENARIOS")
print("=" * 80)

today = timezone.now().date()

# Sample AMC contracts with different scenarios
amc_configs = [
    {
        "customer": customers[0],
        "product": "Air Handling Unit - AHU-5000",
        "amc_type": AMCType.COMPREHENSIVE,
        "payment_frequency": PaymentFrequency.QUARTERLY,
        "annual_value": 50000,
        "start_date": today - timedelta(days=60),  # Started 2 months ago
        "end_date": today + timedelta(days=305),   # Expires in ~10 months
        "scope": "Complete maintenance of AHU including filters, motors, belts",
    },
    {
        "customer": customers[1],
        "product": "Parking Ventilation System - PVS-3000",
        "amc_type": AMCType.NON_COMPREHENSIVE,
        "payment_frequency": PaymentFrequency.MONTHLY,
        "annual_value": 120000,
        "start_date": today - timedelta(days=30),  # Started 1 month ago
        "end_date": today + timedelta(days=335),   # Expires in ~11 months
        "scope": "Regular maintenance and inspection of parking ventilation system",
    },
    {
        "customer": customers[2],
        "product": "Industrial Exhaust Fan - IEF-7500",
        "amc_type": AMCType.COMPREHENSIVE,
        "payment_frequency": PaymentFrequency.QUARTERLY,
        "annual_value": 75000,
        "start_date": today - timedelta(days=300),  # Started 10 months ago
        "end_date": today + timedelta(days=25),     # Expires in 25 days (RENEWAL DUE!)
        "scope": "Complete exhaust fan maintenance including motor and blades",
    },
    {
        "customer": customers[3],
        "product": "HVAC System - Complete Package",
        "amc_type": AMCType.COMPREHENSIVE,
        "payment_frequency": PaymentFrequency.HALF_YEARLY,
        "annual_value": 200000,
        "start_date": today - timedelta(days=200),  # Started ~7 months ago
        "end_date": today + timedelta(days=165),    # Expires in ~5.5 months
        "scope": "Complete HVAC system maintenance - heating, cooling, ventilation",
    },
    {
        "customer": customers[4],
        "product": "Fresh Air System - FAS-2000",
        "amc_type": AMCType.WARRANTY,
        "payment_frequency": PaymentFrequency.QUARTERLY,
        "annual_value": 0,  # Free warranty
        "start_date": today - timedelta(days=90),   # Started 3 months ago
        "end_date": today + timedelta(days=275),    # Expires in ~9 months
        "scope": "1 Year Warranty - 4 Quarterly Free Services",
    },
]

created_contracts = []

for idx, config in enumerate(amc_configs, 1):
    # Create contract
    contract = AMCContract.objects.create(
        customer=config["customer"],
        product=config["product"],
        amc_type=config["amc_type"],
        payment_frequency=config["payment_frequency"],
        annual_value=config["annual_value"],
        start_date=config["start_date"],
        end_date=config["end_date"],
        scope_of_support=config["scope"],
        created_by=admin_user,
        default_customer_address=f"{config['customer'].address or 'Mumbai, Maharashtra'}",
        default_customer_contact=config['customer'].contact_number or "9999999999",
        default_work_description=f"Scheduled {config['amc_type']} service visit for {config['product']}",
    )
    
    # Create first cycle
    AMCCycle.objects.create(
        amc_contract=contract,
        cycle_number=1,
        start_date=config["start_date"],
        end_date=config["end_date"],
        annual_value=config["annual_value"],
        payment_frequency=config["payment_frequency"],
        status=AMCStatus.ACTIVE,
        remarks=f"Initial {config['amc_type']} contract",
        created_by=admin_user,
    )
    
    # Sync contract data
    contract.sync_active_cycle_data()
    
    # Generate service schedule
    services = contract.generate_schedule()
    
    created_contracts.append(contract)
    
    print(f"\n✅ Created: {contract.contract_id}")
    print(f"   Customer: {contract.customer.name}")
    print(f"   Product: {contract.product}")
    print(f"   Type: {contract.get_amc_type_display()}")
    print(f"   Frequency: {contract.get_payment_frequency_display()}")
    print(f"   Start: {contract.start_date} | End: {contract.end_date}")
    print(f"   Value: ₹{contract.annual_value:,.2f}")
    print(f"   Status: {contract.status}")
    print(f"   🔧 Services Generated: {len(services)}")
    
    # Show service dates
    if services:
        print(f"   📅 Service Dates:")
        for srv in services[:3]:  # Show first 3
            print(f"      • {srv.scheduled_date} - {srv.title}")
        if len(services) > 3:
            print(f"      ... and {len(services) - 3} more")

print(f"\n{'='*80}")
print("SUMMARY")
print("=" * 80)
print(f"✅ Customers Created: {len(customers)}")
print(f"✅ AMC Contracts Created: {len(created_contracts)}")

# Count services
from service_management.models import ServiceRequest
total_services = ServiceRequest.objects.filter(amc_contract__isnull=False).count()
print(f"✅ Service Visits Generated: {total_services}")

print(f"\n{'='*80}")
print("CALENDAR EVENTS BREAKDOWN")
print("=" * 80)

# Service visits
scheduled_services = ServiceRequest.objects.filter(
    amc_contract__isnull=False,
    is_allocated=False
).count()

allocated_services = ServiceRequest.objects.filter(
    amc_contract__isnull=False,
    is_allocated=True
).count()

# Expiry events
expiry_events = AMCContract.objects.filter(end_date__isnull=False).count()

# Renewal due (next 30 days)
renewal_due = AMCContract.objects.filter(
    end_date__gte=today,
    end_date__lte=today + timedelta(days=30)
).count()

print(f"🔵 Scheduled Services: {scheduled_services}")
print(f"🟢 Allocated Services: {allocated_services}")
print(f"🔴 Contract Expiry Events: {expiry_events}")
print(f"🟠 Renewal Due (next 30 days): {renewal_due}")
print(f"📊 Total Calendar Events: {scheduled_services + allocated_services + expiry_events + renewal_due}")

print(f"\n{'='*80}")
print("✅ SAMPLE DATA CREATION COMPLETE!")
print("=" * 80)
print("\n📋 Next Steps:")
print("1. Restart Django server if running")
print("2. Open frontend and navigate to AMC → Calendar")
print("3. Calendar should now show all events with colors:")
print("   🔵 Blue = Scheduled Service")
print("   🟢 Green = Allocated Service")
print("   🔴 Red = Contract Expiry")
print("   🟠 Amber = Renewal Due")
print("\n✅ Done!")
