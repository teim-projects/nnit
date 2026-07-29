import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FiSearch, FiLogOut, FiUser, FiBell, FiTarget, FiUsers, FiCheck, FiAlertCircle, FiUserCheck } from "react-icons/fi";
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
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/* ─── notification types ──────────────────────────────────── */
// type: "new_lead" | "converted" | "overdue" | "today_followup"
function buildNotifications(leadsArr) {
  const now   = new Date();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const items = [];

  leadsArr.forEach(lead => {
    const name = lead.customer_name || "Unknown";

    // 1. New lead added today
    const created = new Date(lead.created_at || lead.date);
    created.setHours(0, 0, 0, 0);
    if (created.getTime() === today.getTime()) {
      items.push({
        id:      `new-${lead.id}`,
        type:    "new_lead",
        title:   "New Lead Added",
        body:    `${name} — ${lead.lead_source || ""}`,
        time:    lead.created_at || lead.date,
        path:    "/leads",
        read:    false,
      });
    }

    // 2. Converted to customer
    if (lead.is_converted && lead.converted_at) {
      items.push({
        id:      `conv-${lead.id}`,
        type:    "converted",
        title:   "Lead Converted ✓",
        body:    `${name} is now a Customer`,
        time:    lead.converted_at,
        path:    "/customer",
        read:    false,
      });
    }

    // 3. Overdue follow-up
    if (lead.followup_date && lead.status !== "closed") {
      const fu = new Date(lead.followup_date); fu.setHours(0, 0, 0, 0);
      if (fu < today) {
        items.push({
          id:      `over-${lead.id}`,
          type:    "overdue",
          title:   "Overdue Follow-up",
          body:    `${name} — due ${fmtDate(lead.followup_date)}`,
          time:    lead.followup_date,
          path:    "/leads",
          read:    false,
        });
      }
    }

    // 4. Today's follow-up
    if (lead.followup_date && lead.status !== "closed") {
      const fu = new Date(lead.followup_date); fu.setHours(0, 0, 0, 0);
      if (fu.getTime() === today.getTime()) {
        items.push({
          id:      `today-${lead.id}`,
          type:    "today_followup",
          title:   "Follow-up Today",
          body:    `${name}`,
          time:    lead.followup_date,
          path:    "/leads",
          read:    false,
        });
      }
    }
  });

  // newest first, cap at 30
  return items
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 30);
}

/* ─── icon per type ───────────────────────────────────────── */
function NotifIcon({ type }) {
  const map = {
    new_lead:      { icon: FiTarget,    bg: "bg-indigo-100",  text: "text-indigo-600" },
    converted:     { icon: FiUserCheck, bg: "bg-emerald-100", text: "text-emerald-600" },
    overdue:       { icon: FiAlertCircle, bg: "bg-red-100",   text: "text-red-500" },
    today_followup:{ icon: FiUsers,     bg: "bg-amber-100",   text: "text-amber-600" },
  };
  const { icon: Icon, bg, text } = map[type] || { icon: FiBell, bg: "bg-slate-100", text: "text-slate-500" };
  return (
    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
      <Icon className={`w-4 h-4 ${text}`} />
    </span>
  );
}

/* ══════════════════════════════════════════════════════════ */
const Navbar = ({ onMenuClick }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const searchRef  = useRef(null);
  const bellRef    = useRef(null);

  const [isAuthenticated, setIsAuthenticated]   = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery]           = useState("");
  const [searchResults, setSearchResults]       = useState([]);
  const [showResults, setShowResults]           = useState(false);

  // notifications
  const [notifications, setNotifications]       = useState([]);
  const [showBell, setShowBell]                 = useState(false);
  const [readIds, setReadIds]                   = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("notif_read") || "[]")); }
    catch { return new Set(); }
  });

  /* ── auth ── */
  const handleLogout = useCallback(() => {
    window.dispatchEvent(new Event("authChange"));
    setIsAuthenticated(false);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login", { replace: true });
  }, [navigate]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("access");
    if (!token) return setIsAuthenticated(false);
    const BASE_API = import.meta.env.VITE_BASE_API_URL;
    if (!BASE_API) return handleLogout();
    try {
      const res = await fetch(`${BASE_API}/auth/dj-rest-auth/user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.ok ? setIsAuthenticated(true) : handleLogout();
    } catch { handleLogout(); }
  }, [handleLogout]);

  useEffect(() => {
    const pub = ["/login", "/register"];
    if (!pub.includes(location.pathname)) checkAuth();
    else setIsAuthenticated(false);
  }, [location, checkAuth]);

  /* ── fetch notifications ── */
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("access");
    const BASE_API = import.meta.env.VITE_BASE_API_URL;
    if (!token || !BASE_API) return;
    try {
      const res = await fetch(`${BASE_API}/lead/lead/?page_size=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.results || [];
      const built = buildNotifications(arr);
      setNotifications(built);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000); // refresh every 60s
    return () => clearInterval(id);
  }, [isAuthenticated, fetchNotifications]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    localStorage.setItem("notif_read", JSON.stringify([...allIds]));
  };

  const markRead = (id) => {
    const next = new Set([...readIds, id]);
    setReadIds(next);
    localStorage.setItem("notif_read", JSON.stringify([...next]));
  };

  /* ── search ── */
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) { setSearchResults([]); setShowResults(false); return; }
    setSearchResults(SEARCH_ROUTES.filter(r => r.label.toLowerCase().includes(q)));
    setShowResults(true);
  }, [searchQuery]);

  /* ── close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
      if (bellRef.current   && !bellRef.current.contains(e.target))   setShowBell(false);
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

  /* ─── grouping ───────────────────────────────────────── */
  const grouped = {
    overdue:        notifications.filter(n => n.type === "overdue"),
    today_followup: notifications.filter(n => n.type === "today_followup"),
    new_lead:       notifications.filter(n => n.type === "new_lead"),
    converted:      notifications.filter(n => n.type === "converted"),
  };
  const groupLabels = {
    overdue:        "⚠️ Overdue Follow-ups",
    today_followup: "📅 Today's Follow-ups",
    new_lead:       "🎯 New Leads Today",
    converted:      "✅ Converted to Customer",
  };

  return (
    <>
      {/* ══ NAVBAR ══ */}
      <nav className="fixed top-0 left-0 w-full z-[1000] flex items-center justify-between px-5 bg-white border-b border-slate-200 shadow-sm"
        style={{ minHeight: "62px" }}>

        {/* LEFT: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button onClick={handleToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
            title="Toggle Sidebar">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <Link to="/dashboard" className="flex items-center">
            <img src={logoNNIT} alt="NNIT" className="h-10 w-auto object-contain" />
          </Link>
        </div>

        {/* RIGHT cluster: search + bell + profile + logout */}
        <div className="flex items-center gap-2 ml-auto">

          {/* ── search bar ── */}
          {isAuthenticated && (
            <div ref={searchRef} className="relative hidden md:flex">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 gap-2 w-52 focus-within:w-72 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-300">
                <FiSearch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
                <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {searchResults.length === 0
                    ? <div className="px-4 py-3 text-sm text-slate-400">No pages found</div>
                    : searchResults.map(r => (
                        <button key={r.path} onClick={() => handleSearchSelect(r.path)}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors">
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
              {/* ── Bell ── */}
              <div ref={bellRef} className="relative">
                <button onClick={() => setShowBell(s => !s)}
                  className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition"
                  title="Notifications">
                  <FiBell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showBell && (
                  <div className="absolute right-0 top-full mt-2 w-screen max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[1100] flex flex-col overflow-hidden max-h-[80vh]">
                    {/* header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
                      <div className="flex items-center gap-2">
                        <FiBell className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                          <FiCheck className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* body */}
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                          <FiBell className="w-10 h-10 mb-2 opacity-30" />
                          <p className="text-sm font-medium">All caught up!</p>
                          <p className="text-xs mt-1">No notifications right now</p>
                        </div>
                      ) : (
                        Object.entries(grouped).map(([type, items]) => {
                          if (!items.length) return null;
                          return (
                            <div key={type}>
                              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                {groupLabels[type]}
                                <span className="ml-1 bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">
                                  {items.length}
                                </span>
                              </div>
                              {items.map(n => {
                                const isRead = readIds.has(n.id);
                                return (
                                  <button
                                    key={n.id}
                                    onClick={() => {
                                      markRead(n.id);
                                      setShowBell(false);
                                      navigate(n.path);
                                    }}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-slate-50 transition-colors hover:bg-slate-50 ${isRead ? "opacity-60" : ""}`}
                                  >
                                    <NotifIcon type={n.type} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className={`text-sm leading-tight truncate ${isRead ? "text-slate-500 font-normal" : "text-slate-800 font-semibold"}`}>
                                          {n.title}
                                        </p>
                                        {!isRead && (
                                          <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 truncate mt-0.5">{n.body}</p>
                                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.time)}</p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* footer */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 shrink-0">
                        <button onClick={() => { setShowBell(false); navigate("/leads"); }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold w-full text-center">
                          View all leads →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* profile */}
              <Link to="/profile"
                className="flex items-center gap-1.5 p-2 rounded-full text-slate-500 hover:bg-slate-100 transition"
                title="Profile">
                <FiUser className="w-5 h-5" />
              </Link>

              {/* logout */}
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all">
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* MOBILE OVERLAY — sidebar + search + nav */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[1100] flex md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="relative w-72 h-full bg-white shadow-2xl flex flex-col z-10"
            onClick={e => e.stopPropagation()}>

            {/* Mobile drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <img src={logoNNIT} alt="NNIT" style={{ height: "26px" }} />
              <button onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Mobile search */}
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
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors">
                      <FiSearch className="w-3.5 h-3.5 text-slate-400" /> {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">
              {SEARCH_ROUTES.map(r => (
                <Link key={r.path} to={r.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition flex items-center gap-2">
                  {r.label}
                </Link>
              ))}
            </div>

            {/* Footer */}
            {isAuthenticated && (
              <div className="px-4 py-4 border-t border-slate-100 shrink-0">
                <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition">
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
