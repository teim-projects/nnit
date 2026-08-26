import React, { useState, useEffect } from "react";
import {
  MdAssignmentTurnedIn,
  MdAutorenew,
  MdOutlineHourglassTop,
  MdCancel,
  MdBuild,
  MdSearch,
  MdRemoveRedEye,
  MdAccessTime,
  MdWarning,
  MdCheckCircle,
  MdClose
} from "react-icons/md";
import AmcCalendarView from "./AmcCalendarView";

export default function AmcAnalyticsView({ baseApi, token, onViewContract }) {
  const [stats, setStats] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Dashboard stats
      const statsRes = await fetch(`${baseApi}/amc/dashboard/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Contracts list
      const contractsRes = await fetch(`${baseApi}/amc/contracts/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (contractsRes.ok) {
        const contractsData = await contractsRes.json();
        setContracts(Array.isArray(contractsData) ? contractsData : contractsData.results || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [baseApi, token]);

  const s = stats || {};

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  };

  // Filter expiring contracts (end_date within 15 days)
  const today = new Date();
  const next15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);

  const expiringContracts = contracts.filter((c) => {
    if (!c.end_date) return false;
    const endDate = new Date(c.end_date);
    return endDate >= today && endDate <= next15Days;
  });

  // Collect upcoming scheduled visits from contracts
  const upcomingServices = [];
  contracts.forEach((c) => {
    (c.service_requests || []).forEach((srv) => {
      if (srv.scheduled_date) {
        const srvDate = new Date(srv.scheduled_date);
        if (srvDate >= today && srvDate <= next15Days) {
          upcomingServices.push({
            ...srv,
            contract_number: c.contract_id,
            customer_name: c.customer_details?.company_name || c.customer_details?.name || `Customer #${c.customer}`,
            branch_name: c.customer_details?.address || c.customer_details?.city || c.project_name || "Sava Facility Services Pvt Ltd Pune",
            contract_obj: c
          });
        }
      }
    });
  });

  // Sort upcoming services chronologically
  upcomingServices.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

  // Search filtering across upcoming services and contracts
  const filteredServices = upcomingServices.filter((srv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (srv.contract_number || "").toLowerCase().includes(q) ||
      (srv.customer_name || "").toLowerCase().includes(q) ||
      (srv.branch_name || "").toLowerCase().includes(q)
    );
  });

  const formattedClock = currentTime.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) + ", " + currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  return (
    <div className="space-y-6">
      {/* 5 Top Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: TOTAL AMCS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TOTAL AMCS</p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">{s.total_contracts || contracts.length || 0}</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">
              ↗ All contracts
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
            <MdAssignmentTurnedIn size={24} />
          </div>
        </div>

        {/* Card 2: ACTIVE AMCS */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ACTIVE AMCS</p>
            <h2 className="text-3xl font-black text-emerald-600 mt-1">{s.active_contracts || contracts.filter(c => c.status === 'active').length || 0}</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
              ↗ Currently active
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
            <MdCheckCircle size={24} />
          </div>
        </div>

        {/* Card 3: EXPIRING (15 DAYS) */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/90 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">EXPIRING (15 DAYS)</p>
            <h2 className="text-3xl font-black text-rose-600 mt-1">{expiringContracts.length}</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold">
              ⚠️ Needs attention
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shrink-0">
            <MdOutlineHourglassTop size={24} />
          </div>
        </div>

        {/* Card 4: RENEWAL REQUESTS */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">RENEWAL REQUESTS</p>
            <h2 className="text-3xl font-black text-amber-600 mt-1">{s.renewal_requests_pending || 0}</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold">
              🕒 Pending review
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
            <MdAutorenew size={24} />
          </div>
        </div>

        {/* Card 5: UPCOMING SERVICES */}
        <div className="bg-white p-5 rounded-2xl border border-teal-200/90 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">UPCOMING SERVICES</p>
            <h2 className="text-3xl font-black text-teal-600 mt-1">{upcomingServices.length}</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold">
              📅 Next 15 days
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
            <MdBuild size={24} />
          </div>
        </div>
      </div>

      {/* Quick View & Search Divider */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          QUICK VIEW & SEARCH
        </span>
        <div className="relative w-full max-w-xs">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search customer / contract / branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Interactive AMC Service Calendar */}
      <AmcCalendarView baseApi={baseApi} token={token} onViewContract={onViewContract} />

      {/* Expiring Contracts Table (Next 15 Days) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-rose-600 flex items-center gap-2 tracking-tight">
            <MdOutlineHourglassTop className="text-rose-500" size={20} />
            Expiring Contracts <span className="text-xs text-slate-400 font-semibold">· Next 15 Days</span>
          </h3>
          <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-xs font-bold">
            ⚠️ {expiringContracts.length} contracts expiring
          </span>
        </div>

        {expiringContracts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 space-y-1">
            <p className="text-xl">🎉</p>
            <p className="font-bold text-slate-700">No expiring contracts in the next 15 days — you're all clear!</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">CONTRACT NO.</th>
                  <th className="p-3">CUSTOMER</th>
                  <th className="p-3">BRANCH</th>
                  <th className="p-3">END DATE</th>
                  <th className="p-3">DAYS LEFT</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiringContracts.map((c, idx) => {
                  const daysLeft = Math.ceil((new Date(c.end_date) - today) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={c.id || idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-800 text-center">{idx + 1}</td>
                      <td className="p-3 font-extrabold text-indigo-700">{c.contract_id}</td>
                      <td className="p-3 font-semibold text-slate-800">{c.customer_details?.company_name || c.customer_details?.name}</td>
                      <td className="p-3 text-slate-600">{c.customer_details?.address || "—"}</td>
                      <td className="p-3 font-semibold text-slate-800">📅 {formatDisplayDate(c.end_date)}</td>
                      <td className="p-3 font-bold text-rose-600">{daysLeft} days</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onViewContract?.(c.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition ml-auto"
                        >
                          <MdRemoveRedEye size={14} /> View AMC
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming Services Table (Next 15 Days) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-teal-700 flex items-center gap-2 tracking-tight">
            <MdBuild className="text-teal-500" size={20} />
            Upcoming Services <span className="text-xs text-slate-400 font-semibold">· Next 15 Days</span>
          </h3>
          <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-bold">
            🛠️ {filteredServices.length} services scheduled
          </span>
        </div>

        {filteredServices.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">No upcoming service visits scheduled in the next 15 days.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">SERVICE DATE</th>
                  <th className="p-3">CUSTOMER</th>
                  <th className="p-3">BRANCH</th>
                  <th className="p-3">CONTRACT NO.</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((srv, idx) => (
                  <tr key={srv.id || idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-800 text-center">{idx + 1}</td>
                    <td className="p-3 font-extrabold text-blue-700 whitespace-nowrap">
                      📅 {formatDisplayDate(srv.scheduled_date)}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{srv.customer_name}</td>
                    <td className="p-3 text-slate-600">{srv.branch_name}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-bold text-[10px]">
                        {srv.contract_number}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onViewContract?.(srv.contract_obj?.id)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-xs transition ml-auto"
                      >
                        <MdRemoveRedEye size={14} /> View AMC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
