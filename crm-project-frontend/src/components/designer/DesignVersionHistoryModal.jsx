import React from "react";
import { MdClose } from "react-icons/md";
import {
  FiClock,
  FiFileText,
  FiDownload,
  FiPaperclip,
  FiCheckCircle,
  FiUser,
  FiLayers,
  FiCornerDownRight,
  FiArrowRight
} from "react-icons/fi";
import { triggerFileDownload } from "../../utils/designFileStorage";

export default function DesignVersionHistoryModal({ open, onClose, request }) {
  if (!open || !request) return null;

  const versions = Array.isArray(request.versions) && request.versions.length > 0
    ? [...request.versions].sort((a, b) => (b.version_no || 0) - (a.version_no || 0))
    : [
        {
          version_no: 1,
          title: "V1 - Initial Request",
          created_at: request.sentDate || "Initial",
          created_by: request.salesPersonName || "Sales Person",
          role: "sales",
          requirements: request.requirements,
          quantity: request.quantity || "As per STD",
          remark: request.remark || "-",
          change_notes: "Initial requirement sent to designer",
          customer_layout_name: request.customerLayoutName || "",
          customer_layout_url: request.customerLayoutUrl || "",
          drawing_title: request.drawingTitle || "",
          drawing_files: request.drawingFiles || (request.drawingUrl ? [{ name: request.fileName || "Drawing.dwg", url: request.drawingUrl, type: request.fileType || "autocad" }] : []),
          status: request.drawingUrl ? "drawing_completed" : "pending_drawing",
        },
      ];

  const currentVersionNo = request.current_version || (versions[0]?.version_no || 1);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-300 flex flex-col my-auto max-h-[92vh]">
        {/* Header - Sleek Dark Theme */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl text-indigo-400">
              📚
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Design Version History
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {versions.length} Version{versions.length > 1 ? "s" : ""}
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

        {/* Timeline Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-100/70 space-y-4">
          <div className="relative border-l-2 border-indigo-300 ml-4 pl-6 space-y-6">
            {versions.map((ver, idx) => {
              const isCurrent = ver.version_no === currentVersionNo;
              const isSales = ver.role === "sales";
              const files = ver.drawing_files || [];

              return (
                <div key={idx} className="relative">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${
                      isCurrent
                        ? "bg-indigo-600 border-white text-white shadow-sm ring-4 ring-indigo-200"
                        : "bg-white border-slate-400 text-slate-700"
                    }`}
                  >
                    V{ver.version_no}
                  </div>

                  {/* Card Container */}
                  <div
                    className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 transition ${
                      isCurrent ? "border-indigo-400 ring-2 ring-indigo-500/10" : "border-slate-300"
                    }`}
                  >
                    {/* Version Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          Version {ver.version_no}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                            Active Version
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            isSales
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                          }`}
                        >
                          {isSales ? "Sales Request / Revision" : "Designer Drawing Set"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <FiUser className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-700">{ver.created_by || "User"}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3.5 h-3.5 text-slate-400" />
                          {ver.created_at || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Change / Version Description */}
                    {ver.change_notes && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wide mb-0.5">
                          Change Notes / Reason
                        </span>
                        <p className="text-slate-800 font-medium">{ver.change_notes}</p>
                      </div>
                    )}

                    {/* Requirements at this version */}
                    <div className="text-xs space-y-1">
                      <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wide block">
                        Specifications & Requirements
                      </span>
                      <p className="font-mono text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 leading-relaxed whitespace-pre-wrap">
                        {ver.requirements || request.requirements}
                      </p>
                      {(ver.quantity || ver.remark) && (
                        <div className="flex gap-4 text-[11px] text-slate-600 pt-0.5">
                          {ver.quantity && <span>Qty: <strong>{ver.quantity}</strong></span>}
                          {ver.remark && <span>Remark: <strong>{ver.remark}</strong></span>}
                        </div>
                      )}
                    </div>

                    {/* Customer Provided Layout at this version if any */}
                    {(ver.customer_layout_name || ver.customer_layout_url) && (
                      <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-700 font-bold">📄 Client Layout File:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[200px]">
                            {ver.customer_layout_name || "Layout File"}
                          </span>
                        </div>
                        {(ver.customer_layout_url || ver.customer_layout_name) && (
                          <button
                            type="button"
                            onClick={() =>
                              triggerFileDownload(
                                {
                                  key: ver.customer_layout_key,
                                  fileKey: ver.customer_layout_key,
                                  url: ver.customer_layout_url,
                                  name: ver.customer_layout_name,
                                },
                                ver.customer_layout_name || "Layout.dwg"
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                            Download
                          </button>
                        )}
                      </div>
                    )}

                    {/* Designer Drawing Files attached in this version */}
                    {files.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="font-bold text-emerald-800 text-[10px] uppercase tracking-wide flex items-center gap-1">
                          <FiCheckCircle className="text-emerald-600" />
                          Designer Output Files ({files.length}):
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {files.map((file, fIdx) => (
                            <div
                              key={fIdx}
                              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs hover:border-indigo-300 transition"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {file.type === "autocad" ? "📐" : file.type === "pdf" ? "📄" : "🖼️"}
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
                                onClick={() => triggerFileDownload(file, file.name || `Drawing_V${ver.version_no}.dwg`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold shrink-0 transition shadow-2xs cursor-pointer"
                                title="Download this file"
                              >
                                <FiDownload className="w-3 h-3" />
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-200/80 border-t border-slate-300 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            Close Version History
          </button>
        </div>
      </div>
    </div>
  );
}
