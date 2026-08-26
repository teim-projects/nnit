import React, { useState, useEffect } from "react";
import {
  MdClose,
  MdArticle,
  MdPerson,
  MdCalendarToday,
  MdAutorenew,
  MdAssignment,
  MdEdit,
  MdArrowBack,
  MdDeleteOutline,
  MdEngineering,
  MdPersonAdd,
  MdCalendarMonth,
  MdCheckCircle,
  MdSave
} from "react-icons/md";
import Swal from "sweetalert2";

export default function ContractDetailModal({
  contract,
  onClose,
  onEdit,
  onAssignTech,
  onToggleStatus,
  baseApi,
  token,
  onRefresh
}) {
  if (!contract) return null;

  // Local state for instant 0ms UI update
  const [currentContract, setCurrentContract] = useState(contract);

  useEffect(() => {
    setCurrentContract(contract);
  }, [contract]);

  const [technicians, setTechnicians] = useState([]);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);

  // Edit Visit Modal state
  const [editingVisit, setEditingVisit] = useState(null);
  const [editVisitDate, setEditVisitDate] = useState("");
  const [editTechId, setEditTechId] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [savingEditVisit, setSavingEditVisit] = useState(false);

  // Date Formatter: Day Month Year (e.g. 24 Nov 2026)
  const formatDMY = (dateStr) => {
    if (!dateStr) return "Not scheduled";
    try {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parts[2];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (monthIdx >= 0 && monthIdx < 12) {
          return `${day} ${months[monthIdx]} ${year}`;
        }
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
      }
    } catch (e) {
      // fallback
    }
    return dateStr;
  };

  // Load technician list for dropdown
  const loadTechnicians = async () => {
    if (technicians.length === 0 && baseApi) {
      try {
        const res = await fetch(`${baseApi}/api/services/technicians/?status=active`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (res.ok) {
          const data = await res.json();
          setTechnicians(Array.isArray(data) ? data : data.results || []);
        }
      } catch (e) {
        console.error("Failed to load technicians", e);
      }
    }
  };

  const handleOpenEditVisit = async (visit) => {
    setEditingVisit(visit);
    setEditVisitDate(visit.scheduled_date || "");
    setEditTechId(visit.assigned_technician || "");
    setEditRemarks(visit.resolution_notes || visit.description || "");
    await loadTechnicians();
  };

  const handleSaveEditVisit = async (e) => {
    e.preventDefault();
    if (!editingVisit || !baseApi) return;
    setSavingEditVisit(true);

    try {
      const res = await fetch(`${baseApi}/api/services/service-requests/${editingVisit.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          scheduled_date: editVisitDate || null,
          assigned_technician: editTechId ? parseInt(editTechId, 10) : null,
          resolution_notes: editRemarks || "",
          status: editTechId ? "assigned" : editingVisit.status,
          is_allocated: editTechId ? true : editingVisit.is_allocated
        })
      });

      if (res.ok) {
        const selectedTechObj = technicians.find((t) => String(t.id) === String(editTechId));

        // Instant local state update (0ms lag)
        setCurrentContract((prev) => {
          if (!prev) return prev;
          const updatedRequests = (prev.service_requests || []).map((srv) => {
            if (srv.id === editingVisit.id) {
              return {
                ...srv,
                scheduled_date: editVisitDate || srv.scheduled_date,
                assigned_technician: editTechId ? parseInt(editTechId, 10) : null,
                assigned_technician_details: selectedTechObj || srv.assigned_technician_details,
                resolution_notes: editRemarks,
                status: editTechId ? "assigned" : srv.status,
                is_allocated: editTechId ? true : srv.is_allocated
              };
            }
            return srv;
          });
          return { ...prev, service_requests: updatedRequests };
        });

        Swal.fire({
          icon: "success",
          title: "Visit Updated!",
          text: "Service visit details and technician updated successfully.",
          timer: 1300,
          showConfirmButton: false
        });
        setEditingVisit(null);
        onRefresh?.();
      } else {
        throw new Error("Failed to update visit details");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setSavingEditVisit(false);
    }
  };

  const handleAllocateWork = async (visit) => {
    if (!baseApi || !visit?.id) return;

    if (visit.is_allocated) {
      Swal.fire({
        icon: "info",
        title: "Work Already Allocated",
        text: `Visit #${visit.service_id || visit.id} is already allocated.`
      });
      return;
    }

    const defaultTechObj = currentContract.assigned_technician_details || visit.assigned_technician_details;
    const defaultTechId = currentContract.assigned_technician || visit.assigned_technician;

    // Instant local UI state update (0ms lag)
    setCurrentContract((prev) => {
      if (!prev) return prev;
      const updatedRequests = (prev.service_requests || []).map((srv) => {
        if (srv.id === visit.id) {
          return {
            ...srv,
            is_allocated: true,
            status: "assigned",
            status_display: "Assigned",
            assigned_technician: defaultTechId,
            assigned_technician_details: defaultTechObj
          };
        }
        return srv;
      });
      return { ...prev, service_requests: updatedRequests };
    });

    try {
      const res = await fetch(`${baseApi}/api/services/service-requests/${visit.id}/allocate/?include_all=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          technician_id: defaultTechId || null
        })
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Work Allocated!",
          text: "Service visit allocated successfully and added to active service calls.",
          timer: 1300,
          showConfirmButton: false
        });
        onRefresh?.();
      } else {
        throw new Error("Failed to allocate work");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleGenerateSchedule = async () => {
    if (!baseApi || !currentContract?.id) return;
    setGeneratingSchedule(true);
    try {
      const res = await fetch(`${baseApi}/amc/contracts/${currentContract.id}/generate-schedule/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        Swal.fire({
          icon: "success",
          title: "Schedule Calculated!",
          text: data.message || "Service visits generated successfully.",
          timer: 1500,
          showConfirmButton: false
        });
        onRefresh?.();
      } else {
        throw new Error("Failed to generate schedule");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "expiring_soon":
        return "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse";
      case "expired":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "renewed":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "inactive":
      default:
        return "bg-slate-100 text-slate-800 border border-slate-200";
    }
  };

  const getVisitStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "in_progress":
        return "bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse";
      case "assigned":
      case "allocated":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "on_hold":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "cancelled":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      case "unassigned":
      default:
        return "bg-amber-100 text-amber-800 border border-amber-200";
    }
  };

  const customerName =
    currentContract.customer_details?.company_name ||
    currentContract.customer_details?.name ||
    `Customer #${currentContract.customer}`;

  const isWarranty = currentContract.amc_type === "warranty";
  const amcTypeDisplay = isWarranty
    ? "1 Year Warranty (4 Free Quarterly Services)"
    : currentContract.amc_type_display || (currentContract.amc_type === "comprehensive" ? "Comprehensive" : "Non-Comprehensive");

  const annualVal = parseFloat(currentContract.annual_value || 0);
  const assignedTechName = currentContract.assigned_technician_details?.name || null;
  const locationText =
    currentContract.customer_details?.address ||
    currentContract.customer_details?.city ||
    currentContract.project_name ||
    "—";

  // Sort visits chronologically by scheduled_date
  const serviceVisits = [...(currentContract.service_requests || [])].sort((a, b) => {
    if (!a.scheduled_date) return 1;
    if (!b.scheduled_date) return -1;
    return new Date(a.scheduled_date) - new Date(b.scheduled_date);
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center z-[1100] p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl my-4 overflow-hidden animate-fadeIn flex flex-col max-h-[92vh]">
        
        {/* White Header Banner */}
        <div className="bg-white p-6 border-b border-slate-200 text-slate-800 shrink-0 relative">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-slate-800 tracking-tight">
                <MdArticle className="text-blue-600" />
                {isWarranty ? "Warranty Details" : "AMC Details"} – {currentContract.contract_id || "AMC-000"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                View contract information, assigned technicians, and scheduled service visits in one place.
              </p>

              {/* Quick Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full flex items-center gap-1.5 border border-slate-200 shadow-2xs">
                  <MdPerson className="text-blue-600" size={15} /> {customerName}
                </span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full flex items-center gap-1.5 border border-slate-200 shadow-2xs">
                  <MdCalendarToday className="text-blue-600" size={14} /> {formatDMY(currentContract.start_date)} → {formatDMY(currentContract.end_date)}
                </span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full flex items-center gap-1.5 border border-slate-200 shadow-2xs">
                  <MdAutorenew className="text-blue-600" size={15} /> {currentContract.payment_frequency_display || currentContract.payment_frequency || "quarterly"} visits / year
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <MdClose size={22} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* AMC Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 mb-4">
              <MdAssignment className="text-blue-600" />
              {isWarranty ? "Warranty Information" : "AMC Information"}
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-500 w-1/4 border-r border-slate-200">Customer</td>
                    <td className="p-3 font-bold text-slate-800 w-1/4 border-r border-slate-200">{customerName}</td>
                    <td className="p-3 font-bold text-slate-500 w-1/4 border-r border-slate-200">Service / Product</td>
                    <td className="p-3 font-bold text-slate-800 w-1/4">{currentContract.product || "—"}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-500 border-r border-slate-200">Branch / Location</td>
                    <td className="p-3 text-slate-700 border-r border-slate-200">{locationText}</td>
                    <td className="p-3 font-bold text-slate-500 border-r border-slate-200">AMC Type</td>
                    <td className="p-3 font-bold text-indigo-700">{amcTypeDisplay}</td>
                  </tr>
                  <tr className="bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-500 border-r border-slate-200">Start Date</td>
                    <td className="p-3 text-slate-800 border-r border-slate-200 font-semibold">{formatDMY(currentContract.start_date)}</td>
                    <td className="p-3 font-bold text-slate-500 border-r border-slate-200">End Date</td>
                    <td className="p-3 text-slate-800 font-semibold">{formatDMY(currentContract.end_date)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-500 border-r border-slate-200">Frequency</td>
                    <td className="p-3 text-slate-800 capitalize border-r border-slate-200">{currentContract.payment_frequency_display || currentContract.payment_frequency}</td>
                    <td className="p-3 font-bold text-slate-500 border-r border-slate-200">Status</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(currentContract.status)}`}>
                        {currentContract.status_display || currentContract.status}
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-500 border-r border-slate-200">Total Contract Amount</td>
                    <td colSpan="3" className="p-3 font-black text-emerald-700 text-sm">
                      ₹ {annualVal.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-500 border-r border-slate-200">Assigned Technicians</td>
                    <td colSpan="3" className="p-3 text-slate-700">
                      {assignedTechName ? (
                        <span className="font-bold text-indigo-700">{assignedTechName}</span>
                      ) : (
                        <span className="text-slate-400 italic">No technicians assigned yet</span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-500 border-r border-slate-200">Service Description</td>
                    <td colSpan="3" className="p-3 text-slate-700 whitespace-pre-line">{currentContract.scope_of_support || "—"}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-500 border-r border-slate-200">Notes</td>
                    <td colSpan="3" className="p-3 text-slate-700">{currentContract.remarks || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
              <button
                onClick={() => onEdit?.(currentContract)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <MdEdit size={16} /> Edit AMC
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <MdArrowBack size={16} /> Back to List
              </button>
              <button
                onClick={() => onToggleStatus?.(currentContract.id, currentContract.status)}
                className="px-5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <MdDeleteOutline size={16} /> Cancel / Deactivate AMC
              </button>
            </div>

            {/* Dashed Technician Setup Box */}
            <div className="mt-4 p-4 border-2 border-dashed border-blue-300 bg-blue-50/40 rounded-2xl text-center space-y-2">
              <div className="text-xs font-bold text-blue-900 flex items-center justify-center gap-1.5">
                <MdEngineering className="text-blue-600 text-base" /> Technician Assignment & Default Work Setup
              </div>
              <p className="text-[11px] text-slate-500">
                Assign technicians for this AMC/Warranty and configure default work details for upcoming visits.
              </p>
              <button
                onClick={() => onAssignTech?.(currentContract)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold shadow-xs transition"
              >
                <MdPersonAdd size={15} /> Assign Technicians & Default Work Details
              </button>
            </div>
          </div>

          {/* Service Visits Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <MdCalendarMonth className="text-blue-600" /> Service Visits
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                Total Visits: {serviceVisits.length}
              </span>
            </div>

            {serviceVisits.length === 0 ? (
              <div className="p-8 text-center bg-blue-50/50 rounded-2xl border border-blue-200 text-xs font-medium space-y-3">
                <p className="text-slate-700 font-bold">No service visits calculated yet for this contract.</p>
                <button
                  onClick={handleGenerateSchedule}
                  disabled={generatingSchedule}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition inline-flex items-center gap-1.5"
                >
                  <MdAutorenew className={generatingSchedule ? "animate-spin" : ""} size={16} />
                  {generatingSchedule ? "Calculating Service Visits..." : "⚡ Auto-Calculate & Generate Service Visits"}
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 w-10 text-center">#</th>
                      <th className="p-3.5 w-36">Service Date</th>
                      <th className="p-3.5 w-28">Product</th>
                      <th className="p-3.5 min-w-[160px]">Technicians</th>
                      <th className="p-3.5 w-28">Status</th>
                      <th className="p-3.5 text-right min-w-[260px]">Remarks / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceVisits.map((visit, index) => {
                      const techName = visit.assigned_technician_details?.name || null;
                      return (
                        <tr key={visit.id || index} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 font-extrabold text-slate-800 text-center">{index + 1}</td>
                          <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                            📅 {formatDMY(visit.scheduled_date)}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-800">
                            {visit.product_name || currentContract.product || "—"}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {techName ? (
                              <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                                  {techName.charAt(0)}
                                </span>
                                {techName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Not assigned</span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getVisitStatusBadge(visit.status)}`}>
                              {visit.status_display || visit.status || "Pending"}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[11px] text-slate-500 italic truncate max-w-[120px]">
                                {visit.resolution_notes || "No remarks"}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleOpenEditVisit(visit)}
                                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                                  title="Edit Visit / Technicians"
                                >
                                  <MdEdit size={13} /> Edit
                                </button>

                                {visit.is_allocated ? (
                                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs">
                                    <MdCheckCircle size={14} /> Work Allocated
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleAllocateWork(visit)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition"
                                  >
                                    <MdEngineering size={14} /> Allocate Work
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>

      {/* Edit AMC Visit Modal */}
      {editingVisit && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <MdEdit /> Edit AMC Visit #{editingVisit.service_id || editingVisit.id}
              </h3>
              <button
                onClick={() => setEditingVisit(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg"
              >
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditVisit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Visit Date
                </label>
                <input
                  type="date"
                  value={editVisitDate}
                  onChange={(e) => setEditVisitDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Technicians
                </label>
                <select
                  value={editTechId}
                  onChange={(e) => setEditTechId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white font-medium"
                >
                  <option value="">-- Select / Change Technicians --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization}) - {t.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Remarks / Work Summary
                </label>
                <textarea
                  rows="3"
                  placeholder="Optional remarks..."
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white font-medium resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVisit(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditVisit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <MdSave size={15} /> {savingEditVisit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
