import { useState, useEffect } from "react";
import { 
  MdEdit, 
  MdDelete, 
  MdAutorenew, 
  MdVisibility, 
  MdToggleOn, 
  MdToggleOff, 
  MdAssignmentInd, 
  MdClose 
} from "react-icons/md";
import Swal from "sweetalert2";
import AddAmcForm from "./AddAmcForm";
import ContractDetailModal from "./ContractDetailModal";
import RenewAmcModal from "./RenewAmcModal";

export default function AmcList({ baseApi, token, filters = {} }) {
  const [contracts, setContracts] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAmc, setSelectedAmc] = useState(null);
  const [filterType, setFilterType] = useState("all"); // all, active, expiring_soon, expired, scheduled, renewed
  const [detailContract, setDetailContract] = useState(null);
  const [renewContract, setRenewContract] = useState(null);

  // Assign Technician Modal State
  const [assignAmcModal, setAssignAmcModal] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState("");

  const fetchContracts = async () => {
    setLoading(true);
    try {
      let url = `${baseApi}/amc/contracts/`;
      const queryParams = [];

      if (filterType !== "all") {
        queryParams.push(`status=${encodeURIComponent(filterType)}`);
      }
      if (filters?.search) {
        queryParams.push(`search=${encodeURIComponent(filters.search)}`);
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setContracts(Array.isArray(data) ? data : data.results || []);
      } else {
        throw new Error("Failed to load AMC contracts");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch contracts" });
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch(`${baseApi}/api/services/technicians/?status=active`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setTechnicians(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error("Failed to load active technicians", err);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [filterType, baseApi, token, filters]);

  useEffect(() => {
    fetchTechnicians();
  }, [baseApi, token]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete this AMC contract.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseApi}/amc/contracts/${id}/`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        Swal.fire({ icon: "success", text: "Contract deleted successfully", timer: 1200, showConfirmButton: false });
        fetchContracts();
      } else {
        throw new Error("Failed to delete contract");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const actionText = currentStatus === "inactive" ? "activate" : "deactivate";
    const result = await Swal.fire({
      title: `Toggle Contract Status?`,
      text: `Do you want to ${actionText} this AMC contract?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}!`,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseApi}/amc/contracts/${id}/toggle-status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        Swal.fire({ icon: "success", text: `Contract ${actionText}d successfully`, timer: 1200, showConfirmButton: false });
        fetchContracts();
      } else {
        throw new Error("Failed to toggle status");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleAssignTechnicianSubmit = async (e) => {
    e.preventDefault();
    if (!assignAmcModal) return;

    try {
      const res = await fetch(`${baseApi}/amc/contracts/${assignAmcModal.id}/assign-technician/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          technician_id: selectedTechId ? parseInt(selectedTechId, 10) : null
        })
      });

      if (res.ok) {
        Swal.fire({ icon: "success", text: "Assigned technician updated for AMC", timer: 1200, showConfirmButton: false });
        setAssignAmcModal(null);
        fetchContracts();
      } else {
        throw new Error("Failed to assign technician to AMC contract");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleGenerateWarrantyServices = async (id) => {
    try {
      const res = await fetch(`${baseApi}/amc/contracts/${id}/generate-warranty-services/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        Swal.fire({
          icon: "success",
          title: "Warranty Services Synced",
          text: data.message || "4 Quarterly free warranty services synced successfully!",
        });
        fetchContracts();
      } else {
        throw new Error("Failed to generate warranty services");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "expiring_soon":
        return "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse";
      case "expired":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "renewed":
        return "bg-indigo-100 text-indigo-800 border border-indigo-200";
      case "inactive":
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Contracts" },
            { id: "active", label: "Active" },
            { id: "expiring_soon", label: "Expiring Soon" },
            { id: "expired", label: "Expired" },
            { id: "renewed", label: "Renewed" },
            { id: "scheduled", label: "Scheduled" },
            { id: "inactive", label: "Inactive" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setSelectedAmc(null);
            setShowAddForm(true);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
        >
          + Create AMC Contract
        </button>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Contract ID</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5">AMC Type</th>
                <th className="px-4 py-3.5">Frequency</th>
                <th className="px-4 py-3.5">Assigned Tech</th>
                <th className="px-4 py-3.5">Start Date</th>
                <th className="px-4 py-3.5">End Date</th>
                <th className="px-4 py-3.5">Annual Value</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-4 py-12 text-center text-sm text-slate-400">
                    Loading contracts...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-4 py-12 text-center text-sm text-slate-500">
                    No AMC contracts found matching your filters.
                  </td>
                </tr>
              ) : (
                contracts.map((item, index) => {
                  const customerName =
                    item.customer_details?.company_name ||
                    item.customer_details?.name ||
                    `Customer #${item.customer}`;
                  const assignedTech = item.assigned_technician_details;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-bold text-blue-600">{item.contract_id || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{customerName}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{item.product || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.amc_type === "warranty" ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            🛡️ 1 Yr Warranty (4 Free Services)
                          </span>
                        ) : (
                          item.amc_type_display || (item.amc_type === "comprehensive" ? "Comprehensive" : "Non-Comprehensive")
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize">
                        {item.payment_frequency_display || item.payment_frequency}
                      </td>

                      {/* Assigned Tech Column */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {assignedTech ? (
                          <div className="font-semibold text-indigo-700 flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                              {assignedTech.name.charAt(0)}
                            </span>
                            {assignedTech.name}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAssignAmcModal(item);
                              setSelectedTechId("");
                            }}
                            className="text-amber-600 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <MdAssignmentInd /> Assign Tech
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.start_date || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.end_date || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700 whitespace-nowrap">
                        ₹{parseFloat(item.annual_value || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(item.status)}`}>
                          {item.status_display || item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailContract(item)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="View Contract Details"
                          >
                            <MdVisibility size={16} />
                          </button>
                          {item.amc_type === "warranty" && (
                            <button
                              onClick={() => handleGenerateWarrantyServices(item.id)}
                              className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-bold text-xs"
                              title="Sync 4 Free Quarterly Warranty Services"
                            >
                              🛡️
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setAssignAmcModal(item);
                              setSelectedTechId(item.assigned_technician || "");
                            }}
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Assign Technician"
                          >
                            <MdAssignmentInd size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAmc(item);
                              setShowAddForm(true);
                            }}
                            className="p-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                            title="Edit Contract"
                          >
                            <MdEdit size={16} />
                          </button>
                          <button
                            onClick={() => setRenewContract(item)}
                            className="p-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                            title="Renew Contract"
                          >
                            <MdAutorenew size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(item.id, item.status)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.status === "inactive"
                                ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                            title={item.status === "inactive" ? "Activate Contract" : "Deactivate Contract"}
                          >
                            {item.status === "inactive" ? <MdToggleOff size={18} /> : <MdToggleOn size={18} />}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                            title="Delete Contract"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {showAddForm && (
        <AddAmcForm
          open={showAddForm}
          onClose={() => {
            setShowAddForm(false);
            setSelectedAmc(null);
          }}
          onSuccess={() => {
            fetchContracts();
          }}
          baseApi={baseApi}
          amc={selectedAmc}
          token={token}
        />
      )}

      {/* View Contract Details Modal */}
      {detailContract && (
        <ContractDetailModal
          contract={detailContract}
          baseApi={baseApi}
          token={token}
          onClose={() => setDetailContract(null)}
          onEdit={(item) => {
            setDetailContract(null);
            setSelectedAmc(item);
            setShowAddForm(true);
          }}
          onAssignTech={(item) => {
            setDetailContract(null);
            setAssignAmcModal(item);
            setSelectedTechId(item.assigned_technician || "");
          }}
          onToggleStatus={(id, st) => {
            setDetailContract(null);
            handleToggleStatus(id, st);
          }}
          onRefresh={() => fetchContracts()}
        />
      )}

      {/* Renew AMC Contract Modal */}
      {renewContract && (
        <RenewAmcModal
          contract={renewContract}
          baseApi={baseApi}
          token={token}
          onClose={() => setRenewContract(null)}
          onSuccess={() => fetchContracts()}
        />
      )}

      {/* Assign Technician Modal */}
      {assignAmcModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <MdAssignmentInd className="text-indigo-600" />
                Assign Technician to AMC
              </h3>
              <button
                onClick={() => setAssignAmcModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTechnicianSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">AMC Contract:</p>
                <p className="text-sm font-bold text-slate-800">{assignAmcModal.contract_id} - {assignAmcModal.product}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Technician *
                </label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="">-- Unassign Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization}) - {t.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignAmcModal(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                >
                  Assign to AMC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
