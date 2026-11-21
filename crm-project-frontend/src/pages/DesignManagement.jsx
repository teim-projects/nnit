import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiSend,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiUpload,
  FiPaperclip,
  FiPlus,
  FiX,
  FiEye,
  FiDownload,
  FiUser,
  FiLayers,
  FiCornerDownLeft,
  FiMapPin,
  FiFolder,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiInfo,
  FiPrinter,
  FiRepeat
} from "react-icons/fi";
import { MdRemoveRedEye, MdEdit, MdDelete } from "react-icons/md";
import { IoLogoWhatsapp } from "react-icons/io5";
import Swal from "sweetalert2";
import Base from "../components/Base";
import { useModulePermissions, useUserRole } from "../hooks/useAuth";
import AddDesignerSendModal from "../components/designer/AddDesignerSendModal";
import DesignerSlipModal from "../components/designer/DesignerSlipModal";
import DesignerUploadModal from "../components/designer/DesignerUploadModal";
import SalesRevisionModal from "../components/designer/SalesRevisionModal";
import DesignVersionHistoryModal from "../components/designer/DesignVersionHistoryModal";
import { triggerFileDownload, safeSaveDesignRequests } from "../utils/designFileStorage";
import { getCurrentUserDisplayName, healDesignRequests, isRequestOwnedByUser, isSameDesignRequest } from "../utils/auth";

export default function DesignManagement() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const token = localStorage.getItem("access") || "";

  const { canView, canCreate, canEdit, canDelete, isLoading: loadingUser } = useModulePermissions("design_drawings");
  const { userRole, userData, userName, isSuperUser } = useUserRole(BASE_API);
  const activeRole = (userRole?.name || localStorage.getItem("user_role") || "sales").toLowerCase();
  const isSuper = isSuperUser || activeRole === "admin" || activeRole === "superadmin";

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "sales";
  const sendParam = searchParams.get("send");
  const leadIdParam = searchParams.get("leadId");

  // Logged-in User Profile & Role
  const currentUserEmail = localStorage.getItem("user_email") || "";
  const currentUserName = getCurrentUserDisplayName();
  const [currentRole, setCurrentRole] = useState(localStorage.getItem("user_role") || "sales");

  // Active Tab
  const [activeTab, setActiveTab] = useState(initialTab);

  // Available leads for dropdown pre-fill
  const [availableLeads, setAvailableLeads] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Deduplicate and clean design requests in localStorage
  const getDeduplicatedRequests = () => {
    const saved = localStorage.getItem("nnit_design_requests");
    if (!saved) return [];
    try {
      const raw = JSON.parse(saved);
      if (!Array.isArray(raw)) return [];
      return raw;
    } catch {
      return [];
    }
  };

  // Clear all design requests from storage
  const handleClearAllRequests = () => {
    Swal.fire({
      title: "Clear All Design Requests?",
      text: "This will remove all sent/received design requests from the system.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Clear All",
      confirmButtonColor: "#ef4444",
    }).then((res) => {
      if (res.isConfirmed) {
        safeSaveDesignRequests([]);
        setDesignRequests([]);
        window.dispatchEvent(new Event("designRequestUpdated"));
        window.dispatchEvent(new Event("storage"));
        Swal.fire("Cleared!", "All design requests have been removed.", "success");
      }
    });
  };

  // Design Requests State (Persistent in localStorage)
  const [designRequests, setDesignRequests] = useState(() => getDeduplicatedRequests());

  // Helper to extract & compile site requirements from lead + all its followups
  const compileLeadRequirements = useCallback((lead) => {
    if (!lead) return "";

    const parts = [];

    const mainReq = lead.site_requirement || lead.requirements_details || "";
    if (mainReq.trim()) {
      parts.push(`• Site Specs: ${mainReq.trim()}`);
    }

    const followups = lead.followups || [];
    followups.forEach((fu, i) => {
      const details = [];

      if (fu.requirement_info) {
        const ri = fu.requirement_info;
        const dims = [ri.site_length, ri.site_width, ri.site_height].filter(Boolean).join(" × ");
        if (dims) details.push(`Dimensions: ${dims} ft`);
        if (ri.preferred_parking_type) details.push(`Type: ${ri.preferred_parking_type}`);
        if (ri.automation_needed !== undefined || ri.automation_required !== undefined) {
          details.push(`Automation: ${ri.automation_needed || ri.automation_required ? "Yes" : "No"}`);
        }
        if (ri.cars_capacity || ri.cars_required) details.push(`Cars: ${ri.cars_capacity || ri.cars_required}`);
      }

      if (fu.qualifying_info) {
        const qi = fu.qualifying_info;
        if (qi.cars_required) details.push(`Cars: ${qi.cars_required}`);
        if (qi.car_type) details.push(`Car Type: ${qi.car_type}`);
        if (qi.pit_possible) details.push(`Pit: ${qi.pit_possible}`);
        if (qi.basement_available) details.push(`Basement: ${qi.basement_available}`);
        if (qi.site_challenges) details.push(`Challenges: ${qi.site_challenges}`);
      }

      if (fu.followup_summary) details.push(`Summary: ${fu.followup_summary}`);
      if (fu.discussion_notes) details.push(`Notes: ${fu.discussion_notes}`);
      if (fu.remarks) details.push(`Remarks: ${fu.remarks}`);

      if (details.length > 0) {
        parts.push(`• Followup: ${details.join(" | ")}`);
      }
    });

    return parts.join("\n") || "Site Entrance CAD Layout & Specifications";
  }, []);

  // Sync from backend database + localStorage on mount and events WITH STRICT DEDUPLICATION
  const fetchAllRequests = useCallback(async () => {
    let localReqs = getDeduplicatedRequests();
    let apiLeads = [];
    const token = localStorage.getItem("access");
    const BASE_API = import.meta.env.VITE_BASE_API_URL;

    if (token && BASE_API) {
      try {
        const res = await fetch(`${BASE_API}/lead/lead/?page_size=500`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          apiLeads = Array.isArray(data) ? data : data.results || [];
          setAvailableLeads(apiLeads);
        }
      } catch (err) {
        console.warn("Backend fetch failed, using local storage", err);
      }
    }

    const deduplicatedList = [];
    const seenKeys = new Set();

    // 1. Add LocalStorage requests first (ONLY IF EXPLICITLY SENT BY SALES PERSON)
    localReqs.forEach(r => {
      const isSent = r.is_sent === 1 || r.is_sent === true || r.is_sent === "1" || r.is_sent === "true";
      if (!isSent) return; // Skip unsent leads

      const key = (r.leadId && r.leadId !== "null" && r.leadId !== "undefined")
        ? `lead-${r.leadId}`
        : String(r.id || r.reqNo || "");
      if (key && !seenKeys.has(key.toLowerCase())) {
        seenKeys.add(key.toLowerCase());
        if (r.id) seenKeys.add(String(r.id).toLowerCase());
        if (r.reqNo) seenKeys.add(String(r.reqNo).toLowerCase());
        if (r.leadId && r.leadId !== "null" && r.leadId !== "undefined") {
          seenKeys.add(`lead-${r.leadId}`.toLowerCase());
          seenKeys.add(`ds-${r.leadId}`.toLowerCase());
        }

        const clientName = r.clientCoName || r.customerName || "Unknown Customer";
        const contactPerson = r.contactPerson || r.contact_person_name || "—";
        const contactNumber = r.contactNumber || r.contact_person_number || "—";
        const projName = r.projectName || r.companyName || "N/A";
        const projLoc = r.projectAddress || r.location || "N/A";
        const reqs = r.requirements || "Site Entrance CAD Drawing & Specs";
        const qty = r.quantity || "As per STD";
        const rmk = r.remark || "-";
        const salesPerson = (r.salesPersonName && r.salesPersonName !== "Sales Person")
          ? r.salesPersonName
          : (currentRole === "sales" ? currentUserName : (r.salesPersonName || "Sales Person"));
        const sentDt = r.sentDate || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

        deduplicatedList.push({
          ...r,
          id: r.id || `DS-${r.leadId || Math.floor(100 + Math.random() * 900)}`,
          reqNo: r.reqNo || r.id || `DS-${r.leadId || 101}`,
          leadId: r.leadId,
          salutation: r.salutation || (clientName.startsWith("M/s.") ? "M/s." : "M/s."),
          clientCoName: clientName,
          customerName: clientName,
          projectName: projName,
          companyName: projName,
          projectAddress: projLoc,
          location: projLoc,
          contactPersonSalutation: r.contactPersonSalutation || (contactPerson.startsWith("MS.") ? "MS." : "MS."),
          contactPerson: contactPerson,
          contactNumber: contactNumber,
          requirements: reqs,
          quantity: qty,
          remark: rmk,
          customerLayoutName: r.customerLayoutName || "",
          customerLayoutUrl: r.customerLayoutUrl || "",
          salesPersonName: salesPerson,
          salesPersonEmail: r.salesPersonEmail || "sales@nnit.com",
          sentDate: sentDt,
          status: r.status || "pending_drawing",
          is_sent: 1,
          is_received: r.is_received ?? 0,
          current_version: r.current_version || (r.versions?.length || 1),
          versions: r.versions || [],
          drawingFiles: r.drawingFiles || [],
          change_notes: r.change_notes || "",
          drawingTitle: r.drawingTitle || "",
          drawingSpecs: r.drawingSpecs || "",
          fileName: r.fileName || "",
          fileType: r.fileType || "autocad",
          drawingUrl: r.drawingUrl || "",
          designerNotes: r.designerNotes || ""
        });
      }
    });

    // 2. Add API Leads ONLY IF l.is_sent is True/1 (Explicitly Sent by Sales Person)
    apiLeads.forEach(l => {
      const isSent = l.is_sent === true || l.is_sent === 1 || l.is_sent === "true" || l.is_sent === "1" || l.cad_file || l.customer_layout;
      if (!isSent) return; // Skip leads that Sales Person has NOT sent to designer!

      const idKey = String(l.id).toLowerCase();
      const drKey = `lead-${l.id}`.toLowerCase();
      const dsKey = `ds-${l.id}`.toLowerCase();

      if (!seenKeys.has(idKey) && !seenKeys.has(drKey) && !seenKeys.has(dsKey)) {
        seenKeys.add(idKey);
        seenKeys.add(drKey);
        seenKeys.add(dsKey);

        const coName = l.company_name || l.customer_name || l.customer?.name || "Client";
        const contactPerson = l.contact_person_name || l.customer_name || "Contact";
        const contactNumber = l.contact_person_number || l.customer_contact || l.customer?.contact_number || "—";
        const proj = l.project_name || l.company_name || "N/A";
        const loc = l.site_location || l.project_adderess || l.customer_address || l.customer?.site_address || "N/A";
        const reqs = compileLeadRequirements(l);
        const custLayoutName = l.customer_layout_name || l.cad_file_name || "";
        const custLayoutUrl = l.customer_layout_url || l.customer_layout || l.cad_file || "";
        const salesPerson = l.assign_to_details?.full_name || l.assigned_to_details?.username || l.created_by_details?.full_name || "Sales Person";
        const sentDt = l.created_at ? new Date(l.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : (l.date || "Recent");

        deduplicatedList.push({
          id: `LEAD-${l.id}`,
          reqNo: `DS-${l.id}`,
          leadId: l.id,
          salutation: coName.startsWith("M/s.") ? "M/s." : "M/s.",
          clientCoName: coName.startsWith("M/s.") ? coName : `M/s. ${coName}`,
          customerName: coName.startsWith("M/s.") ? coName : `M/s. ${coName}`,
          projectName: proj,
          companyName: proj,
          projectAddress: loc,
          location: loc,
          contactPersonSalutation: contactPerson.startsWith("MS.") ? "MS." : "MS.",
          contactPerson: contactPerson.startsWith("MS.") || contactPerson.startsWith("Mr.") ? contactPerson : `MS. ${contactPerson}`,
          contactNumber: contactNumber,
          requirements: reqs,
          quantity: "As per STD",
          remark: l.remarks || "-",
          customerLayoutName: custLayoutName,
          customerLayoutUrl: custLayoutUrl,
          salesPersonName: salesPerson,
          salesPersonEmail: l.assign_to_details?.email || "sales@nnit.com",
          sentDate: sentDt,
          status: l.cad_file || l.is_received ? "drawing_completed" : "pending_drawing",
          is_sent: 1,
          is_received: l.is_received || l.cad_file ? 1 : 0,
          current_version: 1,
          versions: [],
          drawingFiles: [],
          change_notes: "",
          drawingTitle: l.cad_file_name || "",
          drawingSpecs: "",
          fileName: l.cad_file_name || "",
          fileType: "autocad",
          drawingUrl: l.cad_file || "",
          designerNotes: ""
        });
      }
    });

    // If completely empty, seed sample request matching user's slip
    if (deduplicatedList.length === 0) {
      const sample = {
        id: "DS-101",
        reqNo: "DS-101",
        salutation: "M/s.",
        clientCoName: "M/s. Shree Associate",
        customerName: "M/s. Shree Associate",
        projectName: "Avdhut Residency",
        projectAddress: "Guruwar peth",
        location: "Guruwar peth",
        contactPersonSalutation: "MS.",
        contactPerson: "MS. Jigar Patel",
        contactNumber: "9890907870",
        requirements: "2DP101 STACK & 3DP304 STACK & CANTILEVER CP401",
        quantity: "As per STD",
        remark: "-",
        customerLayoutName: "",
        customerLayoutUrl: "",
        salesPersonName: "Pravin Dare",
        salesPersonEmail: "pravin123@gmail.com",
        sentDate: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        status: "pending_drawing",
        is_sent: 1,
        is_received: 0,
      };
      deduplicatedList.push(sample);
      localStorage.setItem("nnit_design_requests", JSON.stringify([sample]));
    }

    setDesignRequests(deduplicatedList);
  }, [compileLeadRequirements]);

  useEffect(() => {
    fetchAllRequests();
    const handleSync = () => fetchAllRequests();
    window.addEventListener("designRequestUpdated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("designRequestUpdated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [fetchAllRequests]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipRequest, setSlipRequest] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadRequest, setUploadRequest] = useState(null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionRequest, setRevisionRequest] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionRequest, setVersionRequest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Check URL params for auto-open
  useEffect(() => {
    if (sendParam === "true") {
      setShowAddModal(true);
    }
  }, [sendParam]);

  // Filtered requests based on active tab, ownership & search/status
  // Admin / Super Admin: sees ALL requests across system
  // Sales Person / Staff: in Sales tab sees ONLY requests they created/sent
  const filteredRequests = useMemo(() => {
    return designRequests.filter(r => {
      if (activeTab === "sales" && !isSuper) {
        const isMine = isRequestOwnedByUser(r, { userRole, isSuperUser, userName, userData });
        if (!isMine) return false;
      }

      const matchSearch =
        searchQuery === "" ||
        r.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reqNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.clientCoName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.projectAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contactNumber?.includes(searchQuery) ||
        r.salesPersonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requirements?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && (r.status === "pending_drawing" || r.status === "revision_requested")) ||
        (statusFilter === "revision" && r.status === "revision_requested") ||
        (statusFilter === "completed" && (r.status === "drawing_completed" || r.status === "attached_to_quotation"));

      return matchSearch && matchStatus;
    });
  }, [designRequests, searchQuery, statusFilter, activeTab, isSuper, userRole, isSuperUser, userName, userData]);

  // Metric Counts (Calculated for accessible requests)
  const accessibleRequestsForMetrics = useMemo(() => {
    if (isSuper) return designRequests;
    return designRequests.filter(r => isRequestOwnedByUser(r, { userRole, isSuperUser, userName, userData }));
  }, [designRequests, isSuper, userRole, isSuperUser, userName, userData]);

  const metrics = useMemo(() => {
    const list = accessibleRequestsForMetrics;
    const total = list.length;
    const pending = list.filter(r => r.status === "pending_drawing").length;
    const revisions = list.filter(r => r.status === "revision_requested").length;
    const completed = list.filter(r => r.status === "drawing_completed" || r.status === "attached_to_quotation").length;
    const attached = list.filter(r => r.status === "attached_to_quotation").length;
    return { total, pending, revisions, completed, attached };
  }, [accessibleRequestsForMetrics]);

  // Open New / Edit Designer Send Modal
  const handleOpenSendModal = () => {
    setEditingRequest(null);
    setShowAddModal(true);
  };

  const handleEditRequest = (req) => {
    setEditingRequest(req);
    setShowAddModal(true);
  };

  // Delete Request
  const handleDeleteRequest = async (req) => {
    const confirm = await Swal.fire({
      title: "Delete Request?",
      text: `Are you sure you want to remove request for "${req.projectName || req.customerName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Delete",
    });

    if (confirm.isConfirmed) {
      setDesignRequests((prev) => {
        const updated = prev.filter((item) => !isSameDesignRequest(item, req));
        safeSaveDesignRequests(updated);
        return updated;
      });

      if (BASE_API && req.leadId && token) {
        try {
          await fetch(`${BASE_API}/lead/lead/${req.leadId}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ is_sent: false }),
          });
        } catch {
          // ignore
        }
      }

      window.dispatchEvent(new Event("designRequestUpdated"));
      window.dispatchEvent(new Event("storage"));
      Swal.fire("Deleted!", "Request removed successfully.", "success");
    }
  };

  // Action 2: Designer Opens Upload Modal
  const handleOpenUploadModal = (req) => {
    setUploadRequest(req);
    setShowUploadModal(true);
  };

  // Action 4: Sales Person Attaches Drawing to Quotation
  const handleAttachToQuotation = (req) => {
    setDesignRequests(prev => {
      const updated = prev.map(r => (isSameDesignRequest(r, req) ? { ...r, status: "attached_to_quotation", attachedToQuotation: true } : r));
      safeSaveDesignRequests(updated);
      return updated;
    });
    window.dispatchEvent(new Event("designRequestUpdated"));
    window.dispatchEvent(new Event("storage"));
    Swal.fire({
      title: "Drawing Attached to Quotation!",
      text: `Drawing "${req.drawingTitle || req.id}" attached to Quotation for ${req.customerName}. Redirecting to Quotations...`,
      icon: "success",
      showCancelButton: true,
      confirmButtonText: "Go to Quotations Page",
      cancelButtonText: "Stay Here"
    }).then(res => {
      if (res.isConfirmed) {
        navigate("/quotation");
      }
    });
  };

  // Helper Badge for File Types
  const renderFileTypeBadge = (fileType, fileName) => {
    if (fileType === "autocad" || fileName?.endsWith(".dwg") || fileName?.endsWith(".dxf")) {
      return <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] uppercase border border-blue-200">📐 DWG</span>;
    }
    if (fileType === "pdf" || fileName?.endsWith(".pdf")) {
      return <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] uppercase border border-rose-200">📄 PDF</span>;
    }
    return <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-200">🖼 Layout</span>;
  };

  if (!loadingUser && !canView) {
    return (
      <Base title="Design Drawings">
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow mt-6">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h3>
          <p>You do not have permission to view Design Drawings.</p>
        </div>
      </Base>
    );
  }

  return (
    <Base title="Design Drawings">
      <div className="p-4 sm:p-5 space-y-5 font-sans bg-[#f8fafc] min-h-full">
        
        {/* ── Page Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Design & Drawing Workflow</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-black uppercase border border-indigo-200/80 tracking-wider">
                {currentRole === "admin" ? "Admin Mode" : currentRole === "designer" ? "Designer Queue" : "Sales View"}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Send Lead Details (Project Name, Customer Name, Site Location, Requirements & Layout) to Designer
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {designRequests.length > 0 && (
              <button
                onClick={handleClearAllRequests}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl transition cursor-pointer shadow-2xs"
                title="Clear all design requests"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}

            {currentRole !== "designer" && (
              <button
                onClick={handleOpenSendModal}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-xs cursor-pointer"
              >
                <FiSend className="w-3.5 h-3.5" />
                <span>Send Lead to Designer</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Requests</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</div>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <FiLayers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Drawing</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{metrics.pending}</div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <FiClock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Drawings Completed</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.completed}</div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Attached to Quote</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{metrics.attached}</div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FiPaperclip className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ── Search & Filter Control Bar ── */}
        <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search ID, Customer, Project..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-slate-50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1">
              <FiFilter className="w-3.5 h-3.5" /> Filter:
            </span>
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl gap-1">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                All ({designRequests.length})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === "pending" ? "bg-amber-500 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Pending ({metrics.pending})
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === "completed" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Completed ({metrics.completed})
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 px-5 pt-3">
          <div className="flex items-center gap-6 border-b border-slate-200/80">
            <button
              onClick={() => setActiveTab("sales")}
              className={`pb-3 text-xs sm:text-sm font-extrabold transition-all relative cursor-pointer ${
                activeTab === "sales" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Design Drawings (Sales Person View)
            </button>

            <button
              onClick={() => setActiveTab("designer")}
              className={`pb-3 text-xs sm:text-sm font-extrabold transition-all relative cursor-pointer ${
                activeTab === "designer" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Designer Queue (Designer View)
            </button>
          </div>
        </div>

        {/* ── TAB 1: SALES PERSON VIEW ── */}
        {activeTab === "sales" && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <span>Design Requests Sent by Sales Person</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-black text-xs">
                  {filteredRequests.length}
                </span>
              </h3>
              <button
                onClick={handleOpenSendModal}
                className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FiPlus /> New Design Request
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-700 font-extrabold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-3 w-20">Req #</th>
                    <th className="py-3.5 px-3 w-16 text-center">Version</th>
                    <th className="py-3.5 px-4">Client / Co & Project</th>
                    <th className="py-3.5 px-4">Project Add</th>
                    <th className="py-3.5 px-4">Contact Person</th>
                    <th className="py-3.5 px-4 max-w-xs">Requirements 's</th>
                    <th className="py-3.5 px-4">Customer Layout</th>
                    <th className="py-3.5 px-4">Sales Person (Sent By)</th>
                    <th className="py-3.5 px-4">Sent Date & Time</th>
                    <th className="py-3.5 px-4">Drawing Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(req => {
                      const verNo = req.current_version || (req.versions?.length || 1);
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3">
                            <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200">
                              {req.reqNo || req.id}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setVersionRequest(req);
                                setShowVersionModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer shadow-2xs transition"
                              title="Click to view Version Timeline & History"
                            >
                              <FiLayers className="w-3 h-3 text-indigo-500" />
                              <span>V{verNo}</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 text-xs">{req.clientCoName || req.customerName}</div>
                            <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                              <FiFolder className="w-3.5 h-3.5 shrink-0" />
                              <span>{req.projectName || "N/A"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 max-w-xs">
                            {(req.projectAddress || req.location) && (req.projectAddress || req.location) !== "N/A" ? (
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <FiMapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="truncate max-w-[130px]">{req.projectAddress || req.location}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 text-xs">{req.contactPerson || "—"}</div>
                            {req.contactNumber && req.contactNumber !== "—" && (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 mt-0.5">
                                <span>{req.contactNumber}</span>
                                <a
                                  href={`https://wa.me/91${req.contactNumber.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                  title="WhatsApp"
                                >
                                  <IoLogoWhatsapp className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            {req.requirements ? (
                              <div
                                className="text-slate-800 font-medium text-[11px] max-h-20 overflow-y-auto whitespace-pre-line leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition"
                                title={req.requirements}
                              >
                                {req.requirements}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">No specs provided</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {req.customerLayoutName || req.customerLayoutUrl ? (
                              <a
                                href={req.customerLayoutUrl || "#"}
                                target="_blank"
                                rel="noreferrer"
                                download={req.customerLayoutName}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 border border-indigo-200/80 w-max transition cursor-pointer shadow-2xs"
                              >
                                <FiPaperclip className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[100px]">{req.customerLayoutName || "View Layout"}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs font-normal">—</span>
                            )}
                          </td>
                          {/* Sales Person (Sent By) */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] shrink-0 font-bold">
                                👤
                              </span>
                              <span className="truncate max-w-[110px]">
                                {(req.salesPersonName && req.salesPersonName !== "Sales Person")
                                  ? req.salesPersonName
                                  : (currentRole === "sales" ? currentUserName : (req.salesPersonName || "Sales Person"))}
                              </span>
                            </div>
                          </td>
                          {/* Sent Date & Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs font-semibold text-slate-700">
                            <div className="flex items-center gap-1 text-slate-600">
                              <FiClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{req.sentDate || "—"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {req.status === "revision_requested" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
                                <FiRepeat className="w-3.5 h-3.5 text-purple-600" /> Revision Req (V{verNo})
                              </span>
                            )}
                            {req.status === "pending_drawing" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                <FiClock className="w-3.5 h-3.5" /> In Queue (V{verNo})
                              </span>
                            )}
                            {req.status === "drawing_completed" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <FiCheckCircle className="w-3.5 h-3.5" /> Drawing Ready (V{verNo})
                              </span>
                            )}
                            {req.status === "attached_to_quotation" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                                <FiPaperclip className="w-3.5 h-3.5" /> Quote Attached (V{verNo})
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Request Revision / Change Requirements */}
                              <button
                                onClick={() => {
                                  setRevisionRequest(req);
                                  setShowRevisionModal(true);
                                }}
                                className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                                title="Request Revision / Change Requirements"
                              >
                                <FiRepeat className="w-4 h-4" />
                              </button>

                              {/* Version History Button */}
                              <button
                                onClick={() => {
                                  setVersionRequest(req);
                                  setShowVersionModal(true);
                                }}
                                className="w-8 h-8 rounded-full bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                                title="View Version History Timeline"
                              >
                                <FiLayers className="w-4 h-4" />
                              </button>

                              {/* View / Print Slip */}
                              <button
                                onClick={() => {
                                  setSlipRequest(req);
                                  setShowSlipModal(true);
                                }}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-700 text-slate-700 hover:text-white flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                                title="View & Print Slip"
                              >
                                <FiPrinter className="w-4 h-4" />
                              </button>

                              {/* Edit Request */}
                              <button
                                onClick={() => handleEditRequest(req)}
                                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                                title="Edit Request"
                              >
                                <MdEdit className="w-4 h-4" />
                              </button>

                              {/* Delete Request */}
                              <button
                                onClick={() => handleDeleteRequest(req)}
                                className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                                title="Delete Request"
                              >
                                <MdDelete className="w-4 h-4" />
                              </button>

                              {/* Attach to Quotation if completed */}
                              {req.status === "drawing_completed" && (
                                <button
                                  onClick={() => handleAttachToQuotation(req)}
                                  className="w-8 h-8 rounded-full bg-[#00ac4f] hover:bg-[#009643] text-white flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0"
                                  title="Attach to Quotation"
                                >
                                  <FiPaperclip className="w-4 h-4 text-white" />
                                </button>
                              )}

                              {/* View Quotation if attached */}
                              {req.status === "attached_to_quotation" && (
                                <button
                                  onClick={() => navigate("/quotation")}
                                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0"
                                  title="View Quotation"
                                >
                                  <FiFileText className="w-4 h-4 text-white" />
                                </button>
                              )}

                              {/* View Details */}
                              <button
                                onClick={() => { setSelectedRequest(req); setShowViewModal(true); }}
                                className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                                title="View Full Details"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                        No design requests found. Click "Send Lead to Designer" above to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: DESIGNER QUEUE VIEW ── */}
        {activeTab === "designer" && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <span>Designer Incoming Queue</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-black text-xs">
                  {filteredRequests.length}
                </span>
              </h3>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Upload CAD (.dwg/.dxf), PDF, or layout files and send to Sales • Multiple file support & Revisions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-extrabold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-3 w-20">Req #</th>
                    <th className="py-3.5 px-3 w-16 text-center">Version</th>
                    <th className="py-3.5 px-4">Client / Co & Project</th>
                    <th className="py-3.5 px-4">Project Add</th>
                    <th className="py-3.5 px-4">Contact Person</th>
                    <th className="py-3.5 px-4 max-w-xs">Requirements 's</th>
                    <th className="py-3.5 px-4">Customer Layout</th>
                    <th className="py-3.5 px-4">Sales Person (Sent By)</th>
                    <th className="py-3.5 px-4">Sent Date & Time</th>
                    <th className="py-3.5 px-4">Design Status</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(req => {
                      const verNo = req.current_version || (req.versions?.length || 1);
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3">
                            <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200">
                              {req.reqNo || req.id}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setVersionRequest(req);
                                setShowVersionModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer shadow-2xs transition"
                              title="Click to view Version Timeline & History"
                            >
                              <FiLayers className="w-3 h-3 text-indigo-500" />
                              <span>V{verNo}</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 text-xs">{req.clientCoName || req.customerName}</div>
                            <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                              <FiFolder className="w-3.5 h-3.5 shrink-0" />
                              <span>{req.projectName || "N/A"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 max-w-xs">
                            {(req.projectAddress || req.location) && (req.projectAddress || req.location) !== "N/A" ? (
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <FiMapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="truncate max-w-[130px]">{req.projectAddress || req.location}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 text-xs">{req.contactPerson || "—"}</div>
                            {req.contactNumber && req.contactNumber !== "—" && (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 mt-0.5">
                                <span>{req.contactNumber}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 max-w-sm">
                            {req.requirements ? (
                              <div
                                className="text-slate-800 font-medium text-[11px] max-h-20 overflow-y-auto whitespace-pre-line leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition"
                                title={req.requirements}
                              >
                                {req.requirements}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">No specs provided</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {req.customerLayoutName || req.customerLayoutUrl ? (
                              <a
                                href={req.customerLayoutUrl || "#"}
                                target="_blank"
                                rel="noreferrer"
                                download={req.customerLayoutName}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 border border-indigo-200/80 w-max transition cursor-pointer shadow-2xs"
                              >
                                <FiPaperclip className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[100px]">{req.customerLayoutName || "View Layout"}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs font-normal">—</span>
                            )}
                          </td>
                          {/* Sales Person (Sent By) */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] shrink-0 font-bold">
                                👤
                              </span>
                              <span className="truncate max-w-[110px]">
                                {(req.salesPersonName && req.salesPersonName !== "Sales Person")
                                  ? req.salesPersonName
                                  : (currentRole === "sales" ? currentUserName : (req.salesPersonName || "Sales Person"))}
                              </span>
                            </div>
                          </td>
                          {/* Sent Date & Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs font-semibold text-slate-700">
                            <div className="flex items-center gap-1 text-slate-600">
                              <FiClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{req.sentDate || "—"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {req.status === "revision_requested" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
                                <FiRepeat className="w-3.5 h-3.5 text-purple-600" /> Revision Req (V{verNo})
                              </span>
                            )}
                            {req.status === "pending_drawing" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                <FiClock className="w-3.5 h-3.5" /> Pending Drawing (V{verNo})
                              </span>
                            )}
                            {(req.status === "drawing_completed" || req.status === "attached_to_quotation") && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <FiCheckCircle className="w-3.5 h-3.5" /> Completed (V{verNo})
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Upload CAD Drawing */}
                              <button
                                onClick={() => handleOpenUploadModal(req)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0 ${
                                  req.status === "revision_requested"
                                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                                    : req.status === "pending_drawing"
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                                title={
                                  req.status === "revision_requested"
                                    ? `Upload Revised CAD Drawings (V${verNo})`
                                    : req.status === "pending_drawing"
                                    ? "Upload CAD Drawings"
                                    : "Edit / Add CAD Drawings"
                                }
                              >
                                <FiUpload className="w-4 h-4 text-white" />
                              </button>

                              {/* Version History Button */}
                              <button
                                onClick={() => {
                                  setVersionRequest(req);
                                  setShowVersionModal(true);
                                }}
                                className="w-8 h-8 rounded-full bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                                title="View Version History"
                              >
                                <FiLayers className="w-4 h-4" />
                              </button>

                              {/* View Slip */}
                              <button
                                onClick={() => {
                                  setSlipRequest(req);
                                  setShowSlipModal(true);
                                }}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-700 text-slate-700 hover:text-white flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                                title="View & Print Slip"
                              >
                                <FiPrinter className="w-4 h-4" />
                              </button>

                              {/* View Details */}
                              <button
                                onClick={() => { setSelectedRequest(req); setShowViewModal(true); }}
                                className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                                title="View Details"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                        No design requests in Designer Queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MODAL 1: ADD / EDIT DESIGNER REQUEST (Full Slip Format) ── */}
        <AddDesignerSendModal
          open={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingRequest(null);
          }}
          onSuccess={() => fetchAllRequests()}
          baseApi={BASE_API}
          token={token}
          initialData={editingRequest}
        />

        {/* ── MODAL: DESIGNER SLIP VIEW & PRINT (Exact Physical Slip Format) ── */}
        <DesignerSlipModal
          open={showSlipModal}
          onClose={() => {
            setShowSlipModal(false);
            setSlipRequest(null);
          }}
          request={slipRequest}
        />

        {/* ── MODAL 2: DESIGNER MULTI-FILE UPLOAD & REVISION MODAL ── */}
        <DesignerUploadModal
          open={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setUploadRequest(null);
          }}
          request={uploadRequest}
          onSuccess={() => {
            fetchAllRequests();
            setShowUploadModal(false);
            setUploadRequest(null);
          }}
          baseApi={BASE_API}
          token={token}
        />

        {/* ── MODAL 3: SALES REVISION REQUEST MODAL (Change Requirements) ── */}
        <SalesRevisionModal
          open={showRevisionModal}
          onClose={() => {
            setShowRevisionModal(false);
            setRevisionRequest(null);
          }}
          request={revisionRequest}
          onSuccess={() => {
            fetchAllRequests();
            setShowRevisionModal(false);
            setRevisionRequest(null);
          }}
          baseApi={BASE_API}
          token={token}
        />

        {/* ── MODAL 4: DESIGN VERSION HISTORY TIMELINE ── */}
        <DesignVersionHistoryModal
          open={showVersionModal}
          onClose={() => {
            setShowVersionModal(false);
            setVersionRequest(null);
          }}
          request={versionRequest}
        />

        {/* ── MODAL 5: VIEW ALL DETAILS PREVIEW ── */}
        {showViewModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/60 z-[1200] flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <FiFileText className="text-indigo-400" />
                  <span>Request Details — {selectedRequest.reqNo || selectedRequest.id}</span>
                </h3>
                <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">PROJECT NAME</span>
                    <span className="font-black text-indigo-700 text-sm">{selectedRequest.projectName || selectedRequest.companyName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">CLIENT / CUSTOMER</span>
                    <span className="font-black text-slate-900 text-sm">{selectedRequest.clientCoName || selectedRequest.customerName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">SITE LOCATION</span>
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mt-0.5">
                      <FiMapPin className="text-rose-500 shrink-0" /> {selectedRequest.projectAddress || selectedRequest.location || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">SENT BY (SALES PERSON)</span>
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mt-0.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">👤</span>
                      {(selectedRequest.salesPersonName && selectedRequest.salesPersonName !== "Sales Person")
                        ? selectedRequest.salesPersonName
                        : (currentRole === "sales" ? currentUserName : (selectedRequest.salesPersonName || "Sales Person"))}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">SENT DATE & TIME</span>
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mt-0.5">
                      <FiClock className="text-slate-400 shrink-0" /> {selectedRequest.sentDate || "—"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">SITE REQUIREMENTS & SPECS:</span>
                  <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200/80 text-slate-800 font-medium whitespace-pre-line max-h-40 overflow-y-auto text-xs leading-relaxed">
                    {selectedRequest.requirements}
                  </div>
                </div>

                {/* Customer Provided Layout */}
                <div>
                  <span className="font-bold text-slate-700 block mb-1">CUSTOMER PROVIDED LAYOUT FILE:</span>
                  {selectedRequest.customerLayoutName || selectedRequest.customerLayoutUrl ? (
                    <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/80 flex items-center justify-between">
                      <span className="font-bold text-indigo-900 flex items-center gap-1.5 truncate text-xs">
                        <FiPaperclip className="text-indigo-600 shrink-0" /> {selectedRequest.customerLayoutName || "Layout File"}
                      </span>
                      {selectedRequest.customerLayoutUrl && (
                        <a
                          href={selectedRequest.customerLayoutUrl}
                          download={selectedRequest.customerLayoutName || "Layout.dwg"}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                        >
                          <FiDownload /> Download
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 text-slate-400 font-medium rounded-xl border border-slate-200/80 text-xs">
                      No layout file attached by customer.
                    </div>
                  )}
                </div>

                {/* Designer Uploaded CAD Files (Multiple File Support) */}
                {selectedRequest.drawingFiles && Array.isArray(selectedRequest.drawingFiles) && selectedRequest.drawingFiles.length > 0 ? (
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">
                      DESIGNER CAD FILES ({selectedRequest.drawingFiles.length}):
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedRequest.drawingFiles.map((f, i) => (
                        <div key={i} className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                          <span className="text-emerald-900 font-bold truncate text-[11px]">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => triggerFileDownload(f, f.name)}
                            className="text-emerald-700 hover:text-emerald-900 font-bold text-[10px] flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-emerald-300 shadow-2xs cursor-pointer"
                          >
                            <FiDownload className="w-3 h-3" /> Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (selectedRequest.drawingUrl || selectedRequest.fileName) ? (
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="font-bold text-slate-900 block text-xs truncate">{selectedRequest.fileName || "CAD Drawing.dwg"}</span>
                    <button
                      type="button"
                      onClick={() => triggerFileDownload({ url: selectedRequest.drawingUrl, name: selectedRequest.fileName }, selectedRequest.fileName || "Drawing.dwg")}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 transition cursor-pointer shadow-xs"
                    >
                      <FiDownload /> Download CAD
                    </button>
                  </div>
                ) : null}

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer text-xs"
                  >
                    Close Preview
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
