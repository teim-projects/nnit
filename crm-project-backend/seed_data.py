import os
import django
from decimal import Decimal
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from lead_management.models import Customer, lead_management, LeadFollowUp, InteractionType, ClientResponseType, FollowUpStatus, LeadStatus, LeadSource
from parking_products.models import ProductCategory, ParkingProduct
from quotation.models import Quotation, QuotationVersion
from amc.models import AMCContract, AMCType, PaymentFrequency, AMCStatus

User = get_user_model()
admin_user = User.objects.first()

print("=" * 60)
print("Starting Database Seeding (15 Dummy Records Per Module)...")
print("=" * 60)

# =====================================================================
# 1. Product Categories
# =====================================================================
categories_data = [
    ('stack_parking', 'Stack Parking', 'Two or three level vertical car parking systems', 'stack'),
    ('puzzle_parking', 'Puzzle Parking', 'Multi-level multi-row semi-automated parking systems', 'puzzle'),
    ('tower_parking', 'Tower Parking', 'High-capacity vertical tower automated parking', 'tower'),
    ('pit_parking', 'Pit Parking', 'Underground pit based independent parking systems', 'pit'),
    ('pit_stack_parking', 'Pit Stack Parking', 'Combined pit and stack multi-level systems', 'pit_stack'),
    ('pit_puzzle_parking', 'Pit Puzzle Parking', 'Pit integrated puzzle automated parking', 'pit_puzzle'),
    ('cantilever', 'Cantilever Parking', 'Single column cantilever space-saving parking', 'cantilever'),
]

category_objs = {}
for name, display_name, desc, icon in categories_data:
    cat, created = ProductCategory.objects.get_or_create(
        name=name,
        defaults={
            'display_name': display_name,
            'description': desc,
            'icon': icon,
            'is_active': True
        }
    )
    category_objs[name] = cat

print(f"[OK] Categories ready ({len(category_objs)} categories)")

# =====================================================================
# 2. Parking Products (15 Products)
# =====================================================================
products_data = [
    {
        'product_name': '2DP-101 Two Level Stack',
        'product_code': 'STK-2DP-101',
        'category': category_objs['stack_parking'],
        'levels': 2,
        'operation_type': 'hydraulic',
        'automation_type': 'semi_automatic',
        'pit_required': False,
        'load_capacity': Decimal('2000.00'),
        'min_height': Decimal('3.60'),
        'min_width': Decimal('2.60'),
        'min_length': Decimal('5.20'),
        'car_capacity': 2,
        'base_price': Decimal('240000.00'),
        'description': 'Ideal for residential buildings, dependent 2-car stack hydraulic parking.'
    },
    {
        'product_name': '2DP-102 Heavy Duty Stack',
        'product_code': 'STK-2DP-102',
        'category': category_objs['stack_parking'],
        'levels': 2,
        'operation_type': 'hydraulic',
        'automation_type': 'semi_automatic',
        'pit_required': False,
        'load_capacity': Decimal('2500.00'),
        'min_height': Decimal('3.80'),
        'min_width': Decimal('2.70'),
        'min_length': Decimal('5.40'),
        'car_capacity': 2,
        'base_price': Decimal('280000.00'),
        'description': 'Heavy duty 2-level stack parking suitable for large SUVs and sedans.'
    },
    {
        'product_name': '3DP-201 Tri-Stack Parking',
        'product_code': 'STK-3DP-201',
        'category': category_objs['stack_parking'],
        'levels': 3,
        'operation_type': 'hydraulic',
        'automation_type': 'semi_automatic',
        'pit_required': False,
        'load_capacity': Decimal('2200.00'),
        'min_height': Decimal('5.60'),
        'min_width': Decimal('2.70'),
        'min_length': Decimal('5.40'),
        'car_capacity': 3,
        'base_price': Decimal('420000.00'),
        'description': '3-level vertical stack system providing maximum space efficiency.'
    },
    {
        'product_name': 'PZL-205 2-Level Puzzle System',
        'product_code': 'PZL-002',
        'category': category_objs['puzzle_parking'],
        'levels': 2,
        'operation_type': 'mechanical',
        'automation_type': 'semi_automatic',
        'pit_required': False,
        'load_capacity': Decimal('2000.00'),
        'min_height': Decimal('3.80'),
        'min_width': Decimal('5.20'),
        'min_length': Decimal('5.40'),
        'car_capacity': 5,
        'base_price': Decimal('850000.00'),
        'description': '5-car puzzle parking system with automated matrix movement.'
    },
    {
        'product_name': 'PZL-309 3-Level Puzzle System',
        'product_code': 'PZL-003',
        'category': category_objs['puzzle_parking'],
        'levels': 3,
        'operation_type': 'mechanical',
        'automation_type': 'semi_automatic',
        'pit_required': False,
        'load_capacity': Decimal('2200.00'),
        'min_height': Decimal('5.70'),
        'min_width': Decimal('7.80'),
        'min_length': Decimal('5.40'),
        'car_capacity': 9,
        'base_price': Decimal('1450000.00'),
        'description': '9-car 3-level puzzle system ideal for mid-sized corporate offices.'
    },
    {
        'product_name': 'PZL-415 4-Level High Density Puzzle',
        'product_code': 'PZL-004',
        'category': category_objs['puzzle_parking'],
        'levels': 4,
        'operation_type': 'mechanical',
        'automation_type': 'fully_automatic',
        'pit_required': False,
        'load_capacity': Decimal('2200.00'),
        'min_height': Decimal('7.60'),
        'min_width': Decimal('10.40'),
        'min_length': Decimal('5.50'),
        'car_capacity': 15,
        'base_price': Decimal('2600000.00'),
        'description': 'High-density 15-car 4-level automated puzzle parking with PLC control.'
    },
    {
        'product_name': 'TWR-500 Rotary Tower Parking',
        'product_code': 'TWR-001',
        'category': category_objs['tower_parking'],
        'levels': 10,
        'operation_type': 'mechanical',
        'automation_type': 'fully_automatic',
        'pit_required': False,
        'load_capacity': Decimal('2300.00'),
        'min_height': Decimal('18.50'),
        'min_width': Decimal('7.20'),
        'min_length': Decimal('7.20'),
        'car_capacity': 20,
        'base_price': Decimal('4800000.00'),
        'description': 'Automated 20-car rotary vertical tower on 2-car ground footprint.'
    },
    {
        'product_name': 'TWR-1000 High Rise Tower System',
        'product_code': 'TWR-002',
        'category': category_objs['tower_parking'],
        'levels': 20,
        'operation_type': 'mechanical',
        'automation_type': 'fully_automatic',
        'pit_required': False,
        'load_capacity': Decimal('2500.00'),
        'min_height': Decimal('36.00'),
        'min_width': Decimal('7.50'),
        'min_length': Decimal('7.50'),
        'car_capacity': 40,
        'base_price': Decimal('8900000.00'),
        'description': '40-car automated high rise tower with high speed lift and turntable.'
    },
    {
        'product_name': 'PIT-101 Sub-Surface Pit Stacker',
        'product_code': 'PIT-001',
        'category': category_objs['pit_parking'],
        'levels': 2,
        'operation_type': 'hydraulic',
        'automation_type': 'semi_automatic',
        'pit_required': True,
        'load_capacity': Decimal('2000.00'),
        'min_height': Decimal('3.50'),
        'min_width': Decimal('2.60'),
        'min_length': Decimal('5.20'),
        'car_capacity': 2,
        'base_price': Decimal('380000.00'),
        'description': '1 car in pit + 1 car at ground level, fully independent access.'
    },
    {
        'product_name': 'PIT-201 3-Level Pit System (-1/+2)',
        'product_code': 'PIT-002',
        'category': category_objs['pit_parking'],
        'levels': 3,
        'operation_type': 'hydraulic',
        'automation_type': 'semi_automatic',
        'pit_required': True,
        'load_capacity': Decimal('2200.00'),
        'min_height': Decimal('5.50'),
        'min_width': Decimal('2.70'),
        'min_length': Decimal('5.30'),
        'car_capacity': 3,
        'base_price': Decimal('560000.00'),
        'description': 'Independent 3-car parking: 1 car in underground pit and 2 above.'
    },
    {
        'product_name': 'PSTK-302 Pit Stack Combo (-1/+1)',
        'product_code': 'PSTK-001',
        'category': category_objs['pit_stack_parking'],
        'levels': 2,
        'operation_type': 'hydraulic',
        'automation_type': 'semi_automatic',
        'pit_required': True,
        'load_capacity': Decimal('2100.00'),
        'min_height': Decimal('3.60'),
        'min_width': Decimal('2.60'),
        'min_length': Decimal('5.30'),
        'car_capacity': 2,
        'base_price': Decimal('350000.00'),
        'description': 'Independent access pit stacker system for bungalows and villas.'
    },
    {
        'product_name': 'PSTK-403 Heavy Pit Stack (-1/+2)',
        'product_code': 'PSTK-002',
        'category': category_objs['pit_stack_parking'],
        'levels': 3,
        'operation_type': 'hydraulic',
        'automation_type': 'semi_automatic',
        'pit_required': True,
        'load_capacity': Decimal('2500.00'),
        'min_height': Decimal('5.40'),
        'min_width': Decimal('2.80'),
        'min_length': Decimal('5.40'),
        'car_capacity': 3,
        'base_price': Decimal('590000.00'),
        'description': 'Heavy vehicle pit stacker for commercial basements.'
    },
    {
        'product_name': 'PPZL-510 Pit Puzzle Matrix (-1/+2)',
        'product_code': 'PPZL-001',
        'category': category_objs['pit_puzzle_parking'],
        'levels': 3,
        'operation_type': 'mechanical',
        'automation_type': 'fully_automatic',
        'pit_required': True,
        'load_capacity': Decimal('2200.00'),
        'min_height': Decimal('5.20'),
        'min_width': Decimal('8.50'),
        'min_length': Decimal('5.50'),
        'car_capacity': 10,
        'base_price': Decimal('1950000.00'),
        'description': '10-car pit puzzle system combining underground and overhead levels.'
    },
    {
        'product_name': 'CTL-101 Single Column Cantilever',
        'product_code': 'CTL-001',
        'category': category_objs['cantilever'],
        'levels': 2,
        'operation_type': 'hydraulic',
        'automation_type': 'semi_automatic',
        'pit_required': False,
        'load_capacity': Decimal('2000.00'),
        'min_height': Decimal('3.60'),
        'min_width': Decimal('2.50'),
        'min_length': Decimal('5.10'),
        'car_capacity': 2,
        'base_price': Decimal('310000.00'),
        'description': 'Cantilever design with no front posts, allowing effortless car door opening.'
    },
    {
        'product_name': 'CTL-202 Dual Arm Cantilever Stack',
        'product_code': 'CTL-002',
        'category': category_objs['cantilever'],
        'levels': 2,
        'operation_type': 'hydraulic',
        'automation_type': 'semi_automatic',
        'pit_required': False,
        'load_capacity': Decimal('2400.00'),
        'min_height': Decimal('3.80'),
        'min_width': Decimal('2.65'),
        'min_length': Decimal('5.30'),
        'car_capacity': 2,
        'base_price': Decimal('340000.00'),
        'description': 'Dual-arm reinforced cantilever system for premium luxury vehicles.'
    },
]

product_objs = []
for p in products_data:
    obj, _ = ParkingProduct.objects.get_or_create(
        product_code=p['product_code'],
        defaults={**p, 'created_by': admin_user}
    )
    product_objs.append(obj)

print(f"[OK] Parking Products ready ({len(product_objs)} products)")

# =====================================================================
# 3. Customers (15 Customers)
# =====================================================================
customers_data = [
    {
        'name': 'Lodha World One Developers Pvt Ltd',
        'contact_number': '9820112233',
        'email': 'procurement@lodhagroup.com',
        'poc_name': 'Vikram Singhania',
        'poc_contact_number': '9820112234',
        'address': 'Lodha Excelus, Apollo Mills Compound, NM Joshi Marg',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pin_code': '400011',
        'site_address': 'World Towers Site, Lower Parel',
        'site_city': 'Mumbai',
        'site_state': 'Maharashtra',
        'site_pin_code': '400013',
        'gst': '27AAACL1234F1Z5',
        'pan': 'AAACL1234F',
        'is_lead_only': False
    },
    {
        'name': 'Godrej Properties Limited',
        'contact_number': '9820223344',
        'email': 'projects@godrejproperties.com',
        'poc_name': 'Ananya Deshmukh',
        'poc_contact_number': '9820223345',
        'address': 'Godrej One, 5th Floor, Pirojshanagar, Vikhroli East',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pin_code': '400079',
        'site_address': 'Godrej River Royale, Mahalunge',
        'site_city': 'Pune',
        'site_state': 'Maharashtra',
        'site_pin_code': '411045',
        'gst': '27AAACG5678G1Z2',
        'pan': 'AAACG5678G',
        'is_lead_only': False
    },
    {
        'name': 'Oberoi Realty Ltd',
        'contact_number': '9820334455',
        'email': 'contracts@oberoirealty.com',
        'poc_name': 'Rajesh Oberoi',
        'poc_contact_number': '9820334456',
        'address': 'Commerz II, International Business Park, Oberoi Garden City',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pin_code': '400063',
        'site_address': 'Oberoi Sky City Site, Borivali East',
        'site_city': 'Mumbai',
        'site_state': 'Maharashtra',
        'site_pin_code': '400066',
        'gst': '27AAACO9012H1Z9',
        'pan': 'AAACO9012H',
        'is_lead_only': False
    },
    {
        'name': 'Prestige Estates Projects Ltd',
        'contact_number': '9880112233',
        'email': 'purchase@prestigeconstructions.com',
        'poc_name': 'Suresh Menon',
        'poc_contact_number': '9880112234',
        'address': 'Prestige Falcon Towers, 19 Brunton Road',
        'city': 'Bangalore',
        'state': 'Karnataka',
        'pin_code': '560025',
        'site_address': 'Prestige Tech Cloud, Whitefield',
        'site_city': 'Bangalore',
        'site_state': 'Karnataka',
        'site_pin_code': '560066',
        'gst': '29AAACP3456J1Z1',
        'pan': 'AAACP3456J',
        'is_lead_only': False
    },
    {
        'name': 'K Raheja Corp Real Estate',
        'contact_number': '9820445566',
        'email': 'commercials@kraheja.com',
        'poc_name': 'Meera Kulkarni',
        'poc_contact_number': '9820445567',
        'address': 'Raheja Tower, Plot C-30, Block G, Bandra Kurla Complex',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pin_code': '400051',
        'site_address': 'Mindspace IT Park, Hinjawadi Phase 3',
        'site_city': 'Pune',
        'site_state': 'Maharashtra',
        'site_pin_code': '411057',
        'gst': '27AAACK7890K1Z4',
        'pan': 'AAACK7890K',
        'is_lead_only': False
    },
    {
        'name': 'DLF Cyber City Developers',
        'contact_number': '9810112233',
        'email': 'procurement@dlf.in',
        'poc_name': 'Arun Kapoor',
        'poc_contact_number': '9810112234',
        'address': 'DLF Gateway Tower, R Block, DLF City Phase III',
        'city': 'Gurgaon',
        'state': 'Haryana',
        'pin_code': '122002',
        'site_address': 'DLF Downtown Site, Sector 25A',
        'site_city': 'Gurgaon',
        'site_state': 'Haryana',
        'site_pin_code': '122002',
        'gst': '06AAACD1122L1Z8',
        'pan': 'AAACD1122L',
        'is_lead_only': False
    },
    {
        'name': 'Brigade Enterprises Limited',
        'contact_number': '9880223344',
        'email': 'vendor@brigadegroup.com',
        'poc_name': 'Praveen Hegde',
        'poc_contact_number': '9880223345',
        'address': '29th & 30th Floor, World Trade Center, Brigade Gateway',
        'city': 'Bangalore',
        'state': 'Karnataka',
        'pin_code': '560055',
        'site_address': 'Brigade Cornerstone Utopia Site, Varthur',
        'site_city': 'Bangalore',
        'site_state': 'Karnataka',
        'site_pin_code': '560087',
        'gst': '29AAACB3344M1Z7',
        'pan': 'AAACB3344M',
        'is_lead_only': False
    },
    {
        'name': 'Sobha Limited Commercial',
        'contact_number': '9880334455',
        'email': 'tenders@sobha.com',
        'poc_name': 'Karthik Nambiar',
        'poc_contact_number': '9880334456',
        'address': 'Sarjapur - Marathahalli Outer Ring Road, Bellandur',
        'city': 'Bangalore',
        'state': 'Karnataka',
        'pin_code': '560103',
        'site_address': 'Sobha City Commercial Hub, Thanisandra',
        'site_city': 'Bangalore',
        'site_state': 'Karnataka',
        'site_pin_code': '560077',
        'gst': '29AAACS5566N1Z6',
        'pan': 'AAACS5566N',
        'is_lead_only': False
    },
    {
        'name': 'Shapoorji Pallonji Real Estate',
        'contact_number': '9820556677',
        'email': 'inquiries@shapoorji.com',
        'poc_name': 'Firoze Mistry',
        'poc_contact_number': '9820556678',
        'address': 'SP Centre, 41/44 Minoo Desai Marg, Colaba',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pin_code': '400005',
        'site_address': 'Parkwest Site, Binnypet',
        'site_city': 'Bangalore',
        'site_state': 'Karnataka',
        'site_pin_code': '560026',
        'gst': '27AAACS7788P1Z3',
        'pan': 'AAACS7788P',
        'is_lead_only': False
    },
    {
        'name': 'Hiranandani Communities',
        'contact_number': '9820667788',
        'email': 'infra@hiranandani.net',
        'poc_name': 'Girish Varma',
        'poc_contact_number': '9820667789',
        'address': 'Olympia, Central Avenue, Hiranandani Business Park, Powai',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pin_code': '400076',
        'site_address': 'Hiranandani Estate Site, Ghodbunder Road',
        'site_city': 'Thane',
        'site_state': 'Maharashtra',
        'site_pin_code': '400607',
        'gst': '27AAACH9900Q1Z0',
        'pan': 'AAACH9900Q',
        'is_lead_only': False
    },
    {
        'name': 'The Phoenix Mills Retail Ltd',
        'contact_number': '9820778899',
        'email': 'engineering@thephoenixmills.com',
        'poc_name': 'Nikhil Parekh',
        'poc_contact_number': '9820778890',
        'address': '462 Senapati Bapat Marg, Lower Parel',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pin_code': '400013',
        'site_address': 'Phoenix Marketcity Mall Basement Expansion, Viman Nagar',
        'site_city': 'Pune',
        'site_state': 'Maharashtra',
        'site_pin_code': '411014',
        'gst': '27AAACT2233R1Z5',
        'pan': 'AAACT2233R',
        'is_lead_only': False
    },
    {
        'name': 'Embassy Office Parks REIT',
        'contact_number': '9880445566',
        'email': 'procurement@embassyofficeparks.com',
        'poc_name': 'Ramesh Iyer',
        'poc_contact_number': '9880445567',
        'address': 'Royal Oaks, Embassy GolfLinks Business Park, Off Intermediate Ring Road',
        'city': 'Bangalore',
        'state': 'Karnataka',
        'pin_code': '560071',
        'site_address': 'Embassy TechVillage Site, Outer Ring Road',
        'site_city': 'Bangalore',
        'site_state': 'Karnataka',
        'site_pin_code': '560103',
        'gst': '29AAACE4455S1Z4',
        'pan': 'AAACE4455S',
        'is_lead_only': False
    },
    {
        'name': 'Puravankara Projects Ltd',
        'contact_number': '9880556677',
        'email': 'salesinfra@puravankara.com',
        'poc_name': 'Deepak Gowda',
        'poc_contact_number': '9880556678',
        'address': '130/1, Ulsoor Road',
        'city': 'Bangalore',
        'state': 'Karnataka',
        'pin_code': '560042',
        'site_address': 'Purva Atmosphere Site, Thanisandra',
        'site_city': 'Bangalore',
        'site_state': 'Karnataka',
        'site_pin_code': '560077',
        'gst': '29AAACP6677T1Z3',
        'pan': 'AAACP6677T',
        'is_lead_only': False
    },
    {
        'name': 'Salarpuria Sattva Group',
        'contact_number': '9880667788',
        'email': 'vendorcare@sattvagroup.in',
        'poc_name': 'Amit Salarpuria',
        'poc_contact_number': '9880667789',
        'address': 'Sattva Windsor, 3rd Floor, Ulsoor Road',
        'city': 'Bangalore',
        'state': 'Karnataka',
        'pin_code': '560042',
        'site_address': 'Sattva Knowledge Park Site, Hi-Tec City',
        'site_city': 'Hyderabad',
        'site_state': 'Telangana',
        'site_pin_code': '500081',
        'gst': '36AAACS8899U1Z2',
        'pan': 'AAACS8899U',
        'is_lead_only': False
    },
    {
        'name': 'Kolte-Patil Developers Ltd',
        'contact_number': '9820889900',
        'email': 'purchase@koltepatil.com',
        'poc_name': 'Sunil Patil',
        'poc_contact_number': '9820889901',
        'address': '2nd Floor, City Point, Dhole Patil Road',
        'city': 'Pune',
        'state': 'Maharashtra',
        'pin_code': '411001',
        'site_address': 'Life Republic Township, Marunji, Hinjawadi',
        'site_city': 'Pune',
        'site_state': 'Maharashtra',
        'site_pin_code': '411057',
        'gst': '27AAACK1133V1Z1',
        'pan': 'AAACK1133V',
        'is_lead_only': False
    },
]

customer_objs = []
for c in customers_data:
    cust, _ = Customer.objects.get_or_create(
        contact_number=c['contact_number'],
        defaults=c
    )
    customer_objs.append(cust)

print(f"[OK] Customers ready ({len(customer_objs)} customers)")

# =====================================================================
# 4. Leads (15 Leads)
# =====================================================================
leads_meta = [
    {
        'source': LeadSource.GOOGLE_ADS,
        'status': LeadStatus.OPEN,
        'project': 'Lodha World One Podium A',
        'address': 'Upper Worli, Mumbai',
        'contact': 'Mr. Vikram Singhania',
        'phone': '9820112234',
        'req': 'Need 30 stack parking units for basement 1 and 2 to achieve municipal sanction requirements.'
    },
    {
        'source': LeadSource.INDIAMART,
        'status': LeadStatus.IN_PROCESS,
        'project': 'Godrej River Royale Phase 1',
        'address': 'Mahalunge, Pune',
        'contact': 'Ms. Ananya Deshmukh',
        'phone': '9820223345',
        'req': 'Requirement of 8 puzzle parking systems (6 cars each = 48 cars capacity).'
    },
    {
        'source': LeadSource.BUILDER,
        'status': LeadStatus.CLOSE_WIN,
        'project': 'Oberoi Sky City Tower D',
        'address': 'Borivali East, Mumbai',
        'contact': 'Mr. Rajesh Oberoi',
        'phone': '9820334456',
        'req': 'Tower parking automated system for visitor parking: 40 slots needed.'
    },
    {
        'source': LeadSource.ARCHITECT_INTERIOR_DESIGNER,
        'status': LeadStatus.OPEN,
        'project': 'Prestige Tech Cloud Campus',
        'address': 'Whitefield, Bangalore',
        'contact': 'Mr. Suresh Menon',
        'phone': '9880112234',
        'req': 'Cantilever stack parking required for corporate VIP parking lane (12 bays).'
    },
    {
        'source': LeadSource.REFERENCE,
        'status': LeadStatus.IN_PROCESS,
        'project': 'Mindspace Hinjawadi Bldg 4',
        'address': 'Phase 3, Hinjawadi, Pune',
        'contact': 'Ms. Meera Kulkarni',
        'phone': '9820445567',
        'req': 'Underground pit puzzle parking required: -1 to +2 levels for 35 executive sedans.'
    },
    {
        'source': LeadSource.GOOGLE_ADS,
        'status': LeadStatus.OPEN,
        'project': 'DLF Downtown Sector 25A',
        'address': 'DLF Phase 2, Gurgaon',
        'contact': 'Mr. Arun Kapoor',
        'phone': '9810112234',
        'req': 'High rise rotary automated tower parking: 50 bays requested for quick valet retrieval.'
    },
    {
        'source': LeadSource.BNI,
        'status': LeadStatus.IN_PROCESS,
        'project': 'Brigade Utopia Commercial',
        'address': 'Varthur Main Road, Bangalore',
        'contact': 'Mr. Praveen Hegde',
        'phone': '9880223345',
        'req': '2-level hydraulic stackers with pit option for 24 luxury residential apartments.'
    },
    {
        'source': LeadSource.EXISTING_CUSTOMER,
        'status': LeadStatus.CLOSE_WIN,
        'project': 'Sobha City Phase 2',
        'address': 'Thanisandra Road, Bangalore',
        'contact': 'Mr. Karthik Nambiar',
        'phone': '9880334456',
        'req': 'Additional 16 units of 2DP-102 heavy duty stack parking units for resident clubhouse.'
    },
    {
        'source': LeadSource.BUILDER,
        'status': LeadStatus.OPEN,
        'project': 'Parkwest Tower Sapphire',
        'address': 'Binnypet, Bangalore',
        'contact': 'Mr. Firoze Mistry',
        'phone': '9820556678',
        'req': 'Cantilever parking systems for narrow driveway layout where columns cannot be erected.'
    },
    {
        'source': LeadSource.JUSTDIAL,
        'status': LeadStatus.CLOSE_LOSS,
        'project': 'Hiranandani Estate Rodas',
        'address': 'Ghodbunder Road, Thane',
        'contact': 'Mr. Girish Varma',
        'phone': '9820667789',
        'req': 'Pit stacker combo for basement renovation. Client chose local fabricator due to budget constraint.'
    },
    {
        'source': LeadSource.REFERENCE,
        'status': LeadStatus.IN_PROCESS,
        'project': 'Phoenix Marketcity Expansion',
        'address': 'Viman Nagar, Pune',
        'contact': 'Mr. Nikhil Parekh',
        'phone': '9820778890',
        'req': 'Basement matrix puzzle system to expand shopper vehicle intake by 100 slots.'
    },
    {
        'source': LeadSource.KA_STAFF,
        'status': LeadStatus.OPEN,
        'project': 'Embassy TechVillage Block C',
        'address': 'Devarabisanahalli, Bangalore',
        'contact': 'Mr. Ramesh Iyer',
        'phone': '9880445567',
        'req': 'Multi-tier automated mechanical parking system evaluation for 120 tech campus staff cars.'
    },
    {
        'source': LeadSource.GOOGLE_ADS,
        'status': LeadStatus.IN_PROCESS,
        'project': 'Purva Atmosphere Wing B',
        'address': 'Thanisandra, Bangalore',
        'contact': 'Mr. Deepak Gowda',
        'phone': '9880556678',
        'req': 'Residential 2-level stackers (2DP-101) for 40 apartments. Space layout survey required.'
    },
    {
        'source': LeadSource.ARCHITECT_INTERIOR_DESIGNER,
        'status': LeadStatus.CLOSE_WIN,
        'project': 'Sattva Knowledge Park Phase 3',
        'address': 'Hi-Tec City, Hyderabad',
        'contact': 'Mr. Amit Salarpuria',
        'phone': '9880667789',
        'req': '3-level tri-stackers for commercial office building basement (60 vehicle capacity).'
    },
    {
        'source': LeadSource.BUILDER,
        'status': LeadStatus.OPEN,
        'project': 'Life Republic Township Sector R3',
        'address': 'Hinjawadi, Pune',
        'contact': 'Mr. Sunil Patil',
        'phone': '9820889901',
        'req': 'Economical stack parking for new residential tower launch: 50 bays.'
    },
]

today = date.today()
lead_objs = []
for i, (cust, meta) in enumerate(zip(customer_objs, leads_meta)):
    lead, _ = lead_management.objects.get_or_create(
        customer=cust,
        project_name=meta['project'],
        defaults={
            'lead_source': meta['source'],
            'status': meta['status'],
            'project_adderess': meta['address'],
            'contact_person_name': meta['contact'],
            'contact_person_number': meta['phone'],
            'requirements_details': meta['req'],
            'date': today - timedelta(days=20 - i),
            'enquiry_date': today - timedelta(days=20 - i),
            'followup_date': today + timedelta(days=i % 5 + 1),
            'assign_to': admin_user,
            'creatd_by': admin_user,
            'is_qualified': True,
        }
    )
    lead_objs.append(lead)

print(f"[OK] Leads ready ({len(lead_objs)} leads)")

# =====================================================================
# 5. Lead Follow-Ups (15 Follow-ups)
# =====================================================================
followup_templates = [
    {
        'type': InteractionType.CALL,
        'resp': ClientResponseType.VERY_POSITIVE,
        'status': FollowUpStatus.COMPLETED,
        'summary': 'Discussed initial site dimensions and car count requirements. Client is very interested in 2DP hydraulic stackers.',
        'client_commit': 'Client will email AutoCAD architectural drawing of basement 1 by tomorrow.',
        'our_commit': 'We will prepare preliminary GA layout drawing and feasibility report within 24 hours of CAD receipt.',
    },
    {
        'type': InteractionType.SITE_VISIT,
        'resp': ClientResponseType.POSITIVE,
        'status': FollowUpStatus.COMPLETED,
        'summary': 'Site engineer visited project location. Measured ceiling clear height: 3.75 meters. Suitable for 2DP-102 SUV units.',
        'client_commit': 'Architect will integrate our column clearance spacing into civil structural drawings.',
        'our_commit': 'Send formal quotation with foundation civil work guide by Wednesday.',
    },
    {
        'type': InteractionType.IN_PERSON,
        'resp': ClientResponseType.VERY_POSITIVE,
        'status': FollowUpStatus.COMPLETED,
        'summary': 'Executive meeting at client head office. Presented working 3D animation of 20-car rotary tower parking.',
        'client_commit': 'Purchase director approved quotation; PO drafting in progress.',
        'our_commit': 'Send proforma invoice and technical contract agreement for review.',
    },
    {
        'type': InteractionType.WHATSAPP,
        'resp': ClientResponseType.POSITIVE,
        'status': FollowUpStatus.COMPLETED,
        'summary': 'Shared brochure and installation photos of similar cantilever stack parking implemented in Bangalore.',
        'client_commit': 'Client confirmed site inspection date for next Monday 11:00 AM.',
        'our_commit': 'Our senior project engineer will be present on site with laser measurement equipment.',
    },
    {
        'type': InteractionType.VIDEO_CALL,
        'resp': ClientResponseType.NEUTRAL,
        'status': FollowUpStatus.COMPLETED,
        'summary': 'Technical presentation to project MEP consultants regarding electrical load and power pack requirements.',
        'client_commit': 'Consultant will review DG power backup sizing for hydraulic motors.',
        'our_commit': 'Provide electrical single line diagram (SLD) and power consumption chart.',
    },
]

followup_objs = []
for i, lead in enumerate(lead_objs):
    tmpl = followup_templates[i % len(followup_templates)]
    fu, _ = LeadFollowUp.objects.get_or_create(
        lead=lead,
        followup_date=today - timedelta(days=10 - (i % 8)),
        defaults={
            'interaction_type': tmpl['type'],
            'client_response': tmpl['resp'],
            'followup_status': tmpl['status'],
            'conducted_by': 'Admin Team',
            'contacted_person': lead.contact_person_name,
            'followup_summary': tmpl['summary'],
            'client_commitment': tmpl['client_commit'],
            'our_commitment': tmpl['our_commit'],
            'next_followup_date': today + timedelta(days=(i % 4) + 2),
            'status': 'open',
            'created_by': admin_user,
        }
    )
    followup_objs.append(fu)

print(f"[OK] Lead Follow-ups ready ({len(followup_objs)} follow-ups)")

# =====================================================================
# 6. Quotations & Versions (15 Quotations)
# =====================================================================
quotation_objs = []
for i, cust in enumerate(customer_objs):
    q_no = f"QT-2026-{1001 + i}"
    prod = product_objs[i % len(product_objs)]
    qty = 2 + (i % 6)
    subtotal = prod.base_price * qty
    gst = subtotal * Decimal('0.18')
    transport = Decimal('25000.00')
    grand_total = subtotal + gst + transport

    quot, _ = Quotation.objects.get_or_create(
        quotation_no=q_no,
        defaults={
            'customer': cust,
            'subject': f"Quotation for Supply & Installation of {qty} Nos. {prod.product_name}",
            'site_name': cust.site_address or f"Project Site #{i+1}",
            'site_address': f"{cust.site_address or cust.address}, {cust.city}, {cust.state}",
            'thank_you_note': 'Thank you for your valuable inquiry. We assure you of our best quality, service, and safety standards at all times.',
            'sales_person': admin_user,
            'sales_person_name': 'Admin Executive',
            'sales_person_phone': '9876543210',
        }
    )

    QuotationVersion.objects.get_or_create(
        quotation=quot,
        version_no='V1',
        defaults={
            'is_active': True,
            'gst_type': 'CGST_SGST',
            'subtotal': subtotal,
            'cgst_amount': gst / 2,
            'sgst_amount': gst / 2,
            'gst_amount': gst,
            'transportation_charges': transport,
            'transportation_charges_type': 'custom',
            'total_amount': subtotal + gst,
            'grand_total': grand_total,
            'created_by': admin_user
        }
    )
    quotation_objs.append(quot)

print(f"[OK] Quotations & Versions ready ({len(quotation_objs)} quotations)")

# =====================================================================
# 7. AMC Contracts (15 AMC Contracts)
# =====================================================================
amc_objs = []
for i, cust in enumerate(customer_objs):
    c_id = f"AMC-2026-{501 + i}"
    prod = product_objs[i % len(product_objs)]
    amc_type = AMCType.COMPREHENSIVE if i % 2 == 0 else AMCType.NON_COMPREHENSIVE
    val = Decimal('120000.00') + Decimal(i * 15000)

    contract, _ = AMCContract.objects.get_or_create(
        contract_id=c_id,
        defaults={
            'customer': cust,
            'project_name': f"{cust.name.split()[0]} Towers",
            'product': f"{prod.product_name} (Qty: {2 + (i % 4)})",
            'amc_type': amc_type,
            'start_date': today - timedelta(days=60),
            'end_date': today + timedelta(days=305),
            'annual_value': val,
            'payment_frequency': PaymentFrequency.QUARTERLY,
            'status': AMCStatus.ACTIVE if i % 3 != 0 else AMCStatus.EXPIRING_SOON,
            'default_customer_contact': cust.contact_number,
            'default_customer_address': cust.site_address or cust.address,
            'default_work_description': 'Quarterly preventive maintenance check, hydraulic oil top-up, mechanical chain/rope inspection, safety limit switch testing.',
            'created_by': admin_user
        }
    )
    amc_objs.append(contract)

print(f"[OK] AMC Contracts ready ({len(amc_objs)} contracts)")

print("=" * 60)
print("SEEDING COMPLETED SUCCESSFULLY!")
print(f"Total Categories: {ProductCategory.objects.count()}")
print(f"Total Products:   {ParkingProduct.objects.count()}")
print(f"Total Customers:  {Customer.objects.count()}")
print(f"Total Leads:      {lead_management.objects.count()}")
print(f"Total Follow-ups: {LeadFollowUp.objects.count()}")
print(f"Total Quotations: {Quotation.objects.count()}")
print(f"Total AMC:        {AMCContract.objects.count()}")
print("=" * 60)
