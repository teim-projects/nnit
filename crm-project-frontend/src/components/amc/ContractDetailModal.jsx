import { MdClose, MdHistory, MdPerson, MdCalendarToday, MdMonetizationOn, MdAssignment } from "react-icons/md";

export default function ContractDetailModal({ contract, onClose }) {
  if (!contract) return null;

  const getStatusBadge = (status) => {
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

  const customerName = contract.customer_details?.company_name || contract.customer_details?.name || `Customer ID: ${contract.customer}`;
  const coordinatorName = contract.support_coordinator_details?.full_name || contract.support_coordinator_details?.email || "Unassigned";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[1050] p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b bg-slate-50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">{contract.contract_id || "AMC Contract"}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(contract.status)}`}>
                {contract.status_display || contract.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              {customerName} · Product: {contract.product || "N/A"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1">
            <MdClose size={24} />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border-b">
          <div className="bg-white p-4">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <MdMonetizationOn className="text-emerald-600" /> Annual Value
            </p>
            <p className="text-base font-bold text-slate-800 mt-1">
              ₹{parseFloat(contract.annual_value || 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-white p-4">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <MdCalendarToday className="text-blue-600" /> Active Period
            </p>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              {contract.start_date || "—"} → {contract.end_date || "—"}
            </p>
          </div>
          <div className="bg-white p-4">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <MdAssignment className="text-purple-600" /> AMC Type
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              {contract.amc_type_display || (contract.amc_type === "comprehensive" ? "Comprehensive" : "Non-Comprehensive")}
            </p>
          </div>
          <div className="bg-white p-4">
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <MdPerson className="text-amber-600" /> Coordinator
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-1 truncate">
              {coordinatorName}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Customer Information</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Customer Name:</dt>
                  <dd className="font-medium text-slate-800">{customerName}</dd>
                </div>
                {contract.customer_details?.contact_number && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Contact Number:</dt>
                    <dd className="font-medium text-slate-800">{contract.customer_details.contact_number}</dd>
                  </div>
                )}
                {contract.customer_details?.email && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Email:</dt>
                    <dd className="font-medium text-slate-800">{contract.customer_details.email}</dd>
                  </div>
                )}
                {contract.project_name && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Project Name:</dt>
                    <dd className="font-medium text-slate-800">{contract.project_name}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Contract Specifications</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Product / Equipment:</dt>
                  <dd className="font-medium text-slate-800">{contract.product || "N/A"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Payment Frequency:</dt>
                  <dd className="font-medium text-slate-800">{contract.payment_frequency_display || contract.payment_frequency}</dd>
                </div>
                {contract.scope_of_support && (
                  <div className="mt-2">
                    <dt className="text-slate-500 text-xs font-medium">Scope of Support:</dt>
                    <dd className="mt-1 text-xs text-slate-700 bg-white p-2 rounded border border-slate-200 whitespace-pre-line">
                      {contract.scope_of_support}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Renewal Cycles Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MdHistory className="text-blue-600" size={20} />
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Contract Renewal Cycles History</h4>
            </div>

            {(!contract.cycles || contract.cycles.length === 0) ? (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-md border text-center">
                No renewal cycle history recorded.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2">Cycle #</th>
                      <th className="px-3 py-2">Start Date</th>
                      <th className="px-3 py-2">End Date</th>
                      <th className="px-3 py-2">Annual Value</th>
                      <th className="px-3 py-2">Frequency</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contract.cycles.map((cycle) => (
                      <tr key={cycle.id || cycle.cycle_number} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-slate-800">Cycle #{cycle.cycle_number}</td>
                        <td className="px-3 py-2.5">{cycle.start_date}</td>
                        <td className="px-3 py-2.5">{cycle.end_date}</td>
                        <td className="px-3 py-2.5 font-semibold text-emerald-700">
                          ₹{parseFloat(cycle.annual_value || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2.5 capitalize">{cycle.payment_frequency_display || cycle.payment_frequency}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadge(cycle.status)}`}>
                            {cycle.status_display || cycle.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 italic truncate max-w-[150px]">
                          {cycle.remarks || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-700 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
