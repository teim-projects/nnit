import { useState, useEffect, useMemo } from "react";
import Base from "../components/Base";
import ContractDetailModal from "../components/amc/ContractDetailModal";
import { openServicePdf } from "../utils/servicePdfGenerator";
import {
  MdMiscellaneousServices,
  MdAdd,
  MdSearch,
  MdEdit,
  MdDelete,
  MdAssignmentInd,
  MdCheckCircle,
  MdBuild,
  MdClose,
  MdRefresh,
  MdCalendarToday,
  MdShoppingBag,
  MdVisibility,
  MdArticle,
  MdPerson,
  MdEmail,
  MdMarkEmailRead,
  MdNotificationsActive
} from "react-icons/md";
import Swal from "sweetalert2";

export default function ServicePage() {
  const baseApi = import.meta.env.VITE_BASE_API_URL;
  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  ), []);

  const [services, setServices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productList, setProductList] = useState([]);
  const [amcContracts, setAmcContracts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");

  // Create / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    service_type: "warranty",
    customer: "",
    product_name: "",
    title: "",
    description: "",
    priority: "medium",
    scheduled_date: "",
    service_cost: "0.00",
    assigned_technician: ""
  });

  // Assign Technician Modal state
  const [assignModalService, setAssignModalService] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState("");

  // Update Status Modal state
  const [statusModalService, setStatusModalService] = useState(null);
  const [statusVal, setStatusVal] = useState("assigned");
  const [resNotes, setResNotes] = useState("");

  // View Contract / Details Modal state
  const [selectedContractForView, setSelectedContractForView] = useState(null);
  const [viewingServiceCall, setViewingServiceCall] = useState(null);

  const handleViewDetails = async (srv) => {
    const amcContractId = srv.amc_contract || srv.amc_contract_details?.id;
    if (amcContractId) {
      try {
        const res = await fetch(`${baseApi}/amc/contracts/${amcContractId}/`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (res.ok) {
          const contractData = await res.json();
          setSelectedContractForView(contractData);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch linked AMC contract", err);
      }
    }
    setViewingServiceCall(srv);
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      let url = `${baseApi}/api/services/service-requests/`;
      const params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (statusFilter !== "all") params.push(`status=${encodeURIComponent(statusFilter)}`);
      if (priorityFilter !== "all") params.push(`priority=${encodeURIComponent(priorityFilter)}`);
      if (serviceTypeFilter !== "all") params.push(`service_type=${encodeURIComponent(serviceTypeFilter)}`);

      if (params.length > 0) url += `?${params.join("&")}`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setServices(Array.isArray(data) ? data : data.results || []);
      } else {
        throw new Error("Failed to load service requests");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch services list" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      // 1. Fetch Active Technicians
      const techRes = await fetch(`${baseApi}/api/services/technicians/?status=active`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (techRes.ok) {
        const data = await techRes.json();
        setTechnicians(Array.isArray(data) ? data : data.results || []);
      }

      // 2. Fetch Customers (Centralized Lookup)
      let fetchedCusts = [];
      try {
        const custLookupRes = await fetch(`${baseApi}/api/services/service-requests/customers-lookup/`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (custLookupRes.ok) {
          const data = await custLookupRes.json();
          fetchedCusts = Array.isArray(data) ? data : data.results || [];
        }
      } catch (e) {
        console.warn("Primary customer lookup failed", e);
      }
      setCustomers(fetchedCusts);

      // 3. Fetch Products (Centralized Lookup)
      let fetchedProds = [];
      try {
        const prodLookupRes = await fetch(`${baseApi}/api/services/service-requests/products-lookup/`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (prodLookupRes.ok) {
          const data = await prodLookupRes.json();
          fetchedProds = Array.isArray(data) ? data : data.results || [];
        }
      } catch (e) {
        console.warn("Primary product lookup failed", e);
      }
      setProductList(fetchedProds);

      // 4. Fetch Active AMC Contracts
      try {
        const amcRes = await fetch(`${baseApi}/amc/contracts/`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (amcRes.ok) {
          const data = await amcRes.json();
          setAmcContracts(Array.isArray(data) ? data : data.results || []);
        }
      } catch (e) {
        console.warn("AMC contract lookup failed", e);
      }

    } catch (err) {
      console.error("Error loading dropdown data:", err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [search, statusFilter, priorityFilter, serviceTypeFilter]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      service_type: "warranty",
      customer: "",
      product_name: "",
      title: "",
      description: "",
      priority: "medium",
      scheduled_date: new Date().toISOString().split("T")[0],
      service_cost: "0.00",
      assigned_technician: ""
    });
    setShowModal(true);
  };

  const handleOpenEdit = (srv) => {
    setEditingService(srv);
    setFormData({
      service_type: srv.service_type || "warranty",
      customer: srv.customer || "",
      product_name: srv.product_name || "",
      title: srv.title || "",
      description: srv.description || "",
      priority: srv.priority || "medium",
      scheduled_date: srv.scheduled_date || "",
      service_cost: srv.service_cost || "0.00",
      assigned_technician: srv.assigned_technician || ""
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer) {
      Swal.fire({ icon: "warning", title: "Select Customer", text: "Please select a Customer for the Service Call." });
      return;
    }

    if (!formData.title.trim()) {
      Swal.fire({ icon: "warning", title: "Missing Title", text: "Please enter Service Title / Subject." });
      return;
    }

    const payload = {
      service_type: formData.service_type || "warranty",
      customer: formData.customer,
      product_name: formData.product_name.trim() || null,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      priority: formData.priority,
      scheduled_date: formData.scheduled_date || null,
      service_cost: parseFloat(formData.service_cost) || 0.00,
      assigned_technician: formData.assigned_technician ? parseInt(formData.assigned_technician, 10) : null
    };

    try {
      const url = editingService
        ? `${baseApi}/api/services/service-requests/${editingService.id}/`
        : `${baseApi}/api/services/service-requests/`;
      const method = editingService ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: editingService ? "Service Call updated" : "Service Call created successfully",
          timer: 1500,
          showConfirmButton: false
        });
        setShowModal(false);
        fetchServices();
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || JSON.stringify(errData));
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Submission Failed", text: err.message });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Service Call?",
      text: "Are you sure you want to delete this service call?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      confirmButtonColor: "#ef4444"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseApi}/api/services/service-requests/${id}/`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });

      if (res.ok) {
        Swal.fire({ icon: "success", text: "Service call deleted", timer: 1200, showConfirmButton: false });
        fetchServices();
      } else {
        throw new Error("Failed to delete service call");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalService) return;

    try {
      const res = await fetch(`${baseApi}/api/services/service-requests/${assignModalService.id}/assign/`, {
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
        Swal.fire({ icon: "success", text: "Technician assignment updated", timer: 1200, showConfirmButton: false });
        setAssignModalService(null);
        fetchServices();
      } else {
        throw new Error("Failed to assign technician");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalService) return;

    try {
      const res = await fetch(`${baseApi}/api/services/service-requests/${statusModalService.id}/update-status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: statusVal,
          resolution_notes: resNotes
        })
      });

      if (res.ok) {
        Swal.fire({ icon: "success", text: "Status updated successfully", timer: 1200, showConfirmButton: false });
        setStatusModalService(null);
        fetchServices();
      } else {
        throw new Error("Failed to update service status");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleSend2DayReminders = async () => {
    const confirm = await Swal.fire({
      title: "Send 2-Day Service Reminders?",
      text: "This will send email notifications to Customer, Assigned Technician, and Admin for all services scheduled in 2 days.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Send Emails",
      confirmButtonColor: "#4f46e5"
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${baseApi}/api/services/service-requests/send-2day-reminders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ days: 2 })
      });

      if (res.ok) {
        const data = await res.json();
        const count = data.summary?.processed || 0;
        Swal.fire({
          icon: "success",
          title: "Reminders Dispatched",
          text: `Processed 2-day reminder emails for ${count} scheduled service(s).`
        });
        fetchServices();
      } else {
        throw new Error("Failed to send 2-day reminders");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleSendSingle2DayReminder = async (srv) => {
    const confirm = await Swal.fire({
      title: `Send Reminder for ${srv.service_id}?`,
      text: "Sends email notifications to Customer, Technician, and Admin right now.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Send Email Now",
      confirmButtonColor: "#4f46e5"
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${baseApi}/api/services/service-requests/${srv.id}/send-2day-reminder/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        Swal.fire({ icon: "success", title: "Reminder Sent", text: `Emails dispatched for ${srv.service_id}.`, timer: 2000, showConfirmButton: false });
        fetchServices();
      } else {
        throw new Error("Failed to send reminder email");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  // Helper to reliably get customer display name
  const getCustomerDisplayName = (srv) => {
    if (!srv) return "No Customer";
    if (srv.customer_details) {
      return srv.customer_details.name || srv.customer_details.company_name || srv.customer_details.poc_name || `Customer #${srv.customer_details.id}`;
    }
    if (typeof srv.customer === "object" && srv.customer) {
      return srv.customer.name || srv.customer.company_name || srv.customer.poc_name || `Customer #${srv.customer.id}`;
    }
    if (srv.customer && customers.length > 0) {
      const match = customers.find(c => String(c.id) === String(srv.customer));
      if (match) return match.name || match.company_name || `Customer #${match.id}`;
    }
    return srv.customer ? `Customer #${srv.customer}` : "No Customer";
  };

  // Stats computation
  const stats = useMemo(() => {
    const total = services.length;
    const unassigned = services.filter(s => s.status === "unassigned").length;
    const inProgress = services.filter(s => s.status === "in_progress" || s.status === "assigned").length;
    const completed = services.filter(s => s.status === "completed").length;
    return { total, unassigned, inProgress, completed };
  }, [services]);

  return (
    <Base title="Service Management">
      <div className="p-4 md:p-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MdMiscellaneousServices className="text-indigo-600" />
              Service Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Create service calls, assign field technicians & track job resolution
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={handleSend2DayReminders}
              title="Send 2-Day Prior Service Reminders to Customer, Technician & Admin"
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-semibold border border-slate-200 shadow-sm transition duration-150 text-sm"
            >
              <MdNotificationsActive className="w-4 h-4 text-indigo-600" />
              Send 2-Day Reminders
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition duration-150"
            >
              <MdAdd className="w-5 h-5" />
              Create Service Call
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Service Calls</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
              <MdBuild className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Unassigned</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{stats.unassigned}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <MdAssignmentInd className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">In Progress</p>
              <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{stats.inProgress}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <MdBuild className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.completed}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MdCheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by Service ID, Title, Product, Customer, or Technician..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Service Types</option>
              <option value="warranty">Warranty Service (Free)</option>
              <option value="amc">AMC Service</option>
              <option value="normal">Normal / Paid Service</option>
            </select>

            <button
              onClick={() => { fetchServices(); fetchDropdownData(); }}
              title="Refresh"
              className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
            >
              <MdRefresh className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Service Requests Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading service requests...</div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <MdMiscellaneousServices className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-base font-medium">No service calls found</p>
              <p className="text-xs mt-1">Create a new service call or adjust search filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Service ID</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Title & Product</th>
                    <th className="py-3.5 px-4">Scheduled Date</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Assigned Technician</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {services.map((srv) => {
                    const custName = getCustomerDisplayName(srv);
                    const techName = srv.assigned_technician_details?.name || null;
                    const prodName = srv.product_name || null;

                    return (
                      <tr key={srv.id} className="hover:bg-slate-50/80 transition duration-150">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-indigo-600">{srv.service_id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 text-sm">{custName}</div>
                          {srv.customer_details?.contact_number && (
                            <div className="text-xs text-slate-400 mt-0.5">{srv.customer_details.contact_number}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 max-w-xs truncate">{srv.title}</div>
                          {prodName ? (
                            <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                              <MdShoppingBag className="w-3.5 h-3.5" /> {prodName}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 mt-0.5">No Product Specified</div>
                          )}
                          <div className="mt-1">
                            {srv.service_type === "warranty" && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                🛡️ Warranty (Free)
                              </span>
                            )}
                            {srv.service_type === "amc" && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                ⚙️ AMC Service
                              </span>
                            )}
                            {srv.service_type === "normal" && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                💳 Paid Call
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <MdCalendarToday className="text-slate-400" />
                            {srv.scheduled_date || "Not Scheduled"}
                          </div>
                          {srv.reminder_2days_sent ? (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <MdMarkEmailRead className="w-3 h-3 text-emerald-600" /> Reminder Sent
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px] text-slate-400">
                              Reminder Pending
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {srv.priority === "urgent" && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Urgent</span>
                          )}
                          {srv.priority === "high" && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">High</span>
                          )}
                          {srv.priority === "medium" && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Medium</span>
                          )}
                          {srv.priority === "low" && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Low</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {techName ? (
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                {techName.charAt(0)}
                              </span>
                              <div>
                                <div className="font-semibold text-slate-800 text-xs">{techName}</div>
                                <div className="text-[10px] text-slate-400">{srv.assigned_technician_details?.phone}</div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAssignModalService(srv);
                                setSelectedTechId("");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
                            >
                              <MdAssignmentInd className="w-3.5 h-3.5" /> Assign Technician
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setStatusModalService(srv);
                              setStatusVal(srv.status);
                              setResNotes(srv.resolution_notes || "");
                            }}
                            className="text-left"
                            title="Click to update status"
                          >
                            {srv.status === "unassigned" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Unassigned</span>
                            )}
                            {srv.status === "assigned" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Assigned</span>
                            )}
                            {srv.status === "in_progress" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse">In Progress</span>
                            )}
                            {srv.status === "on_hold" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">On Hold</span>
                            )}
                            {srv.status === "completed" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>
                            )}
                            {srv.status === "cancelled" && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">Cancelled</span>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openServicePdf(srv)}
                              title="View / Print PDF Report"
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition text-xs font-bold flex items-center gap-1 border border-indigo-200"
                            >
                              📄 PDF
                            </button>
                            <button
                              onClick={() => handleViewDetails(srv)}
                              title="View Details / Contract"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <MdVisibility className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setAssignModalService(srv);
                                setSelectedTechId(srv.assigned_technician || "");
                              }}
                              title="Assign/Reassign Technician"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <MdAssignmentInd className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSendSingle2DayReminder(srv)}
                              title="Send 2-Day Service Reminder Email Now"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <MdEmail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(srv)}
                              title="Edit Service Call"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <MdEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(srv.id)}
                              title="Delete Service Call"
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <MdDelete className="w-4 h-4" />
                            </button>
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

        {/* Modal: Create / Edit Service Call */}
        {showModal && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <MdMiscellaneousServices className="text-indigo-600" />
                  {editingService ? "Edit Service Call" : "Create New Service Call"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Service Type Selection */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Service Type *
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => {
                      const typeVal = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        service_type: typeVal,
                        service_cost: (typeVal === "warranty" || typeVal === "amc") ? "0.00" : prev.service_cost
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white font-bold text-slate-800"
                  >
                    <option value="warranty">🛡️ Warranty Service (1 Year Free Quarterly Warranty)</option>
                    <option value="amc">⚙️ AMC Service (Annual Maintenance Contract)</option>
                    <option value="normal">💳 Normal / Paid Service (Chargeable Call)</option>
                  </select>

                  {formData.service_type === "warranty" && (
                    <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                      <span className="font-bold">✨ 1 Year Free Warranty:</span>
                      <span>Quarterly service for 1 year - 100% Free of charge for customer (Service Cost: ₹0.00).</span>
                    </div>
                  )}

                  {formData.service_type === "amc" && (
                    <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center gap-2">
                      <span className="font-bold">⚙️ AMC Service Call:</span>
                      <span>Covered under active AMC Contract. Select contract below to auto-fill details.</span>
                    </div>
                  )}
                </div>

                {/* AMC Contract Link & Auto-fill */}
                <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200">
                  <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>⚙️ Link AMC Contract (Auto-fills Customer, Product & Details)</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">Auto-Sync</span>
                  </label>
                  <select
                    value={formData.amc_contract || ""}
                    onChange={(e) => {
                      const amcId = e.target.value;
                      const selectedAMC = amcContracts.find(a => String(a.id) === String(amcId));
                      if (selectedAMC) {
                        setFormData(prev => ({
                          ...prev,
                          amc_contract: amcId,
                          service_type: "amc",
                          customer: selectedAMC.customer?.id || selectedAMC.customer || prev.customer,
                          product_name: selectedAMC.product || prev.product_name,
                          assigned_technician: selectedAMC.assigned_technician?.id || selectedAMC.assigned_technician || prev.assigned_technician,
                          description: selectedAMC.default_work_description || selectedAMC.scope_of_support || prev.description,
                          service_cost: selectedAMC.annual_value ? String(selectedAMC.annual_value) : prev.service_cost
                        }));
                      } else {
                        setFormData(prev => ({ ...prev, amc_contract: amcId }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white font-medium text-slate-800"
                  >
                    <option value="">-- Select Active AMC Contract to Auto-fill All Details --</option>
                    {amcContracts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.contract_id || `AMC #${a.id}`} - {a.customer_name || a.customer?.name || "Customer"} ({a.product || "Product"}) - ₹{a.annual_value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Customer *
                  </label>
                  <select
                    required
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.company_name || c.poc_name || `Customer #${c.id}`} {c.phone ? `(${c.phone})` : c.contact_number ? `(${c.contact_number})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product / Equipment Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Product / Equipment Serviced</span>
                    <span className="text-[10px] text-slate-400 font-normal">Select product or type custom below</span>
                  </label>
                  <div className="space-y-2">
                    <select
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    >
                      <option value="">-- Select Product from Master / Type Custom below --</option>
                      {productList.map((p) => (
                        <option key={p.id} value={p.name || p.display_name}>
                          {p.name || p.display_name} {p.code ? `(${p.code})` : ""}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or enter custom product name (e.g. Stacker Parking / VRF AC System)..."
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                {/* Title & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Service Title / Problem Subject *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Quarterly AC Filter Cleaning / Compressor Repair"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Priority *
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Scheduled Date & Cost */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Scheduled Service Date
                    </label>
                    <input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Service Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.service_cost}
                      onChange={(e) => setFormData({ ...formData, service_cost: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                {/* Technician Assignment Option */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assign Field Technician (Optional)
                  </label>
                  <select
                    value={formData.assigned_technician}
                    onChange={(e) => setFormData({ ...formData, assigned_technician: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  >
                    <option value="">-- Unassigned (Assign Later) --</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.specialization}) - {tech.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description & Customer Complaints / Instructions
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Enter detailed service description or requirements..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                  >
                    {editingService ? "Save Changes" : "Create Service Call"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Quick Assign Technician */}
        {assignModalService && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <MdAssignmentInd className="text-indigo-600" />
                  Assign Technician
                </h3>
                <button
                  onClick={() => setAssignModalService(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Service Call:</p>
                  <p className="text-sm font-bold text-slate-800">{assignModalService.service_id} - {assignModalService.title}</p>
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
                    <option value="">-- Remove / Unassign Technician --</option>
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
                    onClick={() => setAssignModalService(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                  >
                    Assign Technician
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Update Status & Resolution */}
        {statusModalService && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <MdCheckCircle className="text-emerald-600" />
                  Update Service Status
                </h3>
                <button
                  onClick={() => setStatusModalService(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Service Call:</p>
                  <p className="text-sm font-bold text-slate-800">{statusModalService.service_id} - {statusModalService.title}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Service Status *
                  </label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  >
                    <option value="unassigned">Unassigned</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Resolution / Work Summary Notes
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Enter resolution notes, parts replaced, or technician feedback..."
                    value={resNotes}
                    onChange={(e) => setResNotes(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStatusModalService(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                  >
                    Save Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* AMC / Warranty Contract Detailed View Modal */}
        {selectedContractForView && (
          <ContractDetailModal
            contract={selectedContractForView}
            baseApi={baseApi}
            token={token}
            onClose={() => setSelectedContractForView(null)}
            onEdit={(amc) => {
              setSelectedContractForView(null);
            }}
            onAssignTech={(amc) => {
              setSelectedContractForView(null);
            }}
            onRefresh={() => fetchServices()}
          />
        )}

        {/* Standalone Service Call View Modal */}
        {viewingServiceCall && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <MdMiscellaneousServices className="text-blue-200" />
                    Service Call Details – {viewingServiceCall.service_id}
                  </h3>
                  <p className="text-xs text-blue-100 mt-1">
                    {getCustomerDisplayName(viewingServiceCall)} · {viewingServiceCall.product_name || "No Product Specified"}
                  </p>
                </div>
                <button
                  onClick={() => setViewingServiceCall(null)}
                  className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition"
                >
                  <MdClose size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">SERVICE TYPE</span>
                    <span className="font-bold text-indigo-700 capitalize text-sm">
                      {viewingServiceCall.service_type === "warranty" ? "🛡️ Warranty Service (Free)" : viewingServiceCall.service_type === "amc" ? "⚙️ AMC Service" : "💳 Paid Call"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">PRIORITY & STATUS</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase text-slate-700">{viewingServiceCall.priority}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {viewingServiceCall.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Scheduled Date:</span>
                    <span className="font-bold text-slate-800">{viewingServiceCall.scheduled_date || "Not Scheduled"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Service Cost:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">₹ {parseFloat(viewingServiceCall.service_cost || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Assigned Technician:</span>
                  <span className="font-bold text-indigo-700">
                    {viewingServiceCall.assigned_technician_details?.name ? (
                      `${viewingServiceCall.assigned_technician_details.name} (${viewingServiceCall.assigned_technician_details.phone})`
                    ) : (
                      "Not Assigned"
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Title & Problem Description:</span>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium">
                    {viewingServiceCall.title}
                  </p>
                  {viewingServiceCall.description && (
                    <p className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line">
                      {viewingServiceCall.description}
                    </p>
                  )}
                </div>

                {viewingServiceCall.resolution_notes && (
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Resolution Notes:</span>
                    <p className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                      {viewingServiceCall.resolution_notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                <button
                  onClick={() => openServicePdf(viewingServiceCall)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  📄 View PDF Report
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const callToEdit = viewingServiceCall;
                      setViewingServiceCall(null);
                      handleOpenEdit(callToEdit);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <MdEdit className="inline mr-1" /> Edit Service Call
                  </button>
                  <button
                    onClick={() => setViewingServiceCall(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Base>
  );
}
