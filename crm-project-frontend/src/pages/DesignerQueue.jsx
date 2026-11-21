import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUpload,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiUser,
  FiLayers,
  FiX,
  FiDownload,
  FiPaperclip,
  FiRefreshCw,
  FiMapPin,
  FiFolder,
  FiSearch,
  FiFilter,
  FiInfo,
  FiArrowRight,
  FiPlus,
  FiPrinter,
  FiRepeat
} from "react-icons/fi";
import Swal from "sweetalert2";
import Base from "../components/Base";
import { useModulePermissions } from "../hooks/useAuth";
import DesignerSlipModal from "../components/designer/DesignerSlipModal";
import DesignerUploadModal from "../components/designer/DesignerUploadModal";
import DesignVersionHistoryModal from "../components/designer/DesignVersionHistoryModal";
import { triggerFileDownload } from "../utils/designFileStorage";
import { getCurrentUserDisplayName, healDesignRequests } from "../utils/auth";

export default function DesignerQueue() {
  const { canView, canCreate, canEdit, canDelete, isLoading: loadingUser } = useModulePermissions("designer_queue");
  const navigate = useNavigate();
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const token = localStorage.getItem("access") || "";

  const currentRole = (localStorage.getItem("user_role") || "designer").toLowerCase();
  const currentUserName = localStorage.getItem("user_name") || "Designer User";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipRequest, setSlipRequest] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionRequest, setVersionRequest] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // Load and merge requests from backend API + localStorage WITH PROPER DEDUPLICATION
  const fetchQueueData = useCallback(async () => {
    setLoading(true);
    let apiLeads = [];
    if (token && BASE_API) {
      try {
        const res = await fetch(`${BASE_API}/lead/lead/?page_size=500`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          apiLeads = Array.isArray(data) ? data : data.results || [];
        }
      } catch (e) {
        console.warn("Backend fetch failed, using local storage requests", e);
      }
    }

    // Read localStorage requests
    let localReqs = [];
    try {
      localReqs = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
    } catch {
      localReqs = [];
    }

    // Strict deduplication by leadId / unique ID / customerName
    const deduplicatedList = [];
    const seenKeys = new Set();

    // 1. Process LocalStorage requests first (ONLY IF EXPLICITLY SENT BY SALES PERSON)
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
          : (currentRole === "sales" ? getCurrentUserDisplayName() : (r.salesPersonName || "Sales Person"));
        const sentDt = r.sentDate || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

        deduplicatedList.push({
          ...r,
          id: r.id || `DS-${r.leadId || 101}`,
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
          salesPersonName: salesPerson,
          salesPersonEmail: r.salesPersonEmail || "sales@nnit.com",
          requirements: reqs,
          quantity: qty,
          remark: rmk,
          customerLayoutName: r.customerLayoutName || "",
          customerLayoutUrl: r.customerLayoutUrl || "",
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

    // 2. Add backend leads ONLY IF l.is_sent is True/1 (Explicitly Sent by Sales Person)
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

    setRequests(deduplicatedList);
    setLoading(false);
  }, [token, BASE_API, compileLeadRequirements]);

  useEffect(() => {
    fetchQueueData();
    const handleUpdate = () => fetchQueueData();
    window.addEventListener("designRequestUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("designRequestUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [fetchQueueData]);

  // Filtered requests search & status
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchSearch =
        searchQuery === "" ||
        r.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requirements?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && (r.status === "pending_drawing" || r.status === "revision_requested")) ||
        (statusFilter === "revision" && r.status === "revision_requested") ||
        (statusFilter === "completed" && (r.status === "drawing_completed" || r.status === "attached_to_quotation"));

      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  // Open Upload Modal
  const handleOpenUpload = (req) => {
    setSelectedRequest(req);
    setShowUploadModal(true);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === "pending_drawing").length;
    const revisions = requests.filter(r => r.status === "revision_requested").length;
    const completed = requests.filter(r => r.status === "drawing_completed" || r.status === "attached_to_quotation").length;
    return { total, pending, revisions, completed };
  }, [requests]);

  if (!loadingUser && !canView) {
    return (
      <Base title="Designer Work Queue">
        <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow mt-6">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h3>
          <p>You do not have permission to view Designer Queue.</p>
        </div>
      </Base>
    );
  }

  return (
    <Base title="Designer Work Queue">
      <div className="p-4 sm:p-5 space-y-5 font-sans bg-[#f8fafc] min-h-full">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Designer Work Queue</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200/80 uppercase tracking-wider">
                Designer Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              View and manage incoming lead design requests, upload CAD files (.dwg, .pdf, images), and handle client revision requests.
            </p>
          </div>

          <button
            onClick={fetchQueueData}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition border border-slate-200/80 shrink-0 cursor-pointer shadow-2xs"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Sent Leads</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</div>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <FiLayers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Drawing</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{metrics.pending}</div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <FiClock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Revision Requested</span>
              <div className="text-2xl font-black text-purple-600 mt-1">{metrics.revisions}</div>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
              <FiRepeat className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Drawings Completed</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.completed}</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <FiCheckCircle className="w-5 h-5" />
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
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl gap-1 flex-wrap">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                All ({requests.length})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === "pending" ? "bg-amber-500 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Pending ({metrics.pending})
              </button>
              <button
                onClick={() => setStatusFilter("revision")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === "revision" ? "bg-purple-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Revisions ({metrics.revisions})
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

        {/* ── Incoming Work Queue Table ── */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <span>Incoming Drawing Requests</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-black text-xs">
                {filteredRequests.length}
              </span>
            </h3>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Workflow: Sent by Sales • Designer Uploads CAD • Revision V1, V2...
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-700 font-extrabold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-3 w-20">Req ID</th>
                  <th className="py-3.5 px-3 w-16 text-center">Version</th>
                  <th className="py-3.5 px-4">Client / Customer & Project</th>
                  <th className="py-3.5 px-4">Site Location</th>
                  <th className="py-3.5 px-4 max-w-xs">Requirements & Specs</th>
                  <th className="py-3.5 px-4">Customer Layout</th>
                  <th className="py-3.5 px-4">Sales Person (Sent By)</th>
                  <th className="py-3.5 px-4">Sent Date & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-semibold">
                      <div className="flex flex-col items-center gap-2">
                        <FiRefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                        <span>Loading requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => {
                    const verNo = req.current_version || (req.versions?.length || 1);
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-indigo-600 text-xs">{req.reqNo || req.id}</td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setVersionRequest(req);
                              setShowVersionModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer shadow-2xs transition"
                            title="Click to view Version History"
                          >
                            <FiLayers className="w-3 h-3 text-indigo-500" />
                            <span>V{verNo}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 text-xs">{req.clientCoName || req.customerName}</div>
                          <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                            <FiFolder className="w-3.5 h-3.5 shrink-0" />
                            <span>{req.projectName || req.companyName || "N/A"}</span>
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
                                : (currentRole === "sales" ? getCurrentUserDisplayName() : (req.salesPersonName || "Sales Person"))}
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
                            {/* Upload / Re-Upload CAD Files Modal */}
                            <button
                              onClick={() => handleOpenUpload(req)}
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

                            {/* View Slip Button */}
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

                            {/* View Details Button */}
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setShowViewModal(true);
                              }}
                              className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
                              title="View Complete Details"
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
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                      No design requests in Designer Queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MODAL 1: DESIGNER MULTI-FILE UPLOAD & REVISION MODAL ── */}
        <DesignerUploadModal
          open={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onSuccess={() => {
            fetchQueueData();
            setShowUploadModal(false);
            setSelectedRequest(null);
          }}
          baseApi={BASE_API}
          token={token}
        />

        {/* ── MODAL 2: VERSION HISTORY TIMELINE MODAL ── */}
        <DesignVersionHistoryModal
          open={showVersionModal}
          onClose={() => {
            setShowVersionModal(false);
            setVersionRequest(null);
          }}
          request={versionRequest}
        />

        {/* ── MODAL 3: VIEW DETAILS PREVIEW ── */}
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
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">PROJECT NAME</span>
                    <span className="font-black text-indigo-700 text-sm">{selectedRequest.projectName || selectedRequest.companyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">CUSTOMER NAME</span>
                    <span className="font-black text-slate-900 text-sm">{selectedRequest.clientCoName || selectedRequest.customerName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">SITE LOCATION</span>
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mt-0.5">
                      <FiMapPin className="text-rose-500 shrink-0" /> {selectedRequest.projectAddress || selectedRequest.location || "N/A"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">SITE REQUIREMENTS & SPECS:</span>
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200/80 text-slate-800 font-medium whitespace-pre-line max-h-40 overflow-y-auto leading-relaxed">
                    {selectedRequest.requirements}
                  </div>
                </div>

                {/* Customer Provided Layout */}
                <div>
                  <span className="font-bold text-slate-700 block mb-1">CUSTOMER PROVIDED LAYOUT FILE:</span>
                  {selectedRequest.customerLayoutName || selectedRequest.customerLayoutUrl ? (
                    <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/80 flex items-center justify-between">
                      <span className="font-bold text-indigo-900 flex items-center gap-1.5 truncate">
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

                {/* Designer Uploaded CAD Files (if any) */}
                {selectedRequest.drawingFiles && selectedRequest.drawingFiles.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">DESIGNER CAD DRAWING FILES:</span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {selectedRequest.drawingFiles.map((f, i) => (
                        <div key={i} className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                          <span className="text-emerald-900 font-semibold truncate text-[11px]">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => triggerFileDownload(f, f.name)}
                            className="text-emerald-700 hover:text-emerald-900 font-bold text-[10px] flex items-center gap-1 bg-white px-2 py-1 rounded border border-emerald-300 shadow-2xs cursor-pointer"
                          >
                            <FiDownload className="w-3 h-3" /> Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100">
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

        {/* ── MODAL 4: DESIGNER SLIP VIEW & PRINT (Exact Physical Slip Format) ── */}
        <DesignerSlipModal
          open={showSlipModal}
          onClose={() => {
            setShowSlipModal(false);
            setSlipRequest(null);
          }}
          request={slipRequest}
        />
      </div>
    </Base>
  );
}
