import React, { useCallback, useEffect, useMemo, useState } from "react";
import Base from "../components/Base";
import TableView from "../components/TableView";
import LeadDetails from "../components/lead/LeadDetails";
import AddLeadFollowUpFormNew from "../components/lead/AddLeadFollowUpForm";
import AddLeadForm from "../components/lead/AddLeadForm";
import { IoLogoWhatsapp } from "react-icons/io5";
import { MdEmail, MdDelete, MdRemoveRedEye, MdAdd, MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
import { useModulePermissions } from '../hooks/useAuth';
import AddQuotation from "../components/quotations/AddQuotation";


export default function Lead() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  
  console.log("Lead BASE_API =", BASE_API);
  
  if (!BASE_API) {
    console.error("❌ VITE_BASE_API_URL is not defined!");
  }
  
  const API_URL = `${BASE_API}/lead/lead/`;

  // ✅ Called hook to get module permissions
  const { canView, canCreate, canEdit, canDelete, userRole, isLoading: loadingUser } = useModulePermissions("leads");

  const activeUserRole = (localStorage.getItem("user_role") || userRole?.name || "").toLowerCase();
  const isSuper = userRole?.name === 'admin' || userRole?.is_superuser || activeUserRole === 'admin';
  const isDesignerRole = activeUserRole === 'designer' && !isSuper;

  const initialFilters = useMemo(() => ({
    search: "",
    status: "",
    assign_to: "",
    lead_source: "",
    date: { from: "", to: "" },
    followup_date: { from: "", to: "" },
    overdue: [],
    sort_by: "",
  }), []);

  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [quotationLeadData, setQuotationLeadData] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const displayedRows = useMemo(() => {
    if (isSuper || !isDesignerRole) return rows;
    const existingReqs = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
    const activeSentReqs = existingReqs.filter(r => 
      r.status === "pending_drawing" || r.status === "drawing_completed" || r.status === "attached_to_quotation"
    );
    const reqLeadIds = new Set(activeSentReqs.map(r => String(r.leadId)));
    const reqCustomerNames = new Set(activeSentReqs.map(r => (r.customerName || "").trim().toLowerCase()));

    return rows.filter(r => {
      const leadIdStr = String(r.id);
      const name = (r.contact_person_name || r.customer_name || r.customer?.name || "").trim().toLowerCase();
      return (
        reqLeadIds.has(leadIdStr) ||
        (name && reqCustomerNames.has(name)) ||
        r.sent_to_designer === true ||
        (r.designer_status && r.designer_status !== "none")
      );
    });
  }, [rows, isDesignerRole, isSuper]);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE_FALLBACK = 10;

  // modal / edit state
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [leadDetailsId, setLeadDetailsId] = useState(null);

  const [showLeadFollowUp, setShowLeadFollowUp] = useState(false);
  const [followUpLeadId, setFollowUpLeadId] = useState(null);

  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assignToOptions, setAssignToOptions] = useState([]);

  const token = useMemo(() => (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  ), []);

  const status_choice = useMemo(() => [
    { value: "open", label: "Open" },
    { value: "close_win", label: "Close Win" },
    { value: "close_loss", label: "Close Loss" },
  ], []);

  const leadSourceOptions = useMemo(() => [
    { value: "google_ads", label: "Google Ads" },
    { value: "indiamart", label: "IndiaMART" },
    { value: "bni", label: "BNI" },
    { value: "justdial", label: "Justdial" },
    { value: "reference", label: "Reference" },
    { value: "architect/interior_designer", label: "Architect Interior Designer" },
    { value: "builder", label: "Builder" },
    { value: "existing_customer", label: "Existing Customer" },
    { value: "ka_staff", label: "KA Staff" },
    { value: "other", label: "Other" },
  ], []);


  // =========================================================
  //  useEffect: Fetch Staff Data for Filters (Conditional Fetch)
  // =========================================================
  useEffect(() => {
    // ✅ Only fetch if token exists AND user role is NOT sales
    if (!token || userRole?.name === "sales" || loadingUser) {
      setAssignToOptions([]);
      setLoadingStaff(false);
      return;
    }

    setLoadingStaff(true);
    const controller = new AbortController();

    const staffUrl = `${BASE_API.replace(/\/$/, "")}/auth/staff/?search=sales`;

    fetch(staffUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Failed to fetch staff: ${res.status} ${res.statusText} ${txt}`);
        }
        return res.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : data.results ?? [];
        const mappedStaff = items.map((u) => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        }));
        setAssignToOptions(mappedStaff);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error("Failed to fetch assignable staff:", err);
        setAssignToOptions([]);
      })
      .finally(() => setLoadingStaff(false));

    return () => controller.abort();

  }, [BASE_API, token, userRole, loadingUser]); // Added userRole, loadingUser to deps
  // =========================================================


  const baseFilters = useMemo(() => [
    { key: "search", type: "search", label: "Search", placeholder: "Search name, email, contact..." },
    {
      key: "status",
      type: "select",
      label: "Status",
      placeholder: "Status",
      options: [...status_choice.map(r => ({ value: r.value, label: r.label }))]
    },
    // Assign To filter definition
    {
      key: "assign_to",
      type: "select",
      label: loadingStaff ? "Assign to (Loading...)" : "Assign to",
      placeholder: "Assign to",
      options: assignToOptions.map(at => ({ value: String(at.id), label: at.name }))
    },
    {
      key: "lead_source",
      type: "select",
      label: "Source",
      placeholder: "Source",
      options: [...leadSourceOptions.map(ls => ({ value: ls.value, label: ls.label }))]
    },
    {
      key: "overdue",
      type: "checkbox",
      label: "Overdue Follow-ups",
      options: [
        { value: "true", label: "Show only overdue" }
      ]
    },
    {
      key: "date",
      type: "daterange",
      label: "Lead Date",
    },
    {
      key: "followup_date",
      type: "daterange",
      label: "Follow-up Date",
    },
    {
      key: "sort_by",
      type: "select",
      label: "Sort By",
      placeholder: "Default (Priority)",
      options: [
        { value: "-date",           label: "Newest First" },
        { value: "date",            label: "Oldest First" },
        { value: "customer__name",  label: "Customer Name A to Z" },
        { value: "-customer__name", label: "Customer Name Z to A" },
        { value: "followup_date",   label: "Follow-up Date Ascending" },
        { value: "-followup_date",  label: "Follow-up Date Descending" },
      ],
    },
  ], [status_choice, assignToOptions, loadingStaff, leadSourceOptions]);

  // ✅ CONDITIONAL FILTERING LOGIC: Hide Assign To filter for sales users
  const leadFilters = useMemo(() => {
    // If user role is still loading, show no filters to prevent flicker
    if (loadingUser) return [];

    return baseFilters.filter(filter => {
      // If user is sales, hide the 'assign_to' filter
      if (userRole?.name === 'sales' && filter.key === 'assign_to') {
        return false;
      }
      return true;
    });
  }, [baseFilters, userRole, loadingUser]);

  const PAGE_SIZE = 10;
  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      if (!token) throw new Error("No bearer token found in localStorage.");

      const params = new URLSearchParams();
      params.set("page", String(page));

      // attach filters
      if (appliedFilters.search) params.set("search", appliedFilters.search);
      if (appliedFilters.status) params.set("status", appliedFilters.status);
      if (appliedFilters.lead_source) params.set("lead_source", appliedFilters.lead_source);

      // 🔹 LEAD DATE RANGE
      if (appliedFilters.date?.from) {
        params.set("date_from", appliedFilters.date.from);
      }
      if (appliedFilters.date?.to) {
        params.set("date_to", appliedFilters.date.to);
      }

      // 🔹 FOLLOWUP DATE RANGE
      if (appliedFilters.followup_date?.from) {
        params.set("followup_date_from", appliedFilters.followup_date.from);
      }
      if (appliedFilters.followup_date?.to) {
        params.set("followup_date_to", appliedFilters.followup_date.to);
      }

      // 🔴 OVERDUE FILTER
      if (appliedFilters.overdue?.includes("true")) {
        params.set("overdue", "true");
      }


      // ✅ Final check for assign_to: Only include filter if user is NOT sales
      // The backend handles the restriction for sales users automatically.
      if (userRole?.name !== 'sales' && appliedFilters.assign_to) {
        params.set("assign_to", appliedFilters.assign_to);
      }

      // 🔹 SORT / ORDERING — maps to DRF OrderingFilter ?ordering=
      if (appliedFilters.sort_by) {
        params.set("ordering", appliedFilters.sort_by);
      }

      const url = `${API_URL}?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${body ? " — " + body : ""}`);
      }

      const data = await res.json();

      // ... (rest of data handling remains the same) ...

      // If DRF pagination is enabled, response will contain `results`
      if (data && Array.isArray(data.results)) {
        setRows(data.results);
        const count = Number.isFinite(data.count) ? data.count : (data.results.length || 0);
        setTotalCount(count);
        // compute total pages (PAGE_SIZE must match backend page size)
        const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
        setTotalPages(pages);
        setCurrentPage(page);
      } else if (Array.isArray(data)) {
        // not paginated: backend returned raw array
        setRows(data);
        setTotalCount(data.length);
        setTotalPages(Math.max(1, Math.ceil(data.length / PAGE_SIZE)));
        setCurrentPage(1);
      } else {
        // unexpected shape
        throw new Error("Unexpected staff response shape");
      }
    } catch (err) {
      console.warn("Lead.jsx fetchData error, checking designer fallback:", err);
      if (isDesignerRole) {
        const existingReqs = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
        const activeSentReqs = existingReqs.filter(r => 
          r.status === "pending_drawing" || r.status === "drawing_completed" || r.status === "attached_to_quotation"
        );
        const fallbackRows = activeSentReqs.map(req => ({
          id: req.leadId || req.id,
          date: req.sentDate || new Date().toISOString().split("T")[0],
          followup_date: req.sentDate || new Date().toISOString().split("T")[0],
          contact_person_name: req.customerName,
          customer_name: req.customerName,
          contact_person_number: req.contact || "N/A",
          customer_contact: req.contact || "N/A",
          lead_source: "Sales Dispatch",
          status: req.status === "drawing_completed" ? "COMPLETED" : "OPEN",
          assign_to_details: { full_name: req.salesPersonName || "Pravin Dare" }
        }));
        setRows(fallbackRows);
        setTotalCount(fallbackRows.length);
        setTotalPages(1);
        setError(null);
      } else {
        setError(err.message || String(err));
        setRows([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  }, [token, appliedFilters, API_URL, userRole, isDesignerRole]);

  useEffect(() => { fetchData(currentPage); }, [fetchData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const handleFilterChange = useCallback((filters) => {
    setAppliedFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const handleDelete = async (id) => {
    const res = await Swal.fire({
      title: "Delete Lead?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete"
    });
    if (!res.isConfirmed) return;

    try {
      const resp = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`${resp.status} ${resp.statusText} — ${text}`);
      }
      Swal.fire({ icon: "success", text: "Lead deleted", timer: 1000, showConfirmButton: false });
      // refresh current page
      fetchData(currentPage);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete failed", text: err.message || String(err) });
    }
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getRowClassName = (lead) => {
    if (!lead.followup_date) return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const followupDate = new Date(lead.followup_date);
    followupDate.setHours(0, 0, 0, 0);

    // Today's followup - Yellow
    if (followupDate.getTime() === today.getTime()) {
      return "bg-yellow-100";
    }

    // Missed followup - Red
    if (followupDate < today) {
      return "bg-red-100";
    }

    return "";
  };

  const columns = [
    { key: "sr", label: "Sr.No", render: (_, idx) => (currentPage - 1) * PAGE_SIZE + (idx + 1) },
    { key: "date", label: "Date", render: (r) => formatDate(r.date) },
    { key: "followup_date", label: "Followup Date", render: (r) => formatDate(r.followup_date) },
    { key: "name", label: "Name", render: (r) => r.customer_name },
    { key: "contact", label: "Contact", render: (r) => r.customer_contact },
    // { key: "email", label: "Email", render: (r) => r.customer_email },
    // { key: "hvac_application", label: "HVAC Application", render: (r) => r.hvac_application },
    { key: "lead_source", label: "Source", render: (r) => r.lead_source },
    { key: "status", label: "Status", render: (r) => {
        const s = (r.status || "open").toLowerCase();
        if (s === "close_win" || s === "closed_win") return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs">Close Win</span>;
        if (s === "close_loss" || s === "closed_loss") return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-xs">Close Loss</span>;
        if (s === "closed") return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full font-bold text-xs">Closed</span>;
        if (s === "in_process") return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-xs">In Process</span>;
        return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-bold text-xs">Open</span>;
      }
    },
    // ✅ SHOW ONLY IF USER IS NOT SALES
    ...(userRole?.name !== "sales"
      ? [{
        key: "assign_to",
        label: "Assign To",
        render: (r) => r.assign_to_details?.full_name || "-"
      }]
      : [])
  ];

  // actions renderer with WhatsApp, Email, Delete, View
  const actionsRenderer = useCallback((row) => {
    const handleWhatsApp = (e) => {
      e.stopPropagation();
      const contact = row.customer_contact;
      if (!contact) {
        Swal.fire({ icon: 'warning', title: 'No Contact', text: 'No contact number available' });
        return;
      }
      const cleanNumber = contact.replace(/[^0-9]/g, '');
      const whatsappNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
      window.open(`https://wa.me/${whatsappNumber}`, '_blank');
    };

    const handleEmail = (e) => {
      e.stopPropagation();
      const email = row.customer_email;
      if (!email) {
        Swal.fire({ icon: 'warning', title: 'No Email', text: 'No email address available' });
        return;
      }
      window.location.href = `mailto:${email}`;
    };

    return (
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={handleWhatsApp}
          className="inline-flex items-center px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
          title="Send WhatsApp"
        >
          <IoLogoWhatsapp className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleEmail}
          className="inline-flex items-center px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-medium transition-colors"
          title="Send Email"
        >
          <MdEmail className="w-3.5 h-3.5" />
        </button>

        {canEdit && !isDesignerRole && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingLead(row);
              setShowLeadForm(true);
            }}
            className="inline-flex items-center px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg text-xs font-medium transition-colors"
            title="Edit Lead"
          >
            <MdEdit className="w-3.5 h-3.5" />
          </button>
        )}

        {canDelete && !isDesignerRole && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="inline-flex items-center px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-medium transition-colors"
            title="Delete"
          >
            <MdDelete className="w-3.5 h-3.5" />
          </button>
        )}

        {(() => {
          const customerName = row.contact_person_name || row.customer_name || row.customer?.name || `Lead #${row.id}`;
          const existingReqs = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
          const foundReq = existingReqs.find(r => 
            String(r.id) === String(row.id) ||
            String(r.leadId) === String(row.id) ||
            (r.customerName && customerName && (
              r.customerName.trim().toLowerCase() === customerName.trim().toLowerCase() ||
              r.customerName.trim().toLowerCase().includes(customerName.trim().toLowerCase()) ||
              customerName.trim().toLowerCase().includes(r.customerName.trim().toLowerCase())
            ))
          );

          if (foundReq && (foundReq.status === "drawing_completed" || foundReq.status === "attached_to_quotation")) {
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  Swal.fire({
                    title: `🎨 CAD Drawing Completed`,
                    html: `
                      <div style="text-align: left; font-size: 13px; line-height: 1.6;">
                        <p><strong>Customer:</strong> ${customerName}</p>
                        <p><strong>Drawing Title:</strong> ${foundReq.drawingTitle || customerName + ' Gate Layout Plan'}</p>
                        <p><strong>File Name:</strong> ${foundReq.fileName || "AutoCAD_Drawing_Plan.dwg"}</p>
                        <p><strong>Format:</strong> ${foundReq.fileType || "AutoCAD/PDF"}</p>
                        <p><strong>Designer Remarks:</strong> ${foundReq.designerNotes || "Completed CAD drawing according to site specifications."}</p>
                      </div>
                    `,
                    icon: "success",
                    showCancelButton: true,
                    confirmButtonText: "📥 Download CAD File",
                    cancelButtonText: "Go to Design Drawings Page",
                    confirmButtonColor: "#10b981",
                    cancelButtonColor: "#4f46e5"
                  }).then((res) => {
                    if (res.isConfirmed) {
                      const link = document.createElement("a");
                      link.href = foundReq.drawingUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60";
                      link.download = foundReq.fileName || `${customerName}_CAD_Drawing.dwg`;
                      link.target = "_blank";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else if (res.dismiss === Swal.DismissReason.cancel) {
                      window.location.href = "/design-drawings";
                    }
                  });
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                title="Click to View & Download CAD Drawing File"
              >
                <span>✅ Drawing Ready</span>
              </button>
            );
          }

          if (foundReq && foundReq.status === "pending_drawing") {
            return (
              <a
                href="/design-drawings"
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium transition-colors"
                title="Waiting for Designer Drawing"
              >
                <span>⏳ In Designer Queue</span>
              </a>
            );
          }

          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                Swal.fire({
                  title: "Send Lead to Designer",
                  text: `Enter design & drawing requirements for ${customerName}:`,
                  input: "textarea",
                  inputPlaceholder: "Specify boom barrier length, RFID poles, turnstile specs, entrance layout...",
                  showCancelButton: true,
                  confirmButtonText: "Send to Designer Queue",
                  confirmButtonColor: "#4f46e5"
                }).then((res) => {
                  if (res.isConfirmed && res.value) {
                    const token = localStorage.getItem("access");
                    const BASE_API = import.meta.env.VITE_BASE_API_URL;
                    if (token && BASE_API) {
                      fetch(`${BASE_API}/lead/lead/${row.id}/`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          is_sent: true,
                          is_received: false,
                          requirements_details: res.value
                        })
                      }).catch(() => {});
                    }

                    const existing = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
                    const newReq = {
                      id: `DR-${Math.floor(100 + Math.random() * 900)}`,
                      leadId: row.id,
                      customerName: customerName,
                      companyName: row.company_name || row.project_name || "N/A",
                      salesPersonName: localStorage.getItem("user_name") || "Pravin Dare",
                      salesPersonEmail: localStorage.getItem("user_email") || "pravin123@gmail.com",
                      requirements: res.value,
                      sentDate: new Date().toLocaleString(),
                      status: "pending_drawing",
                      is_sent: 1,
                      is_received: 0,
                      drawingTitle: "",
                      drawingSpecs: "",
                      drawingUrl: "",
                      designerNotes: "",
                      completedDate: "",
                      attachedToQuotation: false
                    };
                    localStorage.setItem("nnit_design_requests", JSON.stringify([newReq, ...existing]));
                    window.dispatchEvent(new Event("designRequestUpdated"));
                    window.dispatchEvent(new Event("storage"));
                    Swal.fire("Sent to Designer!", `Lead sent to Designer Queue. (Sent: Yes, Received: No)`, "success");
                    window.location.reload();
                  }
                });
              }}
              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium transition-colors"
              title="Send to Designer"
            >
              <span>🎨 Designer</span>
            </button>
          );
        })()}

        <button
          onClick={() => {
            setLeadDetailsId(row.id);
            setShowLeadDetails(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium transition-colors"
          title="View Details"
        >
          <MdRemoveRedEye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      </div>
    );
  }, [canEdit, canDelete]);

  if (!loadingUser && !canView) {
    return (
      <Base title="Leads">
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow mt-6">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h3>
          <p>You do not have permission to view Lead Management.</p>
        </div>
      </Base>
    );
  }

  return (
    <Base
      title="Leads"
      filtersConfig={leadFilters}
      initialFilterValues={initialFilters}
      onFiltersChange={handleFilterChange}
    >
      {/* ── Lead Detail full-page view ── */}
      {showLeadDetails && leadDetailsId && (
        <LeadDetails
          open={true}
          onClose={() => { setShowLeadDetails(false); setLeadDetailsId(null); }}
          leadId={leadDetailsId}
          baseApi={BASE_API}
          token={token}
          inline={true}
          onCreateQuotation={(lead) => {
            setShowLeadDetails(false);
            setLeadDetailsId(null);
            setQuotationLeadData({
              customer_id: lead.customer,
              customer_name: lead.customer_name,
              project_name: lead.project_name,
              project_address: lead.project_address,
            });
            setShowQuotationForm(true);
          }}
        />
      )}

      {/* ── Lead List ── */}
      {!showLeadDetails && (
      <div className="space-y-6 ">
        <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Lead Management</h2>
            <div className="text-sm text-slate-600">
              {loading ? "Loading…" : `${totalCount} total • ${rows.length} shown`}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canCreate && !isDesignerRole && (
              <button
                onClick={() => { setEditingLead(null); setShowLeadForm(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <MdAdd className="w-5 h-5" />
                Add Lead
              </button>
            )}
          </div>
        </div>

        <TableView
          columns={columns}
          rows={displayedRows}
          loading={loading}
          error={error}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
          pageSize={PAGE_SIZE} // Using the actual PAGE_SIZE here
          actions={actionsRenderer}
          emptyMessage="No leads found"
          rowClassName={getRowClassName}
        />
      </div>
      )} {/* end !showLeadDetails */}

      <AddLeadForm
        open={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        baseApi={BASE_API}
        token={token}
        lead={editingLead}
        onSuccess={() => {
          fetchData(currentPage);
          setShowLeadForm(false);
          setEditingLead(null);
        }}
      />

      <AddLeadFollowUpFormNew
        open={showLeadFollowUp}
        onClose={() => setShowLeadFollowUp(false)}
        baseApi={BASE_API}
        token={token}
        leadId={followUpLeadId}
        onSuccess={() => {
          fetchData(currentPage);
          setShowLeadFollowUp(false);
          setFollowUpLeadId(null);
        }}
      />

      {showQuotationForm && (
        <AddQuotation
          leadData={quotationLeadData}
          onBack={() => {
            setShowQuotationForm(false);
            setQuotationLeadData(null);
            fetchData(currentPage);
          }}
        />
      )}

    </Base>
  );
}
