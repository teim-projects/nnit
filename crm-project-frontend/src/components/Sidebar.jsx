// Sidebar.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUserRole } from "../hooks/useAuth";

/* ----------------------
   Icons
   ---------------------- */
function ChevronDownIcon({ isOpen = false }) {
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
function FollowupIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
      <path d="M14 2v6h6M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ReportIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="10" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="6" width="4" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="17" y="2" width="4" height="19" rx="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShieldLockIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function WrenchIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheckCircle(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ----------------------
   Sidebar Component
   ---------------------- */
export default function Sidebar({ onNavigate }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const { userRole, permissions, isLoading: loadingRole } = useUserRole(baseApi);

  const sectionsData = useMemo(() => {
    if (loadingRole) return [];
    const roleName = (userRole?.name || localStorage.getItem("user_role") || "").toLowerCase();

    const sections = [
      {
        key: "sales",
        label: "SALES",
        children: [
          { key: "leads", label: "Lead Management", icon: TargetIcon, path: "/leads" },
          { key: "followups", label: "Follow-up Management", icon: FollowupIcon, path: "/followup-management" },
          { key: "quotations", label: "Quotations", icon: QuoteIcon, path: "/quotation" },
          { key: "products", label: "Product Master", icon: ParkingIcon, path: "/parking-products" },
          { key: "customers", label: "Customers", icon: UserIcon, path: "/customer" },
        ],
      },
      {
        key: "design",
        label: "DESIGN & DRAWINGS",
        children: [
          { key: "design_drawings", label: "Design Drawings", icon: DocumentIcon, path: "/design-drawings" },
          { key: "designer_queue", label: "Designer Work Queue", icon: TargetIcon, path: "/designer-queue" },
        ],
      },
      {
        key: "operations",
        label: "OPERATIONS",
        children: [
          { key: "amc", label: "AMC & Renewals", icon: AmcIcon, path: "/amc" },
          { key: "services", label: "Services", icon: WrenchIcon, path: "/services" },
          { key: "technicians", label: "Technicians", icon: UserIcon, path: "/technicians" },
        ],
      },
      {
        key: "USER MANAGEMENT",
        label: "USER MANAGEMENT",
        children: [
          { key: "accounts", label: "Accounts", icon: BuildingIcon, path: "/accounts" },
        ],
      },
      {
        key: "intelligence",
        label: "INTELLIGENCE",
        children: [
          { key: "reports", label: "Report & Analysis", icon: ReportIcon, path: "/reports" },
        ],
      },
      {
        key: "system",
        label: "SYSTEM",
        children: [
          { key: "templates", label: "Message Templates", icon: DocumentIcon, path: "/templates" },
          { key: "terms", label: "Terms & Conditions", icon: DocumentIcon, path: "/terms-conditions" },
          { key: "role_management", label: "Role & Permissions", icon: ShieldLockIcon, path: "/role-access" },
        ],
      },
    ];

    // Dynamic Permission & Role Filtering
    const isSuper = roleName === 'admin' || userRole?.is_superuser;
    const isDesigner = roleName === 'designer' && !isSuper;

    // Load custom role permissions configured in RoleAccessManagement
    let customPerms = null;
    try {
      customPerms = JSON.parse(localStorage.getItem(`nnit_role_permissions_${roleName}`) || "null") ||
                    JSON.parse(localStorage.getItem("nnit_role_permissions") || "null") ||
                    userRole?.permissions || permissions;
    } catch {
      customPerms = userRole?.permissions || permissions;
    }

    const filteredSections = sections
      .map((section) => ({
        ...section,
        children: section.children.filter((child) => {
          if (isSuper) return true;

          if (customPerms && customPerms[child.key] && typeof customPerms[child.key].can_view === "boolean") {
            return customPerms[child.key].can_view;
          }

          if (isDesigner) {
            return (
              child.key === 'design_drawings' ||
              child.key === 'designer_queue' ||
              child.key === 'products'
            );
          }

          if (child.key === 'reports') return true;
          if (permissions && permissions[child.key] && permissions[child.key].can_view === false) {
            return false;
          }
          if (child.key === 'accounts' && roleName === 'sales') return false;
          return true;
        }),
      }))
      .filter((section) => section.children.length > 0);

    return filteredSections;
  }, [userRole, permissions, loadingRole]);

  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    if (sectionsData.length > 0) {
      setOpenSections((prev) => {
        const next = { ...prev };
        sectionsData.forEach((section) => {
          const isActive = section.children.some((child) => isActivePath(child.path, currentPath));
          if (isActive) {
            next[section.key] = true;
          } else if (prev[section.key] === undefined) {
            next[section.key] = true;
          }
        });
        return next;
      });
    }
  }, [currentPath, sectionsData]);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  const isActivePath = (itemPath, currentPath) => {
    if (!itemPath) return false;
    const cleanPath = itemPath.split("?")[0];
    return currentPath === cleanPath || currentPath.startsWith(cleanPath + "/");
  };

  const isSectionActive = (section) => {
    return section.children.some((child) => isActivePath(child.path, currentPath));
  };

  if (loadingRole) return <div className="p-4">Loading sidebar...</div>;

  const roleName = (userRole?.name || localStorage.getItem("user_role") || "").toLowerCase();
  const isDesignerRole = roleName === 'designer' && roleName !== 'admin';
  const isTechnicianRole = roleName === 'technician';

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user_role");
    window.dispatchEvent(new Event("authChange"));
    window.location.href = "/login";
  };

  if (isTechnicianRole) {
    return (
      <aside className="w-full bg-slate-50/80 border-r border-slate-200 h-full px-4 py-6 flex flex-col justify-between shadow-sm">
        <nav className="space-y-3">
          <SidebarItem
            item={{ key: "home", label: "Dashboard", icon: HomeIcon, path: "/technician-dashboard" }}
            active={isActivePath("/technician-dashboard", currentPath)}
            onNavigate={onNavigate}
            currentPath={currentPath}
          />
          <SidebarItem
            item={{ key: "work_list", label: "Work List", icon: FollowupIcon, path: "/technician-work-list" }}
            active={isActivePath("/technician-work-list", currentPath) || isActivePath("/work-list", currentPath)}
            onNavigate={onNavigate}
            currentPath={currentPath}
          />
          <SidebarItem
            item={{ key: "completed_work_list", label: "Completed Work List", icon: IconCheckCircle, path: "/completed-work-list" }}
            active={isActivePath("/completed-work-list", currentPath)}
            onNavigate={onNavigate}
            currentPath={currentPath}
          />
        </nav>

        <div className="pt-6 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-full shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Logout <span className="text-base">➔</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full bg-white border-r border-slate-200/70 h-full px-3 py-4 shadow-sm">
      <nav className="space-y-0.5">
        
        {/* Dashboard Link (Hidden for Designer role) */}
        {!isDesignerRole && (
          <div className="mb-2">
            <SidebarItem
              item={{ key: "home", label: "Dashboard", icon: HomeIcon, path: "/dashboard" }}
              active={isActivePath("/dashboard", currentPath)}
              onNavigate={onNavigate}
              isDashboard
              currentPath={currentPath}
            />
          </div>
        )}

        {sectionsData.map((section) => {
          const sectionActive = isSectionActive(section);
          const isOpen = openSections[section.key] !== false;

          return (
            <div key={section.key} className="mt-2.5 first:mt-1">
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-200 group cursor-pointer select-none ${
                  sectionActive
                    ? "bg-indigo-50/70 text-indigo-700 font-bold"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-semibold"
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <span className="text-[12px] font-bold uppercase tracking-wider shrink-0">
                    {section.label}
                  </span>
                  <span className="flex-1 h-px bg-slate-200/60 group-hover:bg-slate-300/60 transition-colors" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {sectionActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  )}
                  <ChevronDownIcon isOpen={isOpen} />
                </div>
              </button>

              {isOpen && (
                <div className="ml-1 mt-1 space-y-0.5 transition-all duration-200">
                  {section.children.map((child) => (
                    <SidebarItem
                      key={child.key}
                      item={child}
                      active={isActivePath(child.path, currentPath)}
                      onNavigate={onNavigate}
                      depth={1}
                      currentPath={currentPath}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

/* ----------------------
   SidebarItem – Enhanced UI
   ---------------------- */
function SidebarItem({ item, active, onNavigate, depth = 0, isDashboard = false, currentPath = "" }) {
  const location = useLocation();
  const fullPath = (currentPath || location.pathname) + (location.search || "");
  const [subOpen, setSubOpen] = useState(true);

  if (item.subItems && item.subItems.length > 0) {
    const isSubActive = active || item.subItems.some((sub) => fullPath.includes(sub.path));
    return (
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => setSubOpen(!subOpen)}
          className={`sidebar-item group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 ease-out cursor-pointer ${
            isSubActive
              ? "bg-indigo-50/80 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100/50"
              : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <span className={`${isSubActive ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-600"} transition-colors duration-200`}>
              <item.icon className="w-5 h-5" />
            </span>
            <span className="text-[14px] tracking-tight">{item.label}</span>
          </div>
          <ChevronDownIcon isOpen={subOpen} />
        </button>

        {subOpen && (
          <div className="ml-6 pl-2 border-l border-slate-200 space-y-1 my-1">
            {item.subItems.map((sub) => {
              const isChildActive = fullPath === sub.path || (sub.path === "/amc?tab=contracts" && (fullPath === "/amc" || fullPath === "/amc?tab=contracts"));
              return (
                <Link
                  key={sub.key}
                  to={sub.path}
                  onClick={onNavigate}
                  className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isChildActive
                      ? "bg-blue-600 text-white font-bold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {sub.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const baseClasses = `
    sidebar-item group relative flex items-center gap-3.5 px-3.5 py-2.5 
    rounded-xl transition-all duration-200 ease-out
    ${depth > 0 ? "ml-3" : ""}
    ${isDashboard ? "mt-1" : ""}
  `;

  const activeClasses = active
    ? "bg-indigo-50/80 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100/50"
    : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 hover:shadow-sm";

  const accentBar = active && (
    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />
  );

  const iconClasses = active
    ? "text-indigo-500"
    : "text-slate-400 group-hover:text-slate-600";

  return (
    <Link
      to={item.path || "#"}
      onClick={onNavigate}
      className={`${baseClasses} ${activeClasses}`}
      aria-current={active ? "page" : undefined}
    >
      {accentBar}
      <span className={`${iconClasses} transition-colors duration-200`}>
        <item.icon className="w-5 h-5" />
      </span>
      <span className="flex-1 text-[14px] tracking-tight">{item.label}</span>
      {active && (
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
      )}
    </Link>
  );
}