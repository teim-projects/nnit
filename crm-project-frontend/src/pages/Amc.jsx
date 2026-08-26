import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Base from "../components/Base";
import AmcList from "../components/amc/AmcList";
import AmcCalendarView from "../components/amc/AmcCalendarView";
import ContractDetailModal from "../components/amc/ContractDetailModal";
import { useModulePermissions } from "../hooks/useAuth";
import {
  MdAssignmentTurnedIn,
  MdOutlineHourglassTop,
  MdAutorenew,
  MdAttachMoney,
  MdCalendarMonth,
  MdListAlt
} from "react-icons/md";

export default function AmcPage() {
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const { canView, canCreate, canEdit, canDelete, isLoading: loadingUser } = useModulePermissions("amc");
  const [activeTab, setActiveTab] = useState(tabParam === "calendar" ? "calendar" : "contracts");
  const [filters, setFilters] = useState({});
  const [modalContract, setModalContract] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    totalValue: 0,
  });

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  ), []);

  useEffect(() => {
    if (tabParam === "calendar") {
      setActiveTab("calendar");
    } else {
      setActiveTab("contracts");
    }
  }, [tabParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  const handleViewContractById = async (contractId) => {
    if (!baseApi || !contractId) return;
    try {
      const res = await fetch(`${baseApi}/amc/contracts/${contractId}/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setModalContract(data);
      }
    } catch (e) {
      console.error("Failed to load contract for modal:", e);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${baseApi}/amc/contracts/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.results || [];
          let activeCount = 0;
          let expiringCount = 0;
          let sumValue = 0;

          items.forEach((item) => {
            const st = (item.status || "").toLowerCase();
            if (st === "active" || st === "renewed") activeCount++;
            if (st === "expiring_soon") expiringCount++;
            sumValue += parseFloat(item.annual_value || 0);
          });

          setStats({
            total: items.length,
            active: activeCount,
            expiringSoon: expiringCount,
            totalValue: sumValue,
          });
        }
      } catch (err) {
        console.error("Failed to fetch AMC stats:", err);
      }
    };

    fetchStats();
  }, [baseApi, token]);

  const filtersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by contract ID, customer name, product..." }
  ];

  if (!loadingUser && !canView) {
    return (
      <Base title="AMC Management">
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow mt-6 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h3>
          <p>You do not have permission to view AMC Management.</p>
        </div>
      </Base>
    );
  }

  return (
    <Base
      title="AMC Management"
      filterTitle="Search AMC Contracts"
      filtersConfig={filtersConfig}
      initialFilterValues={filters}
      onFiltersChange={setFilters}
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Metric Cards Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Contracts</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.total}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <MdAssignmentTurnedIn size={26} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Contracts</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MdAutorenew size={26} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring Soon</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.expiringSoon}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <MdOutlineHourglassTop size={26} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total AMC Value</p>
              <h3 className="text-xl font-black text-purple-700 mt-1">₹{stats.totalValue.toLocaleString("en-IN")}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <MdAttachMoney size={26} />
            </div>
          </div>
        </div>

        {/* Tab Navigation (2 Tabs) */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => handleTabChange("contracts")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
              activeTab === "contracts"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <MdListAlt size={16} /> AMC Contracts List
          </button>

          <button
            onClick={() => handleTabChange("calendar")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
              activeTab === "calendar"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <MdCalendarMonth size={16} /> Service Visits & Expiry Calendar
          </button>
        </div>

        {/* Tab Content Rendering */}
        {activeTab === "contracts" && (
          <AmcList
            baseApi={baseApi}
            token={token}
            filters={filters}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )}

        {activeTab === "calendar" && (
          <AmcCalendarView
            baseApi={baseApi}
            token={token}
            onViewContract={handleViewContractById}
          />
        )}
      </div>

      {/* Contract Detail Modal */}
      {modalContract && (
        <ContractDetailModal
          contract={modalContract}
          onClose={() => setModalContract(null)}
          baseApi={baseApi}
          token={token}
          onRefresh={() => handleViewContractById(modalContract.id)}
        />
      )}
    </Base>
  );
}
