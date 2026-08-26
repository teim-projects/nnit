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
  FiInfo
} from "react-icons/fi";
import Swal from "sweetalert2";
import Base from "../components/Base";
import { useModulePermissions } from "../hooks/useAuth";

export default function DesignManagement() {
  const { canView, canCreate, canEdit, canDelete, isLoading: loadingUser } = useModulePermissions("design_drawings");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "sales";
  const sendParam = searchParams.get("send");
  const leadIdParam = searchParams.get("leadId");

  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const token = localStorage.getItem("access") || "";

  // Logged-in User Profile & Role
  const currentUserEmail = localStorage.getItem("user_email") || "pravin123@gmail.com";
  const currentUserName = localStorage.getItem("user_name") || "Pravin Dare";
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
        localStorage.setItem("nnit_design_requests", JSON.stringify([]));
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

      const key = String(r.leadId || r.id || r.customerName || "").trim().toLowerCase();
      if (key && !seenKeys.has(key)) {
        seenKeys.add(key);
        if (r.id) seenKeys.add(String(r.id).toLowerCase());
        if (r.leadId) seenKeys.add(String(r.leadId).toLowerCase());

        deduplicatedList.push({
          id: r.id || `DR-${r.leadId}`,
          leadId: r.leadId,
          customerName: r.customerName || "Unknown Customer",
          projectName: r.projectName || r.companyName || "N/A",
          companyName: r.projectName || r.companyName || "N/A",
          location: r.location || "N/A",
          requirements: r.requirements || "Site Entrance CAD Drawing & Specs",
          customerLayoutName: r.customerLayoutName || "",
          customerLayoutUrl: r.customerLayoutUrl || "",
          salesPersonName: r.salesPersonName || "Sales Person",
          salesPersonEmail: r.salesPersonEmail || "sales@nnit.com",
          sentDate: r.sentDate || new Date().toLocaleString(),
          status: r.status || "pending_drawing",
          is_sent: 1,
          is_received: r.is_received ?? 0,
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
      const isSent = l.is_sent === true || l.is_sent === 1 || l.is_sent === "true" || l.is_sent === "1";
      if (!isSent) return; // Skip leads that Sales Person has NOT sent to designer!

      const idKey = String(l.id).toLowerCase();
      const drKey = `dr-${l.id}`;
      const custName = (l.contact_person_name || l.customer_name || l.customer?.name || "").trim().toLowerCase();

      if (!seenKeys.has(idKey) && !seenKeys.has(drKey) && (!custName || !seenKeys.has(custName))) {
        seenKeys.add(idKey);
        seenKeys.add(drKey);
        if (custName) seenKeys.add(custName);

        const proj = l.project_name || l.company_name || "N/A";
        const loc = l.site_location || l.project_adderess || l.customer_address || l.customer?.site_address || "N/A";
        const reqs = compileLeadRequirements(l);
        const custLayoutName = l.customer_layout_name || l.cad_file_name || "";
        const custLayoutUrl = l.customer_layout_url || l.customer_layout || l.cad_file || "";

        deduplicatedList.push({
          id: `DR-${l.id}`,
          leadId: l.id,
          customerName: l.contact_person_name || l.customer_name || l.customer?.name || `Lead #${l.id}`,
          projectName: proj,
          companyName: proj,
          location: loc,
          requirements: reqs,
          customerLayoutName: custLayoutName,
          customerLayoutUrl: custLayoutUrl,
          salesPersonName: l.assign_to_details?.full_name || "Pravin Dare",
          salesPersonEmail: l.assign_to_details?.email || "sales@nnit.com",
          sentDate: l.date || new Date().toLocaleDateString(),
          status: l.is_received ? "drawing_completed" : "pending_drawing",
          is_sent: 1,
          is_received: l.is_received ? 1 : 0,
          drawingTitle: "",
          drawingSpecs: "",
          fileName: "",
          fileType: "autocad",
          drawingUrl: "",
          designerNotes: ""
        });
      }
    });

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
  const [showSendModal, setShowSendModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Form State: Send to Designer
  const [sendForm, setSendForm] = useState({
    selectedLeadId: "",
    customerName: "",
    projectName: "",
    location: "",
    requirements: "",
    customerLayoutName: "",
    customerLayoutUrl: "",
    customerLayoutFile: null
  });

  // Handle lead prefill selection
  const handleSelectLeadToPrefill = useCallback(async (leadId, leadList = availableLeads) => {
    if (!leadId) {
      setSendForm({
        selectedLeadId: "",
        customerName: "",
        projectName: "",
        location: "",
        requirements: "",
        customerLayoutName: "",
        customerLayoutUrl: "",
        customerLayoutFile: null
      });
      return;
    }

    let lead = leadList.find(l => String(l.id) === String(leadId));

    const token = localStorage.getItem("access");
    const BASE_API = import.meta.env.VITE_BASE_API_URL;
    if (token && BASE_API) {
      try {
        const res = await fetch(`${BASE_API}/lead/lead/${leadId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const detailLead = await res.json();
          lead = { ...lead, ...detailLead };
        }
      } catch (err) {
        console.warn("Lead detail fetch fallback", err);
      }
    }

    if (lead) {
      const compiledReqs = compileLeadRequirements(lead);
      setSendForm({
        selectedLeadId: lead.id,
        customerName: lead.contact_person_name || lead.customer_name || lead.customer?.name || "",
        projectName: lead.project_name || lead.company_name || "",
        location: lead.site_location || lead.project_adderess || lead.customer_address || lead.customer?.site_address || "",
        requirements: compiledReqs,
        customerLayoutName: lead.customer_layout_name || lead.cad_file_name || "",
        customerLayoutUrl: lead.customer_layout_url || lead.customer_layout || lead.cad_file || "",
        customerLayoutFile: null
      });
    }
  }, [availableLeads, compileLeadRequirements]);

  useEffect(() => {
    if (sendParam === "true" && leadIdParam) {
      setShowSendModal(true);
      handleSelectLeadToPrefill(leadIdParam);
    }
  }, [sendParam, leadIdParam, handleSelectLeadToPrefill]);

  // Handle Customer Layout File upload by Sales Person
  const handleCustomerLayoutChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSendForm(prev => ({
        ...prev,
        customerLayoutName: file.name,
        customerLayoutUrl: reader.result,
        customerLayoutFile: file
      }));
    };
    reader.readAsDataURL(file);
  };

  // Form State: Designer Drawing Upload
  const [uploadForm, setUploadForm] = useState({
    drawingTitle: "",
    drawingSpecs: "",
    fileName: "",
    fileType: "",
    fileDataUrl: "",
    drawingUrl: "",
    designerNotes: ""
  });

  // Filtered requests based on search & status
  const filteredRequests = useMemo(() => {
    return designRequests.filter(r => {
      const matchSearch =
        searchQuery === "" ||
        r.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requirements?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && r.status === "pending_drawing") ||
        (statusFilter === "completed" && (r.status === "drawing_completed" || r.status === "attached_to_quotation"));

      return matchSearch && matchStatus;
    });
  }, [designRequests, searchQuery, statusFilter]);

  // Metric Counts
  const metrics = useMemo(() => {
    const total = designRequests.length;
    const pending = designRequests.filter(r => r.status === "pending_drawing").length;
    const completed = designRequests.filter(r => r.status === "drawing_completed" || r.status === "attached_to_quotation").length;
    const attached = designRequests.filter(r => r.status === "attached_to_quotation").length;
    return { total, pending, completed, attached };
  }, [designRequests]);

  // Action 1: Sales Person Sends Lead to Designer
  const handleOpenSendModal = () => {
    setSendForm({
      selectedLeadId: "",
      customerName: "",
      projectName: "",
      location: "",
      requirements: "",
      customerLayoutName: "",
      customerLayoutUrl: "",
      customerLayoutFile: null
    });
    setShowSendModal(true);
  };

  const handleSendToDesigner = async (e) => {
    e.preventDefault();
    if (!sendForm.customerName.trim() || !sendForm.requirements.trim()) {
      Swal.fire("Required", "Please enter Customer Name and Site Requirements.", "warning");
      return;
    }

    const token = localStorage.getItem("access");
    const BASE_API = import.meta.env.VITE_BASE_API_URL;
    let targetLeadId = sendForm.selectedLeadId || Date.now();

    if (token && BASE_API) {
      try {
        if (sendForm.selectedLeadId) {
          await fetch(`${BASE_API}/lead/lead/${sendForm.selectedLeadId}/send-to-designer/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              project_name: sendForm.projectName,
              site_location: sendForm.location,
              site_requirement: sendForm.requirements,
              customer_layout_name: sendForm.customerLayoutName,
              customer_layout_url: sendForm.customerLayoutUrl
            })
          });
        } else {
          // Create customer + lead
          const custRes = await fetch(`${BASE_API}/lead/customer/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              name: sendForm.customerName,
              site_address: sendForm.location,
              contact_number: `9${Math.floor(100000000 + Math.random() * 900000000)}`
            })
          });
          let customerId = null;
          if (custRes.ok) {
            const custData = await custRes.json();
            customerId = custData.id;
          }
          if (customerId) {
            const leadRes = await fetch(`${BASE_API}/lead/lead/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                customer: customerId,
                project_name: sendForm.projectName || "N/A",
                company_name: sendForm.projectName || "N/A",
                project_adderess: sendForm.location || "N/A",
                site_location: sendForm.location || "N/A",
                requirements_details: sendForm.requirements,
                site_requirement: sendForm.requirements,
                customer_layout_name: sendForm.customerLayoutName,
                customer_layout_url: sendForm.customerLayoutUrl,
                lead_source: "other",
                is_sent: true,
                is_received: false
              })
            });
            if (leadRes.ok) {
              const leadData = await leadRes.json();
              targetLeadId = leadData.id;
            }
          }
        }
      } catch (err) {
        console.warn("Backend Lead send fallback to local storage", err);
      }
    }

    const newRequest = {
      id: `DR-${targetLeadId}`,
      leadId: targetLeadId,
      customerName: sendForm.customerName,
      projectName: sendForm.projectName || "N/A",
      companyName: sendForm.projectName || "N/A",
      location: sendForm.location || "N/A",
      requirements: sendForm.requirements,
      customerLayoutName: sendForm.customerLayoutName || "",
      customerLayoutUrl: sendForm.customerLayoutUrl || "",
      salesPersonName: currentUserName,
      salesPersonEmail: currentUserEmail,
      sentDate: new Date().toLocaleString(),
      status: "pending_drawing",
      is_sent: 1,
      is_received: 0,
      drawingTitle: "",
      drawingSpecs: "",
      fileName: "",
      fileType: "",
      drawingUrl: "",
      designerNotes: "",
      completedDate: "",
      attachedToQuotation: false
    };

    setDesignRequests(prev => {
      const filtered = prev.filter(r => String(r.leadId) !== String(targetLeadId) && String(r.id) !== String(newRequest.id));
      const updated = [newRequest, ...filtered];
      localStorage.setItem("nnit_design_requests", JSON.stringify(updated));
      return updated;
    });

    window.dispatchEvent(new Event("designRequestUpdated"));
    window.dispatchEvent(new Event("storage"));
    setShowSendModal(false);
    Swal.fire({
      title: "Sent to Designer!",
      text: `Lead for ${sendForm.customerName} (${sendForm.projectName || "Project"}) sent to Designer Queue. (Sent: Yes, Received: No)`,
      icon: "success",
      confirmButtonColor: "#4f46e5"
    });
  };

  // Action 2: Designer Opens Upload Modal
  const handleOpenUploadModal = (req) => {
    setSelectedRequest(req);
    setUploadForm({
      drawingTitle: req.drawingTitle || `${req.customerName} Gate Layout Plan`,
      drawingSpecs: req.drawingSpecs || "AutoCAD CAD Drawing & Site Specification Plan",
      fileName: req.fileName || "",
      fileType: req.fileType || "autocad",
      fileDataUrl: req.drawingUrl || "",
      drawingUrl: req.drawingUrl || "",
      designerNotes: req.designerNotes || "AutoCAD drawing completed according to site specifications."
    });
    setShowUploadModal(true);
  };

  // File Picker Handler for AutoCAD, PDF, Images, Zip, Any format
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    let type = "other";
    if (ext === "dwg" || ext === "dxf") type = "autocad";
    else if (ext === "pdf") type = "pdf";
    else if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) type = "image";
    else if (["zip", "rar", "7z"].includes(ext)) type = "archive";

    const reader = new FileReader();
    reader.onload = () => {
      setUploadForm(prev => ({
        ...prev,
        fileName: file.name,
        fileType: type,
        fileDataUrl: reader.result,
        drawingUrl: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Action 3: Designer Submits Drawing & Returns to Sales
  const handleDesignerSubmit = (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (selectedRequest.leadId && token && BASE_API) {
      fetch(`${BASE_API}/lead/lead/${selectedRequest.leadId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_sent: true, is_received: true })
      }).catch(() => {});
    }

    setDesignRequests(prev => {
      const updated = prev.map(r => {
        const isMatch = (
          String(r.id) === String(selectedRequest.id) ||
          String(r.leadId) === String(selectedRequest.leadId) ||
          (r.customerName && selectedRequest.customerName && (
            r.customerName.toLowerCase() === selectedRequest.customerName.toLowerCase()
          ))
        );

        if (isMatch) {
          return {
            ...r,
            status: "drawing_completed",
            is_sent: 1,
            is_received: 1,
            drawingTitle: uploadForm.drawingTitle || `${selectedRequest.customerName} Gate Layout Plan`,
            drawingSpecs: uploadForm.drawingSpecs || "AutoCAD CAD Drawing & Site Specification",
            fileName: uploadForm.fileName || "AutoCAD_Drawing_Plan.dwg",
            fileType: uploadForm.fileType || "autocad",
            drawingUrl: uploadForm.fileDataUrl || uploadForm.drawingUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60",
            designerNotes: uploadForm.designerNotes,
            completedDate: new Date().toLocaleString()
          };
        }
        return r;
      });
      localStorage.setItem("nnit_design_requests", JSON.stringify(updated));
      return updated;
    });

    setShowUploadModal(false);
    window.dispatchEvent(new Event("designRequestUpdated"));
    window.dispatchEvent(new Event("storage"));
    Swal.fire({
      title: "Drawing Returned to Sales!",
      text: `Drawing (${uploadForm.fileName || "File"}) sent to Sales (Sent: Yes, Received: Yes).`,
      icon: "success",
      confirmButtonColor: "#10b981"
    });
  };

  // Action 4: Sales Person Attaches Drawing to Quotation
  const handleAttachToQuotation = (req) => {
    setDesignRequests(prev => {
      const updated = prev.map(r => (r.id === req.id ? { ...r, status: "attached_to_quotation", attachedToQuotation: true } : r));
      localStorage.setItem("nnit_design_requests", JSON.stringify(updated));
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
                  <tr className="bg-slate-100/70 text-slate-600 font-extrabold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 w-24">Req ID</th>
                    <th className="py-3.5 px-4">Customer & Project</th>
                    <th className="py-3.5 px-4">Site Location</th>
                    <th className="py-3.5 px-4 max-w-xs">Requirements & Specs</th>
                    <th className="py-3.5 px-4">Customer Layout</th>
                    <th className="py-3.5 px-4 text-center">Sales Sent</th>
                    <th className="py-3.5 px-4 text-center">Designer Sent</th>
                    <th className="py-3.5 px-4">Drawing Status</th>
                    <th className="py-3.5 px-4 text-center">Drawing Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-black text-indigo-600 text-xs">{req.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 text-xs">{req.customerName}</div>
                          <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                            <FiFolder className="w-3.5 h-3.5 shrink-0" />
                            <span>{req.projectName || req.companyName || "N/A"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 max-w-xs">
                          {req.location && req.location !== "N/A" ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <FiMapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="truncate max-w-[130px]">{req.location}</span>
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
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${req.is_sent ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80" : "bg-slate-100 text-slate-400"}`}>
                            {req.is_sent ? "✓ Sent" : "No"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${req.is_received ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" : "bg-amber-50 text-amber-700 border border-amber-200/80"}`}>
                            {req.is_received ? "✓ Yes" : "⏳ Pending"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {req.status === "pending_drawing" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                              <FiClock className="w-3.5 h-3.5" /> Pending Drawing
                            </span>
                          )}
                          {req.status === "drawing_completed" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <FiCheckCircle className="w-3.5 h-3.5" /> Drawing Ready
                            </span>
                          )}
                          {req.status === "attached_to_quotation" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                              <FiPaperclip className="w-3.5 h-3.5" /> Quote Attached
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {req.status === "pending_drawing" && (
                              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-xl font-semibold text-xs flex items-center gap-1">
                                <FiClock className="w-3.5 h-3.5 text-amber-600" />
                                <span>In Queue</span>
                              </span>
                            )}
                            {req.status === "drawing_completed" && (
                              <button
                                onClick={() => handleAttachToQuotation(req)}
                                className="w-8 h-8 rounded-full bg-[#00ac4f] hover:bg-[#009643] text-white flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0"
                                title="Attach to Quotation"
                              >
                                <FiPaperclip className="w-4 h-4 text-white" />
                              </button>
                            )}
                            {req.status === "attached_to_quotation" && (
                              <button
                                onClick={() => navigate("/quotation")}
                                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0"
                                title="View Quotation"
                              >
                                <FiFileText className="w-4 h-4 text-white" />
                              </button>
                            )}
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
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
                Upload AutoCAD (.dwg/.dxf), PDF, or layout files and send to Sales
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-extrabold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 w-24">Req ID</th>
                    <th className="py-3.5 px-4">Customer & Project</th>
                    <th className="py-3.5 px-4">Site Location</th>
                    <th className="py-3.5 px-4 max-w-xs">Requirements & Specs</th>
                    <th className="py-3.5 px-4">Customer Layout</th>
                    <th className="py-3.5 px-4 text-center">Sales Sent</th>
                    <th className="py-3.5 px-4 text-center">Designer Sent</th>
                    <th className="py-3.5 px-4">Design Status</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-black text-indigo-600 text-xs">{req.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 text-xs">{req.customerName}</div>
                          <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
                            <FiFolder className="w-3.5 h-3.5 shrink-0" />
                            <span>{req.projectName || req.companyName || "N/A"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 max-w-xs">
                          {req.location && req.location !== "N/A" ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <FiMapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="truncate max-w-[130px]">{req.location}</span>
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
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${req.is_sent ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80" : "bg-slate-100 text-slate-400"}`}>
                            {req.is_sent ? "✓ Sent" : "No"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${req.is_received ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" : "bg-amber-50 text-amber-700 border border-amber-200/80"}`}>
                            {req.is_received ? "✓ Yes" : "⏳ Pending"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {req.status === "pending_drawing" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                              <FiClock className="w-3.5 h-3.5" /> Pending Drawing
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <FiCheckCircle className="w-3.5 h-3.5" /> Completed
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenUploadModal(req)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0 ${
                                req.status === "pending_drawing"
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  : "bg-amber-500 hover:bg-amber-600 text-white"
                              }`}
                              title={req.status === "pending_drawing" ? "Upload CAD Drawing" : "Edit CAD Drawing"}
                            >
                              <FiUpload className="w-4 h-4 text-white" />
                            </button>

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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        No design requests in Designer Queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MODAL 1: SEND LEAD TO DESIGNER ── */}
        {showSendModal && (
          <div className="fixed inset-0 bg-black/60 z-[1200] flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <FiSend className="text-indigo-400" />
                  <span>Send Lead Details to Designer Queue</span>
                </h3>
                <button onClick={() => setShowSendModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendToDesigner} className="p-6 space-y-4 text-xs">
                {availableLeads.length > 0 && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Lead from System (Optional)</label>
                    <select
                      value={sendForm.selectedLeadId}
                      onChange={e => handleSelectLeadToPrefill(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                    >
                      <option value="">-- Manual Entry / Create New Request --</option>
                      {availableLeads.map(l => (
                        <option key={l.id} value={l.id}>
                          Lead #{l.id} — {l.contact_person_name || l.customer_name || l.customer?.name} ({l.project_name || l.company_name || "Project"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">1. Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma Residency / Apex Horizon Project"
                    value={sendForm.projectName}
                    onChange={e => setSendForm({ ...sendForm, projectName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">2. Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BHARAT MANOJ SHARMA"
                    value={sendForm.customerName}
                    onChange={e => setSendForm({ ...sendForm, customerName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">3. Site Location / Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plot No 42, Sector 62, Noida, Uttar Pradesh"
                    value={sendForm.location}
                    onChange={e => setSendForm({ ...sendForm, location: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">4. Site Requirement & Specs *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Specify boom barrier length, pit parking details..."
                    value={sendForm.requirements}
                    onChange={e => setSendForm({ ...sendForm, requirements: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    5. Customer Provided Layout File (Image, PDF, DWG, Zip)
                  </label>
                  <input
                    type="file"
                    accept=".dwg,.dxf,.pdf,.png,.jpg,.jpeg,.zip,.rar"
                    onChange={handleCustomerLayoutChange}
                    className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-xs"
                  />
                  {sendForm.customerLayoutName && (
                    <div className="mt-2 text-xs font-bold text-indigo-900 flex items-center justify-between bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                      <span className="flex items-center gap-1.5 truncate">
                        <FiPaperclip className="text-indigo-600 shrink-0" />
                        Attached: {sendForm.customerLayoutName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm cursor-pointer transition"
                  >
                    Submit to Designer Queue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL 2: DESIGNER UPLOADS DWG / PDF / FILE ── */}
        {showUploadModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/60 z-[1200] flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <FiUpload className="text-emerald-400" />
                  <span>Upload Drawing File & Return to Sales</span>
                </h3>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDesignerSubmit} className="p-6 space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium space-y-1.5">
                  <div><strong className="text-indigo-900">Project: </strong>{selectedRequest.projectName || selectedRequest.companyName}</div>
                  <div><strong className="text-indigo-900">Customer: </strong>{selectedRequest.customerName}</div>
                  <div><strong className="text-indigo-900">Location: </strong>{selectedRequest.location}</div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drawing Title *</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.drawingTitle}
                    onChange={e => setUploadForm({ ...uploadForm, drawingTitle: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Attach Completed Drawing File (.dwg, PDF, Image, ZIP) *
                  </label>
                  <input
                    type="file"
                    accept=".dwg,.dxf,.pdf,.png,.jpg,.jpeg,.zip,.rar"
                    onChange={handleFileChange}
                    className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                  {uploadForm.fileName && (
                    <div className="mt-2 text-xs font-bold text-slate-700 flex items-center gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <FiPaperclip className="text-emerald-600" />
                      <span>Selected: {uploadForm.fileName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designer Remarks</label>
                  <textarea
                    rows={2}
                    value={uploadForm.designerNotes}
                    onChange={e => setUploadForm({ ...uploadForm, designerNotes: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <FiCornerDownLeft /> Return to Sales
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL 3: VIEW ALL DETAILS ── */}
        {showViewModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/60 z-[1200] flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <FiFileText className="text-indigo-400" />
                  <span>Request Details — {selectedRequest.id}</span>
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
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">CUSTOMER NAME</span>
                    <span className="font-black text-slate-900 text-sm">{selectedRequest.customerName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">SITE LOCATION</span>
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mt-0.5">
                      <FiMapPin className="text-rose-500 shrink-0" /> {selectedRequest.location || "N/A"}
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

                {/* Designer Output */}
                {(selectedRequest.drawingUrl || selectedRequest.fileName || selectedRequest.drawingTitle || selectedRequest.status === "drawing_completed" || selectedRequest.status === "attached_to_quotation") && (
                  <div className="space-y-2.5 border-t border-slate-200/80 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 text-xs flex items-center gap-1">
                        <FiCheckCircle /> RETURNED DRAWING FILE:
                      </span>
                      {renderFileTypeBadge(selectedRequest.fileType || "autocad", selectedRequest.fileName || "Drawing.dwg")}
                    </div>

                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiFileText className="w-5 h-5 text-indigo-600" />
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{selectedRequest.fileName || "AutoCAD_Drawing.dwg"}</span>
                        </div>
                      </div>
                      <a
                        href={selectedRequest.drawingUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60"}
                        download={selectedRequest.fileName || `${selectedRequest.customerName}_CAD.dwg`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 transition cursor-pointer shadow-xs"
                      >
                        <FiDownload /> Download CAD
                      </a>
                    </div>
                  </div>
                )}

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
