import React, { useState, useEffect, useMemo, useCallback } from "react";
import Base from "../components/Base";
import TableView from "../components/TableView";
import LeadDetails from "../components/lead/LeadDetails";
import { IoLogoWhatsapp } from "react-icons/io5";
import { MdEmail, MdRemoveRedEye, MdUpload, MdCheckCircle } from "react-icons/md";
import { FiClock, FiUpload, FiCheckCircle, FiPaperclip, FiX, FiFileText, FiDownload, FiCornerDownLeft } from "react-icons/fi";
import Swal from "sweetalert2";

export default function DesignerLeads() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const API_URL = `${BASE_API}/lead/lead/`;
  const token = localStorage.getItem("access") || "";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [leadDetailsId, setLeadDetailsId] = useState(null);

  // Drawing Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    drawingTitle: "",
    drawingSpecs: "",
    fileName: "",
    fileType: "autocad",
    fileDataUrl: "",
    drawingUrl: "",
    designerNotes: ""
  });

  // Fetch Real Leads from backend & filter ONLY sent leads (guaranteed fallback)
  const fetchDesignerLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let allLeads = [];
      try {
        const res = await fetch(`${API_URL}?page_size=1000`, { headers });
        if (res.ok) {
          const data = await res.json();
          allLeads = Array.isArray(data) ? data : data.results || [];
        }
      } catch (e) {
        console.warn("Backend leads fetch failed, using local storage requests fallback", e);
      }

      // Check localStorage sent requests & deduplicate
      const saved = localStorage.getItem("nnit_design_requests");
      let existingReqs = [];
      if (saved) {
        try {
          const raw = JSON.parse(saved);
          if (Array.isArray(raw)) {
            const map = new Map();
            raw.forEach(r => {
              const nameKey = (r.customerName || "").trim().toLowerCase();
              const key = nameKey || String(r.leadId || r.id);
              if (!map.has(key)) map.set(key, r);
              else {
                const existing = map.get(key);
                const rIsCompleted = r.status === "drawing_completed" || r.status === "attached_to_quotation";
                map.set(key, {
                  ...existing,
                  ...r,
                  id: existing.id || r.id,
                  status: rIsCompleted ? r.status : existing.status,
                  drawingTitle: r.drawingTitle || existing.drawingTitle,
                  drawingSpecs: r.drawingSpecs || existing.drawingSpecs,
                  fileName: r.fileName || existing.fileName,
                  fileType: r.fileType || existing.fileType,
                  drawingUrl: r.drawingUrl || existing.drawingUrl,
                  designerNotes: r.designerNotes || existing.designerNotes,
                });
              }
            });
            existingReqs = Array.from(map.values());
            localStorage.setItem("nnit_design_requests", JSON.stringify(existingReqs));
          }
        } catch {}
      }

      const activeSentReqs = existingReqs.filter(r => 
        r.status === "pending_drawing" || r.status === "drawing_completed" || r.status === "attached_to_quotation"
      );
      const reqLeadIds = new Set(activeSentReqs.map(r => String(r.leadId)));
      const reqCustomerNames = new Set(activeSentReqs.map(r => (r.customerName || "").trim().toLowerCase()));

      const mergedRows = [];
      const addedIds = new Set();

      // 1. Add backend leads that match sent requests
      allLeads.forEach(r => {
        const leadIdStr = String(r.id);
        const name = (r.contact_person_name || r.customer_name || r.customer?.name || "").trim().toLowerCase();
        const isSent = (
          reqLeadIds.has(leadIdStr) ||
          (name && reqCustomerNames.has(name)) ||
          r.sent_to_designer === true ||
          (r.designer_status && r.designer_status !== "none")
        );
        if (isSent) {
          mergedRows.push(r);
          addedIds.add(leadIdStr);
          if (name) addedIds.add(name);
        }
      });

      // 2. Add any active design requests from localStorage that weren't in backend response
      activeSentReqs.forEach(req => {
        const reqIdStr = String(req.leadId || req.id);
        const name = (req.customerName || "").trim().toLowerCase();
        if (!addedIds.has(reqIdStr) && (!name || !addedIds.has(name))) {
          mergedRows.push({
            id: req.leadId || req.id,
            date: req.sentDate || new Date().toISOString(),
            followup_date: req.sentDate || new Date().toISOString(),
            contact_person_name: req.customerName,
            customer_name: req.customerName,
            contact_person_number: req.contact || "N/A",
            customer_contact: req.contact || "N/A",
            lead_source: "Sales Dispatch",
            status: req.status === "drawing_completed" ? "Completed" : "Open",
            assign_to_details: { full_name: req.salesPersonName || "Pravin Dare" }
          });
          addedIds.add(reqIdStr);
          if (name) addedIds.add(name);
        }
      });

      setRows(mergedRows);
    } catch (err) {
      console.error(err);
      setError("Failed to load designer leads.");
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchDesignerLeads();
  }, [fetchDesignerLeads]);

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

    if (followupDate.getTime() === today.getTime()) return "bg-yellow-100";
    if (followupDate < today) return "bg-red-100";
    return "";
  };

  const handleOpenUploadModal = (row) => {
    const customerName = row.contact_person_name || row.customer_name || row.customer?.name || `Lead #${row.id}`;
    const existingReqs = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
    const foundReq = existingReqs.find(r => 
      String(r.id) === String(row.id) ||
      String(r.leadId) === String(row.id) ||
      (r.customerName && customerName && (
        r.customerName.toLowerCase() === customerName.toLowerCase() ||
        r.customerName.toLowerCase().includes(customerName.toLowerCase()) ||
        customerName.toLowerCase().includes(r.customerName.toLowerCase())
      ))
    ) || {
      id: row.id && String(row.id).startsWith("DR-") ? row.id : `DR-${Math.floor(100 + Math.random() * 900)}`,
      leadId: row.id,
      customerName,
      companyName: row.company_name || row.project_name || "N/A",
      salesPersonName: row.assign_to_details?.full_name || "Pravin Dare",
      requirements: "Site Entrance CAD Layout Drawing"
    };

    setSelectedRequest(foundReq);
    setUploadForm({
      drawingTitle: foundReq.drawingTitle || `${customerName} Gate Layout Plan`,
      drawingSpecs: foundReq.drawingSpecs || "AutoCAD CAD Drawing & Site Specification Plan",
      fileName: foundReq.fileName || "",
      fileType: foundReq.fileType || "autocad",
      fileDataUrl: foundReq.drawingUrl || "",
      drawingUrl: foundReq.drawingUrl || "",
      designerNotes: foundReq.designerNotes || "Completed drawing according to site specifications."
    });
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    let type = "other";
    if (ext === "dwg" || ext === "dxf") type = "autocad";
    else if (ext === "pdf") type = "pdf";
    else if (["png", "jpg", "jpeg", "webp"].includes(ext)) type = "image";
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

  const handleDesignerSubmit = (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const existingReqs = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
    
    const completedObj = {
      ...selectedRequest,
      id: selectedRequest.id || `DR-${Math.floor(100 + Math.random() * 900)}`,
      status: "drawing_completed",
      drawingTitle: uploadForm.drawingTitle || `${selectedRequest.customerName} Gate Layout Plan`,
      drawingSpecs: uploadForm.drawingSpecs || "AutoCAD CAD Drawing & Site Specification",
      fileName: uploadForm.fileName || "AutoCAD_Drawing_Plan.dwg",
      fileType: uploadForm.fileType || "autocad",
      drawingUrl: uploadForm.fileDataUrl || uploadForm.drawingUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60",
      designerNotes: uploadForm.designerNotes || "Completed drawing according to site specifications.",
      completedDate: new Date().toLocaleString()
    };

    let hasMatch = false;
    let updatedReqs = existingReqs.map(r => {
      const isMatch = (
        String(r.id) === String(selectedRequest.id) ||
        String(r.leadId) === String(selectedRequest.leadId) ||
        String(r.id) === String(selectedRequest.leadId) ||
        String(r.leadId) === String(selectedRequest.id) ||
        (r.customerName && selectedRequest.customerName && (
          r.customerName.toLowerCase() === selectedRequest.customerName.toLowerCase() ||
          r.customerName.toLowerCase().includes(selectedRequest.customerName.toLowerCase()) ||
          selectedRequest.customerName.toLowerCase().includes(r.customerName.toLowerCase())
        ))
      );

      if (isMatch) {
        hasMatch = true;
        return { ...r, ...completedObj };
      }
      return r;
    });

    if (!hasMatch) {
      updatedReqs = [completedObj, ...updatedReqs];
    }

    localStorage.setItem("nnit_design_requests", JSON.stringify(updatedReqs));
    window.dispatchEvent(new Event("designRequestUpdated"));
    window.dispatchEvent(new Event("storage"));
    setShowUploadModal(false);
    fetchDesignerLeads();

    Swal.fire({
      title: "Drawing Returned to Sales!",
      text: `Drawing (${uploadForm.fileName || "File"}) saved & returned to Sales Person.`,
      icon: "success",
      confirmButtonColor: "#10b981"
    });
  };

  const columns = [
    { key: "sr", label: "SR.NO", render: (_, idx) => idx + 1 },
    { key: "date", label: "DATE", render: (r) => formatDate(r.date) },
    { key: "followup_date", label: "FOLLOWUP DATE", render: (r) => formatDate(r.followup_date) },
    { key: "name", label: "NAME", render: (r) => r.contact_person_name || r.customer_name || r.customer?.name || "-" },
    { key: "contact", label: "CONTACT", render: (r) => r.contact_person_number || r.customer_contact || "-" },
    { key: "lead_source", label: "SOURCE", render: (r) => r.lead_source },
    { key: "status", label: "STATUS", render: (r) => r.status },
    { key: "assign_to", label: "ASSIGN TO", render: (r) => r.assign_to_details?.full_name || "Pravin Dare" }
  ];

  const actionsRenderer = useCallback((row) => {
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

    const handleWhatsApp = (e) => {
      e.stopPropagation();
      const contact = row.contact_person_number || row.customer_contact;
      if (!contact) return;
      const cleanNumber = contact.replace(/[^0-9]/g, '');
      const whatsappNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
      window.open(`https://wa.me/${whatsappNumber}`, '_blank');
    };

    const handleEmail = (e) => {
      e.stopPropagation();
      const email = row.customer_email || row.email;
      if (!email) return;
      window.location.href = `mailto:${email}`;
    };

    return (
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        <button
          onClick={handleWhatsApp}
          className="inline-flex items-center px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
          title="WhatsApp"
        >
          <IoLogoWhatsapp className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleEmail}
          className="inline-flex items-center px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-medium transition-colors"
          title="Send Email"
        >
          <MdEmail className="w-3.5 h-3.5" />
        </button>

        {foundReq && (foundReq.status === "drawing_completed" || foundReq.status === "attached_to_quotation") ? (
          <button
            onClick={() => handleOpenUploadModal(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            title="Drawing Completed. Click to Edit/Re-upload"
          >
            <MdCheckCircle className="w-3.5 h-3.5" />
            <span>Drawing Ready</span>
          </button>
        ) : (
          <button
            onClick={() => handleOpenUploadModal(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors"
            title="Upload Drawing for Sales Person"
          >
            <FiClock className="w-3.5 h-3.5 text-amber-700" />
            <span>In Designer Queue</span>
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLead(row);
            setShowLeadDetails(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          title="View Lead Details & CAD Drawing Showcase"
        >
          <MdRemoveRedEye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      </div>
    );
  }, []);

  return (
    <Base title="Designer Leads">
      {/* ── Full Lead Detail View ── */}
      {showLeadDetails && leadDetailsId && (
        <LeadDetails
          open={true}
          onClose={() => { setShowLeadDetails(false); setLeadDetailsId(null); }}
          leadId={leadDetailsId}
          baseApi={BASE_API}
          token={token}
          inline={true}
        />
      )}

      {/* ── Lead Management Table matching exact UI ── */}
      {!showLeadDetails && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Lead Management</h2>
              <div className="text-sm text-slate-600">
                {loading ? "Loading…" : `${rows.length} total • ${rows.length} shown`}
              </div>
            </div>
          </div>

          <TableView
            columns={columns}
            rows={rows}
            loading={loading}
            error={error}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
            pageSize={100}
            actions={actionsRenderer}
            emptyMessage="No designer leads found"
            rowClassName={getRowClassName}
          />
        </div>
      )}

      {/* ── MODAL: DESIGNER UPLOADS DWG/PDF DRAWING ── */}
      {showUploadModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FiUpload className="text-emerald-600" />
                <span>Upload Drawing & Return to Sales ({selectedRequest.salesPersonName})</span>
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDesignerSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-slate-700 font-medium">
                <span className="font-bold text-indigo-900">Requirements: </span>
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
    </Base>
  );
}
