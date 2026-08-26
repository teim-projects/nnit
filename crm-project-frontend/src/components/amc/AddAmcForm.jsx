import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import ReusableForm from "../Form";

const AMC_TYPE_OPTIONS = [
  { value: "comprehensive", label: "Comprehensive AMC" },
  { value: "non_comprehensive", label: "Non-Comprehensive AMC" },
  { value: "warranty", label: "1 Year Warranty (4 Free Quarterly Services)" },
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
  linked_service: "",
  product: "",
  project_name: "",
  amc_type: "comprehensive",
  payment_frequency: "quarterly",
  annual_value: "",
  start_date: "",
  end_date: "",
  support_coordinator: "",
  scope_of_support: "",
  default_customer_contact: "",
  default_customer_address: "",
  default_gps_location: "",
  default_work_description: "",
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
  const [customerServices, setCustomerServices] = useState([]);

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    if (!open) return;

    const fetchDropdownData = async () => {
      // 1. Fetch Customers via lookup endpoint
      try {
        const custRes = await fetch(`${baseApi}/api/services/service-requests/customers-lookup/`, { headers });
        if (custRes.ok) {
          const data = await custRes.json();
          setCustomers(Array.isArray(data) ? data : data.results || []);
        } else {
          const fallbackRes = await fetch(`${baseApi}/lead/customers/?all=true`, { headers });
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            setCustomers(Array.isArray(data) ? data : data.results || []);
          }
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
      }

      // 2. Fetch User Coordinators
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
      linked_service: amc.linked_service || "",
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

  // Fetch Services for selected Customer
  useEffect(() => {
    if (!formData.customer) {
      setCustomerServices([]);
      return;
    }

    const fetchServicesForCustomer = async () => {
      try {
        const res = await fetch(`${baseApi}/api/services/service-requests/?customer=${formData.customer}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.results || [];
          setCustomerServices(items);
        }
      } catch (err) {
        console.error("Error fetching customer services:", err);
      }
    };

    fetchServicesForCustomer();
  }, [formData.customer, baseApi, token]);

  // AMC contract is ALWAYS 1 Year duration. Auto-calculate end_date based on start_date.
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
    label: `${c.company_name || c.name} ${c.phone ? '(' + c.phone + ')' : c.contact_number ? '(' + c.contact_number + ')' : ''}`,
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

  const filteredServices = customerServices.filter((s) => {
    // If editing AMC and this service is currently linked, keep it
    if (formData.linked_service && String(s.id) === String(formData.linked_service)) {
      return true;
    }
    // Only show service calls created directly in Service Management (standalone / amc_contract is null)
    if (s.amc_contract) return false;
    if (s.title && String(s.title).toLowerCase().includes("scheduled amc visit")) return false;
    return true;
  });

  const serviceOptions = [
    { value: "", label: "-- None / No Linked Service Call --" },
    ...filteredServices.map((s) => ({
      value: s.id,
      label: `${s.service_id || ''} - ${s.title || ''} ${s.product_name ? '(' + s.product_name + ')' : ''}`.trim(),
    }))
  ];

  const handleCustomFormChange = (newFormData) => {
    // If customer changed, auto-populate customer details
    if (newFormData.customer !== formData.customer && newFormData.customer) {
      const matchedCust = customers.find((c) => String(c.id) === String(newFormData.customer));
      if (matchedCust) {
        newFormData.default_customer_contact = matchedCust.contact_number || matchedCust.phone || matchedCust.poc_contact_number || "";
        newFormData.default_customer_address = matchedCust.address || matchedCust.site_address || "";
        newFormData.default_gps_location = matchedCust.gps_location || "";
      }
    }

    // If linked_service changed, auto-populate service details
    if (newFormData.linked_service !== formData.linked_service && newFormData.linked_service) {
      const matched = customerServices.find((s) => String(s.id) === String(newFormData.linked_service));
      if (matched) {
        if (matched.product_name) newFormData.product = matched.product_name;
        if (matched.description || matched.title) newFormData.default_work_description = matched.description || matched.title;
        const cust = matched.customer_details;
        if (cust) {
          if (cust.phone || cust.contact_number) newFormData.default_customer_contact = cust.phone || cust.contact_number;
          if (cust.address) newFormData.default_customer_address = cust.address;
          if (cust.gps_location) newFormData.default_gps_location = cust.gps_location;
        }
      }
    }

    // If amc_type changed to warranty
    if (newFormData.amc_type !== formData.amc_type && newFormData.amc_type === "warranty") {
      newFormData.payment_frequency = "quarterly";
      if (!newFormData.annual_value || parseFloat(newFormData.annual_value) === 0) {
        newFormData.annual_value = "0.00";
      }
      if (!newFormData.scope_of_support) {
        newFormData.scope_of_support = "1 Year Free Warranty Coverage - Includes 4 Free Quarterly Service Calls (Q1, Q2, Q3, Q4).";
      }
    }
    setFormData(newFormData);
  };

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
        linked_service: data.linked_service ? parseInt(data.linked_service, 10) : null,
        product: data.product,
        project_name: data.project_name || null,
        amc_type: data.amc_type,
        payment_frequency: data.payment_frequency,
        annual_value: parseFloat(data.annual_value),
        start_date: data.start_date,
        end_date: data.end_date,
        support_coordinator: data.support_coordinator ? parseInt(data.support_coordinator, 10) : null,
        scope_of_support: data.scope_of_support || "",
        default_customer_contact: data.default_customer_contact || null,
        default_customer_address: data.default_customer_address || null,
        default_gps_location: data.default_gps_location || null,
        default_work_description: data.default_work_description || null,
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
      name: "linked_service",
      label: "Linked Service Call (optional)",
      type: "select",
      placeholder: "-- Select Customer's Service Call --",
      options: serviceOptions,
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
    {
      name: "default_customer_contact",
      label: "Default Contact Number (optional)",
      type: "text",
      placeholder: "Contact phone number for service visits...",
      gridCols: 1,
    },
    {
      name: "default_gps_location",
      label: "Default GPS Location URL (optional)",
      type: "text",
      placeholder: "Google Maps link...",
      gridCols: 1,
    },
    {
      name: "default_customer_address",
      label: "Default Service Address (optional)",
      type: "textarea",
      placeholder: "Enter full address for service visits...",
      gridCols: 2,
    },
    {
      name: "default_work_description",
      label: "Default Work Description (optional)",
      type: "textarea",
      placeholder: "Default task instructions for field technicians...",
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
            onChange={handleCustomFormChange}
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