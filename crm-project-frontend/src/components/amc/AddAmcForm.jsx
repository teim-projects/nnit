import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import ReusableForm from "../Form";

const AMC_TYPE_OPTIONS = [
  { value: "comprehensive", label: "Comprehensive" },
  { value: "non_comprehensive", label: "Non-Comprehensive" },
];

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
  { value: "monthly", label: "Monthly" },
  { value: "half_yearly", label: "Half Yearly" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "inactive", label: "Inactive" },
];

const emptyFormData = {
  customer: "",
  product: "",
  project_name: "",
  amc_type: "comprehensive",
  payment_frequency: "quarterly",
  annual_value: "",
  start_date: "",
  end_date: "",
  support_coordinator: "",
  scope_of_support: "",
  status: "active",
};

export default function AddAmcForm({
  open,
  onClose,
  onSuccess,
  baseApi,
  amc = null,
  token,
}) {
  const [formData, setFormData] = useState(emptyFormData);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [coordinators, setCoordinators] = useState([]);

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    if (!open) return;

    const fetchDropdownData = async () => {
      try {
        const custRes = await fetch(`${baseApi}/lead/customer/`, { headers });
        if (custRes.ok) {
          const data = await custRes.json();
          setCustomers(Array.isArray(data) ? data : data.results || []);
        } else {
          // Fallback to quotation customer endpoint if needed
          const qCustRes = await fetch(`${baseApi}/quotation/customer/`, { headers });
          if (qCustRes.ok) {
            const data = await qCustRes.json();
            setCustomers(Array.isArray(data) ? data : data.results || []);
          }
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
      }

      try {
        const userRes = await fetch(`${baseApi}/auth/dj-rest-auth/user/`, { headers });
        if (userRes.ok) {
          const uData = await userRes.json();
          setCoordinators(Array.isArray(uData) ? uData : [uData]);
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    fetchDropdownData();
  }, [open, baseApi, token]);

  useEffect(() => {
    if (!amc || !open) {
      setFormData(emptyFormData);
      return;
    }

    setFormData({
      customer: amc.customer || "",
      product: amc.product || "",
      project_name: amc.project_name || "",
      amc_type: amc.amc_type || "comprehensive",
      payment_frequency: amc.payment_frequency || "quarterly",
      annual_value: amc.annual_value || "",
      start_date: amc.start_date || "",
      end_date: amc.end_date || "",
      support_coordinator: amc.support_coordinator || "",
      scope_of_support: amc.scope_of_support || "",
      status: amc.status || "active",
    });
  }, [amc, open]);

  // Auto-calculate end_date (+1 yr - 1 day) from start_date
  useEffect(() => {
    if (formData.start_date && !amc) {
      const start = new Date(formData.start_date);
      if (!isNaN(start.getTime())) {
        start.setFullYear(start.getFullYear() + 1);
        start.setDate(start.getDate() - 1);
        const formattedEnd = start.toISOString().split("T")[0];
        setFormData((prev) => ({
          ...prev,
          end_date: formattedEnd,
        }));
      }
    }
  }, [formData.start_date, amc]);

  if (!open) return null;

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.company_name || c.name} (${c.contact_number || c.email || 'ID: ' + c.id})`,
  }));

  if (amc?.customer && !customerOptions.some((o) => String(o.value) === String(amc.customer))) {
    const custDetail = amc.customer_details;
    customerOptions.unshift({
      value: amc.customer,
      label: custDetail?.company_name || custDetail?.name || `Customer #${amc.customer}`,
    });
  }

  const coordinatorOptions = coordinators.map((u) => ({
    value: u.pk || u.id,
    label: u.full_name || u.username || u.email,
  }));

  const validate = () => {
    if (!formData.customer) {
      Swal.fire({ icon: "error", title: "Validation", text: "Customer is required" });
      return false;
    }
    if (!formData.product) {
      Swal.fire({ icon: "error", title: "Validation", text: "Product / Equipment is required" });
      return false;
    }
    if (!formData.annual_value || isNaN(parseFloat(formData.annual_value)) || parseFloat(formData.annual_value) < 0) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please enter a valid Annual Value (₹)" });
      return false;
    }
    if (!formData.start_date || !formData.end_date) {
      Swal.fire({ icon: "error", title: "Validation", text: "Start date and End date are required" });
      return false;
    }
    return true;
  };

  const formatBackendErrors = (errorData) => {
    if (typeof errorData === "string") return errorData;
    if (errorData.detail) return errorData.detail;
    if (typeof errorData === "object" && errorData !== null) {
      return Object.entries(errorData)
        .map(([field, msgs]) => {
          const fieldName = field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          const message = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
          return `${fieldName}: ${message}`;
        })
        .join("\n");
    }
    return "An unexpected error occurred.";
  };

  const handleSubmit = async (data) => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        customer: parseInt(data.customer, 10),
        product: data.product,
        project_name: data.project_name || null,
        amc_type: data.amc_type,
        payment_frequency: data.payment_frequency,
        annual_value: parseFloat(data.annual_value),
        start_date: data.start_date,
        end_date: data.end_date,
        support_coordinator: data.support_coordinator ? parseInt(data.support_coordinator, 10) : null,
        scope_of_support: data.scope_of_support || "",
        status: data.status,
      };

      const url = amc ? `${baseApi}/amc/contracts/${amc.id}/` : `${baseApi}/amc/contracts/`;
      const method = amc ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(formatBackendErrors(errorData));
      }

      Swal.fire({
        icon: "success",
        text: amc ? "Contract updated successfully" : "Contract created successfully",
        timer: 1200,
        showConfirmButton: false,
      });

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to save AMC contract" });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "customer",
      label: "Customer",
      type: "searchable_select",
      required: true,
      placeholder: "Search and select customer...",
      options: customerOptions,
      gridCols: 1,
    },
    {
      name: "product",
      label: "Product / Equipment",
      type: "text",
      required: true,
      placeholder: "e.g., Double Stack Parking System, Split AC 1.5 Ton",
      gridCols: 1,
    },
    {
      name: "project_name",
      label: "Project Name (optional)",
      type: "text",
      placeholder: "e.g. Tower A Residential",
      gridCols: 1,
    },
    {
      name: "amc_type",
      label: "Type of AMC",
      type: "select",
      required: true,
      options: AMC_TYPE_OPTIONS,
      gridCols: 1,
    },
    {
      name: "payment_frequency",
      label: "Payment Frequency",
      type: "select",
      required: true,
      options: PAYMENT_FREQUENCY_OPTIONS,
      gridCols: 1,
    },
    {
      name: "annual_value",
      label: "Annual Value (₹)",
      type: "number",
      required: true,
      placeholder: "e.g., 25000",
      gridCols: 1,
    },
    {
      name: "start_date",
      label: "AMC Start Date",
      type: "date",
      required: true,
      gridCols: 1,
    },
    {
      name: "end_date",
      label: "AMC End Date",
      type: "date",
      required: true,
      gridCols: 1,
    },
    {
      name: "support_coordinator",
      label: "Support Coordinator (optional)",
      type: "select",
      placeholder: "Select coordinator...",
      options: coordinatorOptions,
      gridCols: 1,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: STATUS_OPTIONS,
      gridCols: 1,
    },
    {
      name: "scope_of_support",
      label: "Scope of Support (optional)",
      type: "textarea",
      placeholder: "Enter details of services included in this AMC...",
      gridCols: 2,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-[1050] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl relative max-h-[90vh] flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">{amc ? "Edit AMC Contract" : "Create New AMC Contract"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 font-bold text-xl transition-colors">✕</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <ReusableForm
            fields={fields}
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            loading={loading}
            submitText={amc ? "Update Contract" : "Create Contract"}
            onCancel={onClose}
            showCancel={true}
          />
        </div>
      </div>
    </div>
  );
}