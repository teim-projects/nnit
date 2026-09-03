import React, { useCallback, useEffect, useMemo, useState } from "react";
import Base from "../components/Base";
import Swal from "sweetalert2";
import { MdAdd, MdRemoveRedEye } from "react-icons/md";
import { FiAlertCircle, FiClock, FiCheckCircle, FiList, FiFilter } from "react-icons/fi";
import AddLeadFollowUpFormNew from "../components/lead/AddLeadFollowUpForm";

import { useModulePermissions } from "../hooks/useAuth";

/* ── stat card ── */
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="p-2 rounded-lg" style={{ background: color + "18" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </span>
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <div className="text-3xl font-extrabold text-slate-800">{String(value).padStart(2, "0")}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

/* ── status badge ── */
function StatusBadge({ status }) {
  const map = {
    open:        "bg-indigo-50 text-indigo-700 border-indigo-100",
    close_win:   "bg-emerald-50 text-emerald-700 border-emerald-100",
    closed_win:  "bg-emerald-50 text-emerald-700 border-emerald-100",
    close_loss:  "bg-rose-50 text-rose-700 border-rose-100",
    closed_loss: "bg-rose-50 text-rose-700 border-rose-100",
    in_process:  "bg-amber-50 text-amber-700 border-amber-100",
    closed:      "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${map[status] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
      {status?.replace("_", " ").toUpperCase()}
    </span>
  );
}

export default function FollowupManagement() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const { canView, canCreate, isLoading: loadingUser } = useModulePermissions("followups");
  const token = useMemo(() =>
    localStorage.getItem("access") || localStorage.getItem("token") || "", []);

  const [leads, setLeads]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm]     = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [filter, setFilter]         = useState("all"); // all | today | overdue | completed
  const PAGE_SIZE = 10;

  const fetchLeads = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) });
      if (filter === "today")    params.set("followup_today", "true");
      if (filter === "overdue")  params.set("overdue", "true");
      if (filter === "completed") params.set("status", "closed");

      const res = await fetch(`${BASE_API}/lead/lead/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const arr  = Array.isArray(data) ? data : data?.results || [];
      setLeads(arr);
      const count = data?.count ?? arr.length;
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
      setPage(p);
    } catch { setLeads([]); }
    finally { setLoading(false); }
  }, [BASE_API, token, filter]);

  useEffect(() => { fetchLeads(1); }, [fetchLeads]);

  /* ── derived stats ── */
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const allLeadsStats = useMemo(() => ({
    total:     totalCount,
    todayFU:   leads.filter(l => { if (!l.followup_date) return false; const s = (l.status || "").toLowerCase(); if (s === "close_win" || s === "closed_win" || s === "close_loss" || s === "closed_loss" || s === "closed") return false; const d = new Date(l.followup_date); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); }).length,
    overdue:   leads.filter(l => { if (!l.followup_date) return false; const s = (l.status || "").toLowerCase(); if (s === "close_win" || s === "closed_win" || s === "close_loss" || s === "closed_loss" || s === "closed") return false; const d = new Date(l.followup_date); d.setHours(0,0,0,0); return d < today; }).length,
    completed: leads.filter(l => { const s = (l.status || "").toLowerCase(); return s === "close_win" || s === "closed_win" || s === "close_loss" || s === "closed_loss" || s === "closed"; }).length,
  }), [leads, totalCount, today]);

  const fmt = (s) => {
    if (!s) return "—";
    const [y, m, d] = s.split("-");
    return `${d}-${m}-${y}`;
  };

  const FILTERS = [
    { key: "all",       label: "All Records",    icon: FiList },
    { key: "today",     label: "Scheduled Today",icon: FiClock },
    { key: "overdue",   label: "Overdue",         icon: FiAlertCircle },
    { key: "completed", label: "Completed",       icon: FiCheckCircle },
  ];

  if (!loadingUser && !canView) {
    return (
      <Base title="Follow-up Management">
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow mt-6">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h3>
          <p>You do not have permission to view Follow-up Management.</p>
        </div>
      </Base>
    );
  }

  return (
    <Base title="Follow-up Management">
      <div className="space-y-5 pb-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Follow-up Management</h2>
            <p className="text-sm text-slate-400 mt-0.5">{totalCount} lead{totalCount !== 1 ? "s" : ""} found</p>
          </div>
          {canCreate && (
            <button
              onClick={() => { setActiveLead(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <MdAdd className="w-5 h-5" /> Add Follow-up
            </button>
          )}
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={FiList}       label="Total Follow-ups"  value={allLeadsStats.total}     color="#818cf8" sub="All records" />
          <StatCard icon={FiClock}      label="Today's Follow-ups" value={allLeadsStats.todayFU}  color="#34d399" sub="Scheduled for today" />
          <StatCard icon={FiAlertCircle}label="Overdue"           value={allLeadsStats.overdue}   color="#f87171" sub="Past due date" />
          <StatCard icon={FiCheckCircle}label="Completed"         value={allLeadsStats.completed}  color="#fb923c" sub="Done this cycle" />
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => {
            const Icon = f.icon;
            const active = filter === f.key;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  active ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}>
                <Icon className="w-3.5 h-3.5" />{f.label}
              </button>
            );
          })}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["#","Company Name","Contact Person","Mobile","Next Follow-up","Total Follow-ups","Status","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="py-14 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2"/>
                    <p className="text-sm text-slate-400">Loading…</p>
                  </td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={8} className="py-14 text-center text-sm text-slate-400">No follow-up records found.</td></tr>
                ) : leads.map((lead, idx) => (
                  <tr key={lead.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-600">{(page-1)*PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-800 whitespace-nowrap">{lead.company_name || lead.customer_name || "—"}</td>
                    <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap">{lead.contact_person_name || lead.customer_name || "—"}</td>
                    <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap">{lead.customer_contact || "—"}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`font-semibold ${
                        (() => { if (!lead.followup_date) return "text-slate-400"; const d = new Date(lead.followup_date); d.setHours(0,0,0,0); return d < today ? "text-red-500" : d.getTime() === today.getTime() ? "text-amber-600" : "text-slate-700"; })()
                      }`}>
                        {fmt(lead.followup_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                        {lead.total_followups ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={lead.status}/></td>
                    <td className="px-4 py-3 text-center">
                      {canCreate && (
                        <button
                          onClick={() => { setActiveLead(lead.id); setShowForm(true); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100 transition-colors"
                          title="Add Follow-up"
                        >
                          <MdAdd className="w-3.5 h-3.5" /> Follow-up
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          {!loading && leads.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">Page <strong>{page}</strong> of <strong>{totalPages}</strong></p>
              <div className="flex gap-1.5">
                <button onClick={() => fetchLeads(Math.max(1, page-1))} disabled={page===1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition">← Prev</button>
                <button onClick={() => fetchLeads(Math.min(totalPages, page+1))} disabled={page===totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Follow-up form modal */}
      {showForm && (
        <AddLeadFollowUpFormNew
          open={showForm}
          onClose={() => { setShowForm(false); setActiveLead(null); }}
          baseApi={BASE_API}
          token={token}
          leadId={activeLead}
          onSuccess={() => { fetchLeads(page); setShowForm(false); setActiveLead(null); }}
        />
      )}
    </Base>
  );
}
