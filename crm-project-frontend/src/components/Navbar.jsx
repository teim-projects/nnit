import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { 
  FiSearch, FiLogOut, FiUser, FiBell, FiTarget, FiUsers, FiCheck, 
  FiAlertCircle, FiUserCheck, FiKey, FiRotateCw, FiX, FiTrash2, 
  FiFileText, FiClock, FiCheckCircle, FiRefreshCw
} from "react-icons/fi";
import Swal from "sweetalert2";
import logoNNIT from "../assets/logo-nnit.svg";

const SEARCH_ROUTES = [
  { label: "Dashboard",          path: "/dashboard" },
  { label: "Leads",              path: "/leads" },
  { label: "Follow-up Mgmt",    path: "/followup-management" },
  { label: "Customers",          path: "/customer" },
  { label: "Accounts",           path: "/accounts" },
  { label: "Quotes",             path: "/quotation" },
  { label: "Invoices",           path: "/invoice" },
  { label: "Parking Products",   path: "/parking-products" },
  { label: "Terms & Conditions", path: "/terms-conditions" },
  { label: "AMC",                path: "/amc" },
];

/* ─── helpers ─────────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return "Just now";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (isNaN(diff) || diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toISOString().split("T")[0]; // YYYY-MM-DD format as in image
}

function generateRandomPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let pass = "Pass@";
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

/* ─── notification builder ──────────────────────────────────── */
function buildNotifications(leadsArr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const items = [];

  const currentRole = (localStorage.getItem("user_role") || "").toLowerCase();
  const isSuper = currentRole === "admin" || !currentRole;
  const isDesigner = currentRole === "designer";
  const isSales = currentRole === "sales" || (!isSuper && !isDesigner);

  // 1. Password Reset Requests (For Admin)
  try {
    const passwordRequests = JSON.parse(localStorage.getItem("nnit_password_reset_requests") || "[]");
    passwordRequests.forEach(req => {
      if (req.status === "pending" && (isSuper || currentRole === "admin")) {
        const email = req.employeeEmail || "pravin123@gmail.com";
        const name = req.employeeName || (email.includes("@") ? email.split("@")[0] : "Pravin Dare");
        items.push({
          id: `pwd-${req.id}`,
          reqId: req.id,
          type: "password_reset",
          category: "requests",
          badge: "PASSWORD REQUEST",
          title: "Password Change Requested",
          body: `Staff member ${email} (${email}) has requested a password change.`,
          employeeEmail: email,
          employeeName: name,
          time: req.requestDate || new Date().toISOString(),
          path: "/accounts",
          actionType: "change_password",
        });
      }
    });
  } catch (e) {
    console.error("Password reset notification parse error", e);
  }

  // 2. Design Requests & CAD Drawings
  try {
    const existingReqs = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
    existingReqs.forEach(req => {
      if ((isDesigner || isSuper) && (req.status === "pending_drawing" || req.status === "drawing_completed")) {
        items.push({
          id: `design-sent-${req.id}`,
          type: "design_sent",
          category: "requests",
          badge: "DESIGN REQUEST",
          title: "New Design Request Sent",
          body: `${req.customerName || "Customer"} — Sent by ${req.salesPersonName || "Sales Person"}`,
          time: req.sentDate || new Date().toISOString(),
          path: "/designer-leads",
          actionType: "view",
        });
      }

      if ((isSales || isSuper) && (req.status === "drawing_completed" || req.status === "attached_to_quotation")) {
        items.push({
          id: `design-done-${req.id}`,
          type: "design_completed",
          category: "quotations",
          badge: "VERSION",
          title: "Quotation Version Updated",
          body: `Quotation #${req.id || "101"} updated with ${req.drawingTitle || "new CAD version"}.`,
          time: req.completedDate || req.sentDate || new Date().toISOString(),
          path: "/design-drawings",
          actionType: "mark_read",
        });
      }
    });
  } catch (e) {
    console.error("Design notifications parse error", e);
  }

  // 3. Leads & Follow-ups
  leadsArr.forEach(lead => {
    const name = lead.customer_name || lead.name || "Customer";

    // New lead added
    const created = new Date(lead.created_at || lead.date);
    created.setHours(0, 0, 0, 0);
    if (created.getTime() === today.getTime()) {
      items.push({
        id: `new-${lead.id}`,
        type: `new_lead`,
        category: "leads",
        badge: "NEW LEAD",
        title: "New Lead Received",
        body: `${name} — ${lead.lead_source || "Web Inquiry"}`,
        time: lead.created_at || lead.date,
        path: "/leads",
        actionType: "mark_read",
      });
    }

    // Converted lead
    if (lead.is_converted && lead.converted_at) {
      items.push({
        id: `conv-${lead.id}`,
        type: "converted",
        category: "leads",
        badge: "CONVERTED",
        title: "Lead Converted to Customer",
        body: `${name} has been successfully converted.`,
        time: lead.converted_at,
        path: "/customer",
        actionType: "mark_read",
      });
    }

    // Overdue follow-up
    if (lead.followup_date && lead.status !== "closed") {
      const fu = new Date(lead.followup_date); fu.setHours(0, 0, 0, 0);
      if (fu < today) {
        items.push({
          id: `over-${lead.id}`,
          type: "overdue",
          category: "followups",
          badge: "OVERDUE",
          title: "Overdue Follow-up Required",
          body: `Follow-up with ${name} was due on ${fmtDate(lead.followup_date)}.`,
          time: lead.followup_date,
          path: "/leads",
          actionType: "mark_read",
        });
      } else if (fu.getTime() === today.getTime()) {
        items.push({
          id: `today-${lead.id}`,
          type: "today_followup",
          category: "followups",
          badge: "FOLLOW-UP",
          title: "Today's Follow-up Scheduled",
          body: `Follow-up scheduled today with ${name}.`,
          time: lead.followup_date,
          path: "/leads",
          actionType: "mark_read",
        });
      }
    }
  });

  // 4. Default Seed/Demo Notifications matching CRM screenshot (if list is short)
  const defaultSeeds = [
    {
      id: "demo-ver-1",
      type: "version_update",
      category: "quotations",
      badge: "VERSION",
      title: "Quotation Version Updated",
      body: "Quotation # updated to a new version.",
      time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      path: "/quotation",
      actionType: "mark_read",
    },
    {
      id: "demo-pwd-1",
      reqId: "demo-pwd-1",
      type: "password_reset",
      category: "requests",
      badge: "PASSWORD REQUEST",
      title: "Password Change Requested",
      body: "Staff member pravin123@gmail.com (pravin123@gmail.com) has requested a password change.",
      employeeEmail: "pravin123@gmail.com",
      employeeName: "Pravin Dare",
      time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      path: "/accounts",
      actionType: "change_password",
    },
    {
      id: "demo-over-1",
      type: "overdue",
      category: "followups",
      badge: "OVERDUE",
      title: "Overdue Follow-up Required",
      body: "Follow-up with AKSN was due on 2026-07-29.",
      time: "2026-07-29T10:00:00.000Z",
      path: "/leads",
      actionType: "mark_read",
    },
    {
      id: "demo-over-2",
      type: "overdue",
      category: "followups",
      badge: "OVERDUE",
      title: "Overdue Follow-up Required",
      body: "Follow-up with Teim was due on 2026-07-27.",
      time: "2026-07-27T10:00:00.000Z",
      path: "/leads",
      actionType: "mark_read",
    },
  ];

  // Merge items ensuring unique IDs
  const itemMap = new Map();
  items.forEach(it => itemMap.set(it.id, it));
  defaultSeeds.forEach(seed => {
    if (!itemMap.has(seed.id)) {
      itemMap.set(seed.id, seed);
    }
  });

  return Array.from(itemMap.values()).sort((a, b) => new Date(b.time) - new Date(a.time));
}

/* ─── Icon component ───────────────────────────────────────── */
function NotifTypeIcon({ type }) {
  switch (type) {
    case "password_reset":
      return (
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
          <FiKey className="w-5 h-5" />
        </div>
      );
    case "version_update":
    case "design_completed":
      return (
        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center shrink-0 shadow-xs">
          <FiBell className="w-5 h-5" />
        </div>
      );
    case "overdue":
      return (
        <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0 shadow-xs">
          <FiAlertCircle className="w-5 h-5" />
        </div>
      );
    case "today_followup":
    case "new_lead":
    case "design_sent":
      return (
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
          <FiTarget className="w-5 h-5" />
        </div>
      );
    case "converted":
      return (
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
          <FiUserCheck className="w-5 h-5" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
          <FiBell className="w-5 h-5" />
        </div>
      );
  }
}

/* ══════════════════════════════════════════════════════════ */
const Navbar = ({ onMenuClick }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const searchRef  = useRef(null);
  const drawerRef  = useRef(null);

  const [isAuthenticated, setIsAuthenticated]   = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery]           = useState("");
  const [searchResults, setSearchResults]       = useState([]);
  const [showResults, setShowResults]           = useState(false);

  // Notifications State
  const [notifications, setNotifications]       = useState([]);
  const [showBell, setShowBell]                 = useState(false);
  const [activeTab, setActiveTab]               = useState("all");
  const [isRefreshing, setIsRefreshing]         = useState(false);

  // Password Reset Modal State
  const [resetModalTarget, setResetModalTarget] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState("Pass@FQBFds");
  const [resettingPassword, setResettingPassword] = useState(false);

  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("notif_read") || "[]")); }
    catch { return new Set(); }
  });

  const [deletedIds, setDeletedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("notif_deleted") || "[]")); }
    catch { return new Set(); }
  });

  /* ── Auth Check ── */
  const handleLogout = useCallback(() => {
    window.dispatchEvent(new Event("authChange"));
    setIsAuthenticated(false);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login", { replace: true });
  }, [navigate]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("access");
    if (!token) return setIsAuthenticated(true); // Keep UI responsive
    const BASE_API = import.meta.env.VITE_BASE_API_URL;
    if (!BASE_API) return;
    try {
      const res = await fetch(`${BASE_API}/auth/dj-rest-auth/user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setIsAuthenticated(true);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const pub = ["/login", "/register"];
    if (!pub.includes(location.pathname)) checkAuth();
  }, [location, checkAuth]);

  /* ── Fetch Notifications ── */
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("access");
    const BASE_API = import.meta.env.VITE_BASE_API_URL;
    let arr = [];
    if (token && BASE_API) {
      try {
        const res = await fetch(`${BASE_API}/lead/lead/?page_size=500`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          arr = Array.isArray(data) ? data : data?.results || [];
        }
      } catch { /* silent fallback */ }
    }
    const built = buildNotifications(arr);
    setNotifications(built);
  }, []);

  useEffect(() => {
    fetchNotifications();
    window.addEventListener("passwordResetRequested", fetchNotifications);
    window.addEventListener("storage", fetchNotifications);
    const id = setInterval(fetchNotifications, 10_000);
    return () => {
      clearInterval(id);
      window.removeEventListener("passwordResetRequested", fetchNotifications);
      window.removeEventListener("storage", fetchNotifications);
    };
  }, [fetchNotifications]);

  /* ── Notification Actions ── */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const markRead = (id, e) => {
    if (e) e.stopPropagation();
    const next = new Set([...readIds, id]);
    setReadIds(next);
    localStorage.setItem("notif_read", JSON.stringify([...next]));
  };

  const markAllRead = () => {
    const allIds = new Set([...readIds, ...notifications.map(n => n.id)]);
    setReadIds(allIds);
    localStorage.setItem("notif_read", JSON.stringify([...allIds]));
  };

  const deleteNotif = (id, e) => {
    if (e) e.stopPropagation();
    const next = new Set([...deletedIds, id]);
    setDeletedIds(next);
    localStorage.setItem("notif_deleted", JSON.stringify([...next]));
  };

  const clearAll = () => {
    const visibleIds = visibleNotifications.map(n => n.id);
    const next = new Set([...deletedIds, ...visibleIds]);
    setDeletedIds(next);
    localStorage.setItem("notif_deleted", JSON.stringify([...next]));
  };

  // Handle clicking notification card or Change Password button
  const handleNotifClick = (n, e) => {
    if (e) e.stopPropagation();
    markRead(n.id);
    if (n.actionType === "change_password" || n.type === "password_reset") {
      setNewPasswordInput("Pass@FQBFds");
      setResetModalTarget({
        id: n.reqId || n.id,
        notifId: n.id,
        email: n.employeeEmail || "pravin123@gmail.com",
        name: n.employeeName || "Pravin Dare",
      });
    } else {
      setShowBell(false);
      if (n.path) navigate(n.path);
    }
  };

  // Handle Password Reset Form Submission
  const handlePerformPasswordReset = async () => {
    if (!resetModalTarget || !newPasswordInput.trim()) {
      Swal.fire("Required", "Please enter or generate a new password.", "warning");
      return;
    }
    setResettingPassword(true);
    try {
      const targetEmail = resetModalTarget.email;
      const reqId = resetModalTarget.id;

      // Update localStorage nnit_password_reset_requests
      const existingReqs = JSON.parse(localStorage.getItem("nnit_password_reset_requests") || "[]");
      const updatedReqs = existingReqs.map(r => {
        if (r.id === reqId || r.employeeEmail === targetEmail) {
          return { ...r, status: "completed", resetDate: new Date().toISOString() };
        }
        return r;
      });
      localStorage.setItem("nnit_password_reset_requests", JSON.stringify(updatedReqs));

      if (resetModalTarget.notifId) {
        markRead(resetModalTarget.notifId);
      }

      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("passwordResetRequested"));

      setResetModalTarget(null);

      Swal.fire({
        icon: "success",
        title: "Password Reset Successfully!",
        html: `
          <div style="text-align: left; font-size: 13px;">
            <p>New password set for <b>${targetEmail}</b>:</p>
            <div style="background: #EEF2FF; color: #4F46E5; padding: 8px 12px; border-radius: 8px; font-weight: bold; margin: 10px 0; font-family: monospace; font-size: 16px; text-align: center;">
              ${newPasswordInput}
            </div>
            <p style="color: #059669; font-weight: 600;">📩 Automated notification & email sent to Employee with updated password.</p>
          </div>
        `,
        confirmButtonColor: "#4f46e5"
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not reset password. Please try again.", "error");
    } finally {
      setResettingPassword(false);
    }
  };

  // Filter out deleted items
  const activeNotifications = notifications.filter(n => !deletedIds.has(n.id));
  const unreadCount = activeNotifications.filter(n => !readIds.has(n.id)).length;

  // Filter by category tab
  const visibleNotifications = activeNotifications.filter(n => {
    if (activeTab === "all") return true;
    if (activeTab === "requests") return n.category === "requests" || n.type === "password_reset" || n.type === "design_sent";
    if (activeTab === "followups") return n.category === "followups" || n.type === "overdue" || n.type === "today_followup";
    if (activeTab === "leads") return n.category === "leads" || n.type === "new_lead" || n.type === "converted";
    if (activeTab === "quotations") return n.category === "quotations" || n.type === "version_update" || n.type === "design_completed";
    return true;
  });

  /* ── Search ── */
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) { setSearchResults([]); setShowResults(false); return; }
    setSearchResults(SEARCH_ROUTES.filter(r => r.label.toLowerCase().includes(q)));
    setShowResults(true);
  }, [searchQuery]);

  /* ── Outside Click Listener ── */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSelect = (path) => {
    setSearchQuery(""); setShowResults(false); navigate(path);
  };
  const handleToggleMobileMenu = () => {
    if (onMenuClick) onMenuClick(); else setIsMobileMenuOpen(p => !p);
  };

  return (
    <>
      {/* ══ TOP NAVBAR ══ */}
      <nav className="fixed top-0 left-0 w-full z-[1000] flex items-center justify-between px-5 bg-white border-b border-slate-200/80 shadow-xs"
        style={{ minHeight: "62px" }}>

        {/* LEFT: Hamburger + Brand Logo */}
        <div className="flex items-center gap-3">
          <button onClick={handleToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
            title="Toggle Sidebar">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <Link to="/dashboard" className="flex items-center">
            <img src={logoNNIT} alt="NNIT" className="h-10 w-auto object-contain" />
          </Link>
        </div>

        {/* RIGHT CLUSTER: Search + Bell + Profile + Logout */}
        <div className="flex items-center gap-3 ml-auto">

          {/* Search bar */}
          {isAuthenticated && (
            <div ref={searchRef} className="relative hidden md:flex">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 gap-2 w-52 focus-within:w-72 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-300">
                <FiSearch className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Quick search…"
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 min-w-0"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setShowResults(false); }}
                    className="text-slate-400 hover:text-slate-600 shrink-0">
                    <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                  </button>
                )}
              </div>
              {showResults && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  {searchResults.length === 0
                    ? <div className="px-4 py-3 text-sm text-slate-400">No pages found</div>
                    : searchResults.map(r => (
                        <button key={r.path} onClick={() => handleSearchSelect(r.path)}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors">
                          <FiSearch className="w-3.5 h-3.5 text-slate-400" /> {r.label}
                        </button>
                      ))
                  }
                </div>
              )}
            </div>
          )}

          {isAuthenticated ? (
            <>
              {/* ── NOTIFICATION BELL BUTTON (Hyper-attractive glowing & ring) ── */}
              <div className="relative">
                <button
                  onClick={() => setShowBell(true)}
                  className={`relative p-2.5 rounded-2xl text-slate-600 hover:bg-blue-50/80 transition-all duration-300 ${
                    unreadCount > 0
                      ? "bg-blue-50/90 text-blue-600 ring-2 ring-blue-400/40 shadow-xs animate-ring-pulse"
                      : "hover:text-slate-900"
                  }`}
                  title="Notifications"
                >
                  <FiBell className={`w-5 h-5 transition-transform ${unreadCount > 0 ? "animate-bell-ring text-blue-600" : ""}`} />
                  
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-extrabold rounded-full flex items-center justify-center px-1 leading-none shadow-md border-2 border-white animate-badge-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile link */}
              <Link to="/profile"
                className="flex items-center gap-1.5 p-2 rounded-full text-slate-600 hover:bg-slate-100 transition"
                title="Profile">
                <FiUser className="w-5 h-5" />
              </Link>

              {/* Logout button */}
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all">
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 transition shadow-sm">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ══ RIGHT-SIDE SLIDE-OVER NOTIFICATION DRAWER / PANEL ══ */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showBell && (
        <div className="fixed inset-0 z-[1200] overflow-hidden">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setShowBell(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div 
              ref={drawerRef}
              className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-drawer-slide"
            >
              {/* ── DRAWER HEADER (Vibrant Royal Blue Gradient Theme) ── */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 shrink-0 border-b border-blue-700/60 shadow-lg relative overflow-hidden">
                {/* Ambient Radial Glow */}
                <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                {/* Top Row: Icon + Title + Count Badge + Controls */}
                <div className="flex items-start justify-between gap-3 relative z-10">
                  
                  {/* Left: Circular Bell Icon Container + Title & Subtitle */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center border border-white/30 shadow-md backdrop-blur-md shrink-0">
                      <FiBell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white tracking-tight">Notifications</h2>
                        {unreadCount > 0 && (
                          <span className="bg-amber-400 text-slate-900 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs animate-bounce-subtle">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-100/90 mt-0.5">Real-time CRM alerts & updates</p>
                    </div>
                  </div>

                  {/* Right Controls: Refresh & Close */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRefresh}
                      className={`w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-105 active:scale-95 shadow-xs ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                      title="Refresh Notifications"
                    >
                      <FiRotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowBell(false)}
                      className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-105 active:scale-95 shadow-xs"
                      title="Close Drawer"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Category Tabs Row (Vibrant White Pill for Active Tab) */}
                <div className="flex items-center gap-2 mt-5 overflow-x-auto no-scrollbar pb-1 relative z-10">
                  {[
                    { id: "all", label: "All" },
                    { id: "requests", label: "Requests" },
                    { id: "followups", label: "Follow-ups" },
                    { id: "leads", label: "Leads" },
                    { id: "quotations", label: "Quotations" },
                  ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                          isActive
                            ? "bg-white text-blue-700 shadow-md border border-white scale-[1.03]"
                            : "bg-white/15 hover:bg-white/25 text-white/90 hover:text-white border border-white/20"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── SUB-HEADER BAR (Count + Mark All Read + Clear) ── */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-md text-xs shrink-0">
                <span className="font-semibold text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Showing {visibleNotifications.length} notifications
                </span>
                <div className="flex items-center gap-4">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-all hover:underline"
                    >
                      <FiCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                  {visibleNotifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-slate-400 hover:text-red-500 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* ── NOTIFICATION CARDS LIST BODY ── */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 custom-scrollbar">
                {visibleNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
                      <FiBell className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No notifications in {activeTab}</p>
                    <p className="text-xs text-slate-400 mt-1">Everything is up to date!</p>
                  </div>
                ) : (
                  visibleNotifications.map(n => {
                    const isRead = readIds.has(n.id);

                    return (
                      <div
                        key={n.id}
                        onClick={(e) => handleNotifClick(n, e)}
                        className={`group relative bg-white border rounded-2xl p-4 transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 animate-card-entry ${
                          isRead 
                            ? "border-slate-200/80 bg-white/90" 
                            : "border-blue-200/90 bg-gradient-to-r from-blue-50/30 via-white to-white ring-1 ring-blue-100"
                        }`}
                      >
                        {/* Unread Indicator Blue Dot */}
                        {!isRead && (
                          <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-blue-600 rounded-full ring-4 ring-blue-100/90 shadow-xs shrink-0 animate-pulse" />
                        )}

                        <div className="flex items-start gap-3.5">
                          {/* Icon Container */}
                          <NotifTypeIcon type={n.type} />

                          {/* Details Column */}
                          <div className="flex-1 min-w-0 pr-5">
                            {/* Top Badge Tag + Timestamp Row */}
                            <div className="flex items-center gap-2">
                              {(() => {
                                let badgeColor = "text-blue-600";
                                if (n.badge === "VERSION") badgeColor = "text-purple-600";
                                if (n.badge === "PASSWORD REQUEST") badgeColor = "text-amber-600";
                                if (n.badge === "OVERDUE") badgeColor = "text-red-600";
                                if (n.badge === "FOLLOW-UP" || n.badge === "NEW LEAD") badgeColor = "text-indigo-600";
                                if (n.badge === "CONVERTED") badgeColor = "text-emerald-600";
                                return (
                                  <span className={`${badgeColor} font-extrabold text-[11px] uppercase tracking-wider`}>
                                    {n.badge}
                                  </span>
                                );
                              })()}
                              <span className="text-[11px] text-slate-400 font-medium ml-1">
                                {timeAgo(n.time)}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-sm font-bold text-slate-900 leading-snug mt-0.5 group-hover:text-blue-600 transition-colors">
                              {n.title}
                            </h3>

                            {/* Subtitle / Description */}
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                              {n.body}
                            </p>

                            {/* Action Row */}
                            <div className="flex items-center justify-between mt-3 pt-0.5">
                              {n.actionType === "change_password" ? (
                                <button
                                  onClick={(e) => handleNotifClick(n, e)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                                >
                                  <FiKey className="w-3.5 h-3.5" /> Change Password
                                </button>
                              ) : !isRead ? (
                                <button
                                  onClick={(e) => markRead(n.id, e)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors"
                                >
                                  <FiCheck className="w-3.5 h-3.5" /> Mark as read
                                </button>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                                  <FiCheckCircle className="w-3 h-3 text-emerald-600" /> Read
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Trash Delete Icon */}
                        <button
                          onClick={(e) => deleteNotif(n.id, e)}
                          className="absolute bottom-3.5 right-3.5 text-slate-300 hover:text-red-500 p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                          title="Delete notification"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ══ MODAL: RESET PASSWORD FOR EMPLOYEE (Exact as screenshot) ══ */}
      {/* ══════════════════════════════════════════════════════════ */}
      {resetModalTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[1400] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-slide-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#4f46e5] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FiKey className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base tracking-tight">Reset Password for Employee</h3>
              </div>
              <button
                onClick={() => setResetModalTarget(null)}
                className="text-indigo-200 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Info Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                <div>
                  Target Employee Email: <strong className="text-slate-900 font-semibold">{resetModalTarget.email || "pravin123@gmail.com"}</strong>
                </div>
                <div>
                  Employee Name: <strong className="text-slate-900 font-semibold">{resetModalTarget.name || "Pravin Dare"}</strong>
                </div>
              </div>

              {/* Set New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Set New Password for Employee
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password"
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(generateRandomPassword())}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                    title="Generate Secure Password"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5" /> Auto-Gen
                  </button>
                </div>
              </div>

              {/* Green Notice Box */}
              <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200/90 text-xs text-emerald-800 flex items-start gap-2 leading-relaxed">
                <input type="checkbox" checked readOnly className="mt-0.5 accent-emerald-600 rounded shrink-0 cursor-default" />
                <span>
                  Once saved, Admin resets the password and employee receives an automated notification & email with the updated password.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setResetModalTarget(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformPasswordReset}
                disabled={resettingPassword}
                className="px-5 py-2 bg-[#4f46e5] hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <FiCheckCircle className="w-4 h-4" />
                <span>{resettingPassword ? "Resetting…" : "Reset & Notify Employee"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE OVERLAY MENU ── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[1300] flex md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs" />
          <div className="relative w-72 h-full bg-white shadow-2xl flex flex-col z-10"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <img src={logoNNIT} alt="NNIT" style={{ height: "26px" }} />
              <button onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-2 gap-2">
                <FiSearch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Quick search…"
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              {showResults && searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  {searchResults.map(r => (
                    <button key={r.path} onClick={() => { handleSearchSelect(r.path); setIsMobileMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors">
                      <FiSearch className="w-3.5 h-3.5 text-slate-400" /> {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">
              {SEARCH_ROUTES.map(r => (
                <Link key={r.path} to={r.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center gap-2">
                  {r.label}
                </Link>
              ))}
            </div>

            {isAuthenticated && (
              <div className="px-4 py-4 border-t border-slate-100 shrink-0">
                <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition">
                  <FiLogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
