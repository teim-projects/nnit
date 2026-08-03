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
  FiRefreshCw
} from "react-icons/fi";
import Swal from "sweetalert2";

export default function DesignerQueue() {
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

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    drawingTitle: "",
    drawingSpecs: "",
    fileName: "",
    fileType: "autocad",
    fileDataUrl: "",
    drawingUrl: "",
    designerNotes: ""
  });

  // Load and merge requests from backend API + localStorage
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

    const map = new Map();

    // 1. Add localStorage design requests FIRST
    localReqs.forEach(r => {
      const item = {
        id: r.id || `DR-${r.leadId}`,
        leadId: r.leadId,
        customerName: r.customerName || "Unknown Customer",
        companyName: r.companyName || "N/A",
        salesPersonName: r.salesPersonName || "Sales Person",
        requirements: r.requirements || "Site Entrance CAD Drawing & Specs",
        sentDate: r.sentDate || new Date().toLocaleString(),
        status: r.status || "pending_drawing",
        is_sent: r.is_sent ?? 1,
        is_received: r.is_received ?? 0,
        drawingTitle: r.drawingTitle || "",
        drawingSpecs: r.drawingSpecs || "",
        fileName: r.fileName || "",
        fileType: r.fileType || "autocad",
        drawingUrl: r.drawingUrl || "",
        designerNotes: r.designerNotes || ""
      };

      if (r.leadId) map.set(String(r.leadId), item);
      if (r.id) map.set(String(r.id), item);
      if (r.customerName) map.set(`name:${r.customerName.trim().toLowerCase()}`, item);
    });

    // 2. Add backend leads where is_sent is true or sent_to_designer is true
    apiLeads.forEach(l => {
      const k1 = String(l.id);
      const name = l.contact_person_name || l.customer_name || l.customer?.name || `Lead #${l.id}`;
      const nameKey = `name:${name.trim().toLowerCase()}`;

      const existing = map.get(k1) || map.get(nameKey);
      if (!existing) {
        const item = {
          id: `DR-${l.id}`,
          leadId: l.id,
          customerName: name,
          companyName: l.company_name || l.project_name || "N/A",
          salesPersonName: l.assign_to_details?.full_name || "Pravin Dare",
          requirements: l.requirements_details || "Site Entrance CAD Layout",
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
        };
        map.set(k1, item);
        map.set(nameKey, item);
      }
    });

    const mergedList = Array.from(new Set(Array.from(map.values())));
    setRequests(mergedList);
    setLoading(false);
  }, [token, BASE_API]);

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

  // Open Upload Modal
  const handleOpenUpload = (req) => {
    setSelectedRequest(req);
    setUploadForm({
      drawingTitle: req.drawingTitle || `${req.customerName} Gate Layout Plan`,
      drawingSpecs: req.drawingSpecs || "AutoCAD CAD Drawing & Site Specification Plan",
      fileName: req.fileName || "",
      fileType: req.fileType || "autocad",
      fileDataUrl: req.drawingUrl || "",
      drawingUrl: req.drawingUrl || "",
      designerNotes: req.designerNotes || "Completed CAD drawing according to site requirements."
    });

    // Mark as received when opened by Designer (is_received = 1)
    if (req.leadId && token && BASE_API) {
      fetch(`${BASE_API}/lead/lead/${req.leadId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_received: true })
      }).catch(() => {});
    }

    setShowUploadModal(true);
  };

  // Handle File Select (.dwg, .dxf, .pdf, .png, .zip)
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

  // Submit Completed CAD Drawing
  const handleSubmitDrawing = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    // 1. Update Backend Model via PATCH if leadId exists
    if (selectedRequest.leadId && token && BASE_API) {
      try {
        await fetch(`${BASE_API}/lead/lead/${selectedRequest.leadId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ is_sent: true, is_received: true })
        });
      } catch (err) {
        console.warn("Backend PATCH failed, updated local storage", err);
      }
    }

    // 2. Update Local Storage
    const existing = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
    const completedObj = {
      ...selectedRequest,
      status: "drawing_completed",
      is_sent: 1,
      is_received: 1,
      drawingTitle: uploadForm.drawingTitle || `${selectedRequest.customerName} Gate Layout Plan`,
      drawingSpecs: uploadForm.drawingSpecs || "AutoCAD CAD Drawing & Site Specification",
      fileName: uploadForm.fileName || "AutoCAD_Drawing_Plan.dwg",
      fileType: uploadForm.fileType || "autocad",
      drawingUrl: uploadForm.fileDataUrl || uploadForm.drawingUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60",
      designerNotes: uploadForm.designerNotes || "Completed drawing according to site specifications.",
      completedDate: new Date().toLocaleString()
    };

    let hasMatch = false;
    const updatedReqs = existing.map(r => {
      if (String(r.id) === String(selectedRequest.id) || String(r.leadId) === String(selectedRequest.leadId) || r.customerName === selectedRequest.customerName) {
        hasMatch = true;
        return { ...r, ...completedObj };
      }
      return r;
    });

    if (!hasMatch) {
      updatedReqs.unshift(completedObj);
    }

    localStorage.setItem("nnit_design_requests", JSON.stringify(updatedReqs));
    window.dispatchEvent(new Event("designRequestUpdated"));
    window.dispatchEvent(new Event("storage"));

    setShowUploadModal(false);
    fetchQueueData();

    Swal.fire({
      title: "Drawing Submitted to Sales!",
      text: `CAD Drawing (${uploadForm.fileName || "Drawing"}) sent to Sales Person. (Sent: Yes, Received: Yes)`,
      icon: "success",
      confirmButtonColor: "#10b981"
    });
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === "pending_drawing").length;
    const completed = requests.filter(r => r.status === "drawing_completed" || r.status === "attached_to_quotation").length;
    return { total, pending, completed };
  }, [requests]);

  // File Badge Helper
  const renderFileTypeBadge = (fileType, fileName) => {
    if (fileType === "autocad" || fileName?.endsWith(".dwg") || fileName?.endsWith(".dxf")) {
      return <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-900 font-bold text-[11px] uppercase flex items-center gap-1 border border-blue-200">📐 AutoCAD (.DWG)</span>;
    }
    if (fileType === "pdf" || fileName?.endsWith(".pdf")) {
      return <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-bold text-[11px] uppercase flex items-center gap-1 border border-rose-200">📄 PDF Document</span>;
    }
    return <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] uppercase flex items-center gap-1 border border-emerald-200">🖼 Image / Layout</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* ── Top Header ── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Designer Work Queue</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 uppercase">
              Designer Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            View incoming drawing requests sent from Sales Lead Management and upload CAD drawings
          </p>
        </div>

        <button
          onClick={fetchQueueData}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Sent Leads</span>
            <FiLayers className="text-indigo-500 w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{metrics.total}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Pending Drawing</span>
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
      </div>

      {/* ── Incoming Work Queue Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            Incoming Drawing Requests ({requests.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Workflow: Sent = Yes | Received = Yes
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
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Loading incoming requests...
                  </td>
                </tr>
              ) : requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-indigo-700">{req.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{req.customerName}</div>
                      <div className="text-[11px] text-slate-500">{req.companyName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 flex items-center gap-1">
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
                      {req.status === "pending_drawing" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase flex items-center gap-1 w-max">
                          <FiClock /> Pending Drawing
                        </span>
                      )}
                      {(req.status === "drawing_completed" || req.status === "attached_to_quotation") && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1 w-max">
                          <FiCheckCircle /> Drawing Completed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenUpload(req)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-[11px] transition shadow-sm flex items-center gap-1 cursor-pointer"
                        title={req.status === "pending_drawing" ? "Upload CAD Drawing" : "Edit Drawing"}
                      >
                        <FiUpload className="w-3.5 h-3.5" />
                        <span>{req.status === "pending_drawing" ? "Upload CAD Drawing" : "Edit Drawing"}</span>
                      </button>
                      
                      {req.fileName && (
                        <button
                          onClick={() => { setSelectedRequest(req); setShowViewModal(true); }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition"
                          title="View Drawing"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No incoming design requests found. Send a lead from Lead Management to test.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: UPLOAD CAD DRAWING ── */}
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

            <form onSubmit={handleSubmitDrawing} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-slate-700 font-medium">
                <span className="font-bold text-indigo-900">Requirements: </span>
                {selectedRequest.requirements}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Drawing Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Site Entrance AutoCAD Layout & Wiring Specs"
                  value={uploadForm.drawingTitle}
                  onChange={(e) => setUploadForm(p => ({ ...p, drawingTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">AutoCAD / PDF / Image File *</label>
                <input
                  type="file"
                  accept=".dwg,.dxf,.pdf,.png,.jpg,.jpeg,.zip"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {uploadForm.fileName && (
                  <div className="mt-2 flex items-center gap-2">
                    {renderFileTypeBadge(uploadForm.fileType, uploadForm.fileName)}
                    <span className="text-slate-700 font-medium">{uploadForm.fileName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Designer Notes & Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dimensions verified with site manager. 4-meter boom barrier layout specified."
                  value={uploadForm.designerNotes}
                  onChange={(e) => setUploadForm(p => ({ ...p, designerNotes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 font-medium">
                ⚡ Returns status: <strong className="text-emerald-700">Sent = Yes</strong> & <strong className="text-emerald-700">Received = Yes</strong> to Sales Person
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-md flex items-center gap-1.5"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Submit & Return to Sales</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW DRAWING PREVIEW ── */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FiFileText className="text-indigo-600" />
                <span>Drawing Details — {selectedRequest.customerName}</span>
              </h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Customer</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedRequest.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Salesperson</span>
                  <span className="font-semibold text-slate-800">{selectedRequest.salesPersonName}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Drawing Title & File</span>
                <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900">{selectedRequest.drawingTitle || "CAD Drawing Plan"}</div>
                    {renderFileTypeBadge(selectedRequest.fileType, selectedRequest.fileName)}
                  </div>
                  {selectedRequest.drawingUrl && (
                    <a
                      href={selectedRequest.drawingUrl}
                      download={selectedRequest.fileName || "AutoCAD_Drawing.dwg"}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-xs flex items-center gap-1 transition"
                    >
                      <FiDownload /> Download
                    </a>
                  )}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Designer Notes</span>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 font-medium">
                  {selectedRequest.designerNotes || "No extra notes provided."}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
