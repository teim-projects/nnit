import { useState, useEffect } from "react";
import { MdEdit, MdDelete, MdAutorenew, MdVisibility, MdToggleOn, MdToggleOff } from "react-icons/md";
import Swal from "sweetalert2";
import AddAmcForm from "./AddAmcForm";
import ContractDetailModal from "./ContractDetailModal";
import RenewAmcModal from "./RenewAmcModal";

export default function AmcList({ baseApi, token, filters = {} }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAmc, setSelectedAmc] = useState(null);
  const [filterType, setFilterType] = useState("all"); // all, active, expiring_soon, expired, scheduled, renewed
  const [detailContract, setDetailContract] = useState(null);
  const [renewContract, setRenewContract] = useState(null);

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

  useEffect(() => {
    fetchContracts();
  }, [filterType, baseApi, token, filters]);

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
        Swal.fire({ icon: "success", text: `Contract status updated`, timer: 1200, showConfirmButton: false });
        fetchContracts();
      } else {
        throw new Error("Failed to toggle status");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "expiring_soon":
        return "bg-amber-100 text-amber-800 border border-amber-200";
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

  const filterTabs = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "expiring_soon", label: "Expiring Soon" },
    { key: "expired", label: "Expired" },
    { key: "scheduled", label: "Scheduled" },
    { key: "renewed", label: "Renewed" },
    { key: "inactive", label: "Inactive" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls Card */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">AMC Contracts List</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? "Loading..." : `${contracts.length} contract(s) found`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  filterType === tab.key
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            + Create AMC Contract
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">Contract ID</th>
                <th className="px-4 py-3.5">Customer Name</th>
                <th className="px-4 py-3.5">Product / Equipment</th>
                <th className="px-4 py-3.5">AMC Type</th>
                <th className="px-4 py-3.5">Frequency</th>
                <th className="px-4 py-3.5">Start Date</th>
                <th className="px-4 py-3.5">End Date</th>
                <th className="px-4 py-3.5">Annual Value</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-4 py-12 text-center text-sm text-slate-400">
                    Loading contracts...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-4 py-12 text-center text-sm text-slate-500">
                    No AMC contracts found matching your filters.
                  </td>
                </tr>
              ) : (
                contracts.map((item, index) => {
                  const customerName =
                    item.customer_details?.company_name ||
                    item.customer_details?.name ||
                    `Customer #${item.customer}`;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-bold text-blue-600">{item.contract_id || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{customerName}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{item.product || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.amc_type_display || (item.amc_type === "comprehensive" ? "Comprehensive" : "Non-Comprehensive")}
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize">
                        {item.payment_frequency_display || item.payment_frequency}
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
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setDetailContract(item)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="View Contract Details & History"
                          >
                            <MdVisibility size={16} />
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
                            title="Renew Contract (New Cycle)"
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
          onClose={() => setDetailContract(null)}
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
    </div>
  );
}
