import React, { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import {
  FiUploadCloud,
  FiPaperclip,
  FiTrash2,
  FiCheckCircle,
  FiFileText,
  FiLayers,
  FiClock,
  FiInfo,
  FiDownload
} from "react-icons/fi";
import Swal from "sweetalert2";
import {
  storeFileInDB,
  safeSaveDesignRequests,
  triggerFileDownload
} from "../../utils/designFileStorage";
import { isSameDesignRequest } from "../../utils/auth";

export default function DesignerUploadModal({
  open,
  onClose,
  request,
  onSuccess,
  baseApi,
  token = "",
}) {
  if (!open || !request) return null;

  const currentRole = (localStorage.getItem("user_role") || "designer").toLowerCase();
  const currentUserName = localStorage.getItem("user_name") || "Designer Engineer";

  const isRevision = request.status === "revision_requested";
  const currentVersionNo = request.current_version || (request.versions?.length || 1);
  const targetVersionNo = isRevision ? currentVersionNo : (request.drawingUrl || request.drawingFiles?.length ? currentVersionNo + 1 : currentVersionNo);

  const [drawingTitle, setDrawingTitle] = useState("");
  const [drawingSpecs, setDrawingSpecs] = useState("");
  const [designerNotes, setDesignerNotes] = useState("");
  const [fileList, setFileList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when opened
  useEffect(() => {
    if (request) {
      const clientName = request.clientCoName || request.customerName || "Project";
      const projName = request.projectName || request.companyName || "Site";

      setDrawingTitle(
        request.drawingTitle || `${clientName} — ${projName} CAD Layout Plan V${targetVersionNo}`
      );
      setDrawingSpecs(
        request.drawingSpecs || "Standard Parking Layout Plan & Elevation Specifications"
      );
      setDesignerNotes(
        isRevision
          ? `Updated drawings according to revision request V${targetVersionNo}.`
          : "Completed CAD drawing set according to client specifications."
      );

      // Pre-fill existing files if editing
      if (request.drawingFiles && Array.isArray(request.drawingFiles) && request.drawingFiles.length > 0 && !isRevision) {
        setFileList(request.drawingFiles);
      } else if (request.drawingUrl && !isRevision) {
        setFileList([
          {
            name: request.fileName || "AutoCAD_Drawing_Plan.dwg",
            url: request.drawingUrl,
            type: request.fileType || "autocad",
            size: "Standard",
          },
        ]);
      } else {
        setFileList([]);
      }
    }
  }, [request, isRevision, targetVersionNo]);

  // Determine file type category helper
  const detectFileType = (fileName = "") => {
    const ext = fileName.split(".").pop().toLowerCase();
    if (["dwg", "dxf"].includes(ext)) return "autocad";
    if (ext === "pdf") return "pdf";
    if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
    if (["zip", "rar", "7z"].includes(ext)) return "archive";
    return "other";
  };

  const formatFileSize = (bytes) => {
    if (!bytes || typeof bytes !== "number") return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle Multiple File Selection
  const handleFilesSelected = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const newEntries = selectedFiles.map((file) => {
      const fileType = detectFileType(file.name);
      const fileKey = `file_${request.id || "req"}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      return {
        key: fileKey,
        fileKey: fileKey,
        name: file.name,
        size: formatFileSize(file.size),
        type: fileType,
        fileObject: file,
        url: "",
      };
    });

    setFileList((prev) => [...prev, ...newEntries]);
    e.target.value = "";
  };

  // Remove file from list
  const handleRemoveFile = (index) => {
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fileList.length === 0) {
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
      Swal.fire("Files Required", "Please attach at least one drawing file (.dwg, .dxf, .pdf, image, etc.)", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const nowString = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
      const mainFile = fileList[0];

      // 1. Store all files in IndexedDB (handles gigabytes, avoids 5MB localStorage limit)
      const savedDescriptors = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const fileKey = f.fileKey || f.key || `file_${request.id || "req"}_v${targetVersionNo}_${i}_${Date.now()}`;
        const dataToSave = f.fileObject || f.url;

        if (dataToSave) {
          try {
            await storeFileInDB(fileKey, dataToSave, {
              name: f.name,
              size: f.size,
              type: f.type,
            });
          } catch (storageErr) {
            console.warn("IndexedDB single file store warning:", storageErr);
          }
        }

        savedDescriptors.push({
          key: fileKey,
          fileKey: fileKey,
          name: f.name,
          size: f.size,
          type: f.type,
          url: typeof f.url === "string" && !f.url.startsWith("data:") ? f.url : "",
        });
      }

      // Update backend lead if leadId exists (send minimal payload or metadata)
      if (baseApi && request.leadId && token) {
        try {
          const patchBody = {
            is_sent: true,
            is_received: true,
            cad_file_name: mainFile.name,
          };
          await fetch(`${baseApi.replace(/\/$/, "")}/lead/lead/${request.leadId}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(patchBody),
          });
        } catch (apiErr) {
          console.warn("Backend lead patch failed:", apiErr);
        }
      }

      // Existing versions list or seed with original
      const existingVersions = Array.isArray(request.versions) && request.versions.length > 0
        ? [...request.versions]
        : [
            {
              version_no: 1,
              title: "V1 - Initial Request",
              created_at: request.sentDate || nowString,
              created_by: request.salesPersonName || "Sales Person",
              role: "sales",
              requirements: request.requirements,
              quantity: request.quantity || "As per STD",
              remark: request.remark || "-",
              customer_layout_name: request.customerLayoutName || "",
              customer_layout_url: "",
              change_notes: "Initial requirement sent to designer",
              status: "pending_drawing",
            },
          ];

      // New completed version entry
      const newVersionEntry = {
        version_no: targetVersionNo,
        title: `V${targetVersionNo} - Completed Drawing Set`,
        created_at: nowString,
        created_by: currentUserName,
        role: "designer",
        requirements: request.requirements,
        quantity: request.quantity || "As per STD",
        remark: request.remark || "-",
        change_notes: isRevision
          ? `Revision completed by designer: ${designerNotes}`
          : `Initial design completed: ${designerNotes}`,
        drawing_title: drawingTitle,
        drawing_specs: drawingSpecs,
        designer_notes: designerNotes,
        drawing_files: savedDescriptors,
        status: "drawing_completed",
      };

      const updatedVersions = [newVersionEntry, ...existingVersions.filter((v) => v.version_no !== targetVersionNo)];

      // Build updated request object
      const updatedRequest = {
        ...request,
        status: "drawing_completed",
        is_sent: 1,
        is_received: 1,
        current_version: targetVersionNo,
        drawingTitle: drawingTitle,
        drawingSpecs: drawingSpecs,
        designerNotes: designerNotes,
        fileName: mainFile.name,
        fileType: mainFile.type,
        drawingUrl: "",
        drawingFiles: savedDescriptors,
        completedDate: nowString,
        versions: updatedVersions,
      };

      // Save to localStorage safely (IndexedDB holds large binaries, localStorage holds metadata)
      const allSaved = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
      let found = false;
      const updatedList = allSaved.map((item) => {
        if (isSameDesignRequest(item, request)) {
          found = true;
          return { ...item, ...updatedRequest };
        }
        return item;
      });

      // If not in storage yet, prepend it
      if (!found) {
        updatedList.unshift(updatedRequest);
      }

      // Safe save prevents QuotaExceededError
      safeSaveDesignRequests(updatedList);

      // Trigger app-wide sync
      window.dispatchEvent(new Event("designRequestUpdated"));
      window.dispatchEvent(new Event("storage"));

      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }

      Swal.fire({
        icon: "success",
        title: isRevision ? `Revision V${targetVersionNo} Returned!` : "Drawings Returned to Sales!",
        text: `Drawing set with ${fileList.length} file(s) for "${request.projectName || request.customerName}" has been stored and returned to Sales.`,
        timer: 2200,
        showConfirmButton: false,
      });

      if (onSuccess) onSuccess(updatedRequest);
      onClose();
    } catch (err) {
      console.error("Failed to upload drawings:", err);
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
      Swal.fire("Error", "Could not complete upload: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-300 flex flex-col my-auto max-h-[92vh]">
        {/* Header - Dark Sleek */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl text-emerald-400">
              📐
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {isRevision ? `Upload Revised CAD Drawings (V${targetVersionNo})` : "Upload Completed CAD Drawings"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Version {targetVersionNo}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {request.clientCoName || request.customerName} • {request.projectName || "Project"}
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
          {/* If revision requested, show Sales Change Request info box */}
          {isRevision && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                  <FiClock className="w-4 h-4 text-amber-600" />
                  Revision Requested by Sales ({request.salesPersonName || "Sales Person"})
                </span>
                <span className="text-[11px] font-bold text-amber-700">
                  {request.revisionRequestedDate || "Recent"}
                </span>
              </div>
              {request.latestRevisionNotes && (
                <div className="text-xs font-semibold text-amber-950 bg-white/70 p-2.5 rounded-lg border border-amber-200">
                  <strong>Changes Required: </strong>
                  {request.latestRevisionNotes}
                </div>
              )}
              {request.customerLayoutUrl && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-amber-800 font-medium">New Reference File Provided by Sales:</span>
                  <a
                    href={request.customerLayoutUrl}
                    download={request.customerLayoutName || "Layout"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-md border border-amber-200"
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                    Download {request.customerLayoutName || "File"}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Project & Client Quick Summary */}
          <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Client / Co</span>
              <span className="font-bold text-slate-900">{request.clientCoName || request.customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Project Name</span>
              <span className="font-bold text-slate-900">{request.projectName || "—"}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Site Location</span>
              <span className="font-medium text-slate-700 truncate block">{request.projectAddress || request.location || "—"}</span>
            </div>
            <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Current Requirements</span>
              <span className="font-mono text-slate-800 bg-slate-50 p-1.5 rounded block text-[11px] mt-0.5 whitespace-pre-wrap">
                {request.requirements || "—"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drawing Title */}
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Drawing Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Avdhut Residency Puzzle Parking Elevation & Layout"
                  value={drawingTitle}
                  onChange={(e) => setDrawingTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Design Specifications / Dimensions
                </label>
                <input
                  type="text"
                  placeholder="e.g., Pit Depth: 2100mm, Clear Height: 3600mm, 2DP101 Stack"
                  value={drawingSpecs}
                  onChange={(e) => setDrawingSpecs(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* MULTIPLE FILES UPLOAD ZONE */}
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Attach Drawing Files ({fileList.length} Selected) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    You can upload multiple files (.dwg, .dxf, .pdf, images, 3D renders, zip)
                  </p>
                </div>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold cursor-pointer transition">
                  <FiUploadCloud className="w-4 h-4" />
                  <span>+ Browse Files</span>
                  <input
                    type="file"
                    multiple
                    accept=".dwg,.dxf,.pdf,image/*,.zip,.rar,.7z"
                    onChange={handleFilesSelected}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Uploaded Files Staging List */}
              {fileList.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {fileList.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-indigo-300 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {file.type === "autocad" ? "📐" : file.type === "pdf" ? "📄" : file.type === "image" ? "🖼️" : "📦"}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {file.type} {file.size ? `• ${file.size}` : ""}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Remove file"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition group">
                  <FiUploadCloud className="w-9 h-9 text-slate-400 group-hover:text-indigo-600 transition" />
                  <p className="text-xs font-bold text-slate-700 mt-2">
                    Click to select multiple CAD (.dwg/.dxf), PDF or image files
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select all drawing sheets, elevations, and structural details together
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".dwg,.dxf,.pdf,image/*,.zip,.rar,.7z"
                    onChange={handleFilesSelected}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Designer Remarks / Version Notes */}
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                Designer Remarks / Version Notes (V{targetVersionNo})
              </label>
              <textarea
                rows={2}
                placeholder="Describe any engineering changes or assumptions made..."
                value={designerNotes}
                onChange={(e) => setDesignerNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed"
              />
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
                disabled={isSubmitting || fileList.length === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <FiCheckCircle className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? "Returning..."
                    : isRevision
                    ? `Return Revised Set (V${targetVersionNo}) to Sales`
                    : "Submit CAD Set to Sales"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
