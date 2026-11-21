import React, { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { FiRefreshCw, FiPaperclip, FiTrash2, FiUploadCloud, FiSend, FiClock } from "react-icons/fi";
import Swal from "sweetalert2";
import { storeFileInDB, safeSaveDesignRequests } from "../../utils/designFileStorage";
import { isSameDesignRequest } from "../../utils/auth";

export default function SalesRevisionModal({
  open,
  onClose,
  request,
  onSuccess,
  baseApi,
  token = "",
}) {
  if (!open || !request) return null;

  const currentUserName = localStorage.getItem("user_name") || "Sales Person";
  const currentVersionNo = request.current_version || (request.versions?.length || 1);
  const nextVersionNo = currentVersionNo + 1;

  const [revisionNotes, setRevisionNotes] = useState("");
  const [updatedRequirements, setUpdatedRequirements] = useState("");
  const [updatedQuantity, setUpdatedQuantity] = useState("As per STD");
  const [updatedRemark, setUpdatedRemark] = useState("-");
  const [newLayoutFile, setNewLayoutFile] = useState(null);
  const [newLayoutFileName, setNewLayoutFileName] = useState("");
  const [newLayoutPreview, setNewLayoutPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (request) {
      setRevisionNotes("");
      setUpdatedRequirements(request.requirements || "");
      setUpdatedQuantity(request.quantity || "As per STD");
      setUpdatedRemark(request.remark || "-");
      setNewLayoutFile(null);
      setNewLayoutFileName("");
      setNewLayoutPreview("");
    }
  }, [request]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isImg = file.type.startsWith("image/");
      setNewLayoutFile(file);
      setNewLayoutFileName(file.name);
      if (isImg) {
        setNewLayoutPreview(URL.createObjectURL(file));
      } else {
        const reader = new FileReader();
        reader.onload = () => setNewLayoutPreview(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveFile = () => {
    setNewLayoutFile(null);
    setNewLayoutFileName("");
    setNewLayoutPreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!revisionNotes.trim()) {
      Swal.fire("Required", "Please provide the reason / details for revision changes.", "warning");
      return;
    }
    if (!updatedRequirements.trim()) {
      Swal.fire("Required", "Please enter the updated Requirements 's.", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const nowString = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

      // Save new layout file in IndexedDB if attached
      let layoutKey = "";
      if (newLayoutFile) {
        layoutKey = `layout_${request.id || "req"}_v${nextVersionNo}_${Date.now()}`;
        try {
          await storeFileInDB(layoutKey, newLayoutFile, {
            name: newLayoutFileName,
            type: "layout",
          });
        } catch (e) {
          console.warn("Layout file IndexedDB store error:", e);
        }
      }

      // Build new revision entry in history
      const existingVersions = Array.isArray(request.versions) && request.versions.length > 0
        ? [...request.versions]
        : [
            {
              version_no: 1,
              title: "V1 - Original Request",
              created_at: request.sentDate || nowString,
              created_by: request.salesPersonName || currentUserName,
              role: "sales",
              requirements: request.requirements,
              quantity: request.quantity || "As per STD",
              remark: request.remark || "-",
              customer_layout_name: request.customerLayoutName || "",
              customer_layout_url: "",
              customer_layout_key: "",
              drawing_title: request.drawingTitle || "",
              drawing_files: request.drawingFiles || [],
              status: request.drawingUrl ? "drawing_completed" : "pending_drawing",
            },
          ];

      const revisionEntry = {
        version_no: nextVersionNo,
        title: `V${nextVersionNo} - Revision Requested`,
        created_at: nowString,
        created_by: currentUserName,
        role: "sales",
        requirements: updatedRequirements.trim(),
        quantity: updatedQuantity.trim(),
        remark: updatedRemark.trim(),
        change_notes: revisionNotes.trim(),
        customer_layout_name: newLayoutFileName || request.customerLayoutName || "",
        customer_layout_url: "",
        customer_layout_key: layoutKey || request.customerLayoutKey || "",
        drawing_files: [],
        status: "revision_requested",
      };

      const updatedVersions = [revisionEntry, ...existingVersions.filter((v) => v.version_no !== nextVersionNo)];

      const updatedRequest = {
        ...request,
        status: "revision_requested",
        current_version: nextVersionNo,
        requirements: updatedRequirements.trim(),
        quantity: updatedQuantity.trim(),
        remark: updatedRemark.trim(),
        latestRevisionNotes: revisionNotes.trim(),
        revisionRequestedDate: nowString,
        customerLayoutName: newLayoutFileName || request.customerLayoutName || "",
        customerLayoutUrl: "",
        customerLayoutKey: layoutKey || request.customerLayoutKey || "",
        is_sent: 1,
        is_received: 0,
        versions: updatedVersions,
      };

      // Backend lead update if available
      if (baseApi && request.leadId && token) {
        try {
          await fetch(`${baseApi.replace(/\/$/, "")}/lead/lead/${request.leadId}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              site_requirement: updatedRequirements.trim(),
              requirements_details: updatedRequirements.trim(),
              is_sent: true,
              is_received: false,
            }),
          });
        } catch (apiErr) {
          console.warn("Backend lead revision update failed:", apiErr);
        }
      }

      // Save to localStorage safely using safeSaveDesignRequests
      const allSaved = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
      let found = false;
      const updatedList = allSaved.map((item) => {
        if (isSameDesignRequest(item, request)) {
          found = true;
          return { ...item, ...updatedRequest };
        }
        return item;
      });

      if (!found) {
        updatedList.unshift(updatedRequest);
      }

      safeSaveDesignRequests(updatedList);

      window.dispatchEvent(new Event("designRequestUpdated"));
      window.dispatchEvent(new Event("storage"));

      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }

      Swal.fire({
        icon: "success",
        title: `Revision V${nextVersionNo} Sent!`,
        text: `Updated requirements for "${request.projectName || request.customerName}" sent to Designer Queue.`,
        timer: 2000,
        showConfirmButton: false,
      });

      if (onSuccess) onSuccess(updatedRequest);
      onClose();
    } catch (err) {
      console.error("Failed to request revision:", err);
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
      Swal.fire("Error", "Could not complete revision: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-300 flex flex-col my-auto max-h-[92vh]">
        {/* Header - Sleek Dark Theme */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl text-amber-400">
              🔄
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Request Design Revision / Change Requirements
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  New Version V{nextVersionNo}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Current: V{currentVersionNo} • {request.clientCoName || request.customerName} ({request.projectName || "Project"})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-100/70 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Revision Notes / Change Reason */}
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Change Reason & Revision Instructions <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Explain clearly what the designer needs to modify (e.g. dimensions, pit depth, car type, layout changes)
              </p>
              <textarea
                required
                rows={3}
                placeholder="e.g., Client requested pit depth increased from 1800mm to 2100mm. Also change upper level to Cantilever CP401."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium leading-relaxed"
              />
            </div>

            {/* 2. Updated Requirements & Specs */}
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-150">
                Updated Specifications (Slip Format)
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Requirements 's <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={updatedRequirements}
                  onChange={(e) => setUpdatedRequirements(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                    Quantity
                  </label>
                  <input
                    type="text"
                    value={updatedQuantity}
                    onChange={(e) => setUpdatedQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                    Remark
                  </label>
                  <input
                    type="text"
                    value={updatedRemark}
                    onChange={(e) => setUpdatedRemark(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. New Layout / Drawing File Attachment */}
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                Attach New / Revised Layout File (Optional)
              </label>
              <p className="text-[11px] text-slate-500">
                If the client provided a revised architectural layout, CAD file, or marked sketch
              </p>

              {newLayoutFileName ? (
                <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                      📄
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-950 truncate">{newLayoutFileName}</p>
                      <p className="text-[10px] text-amber-700">New Revision Attachment Ready</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/20 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition">
                  <FiUploadCloud className="w-7 h-7 text-slate-400 group-hover:text-amber-600" />
                  <span className="text-xs font-semibold text-slate-700 mt-1">
                    Click to browse or drop new layout file
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">DWG, DXF, PDF, PNG, JPG</span>
                  <input
                    type="file"
                    accept=".dwg,.dxf,.pdf,image/*,.zip,.rar"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-3 border-t border-slate-300">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <FiSend className="w-4 h-4" />
                <span>{isSubmitting ? "Submitting..." : `Submit Revision V${nextVersionNo} to Designer`}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
