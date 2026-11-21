// Sidebar.jsx
import React, { useMemo, useState, useEffect } from "react";
import { logoutUser } from "../utils/auth";
import { Link, useLocation } from "react-router-dom";
import { useUserRole } from "../hooks/useAuth";
import {
  SIDEBAR_SECTIONS,
  DASHBOARD_ITEM,
  HomeIcon,
  FollowupIcon,
  IconCheckCircle,
  ChevronDownIcon
} from "../config/navigationConfig";

/* ----------------------
   Single Unified Sidebar Component
   ---------------------- */
export default function Sidebar({ onNavigate }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const { userRole, permissions, isLoading: loadingRole } = useUserRole(baseApi);

  const roleName = (userRole?.name || localStorage.getItem("user_role") || "").toLowerCase();
  const isSuper = roleName === "admin" || userRole?.is_superuser;
  const isDesigner = roleName === "designer" && !isSuper;
  const isTechnicianRole = roleName === "technician";

  // Load custom role permissions configured in RoleAccessManagement
  const customPerms = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`nnit_role_permissions_${roleName}`) || "null") ||
             JSON.parse(localStorage.getItem("nnit_role_permissions") || "null") ||
             userRole?.permissions || permissions;
    } catch {
      return userRole?.permissions || permissions;
    }
  }, [roleName, userRole, permissions]);

  const canViewDashboard = isSuper || (
    customPerms && customPerms.dashboard && typeof customPerms.dashboard.can_view === "boolean"
      ? customPerms.dashboard.can_view
      : !isDesigner
  );

  const sectionsData = useMemo(() => {
    if (loadingRole) return [];

    const filteredSections = SIDEBAR_SECTIONS
      .map((section) => ({
        ...section,
        children: section.children.filter((child) => {
          if (isSuper) return true;

          // 1. Direct permission toggle from Role & Access Control Matrix
          if (customPerms && customPerms[child.key] && typeof customPerms[child.key].can_view === "boolean") {
            return customPerms[child.key].can_view;
          }

          // 2. Designer role defaults
          if (isDesigner) {
            return (
              child.key === "designer_send" ||
              child.key === "design_drawings" ||
              child.key === "designer_queue" ||
              child.key === "products"
            );
          }

          if (child.key === "reports") return true;
          if (permissions && permissions[child.key] && permissions[child.key].can_view === false) {
            return false;
          }
          if (child.key === "accounts" && roleName === "sales") return false;
          return true;
        }),
      }))
      .filter((section) => section.children.length > 0);

    return filteredSections;
  }, [userRole, permissions, loadingRole, customPerms, isSuper, isDesigner, roleName]);

  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    if (sectionsData.length > 0) {
      setOpenSections((prev) => {
        const next = { ...prev };
        sectionsData.forEach((section) => {
          const isActive = section.children.some((child) => {
            if (isActivePath(child.path, currentPath)) return true;
            if (child.subItems && child.subItems.some((s) => isActivePath(s.path, currentPath))) return true;
            return false;
          });
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
    return section.children.some((child) => {
      if (isActivePath(child.path, currentPath)) return true;
      if (child.subItems && child.subItems.some((s) => isActivePath(s.path, currentPath))) return true;
      return false;
    });
  };

  if (loadingRole) return <div className="p-4">Loading sidebar...</div>;

  const handleLogout = () => {
    logoutUser(true);
  };

  if (isTechnicianRole) {
    return (
      <div className="w-full bg-slate-50/80 min-h-full px-4 py-6 flex flex-col justify-between">
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
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-white px-3 py-4 flex flex-col justify-between">
      <nav className="space-y-0.5">
        
        {/* Dashboard Link (Controlled dynamically by Role & Access Matrix) */}
        {canViewDashboard && (
          <div className="mb-2">
            <SidebarItem
              item={DASHBOARD_ITEM}
              active={isActivePath(DASHBOARD_ITEM.path, currentPath)}
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
                <span className="text-[12px] font-bold uppercase tracking-wider">
                  {section.label}
                </span>
                <ChevronDownIcon isOpen={isOpen} />
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
    </div>
  );
}

/* ----------------------
   SidebarItem – Enhanced UI with Nested Sub-menus
   ---------------------- */
function SidebarItem({ item, active, onNavigate, depth = 0, isDashboard = false, currentPath = "" }) {
  const location = useLocation();
  const fullPath = (currentPath || location.pathname) + (location.search || "");
  const cleanCurrent = (fullPath || "").split("?")[0];

  const isSubActive = Boolean(
    active ||
    (item.subItems &&
      item.subItems.some((sub) => {
        const cleanSub = (sub.path || "").split("?")[0];
        return fullPath === sub.path || cleanCurrent === cleanSub;
      }))
  );

  const [subOpen, setSubOpen] = useState(isSubActive || false);

  useEffect(() => {
    if (isSubActive) {
      setSubOpen(true);
    }
  }, [isSubActive]);

  if (item.subItems && item.subItems.length > 0) {
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
          <div className="ml-3 pl-1 space-y-0.5 my-1">
            {item.subItems.map((sub) => {
              const cleanSub = (sub.path || "").split("?")[0];
              const isChildActive =
                fullPath === sub.path ||
                cleanCurrent === cleanSub ||
                (sub.path === "/amc?tab=contracts" && (fullPath === "/amc" || fullPath === "/amc?tab=contracts"));
              const SubIcon = sub.icon;
              return (
                <Link
                  key={sub.key}
                  to={sub.path}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isChildActive
                      ? "bg-blue-600 text-white font-bold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  {SubIcon && (
                    <SubIcon className={`w-4 h-4 shrink-0 ${isChildActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                  )}
                  <span className="truncate">{sub.label}</span>
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
    </Link>
  );
}
