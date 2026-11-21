import sys, os
from decimal import Decimal
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.base')

import django
django.setup()

from inventory.models import (
    Category, SubCategory, Brand, UnitOfMeasure, Warehouse,
    InventoryProduct, WarehouseStock, Vendor,
    PurchaseOrder, PurchaseOrderItem,
    GoodsReceiptNote, GoodsReceiptNoteItem,
    MaterialRequisition, MaterialRequisitionItem,
    MaterialTransferNote, MaterialTransferNoteItem,
    DeliveryChallan, DeliveryChallanItem,
    MaterialReturn, MaterialReturnItem,
    StockAdjustment, StockAdjustmentItem,
    BillOfMaterials, BOMComponent
)

def run_seed():
    print("🌱 Seeding Inventory ERP Master & Transactional Data...")

    # 1. Units of Measure
    uoms = [
        {"name": "Pieces", "code": "PCS", "precision": 0},
        {"name": "Sets", "code": "SET", "precision": 0},
        {"name": "Meters", "code": "MTR", "precision": 2},
        {"name": "Kilograms", "code": "KG", "precision": 2},
        {"name": "Rolls", "code": "ROL", "precision": 0},
    ]
    uom_objs = {}
    for u in uoms:
        obj, _ = UnitOfMeasure.objects.get_or_create(code=u['code'], defaults=u)
        uom_objs[u['code']] = obj

    # 2. Brands
    brands = [
        {"name": "NNIT Core Systems", "code": "NNIT", "country": "India"},
        {"name": "Magnetix Drive Systems", "code": "MDS", "country": "Germany"},
        {"name": "SensorTech Electronics", "code": "STE", "country": "India"},
        {"name": "Supreme Extrusions", "code": "SME", "country": "India"},
        {"name": "Apex Micro Electronics", "code": "AME", "country": "Taiwan"},
    ]
    brand_objs = {}
    for b in brands:
        obj, _ = Brand.objects.get_or_create(name=b['name'], defaults=b)
        brand_objs[b['code']] = obj

    # 3. Categories & Subcategories
    categories_data = [
        {
            "name": "Barriers & Access Hardware", "code": "BARRIERS", "desc": "Boom barriers, turnstiles, and bollards",
            "sub": [
                {"name": "Barrier Cabinets", "code": "BCAB"},
                {"name": "Boom Arms & Accessories", "code": "BARM"},
                {"name": "Flap Barriers & Turnstiles", "code": "FLAP"},
                {"name": "Rising Bollards", "code": "BOLL"},
            ]
        },
        {
            "name": "Electronic Controllers & PCBs", "code": "CONTROLLERS", "desc": "Motherboards, logic boards, power units",
            "sub": [
                {"name": "BLDC Motor Controllers", "code": "BLDC"},
                {"name": "Relay Boards", "code": "RELAY"},
                {"name": "Power Supplies & SMPS", "code": "SMPS"},
            ]
        },
        {
            "name": "Sensors & Telemetry", "code": "SENSORS", "desc": "Loop detectors, photocells, radar detectors",
            "sub": [
                {"name": "Vehicle Loop Detectors", "code": "LOOP"},
                {"name": "Infrared Photocells", "code": "PHOTO"},
                {"name": "Microwave Radar", "code": "RADAR"},
            ]
        },
        {
            "name": "RFID & Fastag Tech", "code": "RFID", "desc": "Long-range readers, RFID tags, Fastag controllers",
            "sub": [
                {"name": "UHF Long-Range Readers", "code": "UHF"},
                {"name": "RFID Desktop Enrollers", "code": "ENROLL"},
                {"name": "Windshield Fastag Tags", "code": "TAGS"},
            ]
        },
        {
            "name": "Spare Parts & Mechanicals", "code": "SPARES", "desc": "Springs, gearboxes, remote fobs, limit switches",
            "sub": [
                {"name": "Tension Springs", "code": "SPRING"},
                {"name": "Remote Control Fobs", "code": "REMOTE"},
                {"name": "Planetary Gearboxes", "code": "GEAR"},
            ]
        },
        {
            "name": "Displays & Signaling", "code": "DISPLAYS", "desc": "LED signs, traffic signal lights, space indicators",
            "sub": [
                {"name": "Traffic Signal Lights", "code": "TRAFFIC"},
                {"name": "LED Variable Message Signs", "code": "VMS"},
            ]
        }
    ]

    cat_objs = {}
    subcat_objs = {}
    for c in categories_data:
        c_obj, _ = Category.objects.get_or_create(code=c['code'], defaults={'name': c['name'], 'description': c['desc']})
        cat_objs[c['code']] = c_obj
        for s in c['sub']:
            s_obj, _ = SubCategory.objects.get_or_create(category=c_obj, code=s['code'], defaults={'name': s['name']})
            subcat_objs[s['code']] = s_obj

    # 4. Warehouses
    warehouses = [
        {"name": "Central Assembly Plant - Pune", "code": "WH-PUN", "city": "Pune", "state": "Maharashtra", "manager_name": "Rajesh Sharma", "manager_phone": "+91 98220 11223"},
        {"name": "Mumbai Regional Distribution Hub", "code": "WH-BOM", "city": "Mumbai", "state": "Maharashtra", "manager_name": "Amit Kulkarni", "manager_phone": "+91 98200 44556"},
        {"name": "Delhi NCR Project Warehouse", "code": "WH-DEL", "city": "Noida", "state": "Uttar Pradesh", "manager_name": "Vikram Singh", "manager_phone": "+91 98110 77889"},
        {"name": "Bangalore Tech & Sensor Hub", "code": "WH-BLR", "city": "Bengaluru", "state": "Karnataka", "manager_name": "Karthik Nair", "manager_phone": "+91 98450 33445"},
    ]
    wh_objs = {}
    for w in warehouses:
        obj, _ = Warehouse.objects.get_or_create(code=w['code'], defaults=w)
        wh_objs[w['code']] = obj

    # 5. Vendors
    vendors = [
        {"name": "Magnetix Drive Systems Ltd.", "code": "VEN-001", "gstin": "27AABCM8821Q1ZV", "contact_person": "Sanjay Verma", "email": "sales@magnetix-drives.com", "phone": "+91 99201 55432", "city": "Pune", "payment_terms": "Net 30 Days", "rating": Decimal('4.8')},
        {"name": "SensorTech Electronics India", "code": "VEN-002", "gstin": "27AAACS1234P1Z4", "contact_person": "Pooja Patil", "email": "orders@sensortech.in", "phone": "+91 98231 66789", "city": "Nashik", "payment_terms": "Net 15 Days", "rating": Decimal('4.6')},
        {"name": "Supreme Aluminium Extrusions", "code": "VEN-003", "gstin": "24AAJCS9988M1Z2", "contact_person": "Anil Shah", "email": "supply@supremeextrusions.com", "phone": "+91 98980 12345", "city": "Ahmedabad", "payment_terms": "Net 45 Days", "rating": Decimal('4.5')},
        {"name": "Apex Micro Electronics", "code": "VEN-004", "gstin": "29AABCA7766K1ZT", "contact_person": "Ramesh Iyer", "email": "sales@apex-micro.com", "phone": "+91 99000 88776", "city": "Bengaluru", "payment_terms": "Advance 20% Net 30", "rating": Decimal('4.9')},
    ]
    ven_objs = {}
    for v in vendors:
        obj, _ = Vendor.objects.get_or_create(code=v['code'], defaults=v)
        ven_objs[v['code']] = obj

    # 6. Inventory Products (Finished Products, Components, Spares)
    products = [
        # Finished Products
        {
            "sku": "NNIT-ABB-PRO4", "name": "Automatic Boom Barrier Pro 4M (Finished)",
            "item_type": "finished_product", "cat": "BARRIERS", "sub": "BCAB", "brand": "NNIT", "uom": "SET",
            "cost": Decimal('24500.00'), "price": Decimal('38500.00'), "min_stock": Decimal('5'), "reorder": Decimal('10'),
            "desc": "Complete automated parking boom barrier 4-meter telescopic arm system with brushless DC motor."
        },
        {
            "sku": "NNIT-ABB-FASTAG", "name": "Fastag Integrated Boom Barrier Kit (Finished)",
            "item_type": "finished_product", "cat": "BARRIERS", "sub": "BCAB", "brand": "NNIT", "uom": "SET",
            "cost": Decimal('42000.00'), "price": Decimal('65000.00'), "min_stock": Decimal('3'), "reorder": Decimal('8'),
            "desc": "High-speed 1.5s barrier with 12dBi UHF Long-Range RFID Reader & Traffic Signaling."
        },
        # Components
        {
            "sku": "CMP-BARRIER-CABINET", "name": "Heavy-Duty Barrier Cabinet IP65 (Orange/Grey)",
            "item_type": "component", "cat": "BARRIERS", "sub": "BCAB", "brand": "NNIT", "uom": "PCS",
            "cost": Decimal('9500.00'), "price": Decimal('14000.00'), "min_stock": Decimal('10'), "reorder": Decimal('20'),
            "desc": "Weather-proof powder coated 2.0mm steel cabinet enclosure with mechanical chassis."
        },
        {
            "sku": "CMP-BOOM-ARM-4M", "name": "Octagonal Aluminium Boom Arm 4-Meter",
            "item_type": "component", "cat": "BARRIERS", "sub": "BARM", "brand": "SME", "uom": "PCS",
            "cost": Decimal('3200.00'), "price": Decimal('5500.00'), "min_stock": Decimal('15'), "reorder": Decimal('30'),
            "desc": "Aerodynamic octagonal profile aluminum boom with red reflective stickers and rubber bottom cushion."
        },
        {
            "sku": "CMP-BLDC-CTRL-V3", "name": "Smart BLDC Motherboard Controller V3.2",
            "item_type": "component", "cat": "CONTROLLERS", "sub": "BLDC", "brand": "AME", "uom": "PCS",
            "cost": Decimal('4800.00'), "price": Decimal('7500.00'), "min_stock": Decimal('12'), "reorder": Decimal('25'),
            "desc": "Digital barrier controller with RS485, loop integration, speed adjustment & auto-reverse protection."
        },
        {
            "sku": "CMP-DUAL-LOOP-DET", "name": "Dual Channel Vehicle Loop Detector (LD-200)",
            "item_type": "component", "cat": "SENSORS", "sub": "LOOP", "brand": "STE", "uom": "PCS",
            "cost": Decimal('1850.00'), "price": Decimal('3200.00'), "min_stock": Decimal('20'), "reorder": Decimal('40'),
            "desc": "High sensitivity inductive loop detector with directional logic and pulse relay outputs."
        },
        {
            "sku": "CMP-UHF-RFID-12DBI", "name": "12dBi Long Range UHF RFID Reader (Fastag Compatible)",
            "item_type": "component", "cat": "RFID", "sub": "UHF", "brand": "STE", "uom": "PCS",
            "cost": Decimal('14500.00'), "price": Decimal('22000.00'), "min_stock": Decimal('6'), "reorder": Decimal('15'),
            "desc": "865-868 MHz Indian frequency long-range antenna reader with Wiegand 26/34 and TCP/IP."
        },
        {
            "sku": "CMP-IR-PHOTOCELL-PAIR", "name": "Reflective Safety Photocell Sensor (15m Range)",
            "item_type": "component", "cat": "SENSORS", "sub": "PHOTO", "brand": "STE", "uom": "SET",
            "cost": Decimal('1200.00'), "price": Decimal('2200.00'), "min_stock": Decimal('15'), "reorder": Decimal('30'),
            "desc": "Infrared anti-crush safety sensor pair with polarized reflector."
        },
        # Spares & Consumables
        {
            "sku": "SPR-REMOTE-SET-433", "name": "Wireless Remote Control Set (Transmitter + 2 Remotes)",
            "item_type": "spare_part", "cat": "SPARES", "sub": "REMOTE", "brand": "AME", "uom": "SET",
            "cost": Decimal('650.00'), "price": Decimal('1250.00'), "min_stock": Decimal('25'), "reorder": Decimal('50'),
            "desc": "433.92MHz rolling code wireless remote controller with 30-meter range."
        },
        {
            "sku": "SPR-BAL-SPRING-5MM", "name": "High-Tensile Barrier Balancing Spring 5.0mm",
            "item_type": "spare_part", "cat": "SPARES", "sub": "SPRING", "brand": "MDS", "uom": "PCS",
            "cost": Decimal('450.00'), "price": Decimal('900.00'), "min_stock": Decimal('20'), "reorder": Decimal('40'),
            "desc": "Heavy-duty carbon spring for counter-balancing 3m - 4.5m boom arm weight."
        },
        {
            "sku": "DSP-TRAFFIC-LIGHT-200", "name": "LED Traffic Signal Light (Red / Green 200mm)",
            "item_type": "component", "cat": "DISPLAYS", "sub": "TRAFFIC", "brand": "NNIT", "uom": "PCS",
            "cost": Decimal('3100.00'), "price": Decimal('5200.00'), "min_stock": Decimal('8'), "reorder": Decimal('20'),
            "desc": "High-intensity outdoor LED lane signal light with sun visor and IP65 housing."
        },
    ]

    prod_objs = {}
    for p in products:
        c_obj = cat_objs.get(p['cat'])
        s_obj = subcat_objs.get(p['sub'])
        b_obj = brand_objs.get(p['brand'])
        u_obj = uom_objs.get(p['uom'])

        obj, _ = InventoryProduct.objects.get_or_create(
            sku=p['sku'],
            defaults={
                "name": p['name'],
                "item_type": p['item_type'],
                "category": c_obj,
                "sub_category": s_obj,
                "brand": b_obj,
                "uom": u_obj,
                "cost_price": p['cost'],
                "selling_price": p['price'],
                "min_stock_level": p['min_stock'],
                "reorder_quantity": p['reorder'],
                "description": p['desc']
            }
        )
        prod_objs[p['sku']] = obj

    # 7. Warehouse Stock Balances
    wh_main = wh_objs['WH-PUN']
    wh_mumbai = wh_objs['WH-BOM']
    wh_delhi = wh_objs['WH-DEL']

    stock_distributions = [
        ("NNIT-ABB-PRO4", wh_main, Decimal('12'), Decimal('2')),
        ("NNIT-ABB-PRO4", wh_mumbai, Decimal('6'), Decimal('1')),
        ("NNIT-ABB-FASTAG", wh_main, Decimal('4'), Decimal('1')),
        ("CMP-BARRIER-CABINET", wh_main, Decimal('28'), Decimal('5')),
        ("CMP-BARRIER-CABINET", wh_delhi, Decimal('10'), Decimal('0')),
        ("CMP-BOOM-ARM-4M", wh_main, Decimal('45'), Decimal('8')),
        ("CMP-BLDC-CTRL-V3", wh_main, Decimal('32'), Decimal('4')),
        ("CMP-DUAL-LOOP-DET", wh_main, Decimal('50'), Decimal('6')),
        ("CMP-UHF-RFID-12DBI", wh_main, Decimal('8'), Decimal('3')),
        ("CMP-IR-PHOTOCELL-PAIR", wh_main, Decimal('24'), Decimal('2')),
        ("SPR-REMOTE-SET-433", wh_main, Decimal('60'), Decimal('10')),
        ("SPR-BAL-SPRING-5MM", wh_main, Decimal('35'), Decimal('5')),
        ("DSP-TRAFFIC-LIGHT-200", wh_main, Decimal('14'), Decimal('2')),
    ]

    for sku, wh, on_hand, alloc in stock_distributions:
        p = prod_objs.get(sku)
        if p:
            WarehouseStock.objects.update_or_create(
                product=p, warehouse=wh,
                defaults={
                    "on_hand_quantity": on_hand,
                    "allocated_quantity": alloc,
                    "available_quantity": on_hand - alloc
                }
            )

    # 8. Bill of Materials (BOM)
    # Finished Product: Automatic Boom Barrier Pro 4M
    finished_barrier = prod_objs['NNIT-ABB-PRO4']
    bom, _ = BillOfMaterials.objects.get_or_create(
        bom_number="BOM-ABB-4M-001",
        defaults={
            "finished_product": finished_barrier,
            "name": "Standard 4M Automatic Boom Barrier Assembly",
            "version": "v1.2",
            "notes": "Assembly BOM for standard toll and parking barrier with 4m boom arm."
        }
    )

    bom_lines = [
        ("CMP-BARRIER-CABINET", Decimal('1.00'), "Cabinet enclosure with chassis"),
        ("CMP-BOOM-ARM-4M", Decimal('1.00'), "Octagonal boom arm 4m with cushion"),
        ("CMP-BLDC-CTRL-V3", Decimal('1.00'), "Smart motherboard controller"),
        ("CMP-DUAL-LOOP-DET", Decimal('2.00'), "Loop detectors (1 for safety + 1 for auto-close)"),
        ("SPR-REMOTE-SET-433", Decimal('1.00'), "Wireless remote control set"),
        ("CMP-IR-PHOTOCELL-PAIR", Decimal('1.00'), "Anti-crush photocell pair"),
        ("SPR-BAL-SPRING-5MM", Decimal('1.00'), "Balancing tension spring"),
    ]

    for sku, req_qty, line_note in bom_lines:
        c_prod = prod_objs.get(sku)
        if c_prod:
            BOMComponent.objects.get_or_create(
                bom=bom, component_product=c_prod,
                defaults={
                    "required_quantity": req_qty,
                    "uom": c_prod.uom,
                    "scrap_percentage": Decimal('0.00'),
                    "notes": line_note
                }
            )

    # 9. Sample Purchase Order & GRN
    po, _ = PurchaseOrder.objects.get_or_create(
        po_number="PO-2026-1001",
        defaults={
            "vendor": ven_objs['VEN-001'],
            "warehouse": wh_main,
            "status": "completed",
            "subtotal": Decimal('95000.00'),
            "tax_amount": Decimal('17100.00'),
            "total_amount": Decimal('112100.00'),
            "notes": "Urgent procurement of 10 barrier cabinets for upcoming commercial parking projects."
        }
    )

    PurchaseOrderItem.objects.get_or_create(
        po=po, product=prod_objs['CMP-BARRIER-CABINET'],
        defaults={
            "ordered_quantity": Decimal('10.00'),
            "received_quantity": Decimal('10.00'),
            "unit_price": Decimal('9500.00'),
            "tax_rate": Decimal('18.00'),
            "total_price": Decimal('112100.00')
        }
    )

    # GRN for this PO
    grn, _ = GoodsReceiptNote.objects.get_or_create(
        grn_number="GRN-2026-0501",
        defaults={
            "po": po,
            "vendor": ven_objs['VEN-001'],
            "warehouse": wh_main,
            "invoice_challan_no": "INV/MDS/9921",
            "received_by": "Ramesh Stores",
            "status": "stored",
            "notes": "All 10 units inspected and quality checked without any transit damage."
        }
    )

    GoodsReceiptNoteItem.objects.get_or_create(
        grn=grn, product=prod_objs['CMP-BARRIER-CABINET'],
        defaults={
            "received_quantity": Decimal('10.00'),
            "accepted_quantity": Decimal('10.00'),
            "rejected_quantity": Decimal('0.00'),
            "remarks": "QC Passed"
        }
    )

    # 10. Sample Material Requisition
    mr, _ = MaterialRequisition.objects.get_or_create(
        mr_number="MR-2026-0201",
        defaults={
            "requested_by": "Deepak Joshi (Site Engineer)",
            "department_project": "Phoenix Marketcity Parking Automation Phase 2",
            "priority": "high",
            "status": "approved",
            "purpose": "Installation of 4 barrier lanes and Fastag reader antennas at Mall South Entry"
        }
    )
    MaterialRequisitionItem.objects.get_or_create(
        mr=mr, product=prod_objs['CMP-BOOM-ARM-4M'],
        defaults={"quantity": Decimal('4.00'), "notes": "4M arms"}
    )
    MaterialRequisitionItem.objects.get_or_create(
        mr=mr, product=prod_objs['CMP-UHF-RFID-12DBI'],
        defaults={"quantity": Decimal('4.00'), "notes": "Fastag readers"}
    )

    # 11. Sample Delivery Challan
    dc, _ = DeliveryChallan.objects.get_or_create(
        dc_number="DC-2026-0812",
        defaults={
            "customer_name": "Phoenix Mills Developers Ltd.",
            "site_name": "Phoenix Mall Parking - Viman Nagar Pune",
            "dispatch_warehouse": wh_main,
            "vehicle_number": "MH-12-PQ-8899",
            "transporter": "SafeXpress Logistics",
            "status": "delivered",
            "notes": "Materials delivered for installation at entry plaza."
        }
    )
    DeliveryChallanItem.objects.get_or_create(
        dc=dc, product=prod_objs['NNIT-ABB-PRO4'],
        defaults={"quantity": Decimal('2.00')}
    )

    print("✅ Inventory ERP Seed Data created successfully!")

if __name__ == '__main__':
    run_seed()
