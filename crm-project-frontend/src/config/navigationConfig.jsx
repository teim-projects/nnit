import React from "react";
import {
  LayoutDashboard,
  Box,
  Tag,
  Scale,
  Warehouse,
  Factory,
  ClipboardList,
  ShoppingCart,
  CheckCircle2,
  Package,
  Truck,
  RotateCcw,
  ArrowRightLeft,
  Sliders,
  Layers,
  FileText,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  IndianRupee,
  GitBranch,
  PlusSquare,
} from "lucide-react";

/* --------------------------------------------------------------------------
   STANDARD SIDEBAR SVG ICONS
   -------------------------------------------------------------------------- */
export function HomeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TargetIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21 3l-4.35 4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function UserIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 20a6.5 6.5 0 0113 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BuildingIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7h.01M16 7h.01M8 11h.01M16 11h.01M8 15h.01M16 15h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function QuoteIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M9 7h6v6H9zM3 7h6v6H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FollowupIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AmcIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ParkingIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8h4a3 3 0 110 6H8V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8v11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DocumentIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ReportIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="10" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="6" width="4" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="17" y="2" width="4" height="19" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShieldLockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function WrenchIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheckCircle(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ isOpen = false }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${
        isOpen ? "rotate-0 text-indigo-600" : "-rotate-90 text-slate-400"
      }`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   TOP-LEVEL DASHBOARD ITEM
   -------------------------------------------------------------------------- */
export const DASHBOARD_ITEM = {
  key: "dashboard",
  label: "Dashboard & Telemetry",
  description: "View system telemetry, analytics, and overview charts",
  path: "/dashboard",
  icon: HomeIcon,
  section: "DASHBOARD",
};

/* --------------------------------------------------------------------------
   SIDEBAR NAVIGATION SECTIONS
   ==========================================================================
   💡 JAB BHI KOI NEW BUTTON / LINK SIDEBAR ME ADD KARNA HO:
   Bas yahan SIDEBAR_SECTIONS me add karein!
   Yeh AUTOMATICALLY:
   1. Sidebar menu me dikhega.
   2. Role & Access Control Management (/role-access) permission matrix me aayega.
   3. useModulePermissions(key) se automatically integrate hoga.
   ========================================================================== */
export const SIDEBAR_SECTIONS = [
  {
    key: "sales",
    label: "SALES",
    children: [
      {
        key: "leads",
        label: "Lead Management",
        description: "Create, view, edit, and manage sales leads",
        icon: TargetIcon,
        path: "/leads",
      },
      {
        key: "followups",
        label: "Follow-up Management",
        description: "Schedule and manage customer follow-ups and calls",
        icon: FollowupIcon,
        path: "/followup-management",
      },
      {
        key: "quotations",
        label: "Quotations",
        description: "Generate, revise, and send quotation PDFs to customers",
        icon: QuoteIcon,
        path: "/quotation",
      },
      {
        key: "products",
        label: "Product Master",
        description: "Manage parking product models, specifications, and pricing",
        icon: ParkingIcon,
        path: "/parking-products",
      },
      {
        key: "customers",
        label: "Customers",
        description: "Customer directory, client history, and contact details",
        icon: UserIcon,
        path: "/customer",
      },
    ],
  },
  {
    key: "design",
    label: "DESIGN & DRAWINGS",
    children: [
      {
        key: "designer_send",
        label: "Designer Send",
        description: "Send client CAD requirements, site specs & slips to designer",
        icon: DocumentIcon,
        path: "/designer-send",
      },
      {
        key: "design_drawings",
        label: "Design Drawings",
        description: "Sales Person & Designer CAD drawing workflow & tracking",
        icon: DocumentIcon,
        path: "/design-drawings",
      },
      {
        key: "designer_queue",
        label: "Designer Work Queue",
        description: "Designer incoming lead queue to upload CAD drawings & return to sales",
        icon: TargetIcon,
        path: "/designer-queue",
      },
    ],
  },
  {
    key: "operations",
    label: "OPERATIONS",
    children: [
      {
        key: "amc",
        label: "AMC & Renewals",
        description: "Track annual maintenance contracts, renewals, and visits",
        icon: AmcIcon,
        path: "/amc",
      },
      {
        key: "services",
        label: "Services",
        description: "Schedule and monitor customer service & breakdown tickets",
        icon: WrenchIcon,
        path: "/services",
      },
      {
        key: "technicians",
        label: "Technicians",
        description: "Manage technician directory, service assignments, and dispatch",
        icon: UserIcon,
        path: "/technicians",
      },
    ],
  },
  {
    key: "USER MANAGEMENT",
    label: "USER MANAGEMENT",
    children: [
      {
        key: "accounts",
        label: "Accounts & Staff",
        description: "User account creation, staff assignments, and credentials",
        icon: BuildingIcon,
        path: "/accounts",
      },
    ],
  },
  {
    key: "intelligence",
    label: "INTELLIGENCE",
    children: [
      {
        key: "reports",
        label: "Report & Analysis",
        description: "System analytics, revenue charts, lead sources, and reports",
        icon: ReportIcon,
        path: "/reports",
      },
    ],
  },
  {
    key: "system",
    label: "SYSTEM",
    children: [
      {
        key: "templates",
        label: "Message Templates",
        description: "Configure system email, WhatsApp, and SMS notification templates",
        icon: DocumentIcon,
        path: "/templates",
      },
      {
        key: "terms",
        label: "Terms & Conditions",
        description: "Manage quotation and contract legal terms and condition templates",
        icon: DocumentIcon,
        path: "/terms-conditions",
      },
      {
        key: "role_management",
        label: "Role & Access Control",
        description: "Configure system roles, model access rights, and permission matrices",
        icon: ShieldLockIcon,
        path: "/role-access",
      },
    ],
  },
  {
    key: "inventory",
    label: "INVENTORY ERP",
    children: [
      {
        key: "inv_dashboard",
        label: "Dashboard",
        description: "Parking materials overview, stock value, and recent activities",
        icon: LayoutDashboard,
        path: "/inventory/dashboard",
      },
      {
        key: "inv_masters",
        label: "Masters",
        description: "Products, Categories, Sub Categories, Brands, Units, Warehouses",
        icon: Box,
        path: "/inventory/products",
        subItems: [
          { key: "inv_products", label: "Products", path: "/inventory/products", icon: Box },
          { key: "inv_categories", label: "Categories", path: "/inventory/categories", icon: Tag },
          { key: "inv_subcategories", label: "Sub Categories", path: "/inventory/sub-categories", icon: Tag },
          { key: "inv_brands", label: "Brands", path: "/inventory/brands", icon: Tag },
          { key: "inv_uom", label: "Units / UOM", path: "/inventory/uom", icon: Scale },
          { key: "inv_warehouses", label: "Warehouses", path: "/inventory/warehouses", icon: Warehouse },
        ],
      },
      {
        key: "inv_procurement",
        label: "Procurement",
        description: "Vendors, Material Requisition, Purchase Orders, GRN",
        icon: ShoppingCart,
        path: "/inventory/vendors",
        subItems: [
          { key: "inv_vendors", label: "Vendors", path: "/inventory/vendors", icon: Factory },
          { key: "inv_requisitions", label: "Material Requisition", path: "/inventory/material-requisitions", icon: ClipboardList },
          { key: "inv_pos", label: "Purchase Orders", path: "/inventory/purchase-orders", icon: ShoppingCart },
          { key: "inv_grn", label: "GRN", path: "/inventory/grn", icon: CheckCircle2 },
        ],
      },
      {
        key: "inv_movement",
        label: "Material Movement",
        description: "MTN, Delivery Challan, Material Return, Stock Transfer, Stock Adjustment",
        icon: Truck,
        path: "/inventory/mtn",
        subItems: [
          { key: "inv_mtn", label: "MTN", path: "/inventory/mtn", icon: Package },
          { key: "inv_dc", label: "Delivery Challan", path: "/inventory/delivery-challan", icon: Truck },
          { key: "inv_return", label: "Material Return", path: "/inventory/material-return", icon: RotateCcw },
          { key: "inv_transfer", label: "Stock Transfer", path: "/inventory/stock-transfer", icon: ArrowRightLeft },
          { key: "inv_adj", label: "Stock Adjustment", path: "/inventory/stock-adjustment", icon: Sliders },
        ],
      },
      {
        key: "inv_stock",
        label: "Stock",
        description: "Real-time warehouse stock balances & reorder levels",
        icon: Layers,
        path: "/inventory/stock-summary",
        subItems: [
          { key: "inv_stock_summary", label: "Stock Summary", path: "/inventory/stock-summary", icon: Layers },
          { key: "inv_stock_record", label: "Stock Record", path: "/inventory/stock-record", icon: ClipboardList },
        ],
      },
      {
        key: "inv_reports",
        label: "Reports",
        description: "Purchase registers, history, price comparisons, and valuation",
        icon: BarChart3,
        path: "/inventory/reports/purchase-register",
        subItems: [
          { key: "rep_purchase_reg", label: "Purchase Register", path: "/inventory/reports/purchase-register", icon: FileText },
          { key: "rep_prod_history", label: "Product Purchase History", path: "/inventory/reports/product-purchase-history", icon: TrendingUp },
          { key: "rep_price_history", label: "Product Price History", path: "/inventory/reports/product-price-history", icon: TrendingUp },
          { key: "rep_vendor_history", label: "Vendor Purchase History", path: "/inventory/reports/vendor-purchase-history", icon: Factory },
          { key: "rep_price_comp", label: "Product Price Comparison", path: "/inventory/reports/product-price-comparison", icon: BarChart3 },
          { key: "rep_low_stock", label: "Low Stock Report", path: "/inventory/reports/low-stock", icon: AlertTriangle },
          { key: "rep_valuation", label: "Inventory Valuation", path: "/inventory/reports/valuation", icon: IndianRupee },
        ],
      },
      {
        key: "inv_bom",
        label: "BOM",
        description: "Bill of Materials formulas & shortage detection",
        icon: GitBranch,
        path: "/inventory/bom",
        subItems: [
          { key: "inv_bom_list", label: "BOM List", path: "/inventory/bom", icon: GitBranch },
          { key: "inv_bom_create", label: "Create BOM", path: "/inventory/bom/create", icon: PlusSquare },
        ],
      },
    ],
  },
];

/* --------------------------------------------------------------------------
   STANDALONE / ADDITIONAL MODULES
   (Modules that may not have direct main sidebar tabs but require permissions)
   -------------------------------------------------------------------------- */
export const STANDALONE_MODULES = [
  {
    key: "invoice",
    label: "Invoices & Billing",
    description: "Generate, download, and manage customer invoices and payments",
    path: "/invoice",
    section: "FINANCE",
  },
  {
    key: "technician_work_list",
    label: "Technician Work List",
    description: "Field technician pending service visits and work assignments",
    path: "/technician-work-list",
    section: "OPERATIONS",
  },
  {
    key: "completed_work_list",
    label: "Completed Work List",
    description: "History of completed technician service jobs and reports",
    path: "/completed-work-list",
    section: "OPERATIONS",
  },
];

/* --------------------------------------------------------------------------
   HELPER: DYNAMICALLY EXTRACT ALL REGISTERED MODULES FOR ROLE ACCESS MANAGEMENT
   -------------------------------------------------------------------------- */
export function getRegisteredSidebarModules(extraKeys = []) {
  const modulesMap = new Map();

  // 1. Dashboard Module
  modulesMap.set(DASHBOARD_ITEM.key, {
    key: DASHBOARD_ITEM.key,
    label: DASHBOARD_ITEM.label,
    description: DASHBOARD_ITEM.description || "Dashboard overview and telemetry",
    section: DASHBOARD_ITEM.section || "MAIN",
    path: DASHBOARD_ITEM.path,
  });

  // 2. Extract every child module from SIDEBAR_SECTIONS
  SIDEBAR_SECTIONS.forEach((section) => {
    (section.children || []).forEach((child) => {
      if (child.key && !modulesMap.has(child.key)) {
        modulesMap.set(child.key, {
          key: child.key,
          label: child.label,
          description: child.description || `${child.label} module management & access control`,
          section: section.label,
          path: child.path,
        });
      }

      // Nested sub-items if present
      if (Array.isArray(child.subItems)) {
        child.subItems.forEach((sub) => {
          if (sub.key && !modulesMap.has(sub.key)) {
            modulesMap.set(sub.key, {
              key: sub.key,
              label: sub.label,
              description: sub.description || `${sub.label} sub-module access`,
              section: section.label,
              path: sub.path,
            });
          }
        });
      }
    });
  });

  // 3. Standalone system modules
  STANDALONE_MODULES.forEach((mod) => {
    if (mod.key && !modulesMap.has(mod.key)) {
      modulesMap.set(mod.key, {
        key: mod.key,
        label: mod.label,
        description: mod.description || `${mod.label} system module`,
        section: mod.section || "SYSTEM",
        path: mod.path,
      });
    }
  });

  // 4. Any custom/legacy keys passed in (e.g. from existing role permissions in DB)
  if (Array.isArray(extraKeys)) {
    extraKeys.forEach((key) => {
      if (key && !modulesMap.has(key)) {
        const readableLabel = key
          .split(/[_-]/)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ");
        modulesMap.set(key, {
          key,
          label: readableLabel,
          description: `Custom permissions for ${readableLabel}`,
          section: "CUSTOM",
          path: "",
        });
      }
    });
  }

  return Array.from(modulesMap.values());
}
