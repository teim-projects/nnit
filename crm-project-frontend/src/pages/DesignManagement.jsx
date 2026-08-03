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
  FiArrowRight,
  FiUser,
  FiLayers,
  FiCheckSquare,
  FiAlertCircle,
  FiCornerDownLeft,
  FiFile,
  FiFolder,
  FiImage,
  FiTrash2
} from "react-icons/fi";
import Swal from "sweetalert2";
import Base from "../components/Base";
import { useModulePermissions } from "../hooks/useAuth";

// Default Initial State: Empty array until Sales Person sends a lead to Designer
const DEFAULT_DESIGN_REQUESTS = [];

export default function DesignManagement() {
  const { canView, canCreate, canEdit, canDelete, isLoading: loadingUser } = useModulePermissions("design_drawings");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "sales";

  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const token = localStorage.getItem("access") || "";

  // Logged-in User Profile & Role
  const currentUserEmail = localStorage.getItem("user_email") || "pravin123@gmail.com";
  const currentUserName = localStorage.getItem("user_name") || "Pravin Dare";
  const [currentRole, setCurrentRole] = useState(localStorage.getItem("user_role") || "sales");

  // Active Tab
  const [activeTab, setActiveTab] = useState(initialTab);

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

  // Sync from backend database + localStorage on mount and events
  const fetchAllRequests = useCallback(async () => {
    let localReqs = getDeduplicatedRequests();
    let apiReqs = [];
    const token = localStorage.getItem("access");
    const BASE_API = import.meta.env.VITE_BASE_API_URL;

    if (token && BASE_API) {
      try {
        const res = await fetch(`${BASE_API}/lead/lead/?page_size=500`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const leads = Array.isArray(data) ? data : data.results || [];
          leads.forEach(l => {
            const name = l.contact_person_name || l.customer_name || l.customer?.name || `Lead #${l.id}`;
            apiReqs.push({
              id: `DR-${l.id}`,
              leadId: l.id,
              customerName: name,
              companyName: l.company_name || l.project_name || "N/A",
              salesPersonName: l.assign_to_details?.full_name || "Pravin Dare",
              salesPersonEmail: l.assign_to_details?.email || "sales@nnit.com",
              requirements: l.requirements_details || "Site Entrance CAD Drawing & Specs",
              sentDate: l.date || new Date().toLocaleDateString(),
              status: l.is_received ? "drawing_completed" : "pending_drawing",
              is_sent: l.is_sent ? 1 : 1,
              is_received: l.is_received ? 1 : 0,
              drawingTitle: "",
              drawingSpecs: "",
              fileName: "",
              fileType: "autocad",
              drawingUrl: "",
              designerNotes: ""
            });
          });
        }
      } catch (err) {
        console.warn("Backend fetch failed, using local storage", err);
      }
    }

    const map = new Map();
    localReqs.forEach(r => {
      if (r.leadId) map.set(String(r.leadId), r);
      if (r.id) map.set(String(r.id), r);
      if (r.customerName) map.set(`name:${r.customerName.trim().toLowerCase()}`, r);
    });

    apiReqs.forEach(r => {
      const k1 = r.leadId ? String(r.leadId) : null;
      const nameKey = r.customerName ? `name:${r.customerName.trim().toLowerCase()}` : null;
      const existing = (k1 && map.get(k1)) || (nameKey && map.get(nameKey));

      if (!existing) {
        if (k1) map.set(k1, r);
        else if (nameKey) map.set(nameKey, r);
      }
    });

    const uniqueList = Array.from(new Set(Array.from(map.values())));
    setDesignRequests(uniqueList);
  }, []);

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
    customerName: "",
    companyName: "",
    requirements: ""
  });

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

  // Role Filtering logic: Show ALL design requests to Sales, Designer, and Admin!
  const filteredRequests = useMemo(() => {
    return designRequests;
  }, [designRequests]);

  // Metric Counts
  const metrics = useMemo(() => {
    const total = filteredRequests.length;
    const pending = filteredRequests.filter(r => r.status === "pending_drawing").length;
    const completed = filteredRequests.filter(r => r.status === "drawing_completed" || r.status === "attached_to_quotation").length;
    const attached = filteredRequests.filter(r => r.status === "attached_to_quotation").length;
    return { total, pending, completed, attached };
  }, [filteredRequests]);

  // Role Switcher Handler
  const handleRoleSwitch = (role) => {
    setCurrentRole(role);
    localStorage.setItem("user_role", role);
    if (role === "designer") setActiveTab("designer");
    else if (role === "sales") setActiveTab("sales");
  };

  // Action 1: Sales Person Sends Lead to Designer
  const handleOpenSendModal = () => {
    setSendForm({ customerName: "", companyName: "", requirements: "" });
    setShowSendModal(true);
  };

  const handleSendToDesigner = async (e) => {
    e.preventDefault();
    if (!sendForm.customerName.trim() || !sendForm.requirements.trim()) {
      Swal.fire("Required", "Please enter Customer Name and Requirements.", "warning");
      return;
    }

    const token = localStorage.getItem("access");
    const BASE_API = import.meta.env.VITE_BASE_API_URL;
    let createdLeadId = Date.now();

    // 1. Create or patch Lead in Django Backend Database
    if (token && BASE_API) {
      try {
        const custRes = await fetch(`${BASE_API}/lead/customer/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: sendForm.customerName, contact_number: `9${Math.floor(100000000 + Math.random() * 900000000)}` })
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
              company_name: sendForm.companyName || "N/A",
              requirements_details: sendForm.requirements,
              lead_source: "other",
              is_sent: true,
              is_received: false
            })
          });
          if (leadRes.ok) {
            const leadData = await leadRes.json();
            createdLeadId = leadData.id;
          }
        }
      } catch (err) {
        console.warn("Backend Lead creation fallback to local storage", err);
      }
    }

    const newRequest = {
      id: `DR-${Math.floor(100 + Math.random() * 900)}`,
      leadId: createdLeadId,
      customerName: sendForm.customerName,
      companyName: sendForm.companyName || "N/A",
      salesPersonName: currentUserName,
      salesPersonEmail: currentUserEmail,
      requirements: sendForm.requirements,
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
      const updated = [newRequest, ...prev];
      localStorage.setItem("nnit_design_requests", JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event("designRequestUpdated"));
    window.dispatchEvent(new Event("storage"));
    setShowSendModal(false);
    Swal.fire({
      title: "Sent to Designer!",
      text: `Design request for ${sendForm.customerName} sent to Designer Queue. (Sent: Yes, Received: No)`,
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
            r.customerName.toLowerCase() === selectedRequest.customerName.toLowerCase() ||
            r.customerName.toLowerCase().includes(selectedRequest.customerName.toLowerCase()) ||
            selectedRequest.customerName.toLowerCase().includes(r.customerName.toLowerCase())
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

  // Helper Badge for File Types (AutoCAD, PDF, Image, Archive)
  const renderFileTypeBadge = (fileType, fileName) => {
    if (fileType === "autocad" || fileName?.endsWith(".dwg") || fileName?.endsWith(".dxf")) {
      return <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-900 font-bold text-[11px] uppercase flex items-center gap-1 border border-blue-200">📐 AutoCAD (.DWG / .DXF)</span>;
    }
    if (fileType === "pdf" || fileName?.endsWith(".pdf")) {
      return <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-bold text-[11px] uppercase flex items-center gap-1 border border-rose-200">📄 PDF Document</span>;
    }
    if (fileType === "image" || ["png", "jpg", "jpeg"].some(e => fileName?.endsWith(e))) {
      return <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] uppercase flex items-center gap-1 border border-emerald-200">🖼 Layout Image</span>;
    }
    return <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 font-bold text-[11px] uppercase flex items-center gap-1 border border-purple-200">📦 Project File</span>;
  };

  return (
    <div className="min-h-full bg-[#f4f7fc] text-slate-800 p-4 md:p-6 font-sans">
      
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Design & Drawing Workflow</span>
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase tracking-wider">
              {currentRole === "admin" ? "Admin Mode" : currentRole === "designer" ? "Designer Queue" : "Sales Person View"}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Support for AutoCAD (.dwg / .dxf), PDF documents, images, and zip archives
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {designRequests.length > 0 && (
            <button
              onClick={handleClearAllRequests}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition shadow-sm"
              title="Clear all test design requests"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              <span>Clear All Requests</span>
            </button>
          )}

          {currentRole !== "designer" && (
            <button
              onClick={handleOpenSendModal}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
            >
              <FiSend className="w-4 h-4" />
              <span>Send Lead to Designer</span>
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Requests</span>
            <FiLayers className="text-indigo-500 w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{metrics.total}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Pending Designer Drawing</span>
            <FiClock className="text-amber-500 w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{metrics.pending}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Drawings Completed</span>
            <FiCheckCircle className="text-emerald-500 w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{metrics.completed}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Attached to Quotation</span>
            <FiPaperclip className="text-blue-500 w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-blue-600 mt-2">{metrics.attached}</div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 mb-6 px-4 pt-3">
        <div className="flex items-center gap-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("sales")}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "sales" ? "text-indigo-600 font-bold border-b-2 border-indigo-600" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Design Drawings (Sales Person View)
          </button>

          <button
            onClick={() => setActiveTab("designer")}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "designer" ? "text-indigo-600 font-bold border-b-2 border-indigo-600" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Designer Queue (Designer View)
          </button>
        </div>
      </div>

      {/* ── TAB 1: SALES PERSON VIEW ── */}
      {activeTab === "sales" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Design Requests Sent by Sales Person ({filteredRequests.length})
            </h3>
            <button
              onClick={handleOpenSendModal}
              className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-1.5"
            >
              <FiPlus /> New Design Request
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Request ID</th>
                  <th className="py-3.5 px-4">Customer / Company</th>
                  <th className="py-3.5 px-4">Salesperson</th>
                  <th className="py-3.5 px-4 text-center">Sales Sent</th>
                  <th className="py-3.5 px-4 text-center">Designer Sent</th>
                  <th className="py-3.5 px-4">File Format</th>
                  <th className="py-3.5 px-4">Drawing Status</th>
                  <th className="py-3.5 px-4 text-center">Drawing Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-indigo-700">{req.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{req.customerName}</div>
                        <div className="text-[11px] text-slate-500">{req.companyName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 flex items-center gap-1.5">
                        <FiUser className="text-indigo-500" /> {req.salesPersonName}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${req.is_sent ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
                          {req.is_sent ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${req.is_received ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                          {req.is_received ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {req.fileName ? (
                          renderFileTypeBadge(req.fileType, req.fileName)
                        ) : (
                          <span className="text-slate-400 font-medium">Pending Upload</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        {req.status === "pending_drawing" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase flex items-center gap-1 w-max">
                            <FiClock /> Pending Drawing
                          </span>
                        )}
                        {req.status === "drawing_completed" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1 w-max">
                            <FiCheckCircle /> Drawing Ready
                          </span>
                        )}
                        {req.status === "attached_to_quotation" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase flex items-center gap-1 w-max">
                            <FiPaperclip /> Attached to Quote
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 flex items-center justify-center gap-2">
                        {req.status === "pending_drawing" && (
                          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-[11px] flex items-center gap-1">
                            <FiClock className="w-3.5 h-3.5 text-amber-600" />
                            <span>⏳ In Designer Queue</span>
                          </span>
                        )}
                        {req.status === "drawing_completed" && (
                          <button
                            onClick={() => handleAttachToQuotation(req)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[11px] transition shadow-sm flex items-center gap-1"
                          >
                            <FiPaperclip className="w-3.5 h-3.5" />
                            <span>Attach to Quotation</span>
                          </button>
                        )}
                        {req.status === "attached_to_quotation" && (
                          <button
                            onClick={() => navigate("/quotation")}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-[11px] transition shadow-sm flex items-center gap-1"
                          >
                            <FiFileText className="w-3.5 h-3.5" />
                            <span>View Quote</span>
                          </button>
                        )}
                        <button
                          onClick={() => { setSelectedRequest(req); setShowViewModal(true); }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition"
                          title="View Drawing File"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      No design requests found for this Sales Person. Click "Send Lead to Designer" above to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: DESIGNER QUEUE VIEW (AutoCAD DWG/DXF, PDF, Image, Archive File Uploader) ── */}
      {activeTab === "designer" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Designer Incoming Queue ({filteredRequests.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Upload AutoCAD (.dwg/.dxf), PDF, or layout files and send to Sales
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Request ID</th>
                  <th className="py-3.5 px-4">Customer / Company</th>
                  <th className="py-3.5 px-4">Salesperson</th>
                  <th className="py-3.5 px-4">Requirements</th>
                  <th className="py-3.5 px-4 text-center">Sales Sent</th>
                  <th className="py-3.5 px-4 text-center">Designer Sent</th>
                  <th className="py-3.5 px-4">Design Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-indigo-700">{req.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{req.customerName}</div>
                        <div className="text-[11px] text-slate-500">{req.companyName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 flex items-center gap-1.5">
                        <FiUser className="text-indigo-500" /> {req.salesPersonName}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200/60 font-medium line-clamp-2">
                          {req.requirements}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${req.is_sent ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
                          {req.is_sent ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${req.is_received ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                          {req.is_received ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {req.status === "pending_drawing" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase flex items-center gap-1 w-max">
                            <FiClock /> Pending Drawing
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1 w-max">
                            <FiCheckCircle /> Drawing Completed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 flex items-center justify-center gap-2">
                        {req.status === "pending_drawing" ? (
                          <button
                            onClick={() => handleOpenUploadModal(req)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5"
                          >
                            <FiUpload className="w-4 h-4" />
                            <span>Upload Drawing</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            {renderFileTypeBadge(req.fileType, req.fileName)}
                            <button
                              onClick={() => handleOpenUploadModal(req)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
                              title="Edit or Re-upload CAD Drawing"
                            >
                              <FiUpload className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => { setSelectedRequest(req); setShowViewModal(true); }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                            >
                              View
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      No incoming design requests in Designer Queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: SEND TO DESIGNER ── */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FiSend className="text-indigo-600" />
                <span>Send Converted Lead to Designer</span>
              </h3>
              <button onClick={() => setShowSendModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendToDesigner} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer / Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BHARAT MANOJ SHARMA (Sharma Residency)"
                  value={sendForm.customerName}
                  onChange={e => setSendForm({ ...sendForm, customerName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Facility Services Pvt"
                  value={sendForm.companyName}
                  onChange={e => setSendForm({ ...sendForm, companyName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Design Specifications *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify boom barrier length, RFID poles, turnstile specs, entrance layout..."
                  value={sendForm.requirements}
                  onChange={e => setSendForm({ ...sendForm, requirements: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                >
                  Submit to Designer Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: DESIGNER UPLOADS DWG / PDF / FILE & SENDS TO SALES ── */}
      {showUploadModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FiUpload className="text-emerald-600" />
                <span>Upload Drawing File & Return to Sales</span>
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDesignerSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-slate-700 font-medium">
                <span className="font-bold text-indigo-900">Request Requirements: </span>
                {selectedRequest.requirements}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Drawing Title *</label>
                <input
                  type="text"
                  required
                  value={uploadForm.drawingTitle}
                  onChange={e => setUploadForm({ ...uploadForm, drawingTitle: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Attach Drawing File (AutoCAD .dwg, .dxf, PDF, PNG/JPG, ZIP) *
                </label>
                <input
                  type="file"
                  accept=".dwg,.dxf,.pdf,.png,.jpg,.jpeg,.zip,.rar"
                  onChange={handleFileChange}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                />
                {uploadForm.fileName && (
                  <div className="mt-2 text-xs font-bold text-slate-700 flex items-center gap-2 bg-emerald-50 p-2 rounded border border-emerald-200">
                    <FiPaperclip className="text-emerald-600" />
                    <span>Selected File: {uploadForm.fileName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Technical Specs</label>
                <input
                  type="text"
                  value={uploadForm.drawingSpecs}
                  onChange={e => setUploadForm({ ...uploadForm, drawingSpecs: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Designer Remarks for Sales Person</label>
                <textarea
                  rows={3}
                  value={uploadForm.designerNotes}
                  onChange={e => setUploadForm({ ...uploadForm, designerNotes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm flex items-center gap-1.5"
                >
                  <FiCornerDownLeft /> Return File to Sales Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: VIEW / DOWNLOAD DRAWING FILE ── */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Design File Details — {selectedRequest.id}
              </h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">CUSTOMER</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedRequest.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">SALES PERSON</span>
                  <span className="font-bold text-indigo-700 text-sm">{selectedRequest.salesPersonName}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">REQUIREMENTS:</span>
                <p className="text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200/80">{selectedRequest.requirements}</p>
              </div>

              {(selectedRequest.drawingUrl || selectedRequest.fileName || selectedRequest.drawingTitle || selectedRequest.status === "drawing_completed" || selectedRequest.status === "attached_to_quotation") ? (
                <div className="space-y-3 border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                      <FiCheckCircle /> ATTACHED DRAWING FILE:
                    </span>
                    {renderFileTypeBadge(selectedRequest.fileType || "autocad", selectedRequest.fileName || "AutoCAD_Drawing.dwg")}
                  </div>

                  <div className="font-bold text-slate-900 text-sm">{selectedRequest.drawingTitle || `${selectedRequest.customerName} Gate Layout Plan`}</div>
                  <div className="text-slate-600 font-medium">{selectedRequest.drawingSpecs || "AutoCAD CAD Drawing & Site Specification"}</div>

                  <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiFileText className="w-6 h-6 text-indigo-600" />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{selectedRequest.fileName || "AutoCAD_Drawing_Plan.dwg"}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Format: {selectedRequest.fileType || "AutoCAD/PDF"}</span>
                      </div>
                    </div>
                    <a
                      href={selectedRequest.drawingUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60"}
                      download={selectedRequest.fileName || `${selectedRequest.customerName}_CAD_Drawing.dwg`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm text-xs flex items-center gap-1.5 transition"
                    >
                      <FiDownload className="w-4 h-4" /> Download Drawing File
                    </a>
                  </div>

                  <div className="text-slate-700 bg-emerald-50/80 p-3 rounded-lg border border-emerald-200 font-medium">
                    <strong className="text-emerald-900">Designer Remarks: </strong> {selectedRequest.designerNotes || "Completed CAD drawing according to site specifications."}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 font-medium text-center">
                  ⏳ Designer is currently working on the CAD drawing layout.
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                {selectedRequest.status === "drawing_completed" && currentRole !== "designer" && (
                  <button
                    onClick={() => { setShowViewModal(false); handleAttachToQuotation(selectedRequest); }}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
                  >
                    Attach to Quotation & Send Client
                  </button>
                )}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
