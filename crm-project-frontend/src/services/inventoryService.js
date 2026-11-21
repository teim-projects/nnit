// inventoryService.js - Parking Industry Inventory ERP Data Store & Service
import axios from "axios";

const BASE_API = import.meta.env.VITE_BASE_API_URL || "http://localhost:8000";

const STORAGE_KEYS = {
  CATEGORIES: "nnit_inv_categories_v8",
  SUBCATEGORIES: "nnit_inv_subcategories_v8",
  BRANDS: "nnit_inv_brands_v8",
  UOMS: "nnit_inv_uoms_v8",
  WAREHOUSES: "nnit_inv_warehouses_v8",
  PRODUCTS: "nnit_inv_products_v8",
  VENDORS: "nnit_inv_vendors_v8",
  PURCHASE_ORDERS: "nnit_inv_purchase_orders_v8",
  GRNS: "nnit_inv_grns_v8",
  REQUISITIONS: "nnit_inv_requisitions_v8",
  MTNS: "nnit_inv_mtns_v8",
  DELIVERY_CHALLANS: "nnit_inv_delivery_challans_v8",
  MATERIAL_RETURNS: "nnit_inv_returns_v8",
  STOCK_ADJUSTMENTS: "nnit_inv_stock_adjustments_v8",
  BOMS: "nnit_inv_boms_v10",
  STOCK_RECORDS: "nnit_inv_stock_records_v8",
  PRICE_REVISIONS: "nnit_inv_price_revisions_v8",
  VENDOR_QUOTES: "nnit_inv_vendor_quotes_v8",
};

/* ──────────────────────────────────────────────────────────────────────────
   INITIAL REALISTIC PARKING SYSTEM DATA SEED
   ────────────────────────────────────────────────────────────────────────── */
const SEED_UOMS = [
  { id: 1, name: "Pieces", code: "PCS", precision: 0, status: "Active" },
  { id: 2, name: "Sets", code: "SET", precision: 0, status: "Active" },
  { id: 3, name: "Meters", code: "MTR", precision: 2, status: "Active" },
  { id: 4, name: "Kilograms", code: "KG", precision: 2, status: "Active" },
  { id: 5, name: "Rolls", code: "ROL", precision: 0, status: "Active" },
];

const SEED_BRANDS = [
  { id: 1, name: "NNIT Core Systems", code: "NNIT", country: "India", website: "https://nnitparking.com", status: "Active" },
  { id: 2, name: "Magnetix Drive Systems", code: "MDS", country: "Germany", website: "https://magnetix-drives.com", status: "Active" },
  { id: 3, name: "SensorTech Electronics", code: "STE", country: "India", website: "https://sensortech.in", status: "Active" },
  { id: 4, name: "Supreme Extrusions", code: "SME", country: "India", website: "https://supremeextrusions.com", status: "Active" },
  { id: 5, name: "Apex Micro Electronics", code: "AME", country: "Taiwan", website: "https://apex-micro.com", status: "Active" },
];

const SEED_CATEGORIES = [
  { id: 1, name: "Barriers & Access Hardware", code: "BARRIERS", description: "Automated boom barriers, turnstiles, and rising bollards", status: "Active" },
  { id: 2, name: "Chains & Links", code: "CHAINS", description: "Industrial roller chains, lacing links, connecting clips", status: "Active" },
  { id: 3, name: "Fasteners", code: "FASTENERS", description: "Bolts, nuts, washers, anchors, MS hardware", status: "Active" },
  { id: 4, name: "Hydraulic Parts", code: "HYDRAULIC", description: "Hydraulic cylinders, seals, oil VG 46, valves, hoses", status: "Active" },
  { id: 5, name: "Steel & Structural", code: "STEEL", description: "MS flats, angles, hollow section pipes, structural steel", status: "Active" },
  { id: 6, name: "Electrical", code: "ELECTRICAL", description: "Control panels, proximity sensors, contactors, wiring", status: "Active" },
  { id: 7, name: "Bearings", code: "BEARINGS", description: "Deep groove ball bearings, pillow blocks, bushings", status: "Active" },
  { id: 8, name: "Safety & Hardware", code: "SAFETY", description: "Nylon ropes, safety locks, reflective gear, signs", status: "Active" },
  { id: 9, name: "Electronic Controllers & PCBs", code: "CONTROLLERS", description: "BLDC driver boards, logic motherboards, power supplies", status: "Active" },
  { id: 10, name: "Sensors & Telemetry", code: "SENSORS", description: "Vehicle loop detectors, infrared photocells, laser scanners", status: "Active" },
  { id: 11, name: "RFID & Fastag Tech", code: "RFID", description: "Long-range UHF antennas, vehicle windshield tags, Fastag controllers", status: "Active" },
  { id: 12, name: "Spare Parts & Mechanicals", code: "SPARES", description: "Balancing springs, gearboxes, remote fobs, belts", status: "Active" },
  { id: 13, name: "Displays & Signage", code: "DISPLAYS", description: "Traffic lights, parking vacancy signs, LED variable boards", status: "Active" },
];

const SEED_SUBCATEGORIES = [
  { id: 1, categoryId: 1, name: "Barrier Cabinets", code: "BCAB", description: "IP65 powder-coated heavy steel enclosures" },
  { id: 2, categoryId: 1, name: "Boom Arms & Extrusions", code: "BARM", description: "Octagonal aluminium arms with reflective stripes" },
  { id: 3, categoryId: 1, name: "Flap Barriers & Turnstiles", code: "FLAP", description: "Pedestrian passage barriers and turnstile mechanisms" },
  { id: 4, categoryId: 2, name: "BLDC Motor Controllers", code: "BLDC", description: "Digital microcontroller boards with RS485" },
  { id: 5, categoryId: 2, name: "Power Supplies & SMPS", code: "SMPS", description: "24V / 48V industrial switching power supplies" },
  { id: 6, categoryId: 3, name: "Vehicle Loop Detectors", code: "LOOP", description: "Dual channel inductive loop detectors" },
  { id: 7, categoryId: 3, name: "Infrared Photocells", code: "PHOTO", description: "Anti-crush safety beam pairs" },
  { id: 8, categoryId: 4, name: "UHF Long-Range Readers", code: "UHF", description: "12dBi circular polarized RFID antennas" },
  { id: 9, categoryId: 5, name: "Remote Control Fobs", code: "REMOTE", description: "433.92 MHz rolling code transmitters" },
  { id: 10, categoryId: 5, name: "Tension Springs", code: "SPRING", description: "Heavy-duty arm counter-balancing springs" },
  { id: 11, categoryId: 6, name: "Traffic Signal Lights", code: "TRAFFIC", description: "Red / Green 200mm LED lane signals" },
];

const SEED_WAREHOUSES = [
  { id: 1, code: "WH-PUN", name: "Central Assembly Plant - Pune", city: "Pune", state: "Maharashtra", address: "Gat No 42, Hinjewadi Phase 2, Pune 411057", manager: "Rajesh Sharma", phone: "+91 98220 11223", isPrimary: true, status: "Active" },
  { id: 2, code: "WH-BOM", name: "Mumbai Regional Distribution Hub", city: "Mumbai", state: "Maharashtra", address: "Plot 18, MIDC Andheri East, Mumbai 400093", manager: "Amit Kulkarni", phone: "+91 98200 44556", isPrimary: false, status: "Active" },
  { id: 3, code: "WH-DEL", name: "Delhi NCR Project Hub", city: "Noida", state: "Uttar Pradesh", address: "Sector 63, Block B, Noida 201301", manager: "Vikram Singh", phone: "+91 98110 77889", isPrimary: false, status: "Active" },
  { id: 4, code: "WH-BLR", name: "Bangalore Tech & Sensor Hub", city: "Bengaluru", state: "Karnataka", address: "Electronic City Phase 1, Bengaluru 560100", manager: "Karthik Nair", phone: "+91 98450 33445", isPrimary: false, status: "Active" },
];

const SEED_VENDORS = [
  { id: 1, code: "VEN-001", name: "Magnetix Drive Systems Ltd.", gstin: "27AABCM8821Q1ZV", contactPerson: "Sanjay Verma", email: "sales@magnetix-drives.com", phone: "+91 99201 55432", city: "Pune", state: "Maharashtra", paymentTerms: "Net 30 Days", rating: 4.8, status: "Active" },
  { id: 2, code: "VEN-002", name: "SensorTech Electronics India", gstin: "27AAACS1234P1Z4", contactPerson: "Pooja Patil", email: "orders@sensortech.in", phone: "+91 98231 66789", city: "Nashik", state: "Maharashtra", paymentTerms: "Net 15 Days", rating: 4.6, status: "Active" },
  { id: 3, code: "VEN-003", name: "Supreme Aluminium Extrusions", gstin: "24AAJCS9988M1Z2", contactPerson: "Anil Shah", email: "supply@supremeextrusions.com", phone: "+91 98980 12345", city: "Ahmedabad", state: "Gujarat", paymentTerms: "Net 45 Days", rating: 4.5, status: "Active" },
  { id: 4, code: "VEN-004", name: "Apex Micro Electronics", gstin: "29AABCA7766K1ZT", contactPerson: "Ramesh Iyer", email: "sales@apex-micro.com", phone: "+91 99000 88776", city: "Bengaluru", state: "Karnataka", paymentTerms: "Advance 20% Net 30", rating: 4.9, status: "Active" },
];

const SEED_PRODUCTS = [
  // Finished Products
  {
    id: 1,
    sku: "NNIT-ABB-PRO4",
    name: "Automatic Boom Barrier Pro 4M (Finished)",
    itemType: "finished_product",
    category: "Barriers & Access Hardware",
    subCategory: "Barrier Cabinets",
    brand: "NNIT Core Systems",
    uom: "SET",
    costPrice: 24500,
    sellingPrice: 38500,
    minStock: 5,
    reorderQty: 10,
    stocks: { 1: 12, 2: 6, 3: 2, 4: 1 },
    reserved: { 1: 2, 2: 1, 3: 0, 4: 0 },
    description: "Complete automated parking boom barrier 4-meter telescopic arm system with brushless DC motor."
  },
  {
    id: 2,
    sku: "NNIT-ABB-FASTAG",
    name: "Fastag Integrated Boom Barrier Kit (Finished)",
    itemType: "finished_product",
    category: "Barriers & Access Hardware",
    subCategory: "Barrier Cabinets",
    brand: "NNIT Core Systems",
    uom: "SET",
    costPrice: 42000,
    sellingPrice: 65000,
    minStock: 3,
    reorderQty: 8,
    stocks: { 1: 2, 2: 0, 3: 0, 4: 0 },
    reserved: { 1: 1, 2: 0, 3: 0, 4: 0 },
    description: "High-speed 1.5s barrier with 12dBi UHF Long-Range RFID Reader & Traffic Signaling."
  },
  // Components
  {
    id: 3,
    sku: "CMP-BARRIER-CABINET",
    name: "Heavy-Duty Barrier Cabinet IP65 (Orange/Grey)",
    itemType: "component",
    category: "Barriers & Access Hardware",
    subCategory: "Barrier Cabinets",
    brand: "NNIT Core Systems",
    uom: "PCS",
    costPrice: 9500,
    sellingPrice: 14000,
    minStock: 10,
    reorderQty: 20,
    stocks: { 1: 28, 2: 8, 3: 10, 4: 3 },
    reserved: { 1: 5, 2: 0, 3: 0, 4: 0 },
    description: "Weather-proof powder coated 2.0mm steel cabinet enclosure with mechanical chassis."
  },
  {
    id: 4,
    sku: "CMP-BOOM-ARM-4M",
    name: "Octagonal Aluminium Boom Arm 4-Meter",
    itemType: "component",
    category: "Barriers & Access Hardware",
    subCategory: "Boom Arms & Extrusions",
    brand: "Supreme Extrusions",
    uom: "PCS",
    costPrice: 3200,
    sellingPrice: 5500,
    minStock: 15,
    reorderQty: 30,
    stocks: { 1: 45, 2: 12, 3: 8, 4: 5 },
    reserved: { 1: 8, 2: 2, 3: 0, 4: 0 },
    description: "Aerodynamic octagonal profile aluminum boom with red reflective stickers and rubber bottom cushion."
  },
  {
    id: 5,
    sku: "CMP-BLDC-CTRL-V3",
    name: "Smart BLDC Motherboard Controller V3.2",
    itemType: "component",
    category: "Electronic Controllers & PCBs",
    subCategory: "BLDC Motor Controllers",
    brand: "Apex Micro Electronics",
    uom: "PCS",
    costPrice: 4800,
    sellingPrice: 7500,
    minStock: 12,
    reorderQty: 25,
    stocks: { 1: 32, 2: 10, 3: 6, 4: 8 },
    reserved: { 1: 4, 2: 0, 3: 0, 4: 0 },
    description: "Digital barrier controller with RS485, loop integration, speed adjustment & auto-reverse protection."
  },
  {
    id: 6,
    sku: "CMP-DUAL-LOOP-DET",
    name: "Dual Channel Vehicle Loop Detector (LD-200)",
    itemType: "component",
    category: "Sensors & Telemetry",
    subCategory: "Vehicle Loop Detectors",
    brand: "SensorTech Electronics",
    uom: "PCS",
    costPrice: 1850,
    sellingPrice: 3200,
    minStock: 20,
    reorderQty: 40,
    stocks: { 1: 50, 2: 15, 3: 12, 4: 10 },
    reserved: { 1: 6, 2: 2, 3: 0, 4: 0 },
    description: "High sensitivity inductive loop detector with directional logic and pulse relay outputs."
  },
  {
    id: 7,
    sku: "CMP-UHF-RFID-12DBI",
    name: "12dBi Long Range UHF RFID Reader (Fastag Compatible)",
    itemType: "component",
    category: "RFID & Fastag Tech",
    subCategory: "UHF Long-Range Readers",
    brand: "SensorTech Electronics",
    uom: "PCS",
    costPrice: 14500,
    sellingPrice: 22000,
    minStock: 6,
    reorderQty: 15,
    stocks: { 1: 4, 2: 1, 3: 0, 4: 0 },
    reserved: { 1: 2, 2: 0, 3: 0, 4: 0 },
    description: "865-868 MHz Indian frequency long-range antenna reader with Wiegand 26/34 and TCP/IP."
  },
  {
    id: 8,
    sku: "CMP-IR-PHOTOCELL-PAIR",
    name: "Reflective Safety Photocell Sensor (15m Range)",
    itemType: "component",
    category: "Sensors & Telemetry",
    subCategory: "Infrared Photocells",
    brand: "SensorTech Electronics",
    uom: "SET",
    costPrice: 1200,
    sellingPrice: 2200,
    minStock: 15,
    reorderQty: 30,
    stocks: { 1: 24, 2: 6, 3: 4, 4: 5 },
    reserved: { 1: 2, 2: 0, 3: 0, 4: 0 },
    description: "Infrared anti-crush safety sensor pair with polarized reflector."
  },
  // Spares & Signaling
  {
    id: 9,
    sku: "SPR-REMOTE-SET-433",
    name: "Wireless Remote Control Set (Transmitter + 2 Remotes)",
    itemType: "spare_part",
    category: "Spare Parts & Mechanicals",
    subCategory: "Remote Control Fobs",
    brand: "Apex Micro Electronics",
    uom: "SET",
    costPrice: 650,
    sellingPrice: 1250,
    minStock: 25,
    reorderQty: 50,
    stocks: { 1: 60, 2: 20, 3: 15, 4: 12 },
    reserved: { 1: 10, 2: 2, 3: 0, 4: 0 },
    description: "433.92MHz rolling code wireless remote controller with 30-meter range."
  },
  {
    id: 10,
    sku: "SPR-BAL-SPRING-5MM",
    name: "High-Tensile Barrier Balancing Spring 5.0mm",
    itemType: "spare_part",
    category: "Spare Parts & Mechanicals",
    subCategory: "Tension Springs",
    brand: "Magnetix Drive Systems",
    uom: "PCS",
    costPrice: 450,
    sellingPrice: 900,
    minStock: 20,
    reorderQty: 40,
    stocks: { 1: 35, 2: 10, 3: 8, 4: 5 },
    reserved: { 1: 5, 2: 0, 3: 0, 4: 0 },
    description: "Heavy-duty carbon spring for counter-balancing 3m - 4.5m boom arm weight."
  },
  {
    id: 11,
    sku: "DSP-TRAFFIC-LIGHT-200",
    name: "LED Traffic Signal Light (Red / Green 200mm)",
    itemType: "component",
    category: "Displays & Signage",
    subCategory: "Traffic Signal Lights",
    brand: "NNIT Core Systems",
    uom: "PCS",
    costPrice: 3100,
    sellingPrice: 5200,
    minStock: 8,
    reorderQty: 20,
    stocks: { 1: 14, 2: 4, 3: 3, 4: 2 },
    reserved: { 1: 2, 2: 0, 3: 0, 4: 0 },
    description: "High-intensity outdoor LED lane signal light with sun visor and IP65 housing."
  },
  {
    id: 12,
    sku: "PRD-00006",
    name: "Proximity Sensor 12V DC NPN NO (NOS)",
    itemType: "component",
    category: "Electrical",
    subCategory: "Sensors & Telemetry",
    brand: "SensorTech Electronics",
    uom: "PCS",
    costPrice: 450,
    sellingPrice: 850,
    minStock: 10,
    reorderQty: 25,
    stocks: { 1: 3, 2: 0, 3: 0, 4: 0 },
    reserved: { 1: 2, 2: 0, 3: 0, 4: 0 },
    description: "Inductive proximity sensor switch 12V NPN Normally Open."
  },
  {
    id: 13,
    sku: "PRD-00010",
    name: "Nylon Rope 12mm x 100m (ROLL)",
    itemType: "component",
    category: "Safety & Hardware",
    subCategory: "Safety Equipment",
    brand: "NNIT Core Systems",
    uom: "ROLL",
    costPrice: 850,
    sellingPrice: 1500,
    minStock: 5,
    reorderQty: 10,
    stocks: { 1: 3, 2: 0, 3: 0, 4: 0 },
    reserved: { 1: 2, 2: 0, 3: 0, 4: 0 },
    description: "Heavy-duty 12mm braided nylon safety rope with high tensile strength."
  },
  {
    id: 14,
    sku: "PRD-00011",
    name: "Electrical Control Panel 32A 415V 4-Way (NOS)",
    itemType: "component",
    category: "Electrical",
    subCategory: "Distribution Boards",
    brand: "Apex Micro Electronics",
    uom: "PCS",
    costPrice: 6500,
    sellingPrice: 11000,
    minStock: 6,
    reorderQty: 12,
    stocks: { 1: 4, 2: 0, 3: 0, 4: 0 },
    reserved: { 1: 2, 2: 0, 3: 0, 4: 0 },
    description: "Industrial weatherproof electrical control and distribution panel."
  },
  {
    id: 15,
    sku: "PRD-00013",
    name: "200W High-Torque BLDC Servo Motor (Parking Barrier Drive)",
    itemType: "component",
    category: "Electrical",
    subCategory: "BLDC Motor Controllers",
    brand: "Magnetix Drive Systems",
    uom: "PCS",
    costPrice: 7500,
    sellingPrice: 13000,
    minStock: 8,
    reorderQty: 15,
    stocks: { 1: 1, 2: 0, 3: 0, 4: 0 },
    reserved: { 1: 0, 2: 0, 3: 0, 4: 0 },
    description: "Precision brushless DC servo drive motor for 1.5s - 3s high-speed barriers."
  },
  {
    id: 16,
    sku: "PRD-00014",
    name: "Silicon Insulated Inductive Loop Wire 1.5mm 100m (Roll)",
    itemType: "component",
    category: "Sensors & Telemetry",
    subCategory: "Vehicle Loop Detectors",
    brand: "SensorTech Electronics",
    uom: "ROLL",
    costPrice: 1200,
    sellingPrice: 2400,
    minStock: 5,
    reorderQty: 10,
    stocks: { 1: 0, 2: 0, 3: 0, 4: 0 },
    reserved: { 1: 0, 2: 0, 3: 0, 4: 0 },
    description: "Heat-resistant silicon insulated multi-strand loop wire for in-road installation."
  },
  {
    id: 17,
    sku: "PRD-00015",
    name: "Optical Limit Switch Sensor for Boom Barrier Arm",
    itemType: "component",
    category: "Sensors & Telemetry",
    subCategory: "Infrared Photocells",
    brand: "SensorTech Electronics",
    uom: "PCS",
    costPrice: 380,
    sellingPrice: 750,
    minStock: 10,
    reorderQty: 25,
    stocks: { 1: 2, 2: 0, 3: 0, 4: 0 },
    reserved: { 1: 1, 2: 0, 3: 0, 4: 0 },
    description: "Contactless optical optocoupler sensor for barrier arm horizontal and vertical positioning."
  },
  {
    id: 18,
    sku: "PRD-00016",
    name: "Emergency Manual Release Key for Barrier Cabinet",
    itemType: "spare_part",
    category: "Spare Parts & Mechanicals",
    subCategory: "Mechanical Accessories",
    brand: "NNIT Core Systems",
    uom: "PCS",
    costPrice: 150,
    sellingPrice: 350,
    minStock: 15,
    reorderQty: 50,
    stocks: { 1: 2, 2: 0, 3: 0, 4: 0 },
    reserved: { 1: 0, 2: 0, 3: 0, 4: 0 },
    description: "Triangular mechanical emergency clutch release key for power outage operation."
  },
];

const SEED_BOMS = [
  {
    id: 1,
    bomNumber: "BOM-ABB-4M-001",
    name: "Automatic Boom Barrier Pro 4M Assembly",
    finishedProductSku: "NNIT-ABB-PRO4",
    finishedProductName: "Automatic Boom Barrier Pro 4M (Finished)",
    category: "Barriers & Access Hardware",
    version: "V3",
    leadTimeHours: 2.5,
    laborCost: 1500,
    status: "Active",
    components: [
      { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
      { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
      { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
      { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2, uom: "PCS", unitCost: 1850 },
      { sku: "SPR-REMOTE-SET-433", name: "Wireless Remote Control Set", qty: 1, uom: "SET", unitCost: 650 },
      { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 },
      { sku: "SPR-BAL-SPRING-5MM", name: "Barrier Balancing Spring 5.0mm", qty: 1, uom: "PCS", unitCost: 450 }
    ],
    versions: [
      {
        id: 103,
        versionNo: "V3",
        is_active: true,
        createdAt: "2026-11-20",
        changedBy: "Chief Technical Officer",
        changeReason: "Upgraded Smart BLDC Controller to V3.2 with dual loop detector support",
        laborCost: 1500,
        materialCost: 21650,
        totalCost: 23150,
        componentsCount: 7,
        components: [
          { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
          { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
          { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
          { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2, uom: "PCS", unitCost: 1850 },
          { sku: "SPR-REMOTE-SET-433", name: "Wireless Remote Control Set", qty: 1, uom: "SET", unitCost: 650 },
          { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 },
          { sku: "SPR-BAL-SPRING-5MM", name: "Barrier Balancing Spring 5.0mm", qty: 1, uom: "PCS", unitCost: 450 }
        ]
      },
      {
        id: 102,
        versionNo: "V2",
        is_active: false,
        createdAt: "2026-08-15",
        changedBy: "Senior Hardware Engineer",
        changeReason: "Added reflective safety photocell sensor pair to prevent vehicle damage",
        laborCost: 1400,
        materialCost: 20450,
        totalCost: 21850,
        componentsCount: 6,
        components: [
          { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
          { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
          { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
          { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2, uom: "PCS", unitCost: 1850 },
          { sku: "SPR-REMOTE-SET-433", name: "Wireless Remote Control Set", qty: 1, uom: "SET", unitCost: 650 },
          { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 }
        ]
      },
      {
        id: 101,
        versionNo: "V1",
        is_active: false,
        createdAt: "2026-05-10",
        changedBy: "Production Head",
        changeReason: "Initial baseline bill of materials release for 4M boom barrier",
        laborCost: 1200,
        materialCost: 19250,
        totalCost: 20450,
        componentsCount: 5,
        components: [
          { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
          { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
          { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
          { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2, uom: "PCS", unitCost: 1850 },
          { sku: "SPR-REMOTE-SET-433", name: "Wireless Remote Control Set", qty: 1, uom: "SET", unitCost: 650 }
        ]
      }
    ],
    checklists: [
      "Spring balance & tension torque verification",
      "BLDC motor limit switch calibration (90 deg)",
      "Safety loop detector rebound latency test",
      "Reflective photocell obstacle bounce trigger"
    ],
    notes: "Production bill of materials for standard 4-meter parking boom barrier system."
  },
  {
    id: 2,
    bomNumber: "BOM-FASTAG-LANE-002",
    name: "Fastag Integrated Boom Barrier Kit Assembly",
    finishedProductSku: "NNIT-ABB-FASTAG",
    finishedProductName: "Fastag Integrated Boom Barrier Kit (Finished)",
    category: "RFID & Fastag Tech",
    version: "V2",
    leadTimeHours: 4.0,
    laborCost: 2800,
    status: "Active",
    components: [
      { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
      { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
      { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
      { sku: "CMP-UHF-RFID-12DBI", name: "12dBi Long Range UHF RFID Reader", qty: 1, uom: "PCS", unitCost: 14500 },
      { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2, uom: "PCS", unitCost: 1850 },
      { sku: "DSP-TRAFFIC-LIGHT-200", name: "LED Traffic Signal Light (Red/Green)", qty: 1, uom: "PCS", unitCost: 3100 },
      { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 }
    ],
    versions: [
      {
        id: 202,
        versionNo: "V2",
        is_active: true,
        createdAt: "2026-11-18",
        changedBy: "RFID Solutions Architect",
        changeReason: "Integrated high-gain 12dBi Long Range UHF RFID reader with Wiegand sync",
        laborCost: 2800,
        materialCost: 38150,
        totalCost: 40950,
        componentsCount: 7,
        components: [
          { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
          { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
          { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
          { sku: "CMP-UHF-RFID-12DBI", name: "12dBi Long Range UHF RFID Reader", qty: 1, uom: "PCS", unitCost: 14500 },
          { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2, uom: "PCS", unitCost: 1850 },
          { sku: "DSP-TRAFFIC-LIGHT-200", name: "LED Traffic Signal Light (Red/Green)", qty: 1, uom: "PCS", unitCost: 3100 },
          { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 }
        ]
      },
      {
        id: 201,
        versionNo: "V1",
        is_active: false,
        createdAt: "2026-06-22",
        changedBy: "Hardware Engineer",
        changeReason: "Standard commercial parking entry barrier setup without RFID",
        laborCost: 2000,
        materialCost: 23650,
        totalCost: 25650,
        componentsCount: 5,
        components: [
          { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
          { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
          { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
          { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2, uom: "PCS", unitCost: 1850 },
          { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 }
        ]
      }
    ],
    checklists: [
      "UHF RFID antenna beam polarization alignment",
      "Wiegand 26/34 protocol communication sync",
      "Red/Green LED traffic light relay test",
      "NPCI / NETC Fastag tag recognition test"
    ],
    notes: "Fastag toll & commercial mall express entrance lane package."
  },
  {
    id: 3,
    bomNumber: "BOM-ABB-SOLAR-003",
    name: "Solar Powered Smart Boom Barrier with DC Backup",
    finishedProductSku: "NNIT-ABB-PRO4",
    finishedProductName: "Automatic Boom Barrier Pro 4M (Finished)",
    category: "Green Energy & Solar",
    version: "v1.1",
    leadTimeHours: 3.5,
    laborCost: 2200,
    status: "Active",
    components: [
      { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
      { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
      { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
      { sku: "PRD-00013", name: "Solar Panel 100W 12V Monocrystalline", qty: 2, uom: "PCS", unitCost: 4200 },
      { sku: "PRD-00014", name: "12V 26Ah Sealed Lead Acid Battery", qty: 2, uom: "NOS", unitCost: 3100 },
      { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 1, uom: "PCS", unitCost: 1850 },
      { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 }
    ],
    versions: [
      {
        id: 302,
        versionNo: "v1.1",
        is_active: true,
        createdAt: "2026-11-10",
        changedBy: "Solar Systems Lead",
        changeReason: "Added dual 100W mono solar panels with 26Ah deep-cycle battery backup",
        laborCost: 2200,
        materialCost: 29850,
        totalCost: 32050,
        componentsCount: 7,
        components: [
          { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
          { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
          { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
          { sku: "PRD-00013", name: "Solar Panel 100W 12V Monocrystalline", qty: 2, uom: "PCS", unitCost: 4200 },
          { sku: "PRD-00014", name: "12V 26Ah Sealed Lead Acid Battery", qty: 2, uom: "NOS", unitCost: 3100 },
          { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 1, uom: "PCS", unitCost: 1850 },
          { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 1, uom: "SET", unitCost: 1200 }
        ]
      },
      {
        id: 301,
        versionNo: "v1.0",
        is_active: false,
        createdAt: "2026-07-04",
        changedBy: "Hardware Engineer",
        changeReason: "Prototype single 50W solar panel test assembly",
        laborCost: 1800,
        materialCost: 23000,
        totalCost: 24800,
        componentsCount: 5,
        components: [
          { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", qty: 1, uom: "PCS", unitCost: 9500 },
          { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 1, uom: "PCS", unitCost: 3200 },
          { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, uom: "PCS", unitCost: 4800 },
          { sku: "PRD-00013", name: "Solar Panel 100W 12V Monocrystalline", qty: 1, uom: "PCS", unitCost: 4200 },
          { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 1, uom: "PCS", unitCost: 1850 }
        ]
      }
    ],
    checklists: [
      "Solar charge controller MPPT 24V float test",
      "Battery deep discharge cutoff test (21.6V)",
      "Solar array angle orientation (28 deg south)",
      "Continuous cycle test on 24V battery mode"
    ],
    notes: "Remote or highway perimeter installation with zero grid power requirement."
  },
  {
    id: 4,
    bomNumber: "BOM-FLAP-BARRIER-004",
    name: "Pedestrian Optical Flap Barrier Turnstile Core",
    finishedProductSku: "PRD-00015",
    finishedProductName: "Flap Barrier Mechanism Core Module",
    category: "Pedestrian Access",
    version: "v1.0",
    leadTimeHours: 5.0,
    laborCost: 3500,
    status: "Active",
    components: [
      { sku: "PRD-00015", name: "Flap Barrier Mechanism Core Module", qty: 1, uom: "SET", unitCost: 18500 },
      { sku: "PRD-00016", name: "Access Control QR / Card Reader Terminal", qty: 2, uom: "PCS", unitCost: 6500 },
      { sku: "PRD-00011", name: "Electrical Control Panel 32A 415V 4-Way", qty: 1, uom: "NOS", unitCost: 8200 },
      { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 3, uom: "SET", unitCost: 1200 },
      { sku: "PRD-00006", name: "Proximity Sensor 12V DC NPN NO", qty: 2, uom: "NOS", unitCost: 850 }
    ],
    versions: [
      {
        id: 401,
        versionNo: "v1.0",
        is_active: true,
        createdAt: "2026-11-05",
        changedBy: "Pedestrian Systems Architect",
        changeReason: "Initial baseline engineering release for dual-lane optical flap barrier turnstile core",
        laborCost: 3500,
        materialCost: 37250,
        totalCost: 40750,
        componentsCount: 5,
        components: [
          { sku: "PRD-00015", name: "Flap Barrier Mechanism Core Module", qty: 1, uom: "SET", unitCost: 18500 },
          { sku: "PRD-00016", name: "Access Control QR / Card Reader Terminal", qty: 2, uom: "PCS", unitCost: 6500 },
          { sku: "PRD-00011", name: "Electrical Control Panel 32A 415V 4-Way", qty: 1, uom: "NOS", unitCost: 8200 },
          { sku: "CMP-IR-PHOTOCELL-PAIR", name: "Reflective Safety Photocell Sensor", qty: 3, uom: "SET", unitCost: 1200 },
          { sku: "PRD-00006", name: "Proximity Sensor 12V DC NPN NO", qty: 2, uom: "NOS", unitCost: 850 }
        ]
      }
    ],
    checklists: [
      "Anti-tailgating optical beam array matrix check",
      "Emergency fire alarm auto drop/open mechanism",
      "Brushless wing opening speed test (<0.4 sec)",
      "RS485 QR code reader integration verify"
    ],
    notes: "High-throughput building lobby and metro entrance optical flap barrier."
  }
];

const SEED_PURCHASE_ORDERS = [
  {
    id: 1,
    poNumber: "PO-2026-1001",
    vendorId: 1,
    vendorName: "Magnetix Drive Systems Ltd.",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    orderDate: "2026-11-10",
    expectedDate: "2026-11-25",
    status: "Completed",
    subtotal: 95000,
    tax: 17100,
    total: 112100,
    items: [
      { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", orderedQty: 10, receivedQty: 10, unitPrice: 9500, taxRate: 18, total: 112100 }
    ],
    notes: "Urgent procurement of 10 barrier cabinets for commercial projects."
  },
  {
    id: 2,
    poNumber: "PO-2026-1002",
    vendorId: 2,
    vendorName: "SensorTech Electronics India",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    orderDate: "2026-11-15",
    expectedDate: "2026-11-28",
    status: "Sent to Vendor",
    subtotal: 74000,
    tax: 13320,
    total: 87320,
    items: [
      { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", orderedQty: 40, receivedQty: 0, unitPrice: 1850, taxRate: 18, total: 87320 }
    ],
    notes: "Regular stock replenishment of vehicle loop sensors."
  }
];

const SEED_GRNS = [
  {
    id: 1,
    grnNumber: "GRN-2026-0501",
    poNumber: "PO-2026-1001",
    vendorName: "Magnetix Drive Systems Ltd.",
    warehouseName: "Central Assembly Plant - Pune",
    warehouseId: 1,
    receivedDate: "2026-11-14",
    challanNo: "INV/MDS/9921",
    receivedBy: "Ramesh Stores",
    status: "Verified & Stored",
    items: [
      { sku: "CMP-BARRIER-CABINET", name: "Heavy-Duty Barrier Cabinet IP65", receivedQty: 10, acceptedQty: 10, rejectedQty: 0, remarks: "QC Passed" }
    ],
    notes: "All 10 units inspected and quality checked without any transit damage."
  }
];

const SEED_REQUISITIONS = [
  {
    id: 1,
    mrNumber: "MR-2026-0201",
    requestedBy: "Deepak Joshi (Site Engineer)",
    departmentProject: "Phoenix Marketcity Parking Automation Phase 2",
    requestDate: "2026-11-12",
    requiredDate: "2026-11-22",
    priority: "High",
    status: "Approved",
    purpose: "Installation of 4 barrier lanes and Fastag reader antennas at Mall South Entry",
    items: [
      { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 4, notes: "South gate lanes" },
      { sku: "CMP-UHF-RFID-12DBI", name: "12dBi Long Range UHF RFID Reader", qty: 4, notes: "Fastag lanes" },
    ]
  },
  {
    id: 2,
    mrNumber: "MR-2026-0202",
    requestedBy: "Sunil K (Service Lead)",
    departmentProject: "AMC Maintenance Replacement - IT Park",
    requestDate: "2026-11-18",
    requiredDate: "2026-11-20",
    priority: "Urgent",
    status: "Pending",
    purpose: "Breakdown replacement of damaged boom arm and motherboard at Tower B",
    items: [
      { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", qty: 2, notes: "Broken arm replace" },
      { sku: "CMP-BLDC-CTRL-V3", name: "Smart BLDC Motherboard Controller V3.2", qty: 1, notes: "Surge damaged PCB" },
    ]
  }
];

const SEED_MTNS = [
  {
    id: 1,
    mtnNumber: "MTN-2026-0301",
    date: "2026-11-16",
    sourceWarehouse: "Central Assembly Plant - Pune",
    destinationWarehouse: "Mumbai Regional Distribution Hub",
    purpose: "Replenishing finished barrier stock for Mumbai metro station projects",
    approvedBy: "Pravin Dare",
    status: "In Transit",
    items: [
      { sku: "NNIT-ABB-PRO4", name: "Automatic Boom Barrier Pro 4M (Finished)", qty: 4 },
      { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 10 },
    ]
  }
];

const SEED_DELIVERY_CHALLANS = [
  {
    id: 1,
    dcNumber: "DC-2026-0812",
    customerName: "Phoenix Mills Developers Ltd.",
    siteName: "Phoenix Mall Parking - Viman Nagar Pune",
    dispatchWarehouse: "Central Assembly Plant - Pune",
    dispatchDate: "2026-11-17",
    vehicleNumber: "MH-12-PQ-8899",
    transporter: "SafeXpress Logistics",
    status: "Delivered",
    items: [
      { sku: "NNIT-ABB-PRO4", name: "Automatic Boom Barrier Pro 4M (Finished)", qty: 2 },
      { sku: "DSP-TRAFFIC-LIGHT-200", name: "LED Traffic Signal Light", qty: 2 },
    ],
    notes: "Materials delivered for installation at entry plaza."
  }
];

const SEED_RETURNS = [
  {
    id: 1,
    returnNumber: "MRN-2026-0101",
    returnDate: "2026-11-15",
    sourceDescription: "Cyber City Tech Park Gate 3",
    receivingWarehouse: "Central Assembly Plant - Pune",
    reason: "Excess spare parts returned after project commissioning",
    status: "Restocked",
    items: [
      { sku: "SPR-REMOTE-SET-433", name: "Wireless Remote Control Set", qty: 4 },
      { sku: "CMP-DUAL-LOOP-DET", name: "Dual Channel Vehicle Loop Detector", qty: 2 },
    ],
    notes: "Components inspected and added back into available stock."
  }
];

const SEED_ADJUSTMENTS = [
  {
    id: 1,
    adjNumber: "ADJ-2026-0045",
    date: "2026-11-12",
    warehouseName: "Central Assembly Plant - Pune",
    adjustmentType: "Physical Audit Reconciliation",
    reason: "Annual Q3 physical stock count audit",
    adjustedBy: "Audit Team - Mahesh G",
    items: [
      { sku: "CMP-BOOM-ARM-4M", name: "Octagonal Aluminium Boom Arm 4-Meter", systemQty: 47, physicalQty: 45, diff: -2, reason: "1 transit scratch, 1 sample test" },
      { sku: "SPR-BAL-SPRING-5MM", name: "Barrier Balancing Spring 5.0mm", systemQty: 33, physicalQty: 35, diff: +2, reason: "Unrecorded return from test bench" },
    ]
  }
];

export const SEED_STOCK_RECORDS = [
  {
    id: 1,
    sku: "PRD-00001",
    name: "12B 6×6 Lacing Link Chain 1600 Pitches (KG)",
    category: "Chains & Links",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 150,
    receipt: 623.84,
    sent: 50,
    approved: 0,
    reserved: 0,
    closing: 723.84,
    available: 723.84,
    minStock: 200,
    date: "2026-11-20"
  },
  {
    id: 2,
    sku: "PRD-00002",
    name: "12B 6×6 Spring Clip Connecting Link (NOS)",
    category: "Chains & Links",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 500,
    receipt: 0,
    sent: 50,
    approved: 0,
    reserved: 0,
    closing: 450,
    available: 450,
    minStock: 100,
    date: "2026-11-20"
  },
  {
    id: 3,
    sku: "PRD-00003",
    name: "MS Nut Bolt M12×40 mm (NOS)",
    category: "Fasteners",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 800,
    receipt: 1500,
    sent: 100,
    approved: 0,
    reserved: 0,
    closing: 2200,
    available: 2200,
    minStock: 500,
    date: "2026-11-20"
  },
  {
    id: 4,
    sku: "PRD-00004",
    name: "Hydraulic Oil ISO VG 46 (LTR)",
    category: "Hydraulic Parts",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 15,
    receipt: 150,
    sent: 20,
    approved: 0,
    reserved: 0,
    closing: 145,
    available: 145,
    minStock: 30,
    date: "2026-11-20"
  },
  {
    id: 5,
    sku: "PRD-00005",
    name: "MS Flat 50×6 mm (KG)",
    category: "Steel & Structural",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 200,
    receipt: 0,
    sent: 80,
    approved: 0,
    reserved: 0,
    closing: 120,
    available: 120,
    minStock: 50,
    date: "2026-11-20"
  },
  {
    id: 6,
    sku: "PRD-00006",
    name: "Proximity Sensor 12V DC NPN NO (NOS)",
    category: "Electrical",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 3,
    receipt: 0,
    sent: 2,
    approved: 0,
    reserved: 0,
    closing: 1,
    available: 1,
    minStock: 10, // LOW STOCK (1 <= 10)
    date: "2026-11-20"
  },
  {
    id: 7,
    sku: "PRD-00007",
    name: "MS Angle 50×50×6 mm (KG)",
    category: "Steel & Structural",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 150,
    receipt: 0,
    sent: 60,
    approved: 0,
    reserved: 0,
    closing: 90,
    available: 90,
    minStock: 40,
    date: "2026-11-20"
  },
  {
    id: 8,
    sku: "PRD-00008",
    name: "Hydraulic Cylinder Seal Kit 80mm (SET)",
    category: "Hydraulic Parts",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 5,
    receipt: 3,
    sent: 0,
    approved: 0,
    reserved: 4,
    closing: 8,
    available: 4,
    minStock: 10, // LOW STOCK (4 <= 10)
    date: "2026-11-20"
  },
  {
    id: 9,
    sku: "PRD-00009",
    name: "SKF Deep Groove Ball Bearing 6205 (NOS)",
    category: "Bearings",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 15,
    receipt: 40,
    sent: 5,
    approved: 0,
    reserved: 0,
    closing: 50,
    available: 50,
    minStock: 25,
    date: "2026-11-20"
  },
  {
    id: 10,
    sku: "PRD-00010",
    name: "Nylon Rope 12mm x 100m (ROLL)",
    category: "Safety & Hardware",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 3,
    receipt: 0,
    sent: 2,
    approved: 0,
    reserved: 0,
    closing: 1,
    available: 1,
    minStock: 5, // LOW STOCK (1 <= 5)
    date: "2026-11-20"
  },
  {
    id: 11,
    sku: "PRD-00011",
    name: "Electrical Control Panel 32A 415V 4-Way (NOS)",
    category: "Electrical",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 2,
    receipt: 2,
    sent: 0,
    approved: 0,
    reserved: 2,
    closing: 4,
    available: 2,
    minStock: 6, // LOW STOCK (2 <= 6)
    date: "2026-11-20"
  },
  {
    id: 12,
    sku: "PRD-00012",
    name: "MS Pipe 25×25×2 mm Square Hollow Section (KG)",
    category: "Steel & Structural",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 100,
    receipt: 0,
    sent: 50,
    approved: 0,
    reserved: 0,
    closing: 50,
    available: 50,
    minStock: 20,
    date: "2026-11-20"
  },
  {
    id: 13,
    sku: "PRD-00013",
    name: "200W High-Torque BLDC Servo Motor (Parking Barrier Drive)",
    category: "Electrical",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 4,
    receipt: 0,
    sent: 3,
    approved: 0,
    reserved: 0,
    closing: 1,
    available: 1,
    minStock: 8, // LOW STOCK (1 <= 8)
    date: "2026-11-20"
  },
  {
    id: 14,
    sku: "PRD-00014",
    name: "Silicon Insulated Inductive Loop Wire 1.5mm 100m (Roll)",
    category: "Sensors & Telemetry",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 2,
    receipt: 0,
    sent: 2,
    approved: 0,
    reserved: 0,
    closing: 0,
    available: 0,
    minStock: 5, // OUT OF STOCK (0 <= 0)
    date: "2026-11-20"
  },
  {
    id: 15,
    sku: "PRD-00015",
    name: "Optical Limit Switch Sensor for Boom Barrier Arm",
    category: "Sensors & Telemetry",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 5,
    receipt: 1,
    sent: 4,
    approved: 0,
    reserved: 1,
    closing: 2,
    available: 1,
    minStock: 10, // LOW STOCK (1 <= 10)
    date: "2026-11-20"
  },
  {
    id: 16,
    sku: "PRD-00016",
    name: "Emergency Manual Release Key for Barrier Cabinet",
    category: "Spare Parts & Mechanicals",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 3,
    receipt: 0,
    sent: 1,
    approved: 0,
    reserved: 0,
    closing: 2,
    available: 2,
    minStock: 15, // LOW STOCK (2 <= 15)
    date: "2026-11-20"
  },
  {
    id: 17,
    sku: "NNIT-ABB-PRO4",
    name: "Automatic Boom Barrier Pro 4M (Finished)",
    category: "Barriers & Access Hardware",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 12,
    receipt: 10,
    sent: 2,
    approved: 0,
    reserved: 2,
    closing: 20,
    available: 18,
    minStock: 5,
    date: "2026-11-20"
  },
  {
    id: 18,
    sku: "NNIT-ABB-FASTAG",
    name: "Fastag Integrated Boom Barrier Kit (Finished)",
    category: "Barriers & Access Hardware",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 4,
    receipt: 0,
    sent: 1,
    approved: 0,
    reserved: 1,
    closing: 3,
    available: 2,
    minStock: 3, // LOW STOCK (2 <= 3)
    date: "2026-11-20"
  },
  {
    id: 19,
    sku: "CMP-BARRIER-CABINET",
    name: "Heavy-Duty Barrier Cabinet IP65 (Orange/Grey)",
    category: "Barriers & Access Hardware",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 28,
    receipt: 20,
    sent: 5,
    approved: 0,
    reserved: 5,
    closing: 43,
    available: 38,
    minStock: 10,
    date: "2026-11-20"
  },
  {
    id: 20,
    sku: "CMP-BOOM-ARM-4M",
    name: "Octagonal Aluminium Boom Arm 4-Meter",
    category: "Barriers & Access Hardware",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 45,
    receipt: 20,
    sent: 8,
    approved: 0,
    reserved: 8,
    closing: 57,
    available: 49,
    minStock: 15,
    date: "2026-11-20"
  },
  {
    id: 21,
    sku: "CMP-BLDC-CTRL-V3",
    name: "Smart BLDC Motherboard Controller V3.2",
    category: "Electronic Controllers & PCBs",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 32,
    receipt: 15,
    sent: 4,
    approved: 0,
    reserved: 4,
    closing: 43,
    available: 39,
    minStock: 12,
    date: "2026-11-20"
  },
  {
    id: 22,
    sku: "CMP-DUAL-LOOP-DET",
    name: "Dual Channel Vehicle Loop Detector (LD-200)",
    category: "Sensors & Telemetry",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 50,
    receipt: 20,
    sent: 6,
    approved: 0,
    reserved: 6,
    closing: 64,
    available: 58,
    minStock: 20,
    date: "2026-11-20"
  },
  {
    id: 23,
    sku: "CMP-UHF-RFID-12DBI",
    name: "12dBi Long Range UHF RFID Reader (Fastag Compatible)",
    category: "RFID & Fastag Tech",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 8,
    receipt: 0,
    sent: 3,
    approved: 0,
    reserved: 3,
    closing: 5,
    available: 2,
    minStock: 6, // LOW STOCK (2 <= 6)
    date: "2026-11-20"
  },
  {
    id: 24,
    sku: "CMP-IR-PHOTOCELL-PAIR",
    name: "Reflective Safety Photocell Sensor (15m Range)",
    category: "Sensors & Telemetry",
    warehouseId: 1,
    warehouseName: "Central Assembly Plant - Pune",
    opening: 24,
    receipt: 10,
    sent: 2,
    approved: 0,
    reserved: 2,
    closing: 32,
    available: 30,
    minStock: 15,
    date: "2026-11-20"
  }
];

const SEED_PRICE_REVISIONS = [
  {
    sku: "NNIT-ABB-PRO4",
    name: "Automatic Boom Barrier Pro 4M (Finished)",
    initialPrice: 21500,
    currentPrice: 24500,
    revisions: [
      { revNo: 1, date: "2025-01-15", oldPrice: 21500, newPrice: 21500, changeAmount: 0, changePercent: 0, reason: "Initial product launch base rate", changedBy: "Pooja Patil (Procurement)", approvedBy: "Director Ops", refDoc: "PRD-LAUNCH-01" },
      { revNo: 2, date: "2025-06-10", oldPrice: 21500, newPrice: 22800, changeAmount: 1300, changePercent: 6.05, reason: "BLDC motor copper winding & magnet import price surge", changedBy: "Sanjay Verma", approvedBy: "Finance Head", refDoc: "PO-2025-0112" },
      { revNo: 3, date: "2026-01-18", oldPrice: 22800, newPrice: 23600, changeAmount: 800, changePercent: 3.51, reason: "Annual supplier rate contract revision & freight indexation", changedBy: "Sanjay Verma", approvedBy: "Director Ops", refDoc: "PO-2026-0004" },
      { revNo: 4, date: "2026-09-25", oldPrice: 23600, newPrice: 24500, changeAmount: 900, changePercent: 3.81, reason: "Upgraded heavy-duty chassis coating & IP65 seals standard", changedBy: "Amit Kulkarni", approvedBy: "Finance Head", refDoc: "PO-2026-0038" }
    ]
  },
  {
    sku: "NNIT-ABB-FASTAG",
    name: "Fastag Integrated Boom Barrier Kit (Finished)",
    initialPrice: 38000,
    currentPrice: 42000,
    revisions: [
      { revNo: 1, date: "2025-03-10", oldPrice: 38000, newPrice: 38000, changeAmount: 0, changePercent: 0, reason: "Base launch price for FASTag automated barrier kit", changedBy: "Sanjay Verma", approvedBy: "Director Ops", refDoc: "PRD-LAUNCH-02" },
      { revNo: 2, date: "2025-11-14", oldPrice: 38000, newPrice: 40200, changeAmount: 2200, changePercent: 5.79, reason: "UHF RFID Antenna chipset global component supply tightness", changedBy: "Pooja Patil", approvedBy: "Finance Head", refDoc: "PO-2025-0218" },
      { revNo: 3, date: "2026-08-02", oldPrice: 40200, newPrice: 42000, changeAmount: 1800, changePercent: 4.48, reason: "NPCI FASTag certification standard v2.4 protocol hardware upgrade", changedBy: "Sanjay Verma", approvedBy: "Director Ops", refDoc: "PO-2026-0031" }
    ]
  },
  {
    sku: "CMP-BLDC-CTRL-V3",
    name: "Smart BLDC Motherboard Controller V3.2",
    initialPrice: 3900,
    currentPrice: 4800,
    revisions: [
      { revNo: 1, date: "2024-08-20", oldPrice: 3900, newPrice: 3900, changeAmount: 0, changePercent: 0, reason: "Initial release PCB motherboard assembly rate", changedBy: "Ramesh Iyer", approvedBy: "Tech Director", refDoc: "PRD-LAUNCH-03" },
      { revNo: 2, date: "2025-01-05", oldPrice: 3900, newPrice: 4200, changeAmount: 300, changePercent: 7.69, reason: "STM32 microcontroller semiconductor lead-time shortage surcharge", changedBy: "Ramesh Iyer", approvedBy: "Director Ops", refDoc: "PO-2025-0019" },
      { revNo: 3, date: "2025-06-15", oldPrice: 4200, newPrice: 4500, changeAmount: 300, changePercent: 7.14, reason: "Upgraded MOSFET power stage to 60V 50A for thermal durability", changedBy: "Pooja Patil", approvedBy: "Finance Head", refDoc: "PO-2025-0142" },
      { revNo: 4, date: "2026-01-10", oldPrice: 4500, newPrice: 4300, changeAmount: -200, changePercent: -4.44, reason: "Bulk volume price rebate renegotiated with Apex Micro Electronics", changedBy: "Sanjay Verma", approvedBy: "Director Ops", refDoc: "PO-2026-0003" },
      { revNo: 5, date: "2026-09-05", oldPrice: 4300, newPrice: 4800, changeAmount: 500, changePercent: 11.63, reason: "Integrated RS485 opto-isolated telemetry & lightning surge circuit", changedBy: "Ramesh Iyer", approvedBy: "Finance Head", refDoc: "PO-2026-0036" }
    ]
  },
  {
    sku: "CMP-BOOM-ARM-4M",
    name: "Octagonal Aluminium Boom Arm 4-Meter",
    initialPrice: 2600,
    currentPrice: 3200,
    revisions: [
      { revNo: 1, date: "2025-01-15", oldPrice: 2600, newPrice: 2600, changeAmount: 0, changePercent: 0, reason: "Extrusion profile initial catalog cost", changedBy: "Anil Shah", approvedBy: "Director Ops", refDoc: "PRD-LAUNCH-04" },
      { revNo: 2, date: "2025-05-18", oldPrice: 2600, newPrice: 2850, changeAmount: 250, changePercent: 9.62, reason: "Aluminium raw ingot MCX commodity benchmark escalation", changedBy: "Anil Shah", approvedBy: "Finance Head", refDoc: "PO-2025-0098" },
      { revNo: 3, date: "2025-12-01", oldPrice: 2850, newPrice: 3050, changeAmount: 200, changePercent: 7.02, reason: "3M Diamond Grade reflective prismatic stripes addition", changedBy: "Sanjay Verma", approvedBy: "Director Ops", refDoc: "PO-2025-0245" },
      { revNo: 4, date: "2026-07-15", oldPrice: 3050, newPrice: 3200, changeAmount: 150, changePercent: 4.92, reason: "Alloy 6063 T6 tempering die maintenance tolling surcharge", changedBy: "Anil Shah", approvedBy: "Director Ops", refDoc: "PO-2026-0027" }
    ]
  },
  {
    sku: "CMP-BARRIER-CABINET",
    name: "Heavy-Duty Barrier Cabinet IP65 (Orange/Grey)",
    initialPrice: 8400,
    currentPrice: 9500,
    revisions: [
      { revNo: 1, date: "2025-02-01", oldPrice: 8400, newPrice: 8400, changeAmount: 0, changePercent: 0, reason: "Initial sheet metal fabrication rate", changedBy: "Sanjay Verma", approvedBy: "Director Ops", refDoc: "PRD-LAUNCH-05" },
      { revNo: 2, date: "2025-08-10", oldPrice: 8400, newPrice: 8900, changeAmount: 500, changePercent: 5.95, reason: "CRCA 2mm sheet metal and laser cutting price inflation", changedBy: "Pooja Patil", approvedBy: "Finance Head", refDoc: "PO-2025-0165" },
      { revNo: 3, date: "2026-03-12", oldPrice: 8900, newPrice: 9500, changeAmount: 600, changePercent: 6.74, reason: "Dual-coat pure polyester outdoor UV powder-coat treatment", changedBy: "Sanjay Verma", approvedBy: "Director Ops", refDoc: "PO-2026-0012" }
    ]
  },
  {
    sku: "CMP-DUAL-LOOP-DET",
    name: "Dual Channel Vehicle Loop Detector (LD-200)",
    initialPrice: 1650,
    currentPrice: 1850,
    revisions: [
      { revNo: 1, date: "2025-01-05", oldPrice: 1650, newPrice: 1650, changeAmount: 0, changePercent: 0, reason: "Base inductive loop sensor rate", changedBy: "Pooja Patil", approvedBy: "Director Ops", refDoc: "PRD-LAUNCH-06" },
      { revNo: 2, date: "2026-02-20", oldPrice: 1650, newPrice: 1850, changeAmount: 200, changePercent: 12.12, reason: "High-sensitivity frequency tracking microcontroller revision", changedBy: "Pooja Patil", approvedBy: "Finance Head", refDoc: "PO-2026-0008" }
    ]
  },
  {
    sku: "CMP-UHF-RFID-12DBI",
    name: "12dBi Long Range UHF RFID Reader (Fastag Compatible)",
    initialPrice: 12800,
    currentPrice: 14500,
    revisions: [
      { revNo: 1, date: "2025-03-15", oldPrice: 12800, newPrice: 12800, changeAmount: 0, changePercent: 0, reason: "RFID long range reader introductory procurement rate", changedBy: "Ramesh Iyer", approvedBy: "Director Ops", refDoc: "PRD-LAUNCH-07" },
      { revNo: 2, date: "2025-09-20", oldPrice: 12800, newPrice: 13600, changeAmount: 800, changePercent: 6.25, reason: "Circular polarized 12dBi antenna gain & IP67 radome upgrade", changedBy: "Pooja Patil", approvedBy: "Finance Head", refDoc: "PO-2025-0189" },
      { revNo: 3, date: "2026-06-15", oldPrice: 13600, newPrice: 14500, changeAmount: 900, changePercent: 6.62, reason: "Impinj R2000 transceiver chipset import tariff adjustment", changedBy: "Ramesh Iyer", approvedBy: "Director Ops", refDoc: "PO-2026-0024" }
    ]
  },
  {
    sku: "CMP-IR-PHOTOCELL-PAIR",
    name: "Reflective Safety Photocell Sensor (15m Range)",
    initialPrice: 1050,
    currentPrice: 1200,
    revisions: [
      { revNo: 1, date: "2025-01-10", oldPrice: 1050, newPrice: 1050, changeAmount: 0, changePercent: 0, reason: "Safety photocell baseline rate", changedBy: "Pooja Patil", approvedBy: "Director Ops", refDoc: "PRD-LAUNCH-08" },
      { revNo: 2, date: "2026-05-05", oldPrice: 1050, newPrice: 1200, changeAmount: 150, changePercent: 14.29, reason: "Filtered optical lens upgrade for direct sunlight immunity", changedBy: "Pooja Patil", approvedBy: "Finance Head", refDoc: "PO-2026-0021" }
    ]
  },
  {
    sku: "PRD-00006",
    name: "Proximity Sensor 12V DC NPN NO (NOS)",
    initialPrice: 380,
    currentPrice: 450,
    revisions: [
      { revNo: 1, date: "2025-01-12", oldPrice: 380, newPrice: 380, changeAmount: 0, changePercent: 0, reason: "Initial proximity sensor rate", changedBy: "Pooja Patil", approvedBy: "Director Ops", refDoc: "PRD-LAUNCH-09" },
      { revNo: 2, date: "2025-08-18", oldPrice: 380, newPrice: 410, changeAmount: 30, changePercent: 7.89, reason: "Stainless steel threaded barrel casing upgrade", changedBy: "Pooja Patil", approvedBy: "Finance Head", refDoc: "PO-2025-0171" },
      { revNo: 3, date: "2026-04-10", oldPrice: 410, newPrice: 450, changeAmount: 40, changePercent: 9.76, reason: "IP68 water submersible seal compliance", changedBy: "Sanjay Verma", approvedBy: "Director Ops", refDoc: "PO-2026-0017" }
    ]
  },
  {
    sku: "DSP-TRAFFIC-LIGHT-200",
    name: "Red / Green 200mm LED Lane Signal Light (SET)",
    initialPrice: 2400,
    currentPrice: 2800,
    revisions: [
      { revNo: 1, date: "2025-02-10", oldPrice: 2400, newPrice: 2400, changeAmount: 0, changePercent: 0, reason: "Base signal LED rate", changedBy: "Sanjay Verma", approvedBy: "Director Ops", refDoc: "PRD-LAUNCH-10" },
      { revNo: 2, date: "2025-11-12", oldPrice: 2400, newPrice: 2800, changeAmount: 400, changePercent: 16.67, reason: "High-lumen Cree LED diodes with sun hood visor inclusion", changedBy: "Sanjay Verma", approvedBy: "Finance Head", refDoc: "PO-2025-0215" }
    ]
  }
];

const SEED_VENDOR_QUOTES = [
  {
    sku: "NNIT-ABB-PRO4",
    productName: "Automatic Boom Barrier Pro 4M (Finished)",
    ourCost: 24500,
    quotes: [
      { vendorName: "Magnetix Drive Systems Ltd.", rate: 24500, leadTime: "7 Days", warranty: "24 Mos", rating: 4.8, isL1: true },
      { vendorName: "Supreme Automation Corp", rate: 26200, leadTime: "12 Days", warranty: "12 Mos", rating: 4.4, isL1: false },
      { vendorName: "Asian Parking Technologies", rate: 27500, leadTime: "15 Days", warranty: "18 Mos", rating: 4.1, isL1: false },
      { vendorName: "Global Access Hardware", rate: 28900, leadTime: "21 Days", warranty: "24 Mos", rating: 4.6, isL1: false }
    ]
  },
  {
    sku: "NNIT-ABB-FASTAG",
    productName: "Fastag Integrated Boom Barrier Kit (Finished)",
    ourCost: 42000,
    quotes: [
      { vendorName: "SensorTech Electronics India", rate: 42000, leadTime: "5 Days", warranty: "24 Mos", rating: 4.7, isL1: true },
      { vendorName: "Apex Micro Electronics", rate: 44500, leadTime: "10 Days", warranty: "18 Mos", rating: 4.9, isL1: false },
      { vendorName: "TollSys Solutions Ltd", rate: 46800, leadTime: "14 Days", warranty: "12 Mos", rating: 4.2, isL1: false }
    ]
  },
  {
    sku: "CMP-BLDC-CTRL-V3",
    productName: "Smart BLDC Motherboard Controller V3.2",
    ourCost: 4800,
    quotes: [
      { vendorName: "Apex Micro Electronics", rate: 4800, leadTime: "8 Days", warranty: "18 Mos", rating: 4.9, isL1: true },
      { vendorName: "CircuitKraft Taiwan", rate: 5250, leadTime: "14 Days", warranty: "12 Mos", rating: 4.5, isL1: false },
      { vendorName: "MicroTech Embedded Systems", rate: 5600, leadTime: "18 Days", warranty: "12 Mos", rating: 4.3, isL1: false }
    ]
  },
  {
    sku: "CMP-BOOM-ARM-4M",
    productName: "Octagonal Aluminium Boom Arm 4-Meter",
    ourCost: 3200,
    quotes: [
      { vendorName: "Supreme Aluminium Extrusions", rate: 3200, leadTime: "4 Days", warranty: "12 Mos", rating: 4.6, isL1: true },
      { vendorName: "Hind Extrusions Ltd", rate: 3450, leadTime: "7 Days", warranty: "12 Mos", rating: 4.3, isL1: false },
      { vendorName: "MetalCraft Industries", rate: 3700, leadTime: "10 Days", warranty: "6 Mos", rating: 4.1, isL1: false }
    ]
  },
  {
    sku: "CMP-BARRIER-CABINET",
    productName: "Heavy-Duty Barrier Cabinet IP65 (Orange/Grey)",
    ourCost: 9500,
    quotes: [
      { vendorName: "SheetMetal Fab Works", rate: 9500, leadTime: "6 Days", warranty: "24 Mos", rating: 4.5, isL1: true },
      { vendorName: "Enclosure Systems India", rate: 10200, leadTime: "9 Days", warranty: "18 Mos", rating: 4.4, isL1: false },
      { vendorName: "Prime Fabricators", rate: 10800, leadTime: "12 Days", warranty: "12 Mos", rating: 4.0, isL1: false }
    ]
  },
  {
    sku: "CMP-DUAL-LOOP-DET",
    productName: "Dual Channel Vehicle Loop Detector (LD-200)",
    ourCost: 1850,
    quotes: [
      { vendorName: "SensorTech Electronics India", rate: 1850, leadTime: "3 Days", warranty: "24 Mos", rating: 4.8, isL1: true },
      { vendorName: "SafeTraffic Sensors", rate: 2100, leadTime: "7 Days", warranty: "12 Mos", rating: 4.2, isL1: false },
      { vendorName: "AutoLoop Systems Ltd", rate: 2300, leadTime: "10 Days", warranty: "12 Mos", rating: 4.3, isL1: false }
    ]
  },
  {
    sku: "CMP-UHF-RFID-12DBI",
    productName: "12dBi Long Range UHF RFID Reader (Fastag Compatible)",
    ourCost: 14500,
    quotes: [
      { vendorName: "SensorTech Electronics India", rate: 14500, leadTime: "5 Days", warranty: "24 Mos", rating: 4.8, isL1: true },
      { vendorName: "RFID World International", rate: 15800, leadTime: "12 Days", warranty: "18 Mos", rating: 4.6, isL1: false },
      { vendorName: "WaveTech Telemetry", rate: 16500, leadTime: "15 Days", warranty: "12 Mos", rating: 4.2, isL1: false }
    ]
  },
  {
    sku: "CMP-IR-PHOTOCELL-PAIR",
    productName: "Reflective Safety Photocell Sensor (15m Range)",
    ourCost: 1200,
    quotes: [
      { vendorName: "SensorTech Electronics India", rate: 1200, leadTime: "3 Days", warranty: "24 Mos", rating: 4.7, isL1: true },
      { vendorName: "OpticalSens India", rate: 1350, leadTime: "6 Days", warranty: "12 Mos", rating: 4.3, isL1: false },
      { vendorName: "SecureBeam Tech", rate: 1480, leadTime: "8 Days", warranty: "12 Mos", rating: 4.1, isL1: false }
    ]
  },
  {
    sku: "PRD-00006",
    productName: "Proximity Sensor 12V DC NPN NO (NOS)",
    ourCost: 450,
    quotes: [
      { vendorName: "InduSense Automation", rate: 450, leadTime: "3 Days", warranty: "12 Mos", rating: 4.5, isL1: true },
      { vendorName: "Apex Micro Electronics", rate: 490, leadTime: "6 Days", warranty: "18 Mos", rating: 4.9, isL1: false },
      { vendorName: "Omnron Industrial", rate: 540, leadTime: "10 Days", warranty: "12 Mos", rating: 4.3, isL1: false }
    ]
  },
  {
    sku: "DSP-TRAFFIC-LIGHT-200",
    productName: "Red / Green 200mm LED Lane Signal Light (SET)",
    ourCost: 2800,
    quotes: [
      { vendorName: "SignaTech Visuals", rate: 2800, leadTime: "5 Days", warranty: "18 Mos", rating: 4.6, isL1: true },
      { vendorName: "TrafficMaster LED", rate: 3100, leadTime: "8 Days", warranty: "12 Mos", rating: 4.2, isL1: false },
      { vendorName: "OptoVision Systems", rate: 3350, leadTime: "12 Days", warranty: "12 Mos", rating: 4.4, isL1: false }
    ]
  }
];

/* ──────────────────────────────────────────────────────────────────────────
   HELPER UTILITIES TO LOAD & SAVE FROM LOCAL STORAGE
   ────────────────────────────────────────────────────────────────────────── */
function getStored(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function setStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to store key:", key, e);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   INVENTORY SERVICE API IMPLEMENTATION
   ────────────────────────────────────────────────────────────────────────── */
export const InventoryService = {
  // Masters: Categories
  getCategories: () => getStored(STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES),
  saveCategory: (cat) => {
    const list = InventoryService.getCategories();
    let updated;
    if (cat.id) {
      updated = list.map((item) => (item.id === cat.id ? { ...item, ...cat } : item));
    } else {
      const newCat = { ...cat, id: Date.now() };
      updated = [newCat, ...list];
    }
    setStored(STORAGE_KEYS.CATEGORIES, updated);
    return updated;
  },
  deleteCategory: (id) => {
    const list = InventoryService.getCategories().filter((c) => c.id !== id);
    setStored(STORAGE_KEYS.CATEGORIES, list);
    return list;
  },

  // Masters: Subcategories
  getSubCategories: () => getStored(STORAGE_KEYS.SUBCATEGORIES, SEED_SUBCATEGORIES),
  saveSubCategory: (sub) => {
    const list = InventoryService.getSubCategories();
    let updated;
    if (sub.id) {
      updated = list.map((item) => (item.id === sub.id ? { ...item, ...sub } : item));
    } else {
      const newSub = { ...sub, id: Date.now() };
      updated = [newSub, ...list];
    }
    setStored(STORAGE_KEYS.SUBCATEGORIES, updated);
    return updated;
  },
  deleteSubCategory: (id) => {
    const list = InventoryService.getSubCategories().filter((s) => s.id !== id);
    setStored(STORAGE_KEYS.SUBCATEGORIES, list);
    return list;
  },

  // Masters: Brands
  getBrands: () => getStored(STORAGE_KEYS.BRANDS, SEED_BRANDS),
  saveBrand: (b) => {
    const list = InventoryService.getBrands();
    let updated;
    if (b.id) {
      updated = list.map((item) => (item.id === b.id ? { ...item, ...b } : item));
    } else {
      const newB = { ...b, id: Date.now() };
      updated = [newB, ...list];
    }
    setStored(STORAGE_KEYS.BRANDS, updated);
    return updated;
  },
  deleteBrand: (id) => {
    const list = InventoryService.getBrands().filter((b) => b.id !== id);
    setStored(STORAGE_KEYS.BRANDS, list);
    return list;
  },

  // Masters: Units (UOM)
  getUOMs: () => getStored(STORAGE_KEYS.UOMS, SEED_UOMS),
  saveUOM: (u) => {
    const list = InventoryService.getUOMs();
    let updated;
    if (u.id) {
      updated = list.map((item) => (item.id === u.id ? { ...item, ...u } : item));
    } else {
      const newU = { ...u, id: Date.now() };
      updated = [newU, ...list];
    }
    setStored(STORAGE_KEYS.UOMS, updated);
    return updated;
  },
  deleteUOM: (id) => {
    const list = InventoryService.getUOMs().filter((u) => u.id !== id);
    setStored(STORAGE_KEYS.UOMS, list);
    return list;
  },

  // Masters: Warehouses
  getWarehouses: () => getStored(STORAGE_KEYS.WAREHOUSES, SEED_WAREHOUSES),
  saveWarehouse: (wh) => {
    const list = InventoryService.getWarehouses();
    let updated;
    if (wh.id) {
      updated = list.map((item) => (item.id === wh.id ? { ...item, ...wh } : item));
    } else {
      const newWh = { ...wh, id: Date.now() };
      updated = [newWh, ...list];
    }
    setStored(STORAGE_KEYS.WAREHOUSES, updated);
    return updated;
  },
  deleteWarehouse: (id) => {
    const list = InventoryService.getWarehouses().filter((w) => w.id !== id);
    setStored(STORAGE_KEYS.WAREHOUSES, list);
    return list;
  },

  // Masters: Products
  getProducts: () => {
    let list = getStored(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    if (!list || list.length === 0) {
      list = SEED_PRODUCTS;
      setStored(STORAGE_KEYS.PRODUCTS, list);
      return list;
    }
    let modified = false;
    SEED_PRODUCTS.forEach((sp) => {
      const idx = list.findIndex((p) => p.sku === sp.sku);
      if (idx === -1) {
        list.push(sp);
        modified = true;
      }
    });
    if (modified) {
      setStored(STORAGE_KEYS.PRODUCTS, list);
    }
    return list;
  },
  saveProduct: (prod) => {
    const list = InventoryService.getProducts();
    let updated;
    if (prod.id) {
      updated = list.map((item) => (item.id === prod.id ? { ...item, ...prod } : item));
    } else {
      const newProd = {
        ...prod,
        id: Date.now(),
        stocks: prod.stocks || { 1: 10, 2: 5, 3: 2, 4: 0 },
        reserved: prod.reserved || { 1: 0, 2: 0, 3: 0, 4: 0 }
      };
      updated = [newProd, ...list];
    }
    setStored(STORAGE_KEYS.PRODUCTS, updated);
    return updated;
  },
  deleteProduct: (id) => {
    const list = InventoryService.getProducts().filter((p) => p.id !== id);
    setStored(STORAGE_KEYS.PRODUCTS, list);
    return list;
  },

  // Procurement: Vendors
  getVendors: () => getStored(STORAGE_KEYS.VENDORS, SEED_VENDORS),
  saveVendor: (ven) => {
    const list = InventoryService.getVendors();
    let updated;
    if (ven.id) {
      updated = list.map((item) => (item.id === ven.id ? { ...item, ...ven } : item));
    } else {
      const newVen = { ...ven, id: Date.now() };
      updated = [newVen, ...list];
    }
    setStored(STORAGE_KEYS.VENDORS, updated);
    return updated;
  },
  deleteVendor: (id) => {
    const list = InventoryService.getVendors().filter((v) => v.id !== id);
    setStored(STORAGE_KEYS.VENDORS, list);
    return list;
  },

  // Procurement: Material Requisition
  getRequisitions: () => getStored(STORAGE_KEYS.REQUISITIONS, SEED_REQUISITIONS),
  saveRequisition: (mr) => {
    const list = InventoryService.getRequisitions();
    let updated;
    if (mr.id) {
      updated = list.map((item) => (item.id === mr.id ? { ...item, ...mr } : item));
    } else {
      const newMr = {
        ...mr,
        id: Date.now(),
        mrNumber: `MR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        requestDate: new Date().toISOString().split("T")[0],
        status: mr.status || "Pending"
      };
      updated = [newMr, ...list];
    }
    setStored(STORAGE_KEYS.REQUISITIONS, updated);
    return updated;
  },
  updateRequisitionStatus: (id, status) => {
    const list = InventoryService.getRequisitions().map((mr) => (mr.id === id ? { ...mr, status } : mr));
    setStored(STORAGE_KEYS.REQUISITIONS, list);
    return list;
  },

  // Procurement: Purchase Orders
  getPurchaseOrders: () => getStored(STORAGE_KEYS.PURCHASE_ORDERS, SEED_PURCHASE_ORDERS),
  savePurchaseOrder: (po) => {
    const list = InventoryService.getPurchaseOrders();
    let updated;
    if (po.id) {
      updated = list.map((item) => (item.id === po.id ? { ...item, ...po } : item));
    } else {
      const newPo = {
        ...po,
        id: Date.now(),
        poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        orderDate: new Date().toISOString().split("T")[0],
        status: po.status || "Sent to Vendor"
      };
      updated = [newPo, ...list];
    }
    setStored(STORAGE_KEYS.PURCHASE_ORDERS, updated);
    return updated;
  },

  // Procurement: GRN (Goods Receipt Note)
  getGRNs: () => getStored(STORAGE_KEYS.GRNS, SEED_GRNS),
  saveGRN: (grn) => {
    const list = InventoryService.getGRNs();
    const newGrn = {
      ...grn,
      id: Date.now(),
      grnNumber: `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedDate: new Date().toISOString().split("T")[0],
      status: "Verified & Stored"
    };
    const updated = [newGrn, ...list];
    setStored(STORAGE_KEYS.GRNS, updated);

    // Auto increment stock in warehouse & stock records!
    const products = InventoryService.getProducts();
    const whId = grn.warehouseId || 1;
    grn.items?.forEach((item) => {
      const p = products.find((prod) => prod.sku === item.sku);
      const qty = Number(item.acceptedQty) || Number(item.receivedQty) || 0;
      if (p) {
        p.stocks = p.stocks || {};
        p.stocks[whId] = (Number(p.stocks[whId]) || 0) + qty;
      }
      InventoryService.adjustStockMovement(item.sku, { receiptDelta: qty, warehouseId: whId });
    });
    setStored(STORAGE_KEYS.PRODUCTS, products);

    // If linked to PO, mark PO completed/partially received
    if (grn.poNumber) {
      const pos = InventoryService.getPurchaseOrders().map((po) => {
        if (po.poNumber === grn.poNumber) {
          return { ...po, status: "Completed" };
        }
        return po;
      });
      setStored(STORAGE_KEYS.PURCHASE_ORDERS, pos);
    }

    return updated;
  },

  // Material Movement: MTN
  getMTNs: () => getStored(STORAGE_KEYS.MTNS, SEED_MTNS),
  saveMTN: (mtn) => {
    const list = InventoryService.getMTNs();
    const newMtn = {
      ...mtn,
      id: Date.now(),
      mtnNumber: `MTN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split("T")[0],
      status: mtn.status || "In Transit"
    };
    const updated = [newMtn, ...list];
    setStored(STORAGE_KEYS.MTNS, updated);
    return updated;
  },

  // Material Movement: Delivery Challan
  getDeliveryChallans: () => getStored(STORAGE_KEYS.DELIVERY_CHALLANS, SEED_DELIVERY_CHALLANS),
  saveDeliveryChallan: (dc) => {
    const list = InventoryService.getDeliveryChallans();
    const newDc = {
      ...dc,
      id: Date.now(),
      dcNumber: `DC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      dispatchDate: new Date().toISOString().split("T")[0],
      status: "Dispatched"
    };
    const updated = [newDc, ...list];
    setStored(STORAGE_KEYS.DELIVERY_CHALLANS, updated);

    // Deduct warehouse stock on dispatch & update stock records!
    const products = InventoryService.getProducts();
    const whId = dc.dispatchWarehouseId || 1;
    dc.items?.forEach((item) => {
      const p = products.find((prod) => prod.sku === item.sku);
      const qty = Number(item.qty) || 0;
      if (p) {
        p.stocks = p.stocks || {};
        p.stocks[whId] = Math.max(0, (Number(p.stocks[whId]) || 0) - qty);
      }
      InventoryService.adjustStockMovement(item.sku, { sentDelta: qty, warehouseId: whId });
    });
    setStored(STORAGE_KEYS.PRODUCTS, products);

    return updated;
  },

  // Material Movement: Material Return
  getMaterialReturns: () => getStored(STORAGE_KEYS.MATERIAL_RETURNS, SEED_RETURNS),
  saveMaterialReturn: (mr) => {
    const list = InventoryService.getMaterialReturns();
    const newReturn = {
      ...mr,
      id: Date.now(),
      returnNumber: `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      returnDate: new Date().toISOString().split("T")[0],
      status: "Restocked"
    };
    const updated = [newReturn, ...list];
    setStored(STORAGE_KEYS.MATERIAL_RETURNS, updated);

    // Restock back to warehouse
    const products = InventoryService.getProducts();
    const whId = mr.receivingWarehouseId || 1;
    mr.items?.forEach((item) => {
      const p = products.find((prod) => prod.sku === item.sku);
      if (p) {
        p.stocks = p.stocks || {};
        p.stocks[whId] = (Number(p.stocks[whId]) || 0) + (Number(item.qty) || 0);
      }
    });
    setStored(STORAGE_KEYS.PRODUCTS, products);

    return updated;
  },

  // Material Movement: Stock Adjustment
  getStockAdjustments: () => getStored(STORAGE_KEYS.STOCK_ADJUSTMENTS, SEED_ADJUSTMENTS),
  saveStockAdjustment: (adj) => {
    const list = InventoryService.getStockAdjustments();
    const newAdj = {
      ...adj,
      id: Date.now(),
      adjNumber: `ADJ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split("T")[0],
    };
    const updated = [newAdj, ...list];
    setStored(STORAGE_KEYS.STOCK_ADJUSTMENTS, updated);

    // Apply physical count adjustments to warehouse stock
    const products = InventoryService.getProducts();
    const whId = adj.warehouseId || 1;
    adj.items?.forEach((item) => {
      const p = products.find((prod) => prod.sku === item.sku);
      if (p) {
        p.stocks = p.stocks || {};
        p.stocks[whId] = Math.max(0, Number(item.physicalQty) || 0);
      }
    });
    setStored(STORAGE_KEYS.PRODUCTS, products);

    return updated;
  },

  // BOM (Bill of Materials)
  getBOMs: () => getStored(STORAGE_KEYS.BOMS, SEED_BOMS),
  saveBOM: (bom) => {
    const list = InventoryService.getBOMs();
    let updated;
    if (bom.id) {
      updated = list.map((b) => {
        if (b.id !== bom.id) return b;

        const matCost = (bom.components || []).reduce(
          (acc, c) => acc + (Number(c.qty) || 0) * (Number(c.unitCost) || 0),
          0
        );
        const labCost = Number(bom.laborCost) || 0;
        const totCost = matCost + labCost;

        const existingVersions = Array.isArray(b.versions) && b.versions.length > 0
          ? [...b.versions]
          : [
              {
                id: 1,
                versionNo: "V1",
                is_active: true,
                createdAt: b.createdAt || "2026-08-01",
                changedBy: "Engineering Team",
                changeReason: "Initial standard baseline release",
                laborCost: Number(b.laborCost) || 0,
                materialCost: (b.components || []).reduce(
                  (acc, c) => acc + (Number(c.qty) || 0) * (Number(c.unitCost) || 0),
                  0
                ),
                totalCost:
                  (b.components || []).reduce(
                    (acc, c) => acc + (Number(c.qty) || 0) * (Number(c.unitCost) || 0),
                    0
                  ) + (Number(b.laborCost) || 0),
                componentsCount: b.components?.length || 0,
                components: b.components || []
              }
            ];

        // Kitni bar change kiya hai -> Automatic version increment: V1 -> V2 -> V3...
        const nextNum = existingVersions.length + 1;
        const newVersionNo = `V${nextNum}`;

        const deactiveVersions = existingVersions.map((v) => ({ ...v, is_active: false }));

        const newVersionEntry = {
          id: Date.now(),
          versionNo: newVersionNo,
          is_active: true,
          createdAt: new Date().toISOString().split("T")[0],
          changedBy: bom.changedBy || "Engineering Team",
          changeReason:
            bom.changeReason ||
            `Revision V${nextNum} - Updated BOM specifications & components`,
          laborCost: labCost,
          materialCost: matCost,
          totalCost: totCost,
          componentsCount: (bom.components || []).length,
          components: bom.components || []
        };

        return {
          ...b,
          ...bom,
          version: newVersionNo,
          updatedAt: new Date().toISOString().split("T")[0],
          versions: [newVersionEntry, ...deactiveVersions]
        };
      });
    } else {
      const matCost = (bom.components || []).reduce(
        (acc, c) => acc + (Number(c.qty) || 0) * (Number(c.unitCost) || 0),
        0
      );
      const labCost = Number(bom.laborCost) || 0;
      const initialVer = "V1";
      const initialVersionEntry = {
        id: Date.now(),
        versionNo: initialVer,
        is_active: true,
        createdAt: new Date().toISOString().split("T")[0],
        changedBy: bom.changedBy || "Engineering Team",
        changeReason: bom.changeReason || "Initial production BOM release",
        laborCost: labCost,
        materialCost: matCost,
        totalCost: matCost + labCost,
        componentsCount: (bom.components || []).length,
        components: bom.components || []
      };

      const newBom = {
        ...bom,
        id: Date.now(),
        bomNumber: bom.bomNumber || `BOM-ABB-${Math.floor(100 + Math.random() * 900)}`,
        version: initialVer,
        status: bom.status || "Active",
        createdAt: new Date().toISOString().split("T")[0],
        versions: [initialVersionEntry]
      };
      updated = [newBom, ...list];
    }
    setStored(STORAGE_KEYS.BOMS, updated);
    return updated;
  },
  restoreBOMVersion: (bomId, versionId) => {
    const list = InventoryService.getBOMs();
    const updated = list.map((b) => {
      if (b.id !== bomId) return b;
      const targetVersion = (b.versions || []).find((v) => v.id === versionId);
      if (!targetVersion) return b;

      const nextNum = (b.versions || []).length + 1;
      const newVersionNo = `V${nextNum}`;
      const deactiveVersions = (b.versions || []).map((v) => ({ ...v, is_active: false }));
      const newVersionEntry = {
        id: Date.now(),
        versionNo: newVersionNo,
        is_active: true,
        createdAt: new Date().toISOString().split("T")[0],
        changedBy: "Engineering Team",
        changeReason: `Restored previous recipe from revision ${targetVersion.versionNo}`,
        laborCost: targetVersion.laborCost || 0,
        materialCost: targetVersion.materialCost || 0,
        totalCost: targetVersion.totalCost || 0,
        componentsCount: targetVersion.componentsCount || targetVersion.components?.length || 0,
        components: targetVersion.components || []
      };

      return {
        ...b,
        version: newVersionNo,
        laborCost: targetVersion.laborCost || 0,
        components: targetVersion.components || [],
        versions: [newVersionEntry, ...deactiveVersions]
      };
    });
    setStored(STORAGE_KEYS.BOMS, updated);
    return updated;
  },
  deleteBOM: (id) => {
    const list = InventoryService.getBOMs().filter((b) => b.id !== id);
    setStored(STORAGE_KEYS.BOMS, list);
    return list;
  },

  // BOM Availability & Shortage Checker
  checkBOMAvailability: (bomId, unitsToProduce = 1, warehouseId = null) => {
    const bom = InventoryService.getBOMs().find((b) => b.id === Number(bomId));
    if (!bom) return null;

    const products = InventoryService.getProducts();
    let hasShortage = false;

    const lines = bom.components.map((comp) => {
      const prod = products.find((p) => p.sku === comp.sku);
      const reqQty = comp.qty * unitsToProduce;

      let availableQty = 0;
      if (prod && prod.stocks) {
        if (warehouseId) {
          const onHand = Number(prod.stocks[warehouseId]) || 0;
          const res = Number(prod.reserved?.[warehouseId]) || 0;
          availableQty = Math.max(0, onHand - res);
        } else {
          // Total across all warehouses
          const totalOnHand = Object.values(prod.stocks).reduce((sum, v) => sum + (Number(v) || 0), 0);
          const totalRes = prod.reserved ? Object.values(prod.reserved).reduce((sum, v) => sum + (Number(v) || 0), 0) : 0;
          availableQty = Math.max(0, totalOnHand - totalRes);
        }
      }

      const shortage = Math.max(0, reqQty - availableQty);
      if (shortage > 0) hasShortage = true;

      return {
        sku: comp.sku,
        name: comp.name,
        uom: comp.uom || "PCS",
        unitCost: comp.unitCost || 0,
        qtyPerUnit: comp.qty,
        totalRequired: reqQty,
        availableStock: availableQty,
        shortageQty: shortage,
        status: shortage > 0 ? "Shortage" : "Available"
      };
    });

    const maxAssemblable = lines.length > 0
      ? Math.min(...lines.map((c) => Math.floor(c.availableStock / Math.max(0.01, c.qtyPerUnit))))
      : 0;

    const bottleneck = lines.length > 0
      ? lines.reduce((prev, curr) => {
          const prevRatio = prev.availableStock / Math.max(0.01, prev.qtyPerUnit);
          const currRatio = curr.availableStock / Math.max(0.01, curr.qtyPerUnit);
          return currRatio < prevRatio ? curr : prev;
        }, lines[0])
      : null;

    const shortageLines = lines.filter((c) => c.shortageQty > 0);
    const readinessScore = lines.length > 0
      ? Math.round(((lines.length - shortageLines.length) / lines.length) * 100)
      : 100;

    return {
      bomId: bom.id,
      bomNumber: bom.bomNumber,
      bomName: bom.name,
      finishedProductName: bom.finishedProductName,
      finishedProductSku: bom.finishedProductSku,
      unitsRequested: unitsToProduce,
      canAssemble: !hasShortage,
      maxAssemblableUnits: Math.max(0, maxAssemblable),
      bottleneckComponent: bottleneck,
      shortageCount: shortageLines.length,
      readinessScore,
      components: lines,
      estimatedProductionCost: lines.reduce((acc, c) => acc + c.totalRequired * c.unitCost, 0)
    };
  },

  // Stock Summary with filter
  getStockSummary: (warehouseId = "all", categoryFilter = "all", statusFilter = "all", search = "") => {
    const products = InventoryService.getProducts();
    const warehouses = InventoryService.getWarehouses();

    let list = [];

    products.forEach((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return;
      }

      if (warehouseId === "all") {
        const totalOnHand = Object.values(p.stocks || {}).reduce((s, v) => s + (Number(v) || 0), 0);
        const totalReserved = Object.values(p.reserved || {}).reduce((s, v) => s + (Number(v) || 0), 0);
        const available = Math.max(0, totalOnHand - totalReserved);
        const reorder = Number(p.minStock) || 5;

        let status = "In Stock";
        if (available <= 0) status = "Out of Stock";
        else if (available <= reorder) status = "Low Stock";

        if (statusFilter !== "all" && status !== statusFilter) return;

        list.push({
          id: p.id,
          sku: p.sku,
          name: p.name,
          itemType: p.itemType,
          category: p.category,
          subCategory: p.subCategory,
          brand: p.brand,
          uom: p.uom,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          warehouseName: "All Warehouses",
          onHandQty: totalOnHand,
          reservedQty: totalReserved,
          availableQty: available,
          minStock: reorder,
          status,
          totalValuation: available * p.costPrice
        });
      } else {
        const wh = warehouses.find((w) => String(w.id) === String(warehouseId));
        const onHand = Number(p.stocks?.[warehouseId]) || 0;
        const res = Number(p.reserved?.[warehouseId]) || 0;
        const available = Math.max(0, onHand - res);
        const reorder = Number(p.minStock) || 5;

        let status = "In Stock";
        if (available <= 0) status = "Out of Stock";
        else if (available <= reorder) status = "Low Stock";

        if (statusFilter !== "all" && status !== statusFilter) return;

        list.push({
          id: p.id,
          sku: p.sku,
          name: p.name,
          itemType: p.itemType,
          category: p.category,
          subCategory: p.subCategory,
          brand: p.brand,
          uom: p.uom,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          warehouseName: wh ? wh.name : `Warehouse #${warehouseId}`,
          onHandQty: onHand,
          reservedQty: res,
          availableQty: available,
          minStock: reorder,
          status,
          totalValuation: available * p.costPrice
        });
      }
    });

    return list;
  },

  // Stock Records (Opening + Receipt - Sent = Closing; Available = Closing - Reserved)
  getStockRecords: (warehouseId = "all", categoryFilter = "all", search = "", date = "", statusFilter = "all") => {
    let records = getStored(STORAGE_KEYS.STOCK_RECORDS, SEED_STOCK_RECORDS);
    if (!records || records.length === 0) {
      records = SEED_STOCK_RECORDS;
      setStored(STORAGE_KEYS.STOCK_RECORDS, records);
    }

    return records
      .map((r) => {
        const opening = Number(r.opening) || 0;
        const receipt = Number(r.receipt) || 0;
        const sent = Number(r.sent) || 0;
        const approved = Number(r.approved) || 0;
        const reserved = Number(r.reserved) || 0;
        const closing = Number((opening + receipt - sent).toFixed(2));
        const available = Number((closing - reserved).toFixed(2));
        const minStock = Number(r.minStock) || 5;

        let status = "In Stock";
        if (available <= 0) status = "Out of Stock";
        else if (available <= minStock) status = "Low Stock";

        return {
          ...r,
          opening,
          receipt,
          sent,
          approved,
          reserved,
          closing,
          available,
          minStock,
          status
        };
      })
      .filter((r) => {
        if (warehouseId !== "all" && String(r.warehouseId) !== String(warehouseId)) return false;
        if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          const matchName = r.name && r.name.toLowerCase().includes(q);
          const matchSku = r.sku && r.sku.toLowerCase().includes(q);
          const matchCat = r.category && r.category.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchCat) return false;
        }
        if (date && r.date && r.date !== date) {
          return false;
        }
        return true;
      })
      .map((r, idx) => ({
        ...r,
        sr: idx + 1
      }));
  },

  saveStockRecord: (record) => {
    const list = getStored(STORAGE_KEYS.STOCK_RECORDS, SEED_STOCK_RECORDS);
    let updated;
    if (record.id) {
      updated = list.map((item) => (item.id === record.id ? { ...item, ...record } : item));
    } else {
      const newRec = {
        ...record,
        id: Date.now(),
        date: record.date || new Date().toISOString().split("T")[0]
      };
      updated = [newRec, ...list];
    }
    setStored(STORAGE_KEYS.STOCK_RECORDS, updated);
    return updated;
  },

  adjustStockMovement: (sku, { opening, receiptDelta, sentDelta, approvedDelta, reservedDelta, warehouseId }) => {
    const list = getStored(STORAGE_KEYS.STOCK_RECORDS, SEED_STOCK_RECORDS);
    let matched = false;
    const updated = list.map((item) => {
      if (item.sku === sku) {
        matched = true;
        const newOpening = opening !== undefined ? Number(opening) : Number(item.opening || 0);
        const newReceipt = receiptDelta !== undefined ? Number(item.receipt || 0) + Number(receiptDelta) : Number(item.receipt || 0);
        const newSent = sentDelta !== undefined ? Number(item.sent || 0) + Number(sentDelta) : Number(item.sent || 0);
        const newApproved = approvedDelta !== undefined ? Number(item.approved || 0) + Number(approvedDelta) : Number(item.approved || 0);
        const newReserved = reservedDelta !== undefined ? Number(item.reserved || 0) + Number(reservedDelta) : Number(item.reserved || 0);
        const closing = Number((newOpening + newReceipt - newSent).toFixed(2));
        const available = Number((closing - newReserved).toFixed(2));

        return {
          ...item,
          opening: newOpening,
          receipt: newReceipt,
          sent: newSent,
          approved: newApproved,
          reserved: newReserved,
          closing,
          available,
          warehouseId: warehouseId || item.warehouseId
        };
      }
      return item;
    });

    if (!matched) {
      // If product not yet in stock records list, add it
      const products = InventoryService.getProducts();
      const p = products.find((pr) => pr.sku === sku);
      const newOpening = opening !== undefined ? Number(opening) : 0;
      const newReceipt = receiptDelta !== undefined ? Number(receiptDelta) : 0;
      const newSent = sentDelta !== undefined ? Number(sentDelta) : 0;
      const newApproved = approvedDelta !== undefined ? Number(approvedDelta) : 0;
      const newReserved = reservedDelta !== undefined ? Number(reservedDelta) : 0;
      const closing = Number((newOpening + newReceipt - newSent).toFixed(2));
      const available = Number((closing - newReserved).toFixed(2));

      updated.push({
        id: Date.now(),
        sku,
        name: p ? p.name : sku,
        category: p ? p.category : "General",
        warehouseId: warehouseId || 1,
        warehouseName: "Central Assembly Plant - Pune",
        opening: newOpening,
        receipt: newReceipt,
        sent: newSent,
        approved: newApproved,
        reserved: newReserved,
        closing,
        available,
        date: new Date().toISOString().split("T")[0]
      });
    }

    setStored(STORAGE_KEYS.STOCK_RECORDS, updated);
    return updated;
  },

  // Telemetry Aggregates for Dashboard
  getTelemetry: () => {
    const products = InventoryService.getProducts();
    const pos = InventoryService.getPurchaseOrders();
    const grns = InventoryService.getGRNs();
    const requisitions = InventoryService.getRequisitions();
    const boms = InventoryService.getBOMs();
    const warehouses = InventoryService.getWarehouses();

    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalItemsTracked = products.length;

    products.forEach((p) => {
      const totalAvailable = Object.values(p.stocks || {}).reduce((s, v) => s + (Number(v) || 0), 0);
      totalValuation += totalAvailable * (Number(p.costPrice) || 0);
      if (totalAvailable <= 0) outOfStockCount++;
      else if (totalAvailable <= (Number(p.minStock) || 5)) lowStockCount++;
    });

    const activePOs = pos.filter((po) => po.status !== "Completed" && po.status !== "Cancelled").length;
    const pendingMRs = requisitions.filter((mr) => mr.status === "Pending").length;

    return {
      totalValuation,
      totalItemsTracked,
      lowStockCount,
      outOfStockCount,
      activePOs,
      totalGRNs: grns.length,
      pendingMRs,
      totalBOMs: boms.length,
      totalWarehouses: warehouses.length
    };
  },

  // ── Price Revisions & Change Tracking ──
  getAllPriceRevisions: () => {
    const stored = getStored(STORAGE_KEYS.PRICE_REVISIONS, SEED_PRICE_REVISIONS);
    const products = InventoryService.getProducts();

    const map = new Map(stored.map((item) => [item.sku, item]));
    const merged = products.map((prod) => {
      const existing = map.get(prod.sku);
      if (existing) {
        return {
          ...existing,
          name: prod.name,
          category: prod.category,
          uom: prod.uom,
          currentPrice: Number(prod.costPrice) || existing.currentPrice,
          revisionCount: existing.revisions.length
        };
      }
      const baseRev = {
        revNo: 1,
        date: "2026-01-01",
        oldPrice: prod.costPrice,
        newPrice: prod.costPrice,
        changeAmount: 0,
        changePercent: 0,
        reason: "Initial baseline catalogue rate",
        changedBy: "Procurement Team",
        approvedBy: "Director Ops",
        refDoc: "BASE-01"
      };
      return {
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        uom: prod.uom,
        initialPrice: prod.costPrice,
        currentPrice: prod.costPrice,
        revisionCount: 1,
        revisions: [baseRev]
      };
    });

    return merged;
  },

  getPriceRevisionsBySku: (sku) => {
    const all = InventoryService.getAllPriceRevisions();
    return all.find((item) => item.sku === sku) || null;
  },

  addPriceRevision: ({ sku, newPrice, reason, changedBy, approvedBy, refDoc, date }) => {
    const list = getStored(STORAGE_KEYS.PRICE_REVISIONS, SEED_PRICE_REVISIONS);
    const parsedPrice = parseFloat(newPrice) || 0;
    const revDate = date || new Date().toISOString().split("T")[0];

    let found = false;
    const updated = list.map((item) => {
      if (item.sku === sku) {
        found = true;
        const currentOldPrice = item.revisions[item.revisions.length - 1]?.newPrice || item.currentPrice;
        const changeAmount = Number((parsedPrice - currentOldPrice).toFixed(2));
        const changePercent = currentOldPrice > 0 ? Number(((changeAmount / currentOldPrice) * 100).toFixed(2)) : 0;
        const newRev = {
          revNo: item.revisions.length + 1,
          date: revDate,
          oldPrice: currentOldPrice,
          newPrice: parsedPrice,
          changeAmount,
          changePercent,
          reason: reason || "Market price review",
          changedBy: changedBy || "Procurement Manager",
          approvedBy: approvedBy || "Director Operations",
          refDoc: refDoc || `REV-${Date.now().toString().slice(-4)}`
        };
        return {
          ...item,
          currentPrice: parsedPrice,
          revisions: [...item.revisions, newRev]
        };
      }
      return item;
    });

    if (!found) {
      const prod = InventoryService.getProducts().find((p) => p.sku === sku);
      const newEntry = {
        sku,
        name: prod ? prod.name : sku,
        initialPrice: parsedPrice,
        currentPrice: parsedPrice,
        revisions: [
          {
            revNo: 1,
            date: revDate,
            oldPrice: parsedPrice,
            newPrice: parsedPrice,
            changeAmount: 0,
            changePercent: 0,
            reason: reason || "Initial baseline rate",
            changedBy: changedBy || "Procurement Manager",
            approvedBy: approvedBy || "Director Operations",
            refDoc: refDoc || "REV-01"
          }
        ]
      };
      updated.push(newEntry);
    }

    setStored(STORAGE_KEYS.PRICE_REVISIONS, updated);

    // Also update product's costPrice in Products master!
    const products = InventoryService.getProducts();
    const updatedProducts = products.map((p) => {
      if (p.sku === sku) {
        return { ...p, costPrice: parsedPrice };
      }
      return p;
    });
    setStored(STORAGE_KEYS.PRODUCTS, updatedProducts);

    return updated;
  },

  // ── Multi-Vendor Quotes & Price Comparison ──
  getAllVendorQuotes: () => {
    return getStored(STORAGE_KEYS.VENDOR_QUOTES, SEED_VENDOR_QUOTES);
  },

  getVendorQuotesBySku: (sku) => {
    const all = InventoryService.getAllVendorQuotes();
    return all.find((item) => item.sku === sku) || null;
  },

  // Aggregated Price Comparison & Revision Intelligence Data
  getPriceComparisonIntelligence: () => {
    const revisions = InventoryService.getAllPriceRevisions();
    const quotes = InventoryService.getAllVendorQuotes();
    const quotesMap = new Map(quotes.map((q) => [q.sku, q]));

    let totalRevisionsLogged = 0;
    let highestRevisionProduct = null;
    let maxRevisions = 0;
    let totalSavingsAcrossCatalog = 0;
    let savingsCount = 0;

    const enrichedProducts = revisions.map((item) => {
      const quoteData = quotesMap.get(item.sku);
      totalRevisionsLogged += item.revisions.length;

      if (item.revisions.length > maxRevisions) {
        maxRevisions = item.revisions.length;
        highestRevisionProduct = item;
      }

      const qList = quoteData?.quotes || [];
      const rates = qList.map((q) => q.rate);
      const minRate = rates.length > 0 ? Math.min(...rates) : item.currentPrice;
      const maxRate = rates.length > 0 ? Math.max(...rates) : item.currentPrice;
      const savings = maxRate - minRate;
      const savingsPercent = maxRate > 0 ? Number(((savings / maxRate) * 100).toFixed(1)) : 0;

      if (savings > 0) {
        totalSavingsAcrossCatalog += savings;
        savingsCount++;
      }

      const firstPrice = item.revisions[0]?.oldPrice || item.initialPrice || item.currentPrice;
      const lifetimeChange = item.currentPrice - firstPrice;
      const lifetimePercent = firstPrice > 0 ? Number(((lifetimeChange / firstPrice) * 100).toFixed(1)) : 0;

      return {
        ...item,
        initialPrice: firstPrice,
        revisionCount: item.revisions.length,
        lifetimeChange,
        lifetimePercent,
        vendorQuotes: qList,
        l1Rate: minRate,
        highestQuote: maxRate,
        savings,
        savingsPercent
      };
    });

    const avgSavingsPercent =
      savingsCount > 0 ? Number((totalSavingsAcrossCatalog / (savingsCount * 1000)).toFixed(1)) : 8.5;

    return {
      products: enrichedProducts,
      kpis: {
        totalRevisionsLogged,
        avgRevisionsPerProduct: (totalRevisionsLogged / (enrichedProducts.length || 1)).toFixed(1),
        highestRevisionProduct: highestRevisionProduct ? {
          name: highestRevisionProduct.name,
          sku: highestRevisionProduct.sku,
          count: maxRevisions
        } : null,
        totalSavingsAcrossCatalog,
        avgSavingsPercent
      }
    };
  }
};
