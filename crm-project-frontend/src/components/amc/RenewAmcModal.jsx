import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import Swal from "sweetalert2";

export default function RenewAmcModal({ contract, baseApi, token, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    new_start_date: "",
    new_end_date: "",
    new_annual_value: "",
    payment_frequency: "quarterly",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contract) return;

    let defaultStart = "";
    let defaultEnd = "";

    if (contract.end_date) {
      const currentEnd = new Date(contract.end_date);
      currentEnd.setDate(currentEnd.getDate() + 1);
      defaultStart = currentEnd.toISOString().split("T")[0];

      const nextEnd = new Date(defaultStart);
      nextEnd.setFullYear(nextEnd.getFullYear() + 1);
      nextEnd.setDate(nextEnd.getDate() - 1);
      defaultEnd = nextEnd.toISOString().split("T")[0];
    } else {
      const today = new Date();
      defaultStart = today.toISOString().split("T")[0];
      const nextEnd = new Date(today);
      nextEnd.setFullYear(nextEnd.getFullYear() + 1);
      nextEnd.setDate(nextEnd.getDate() - 1);
      defaultEnd = nextEnd.toISOString().split("T")[0];
    }

    setFormData({
      new_start_date: defaultStart,
      new_end_date: defaultEnd,
      new_annual_value: contract.annual_value || "",
      payment_frequency: contract.payment_frequency || "quarterly",
      remarks: `Renewal cycle for ${contract.contract_id || 'AMC Contract'}`,
    });
  }, [contract]);

  useEffect(() => {
    if (formData.new_start_date) {
      const start = new Date(formData.new_start_date);
      if (!isNaN(start.getTime())) {
        start.setFullYear(start.getFullYear() + 1);
        start.setDate(start.getDate() - 1);
        const calculatedEnd = start.toISOString().split("T")[0];
        setFormData((prev) => ({ ...prev, new_end_date: calculatedEnd }));
      }
    }
  }, [formData.new_start_date]);

  if (!contract) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.new_start_date || !formData.new_end_date) {
      Swal.fire({ icon: "error", title: "Validation Error", text: "Start date and end date are required." });
      return;
    }
    if (!formData.new_annual_value || parseFloat(formData.new_annual_value) < 0) {
      Swal.fire({ icon: "error", title: "Validation Error", text: "Please enter a valid renewal annual value." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseApi}/amc/contracts/${contract.id}/renew/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          new_start_date: formData.new_start_date,
          new_end_date: formData.new_end_date,
          new_annual_value: parseFloat(formData.new_annual_value),
          payment_frequency: formData.payment_frequency,
          remarks: formData.remarks,
        }),
      });

      if (res.ok) {
        Swal.fire({ icon: "success", title: "Contract Renewed!", text: "AMC Contract has been renewed successfully.", timer: 1500, showConfirmButton: false });
        onSuccess && onSuccess();
        onClose && onClose();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.detail || "Failed to renew AMC contract.");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Renewal Failed", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const customerName = contract.customer_details?.company_name || contract.customer_details?.name || `Customer ID: ${contract.customer}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1050] p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Renew AMC Contract</h3>
            <p className="text-xs text-slate-500 mt-0.5">{contract.contract_id} · {customerName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500">
            <MdClose size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Start Date *</label>
              <input
                type="date"
                required
                value={formData.new_start_date}
                onChange={(e) => setFormData({ ...formData, new_start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New End Date *</label>
              <input
                type="date"
                required
                value={formData.new_end_date}
                onChange={(e) => setFormData({ ...formData, new_end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Value (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 15000"
                value={formData.new_annual_value}
                onChange={(e) => setFormData({ ...formData, new_annual_value: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Frequency *</label>
              <select
                value={formData.payment_frequency}
                onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
                <option value="half_yearly">Half Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Renewal Remarks / Notes</label>
            <textarea
              rows="3"
              placeholder="Add any specific notes for this renewal cycle..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow transition-colors disabled:opacity-50"
            >
              {loading ? "Renewing..." : "Confirm Renewal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
