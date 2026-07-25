// Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useUserRole } from "../hooks/useAuth";

/* ----------------------
   1. Define items (moved inside component setup scope for clarity/safety)
   ---------------------- */
const allItems = [
  { key: "home", label: "Home", icon: HomeIcon, path: "/dashboard" },
  { key: "leads", label: "Leads", icon: TargetIcon, path: "/leads" },
  { key: "contacts", label: "Contacts", icon: UserIcon, path: "/customer" },
  { key: "accounts", label: "Accounts", icon: BuildingIcon, path: "/accounts" }, // <-- Item to hide
 
  { key: "quotes", label: "Quotes", icon: QuoteIcon, path: "/quotation" },
  
  { key: "parking-products", label: "Parking Products", icon: ParkingIcon, path: "/parking-products" },
  { key: "terms", label: "Terms & Conditions", icon: DocumentIcon, path: "/terms-conditions" },
  { key: "amc", label: "AMC", icon: AmcIcon, path: "/amc" },
];

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Get BASE_API from environment
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  console.log("Sidebar BASE_API =", baseApi);

  if (!baseApi) {
    console.error("Sidebar: VITE_BASE_API_URL is not defined!");
  }

  // 2. ✅ Get the user role
  // Assuming useUserRole returns { userRole: { name: 'sales' }, ... }
  const { userRole, isLoading: loadingRole } = useUserRole(baseApi);

  // 3. ✅ Filter the sidebar items based on the user role
  const filteredItems = React.useMemo(() => {
    // Wait until role is loaded to ensure correct filtering
    if (loadingRole) {
      return [];
    }

    return allItems.filter(item => {
      // Check for the role object and the name property safely
      const roleName = userRole?.name?.toLowerCase();

      // Rule: Hide 'accounts' if the user role is 'sales'
      if (item.key === 'accounts' && roleName === 'sales') {
        return false; // Exclude this item
      }

      // Include all other items
      return true;
    });
  }, [userRole, loadingRole, baseApi]);


  return (
    <aside className="w-55 bg-gradient-to-b from-white via-orange-50 to-blue-50 border-r border-orange-100 min-h-screen px-3 py-4">
      <nav className="space-y-1">
        {/* 4. ✅ Render the filtered items */}
        {filteredItems.map((it) => (
          <SidebarItem key={it.key} item={it} active={isActive(it.path, currentPath)} />
        ))}
      </nav>
    </aside>
  );
}

function isActive(itemPath, currentPath) {
  if (!itemPath) return false;
  // exact match or startsWith (for nested routes)
  return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
}

function SidebarItem({ item, active }) {
  const baseClasses = "sidebar-item text-sm flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200";
  const activeClasses = active 
    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md shadow-orange-200" 
    : "text-gray-700 hover:bg-orange-50 hover:text-orange-700";

  return (
    <Link
      to={item.path || "#"}
      className={`${baseClasses} ${activeClasses}`}
      aria-current={active ? "page" : undefined}
    >
      <span className={active ? "text-white" : "text-gray-400"}>
        <item.icon className="w-5 h-5" />
      </span>

      <span className="flex-1 font-medium">{item.label}</span>

      {active && (
        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white bg-opacity-20">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="19" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </span>
      )}
    </Link>
  );
}

/* ----------------------
   Inline SVG icons (included for completeness)
   ---------------------- */

function HomeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TargetIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21 3l-4.35 4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 20a6.5 6.5 0 0113 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function BuildingIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7h.01M16 7h.01M8 11h.01M16 11h.01M8 15h.01M16 15h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function QuoteIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M9 7h6v6H9zM3 7h6v6H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function InvoiceIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7h8M7 11h8M7 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function AmcIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ParkingIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8h4a3 3 0 110 6H8V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8v11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DocumentIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
