// QuotationList.jsx — Full version-aware quotation table
import { useEffect, useState, useCallback, useRef } from "react";
import React from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  MdRemoveRedEye, MdDownload, MdEdit, MdDelete,
  MdEmail, MdExpandMore, MdExpandLess, MdPrint,
  MdClose, MdHistory, MdOutlineNavigateBefore, MdOutlineNavigateNext
} from "react-icons/md";
import { IoLogoWhatsapp } from "react-icons/io5";
import SendEmailModal from "../SendEmailModal";

const BASE_API = import.meta.env.VITE_BASE_API_URL;
console.log("QuotationList BASE_API =", BASE_API);

if (!BASE_API) {
  console.error("QuotationList: VITE_BASE_API_URL is not defined!");
}

const api = axios.create({ baseURL: `${BASE_API}/` });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const normalize = (d) => (Array.isArray(d) ? d : d?.results || []);

const fmt = (amount) => {
  if (!amount && amount !== 0) return "0.00";
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return isNaN(n) ? "0.00" : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (dt) => {
  if (!dt) return "—";
  return dt.split("T")[0];
};

// ── Version badge ─────────────────────────────────────────────────────────────
function VersionBadge({ versionNo, isLatest }) {
  const num = versionNo?.split("-R")?.pop() ?? versionNo;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
      ${isLatest ? "bg-green-100 text-green-700 border border-green-300" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
      V{num}
      {isLatest && <span className="ml-0.5 text-[10px] bg-green-600 text-white px-1 rounded-full">Latest</span>}
    </span>
  );
}

// ── Main QuotationList ────────────────────────────────────────────────────────
export default function QuotationList({ onAdd, onEdit, filters = {}, canCreate = true, canEdit = true, canDelete = true }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});   // { [quotation.id]: bool }
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalData, setEmailModalData] = useState({});
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 15;

  // ── Build query params ──────────────────────────────────────────────────────
  const buildParams = useCallback((f = {}, pg = 1) => {
    const params = new URLSearchParams();
    if (f.search) params.set("search", f.search);
    if (f.date?.from) params.set("date_from", f.date.from);
    if (f.date?.to) params.set("date_to", f.date.to);
    params.set("page", String(pg));
    params.set("page_size", String(PAGE_SIZE));
    return params.toString();
  }, []);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchQuotations = useCallback((pg = 1) => {
    setLoading(true);
    const qs = buildParams(filters, pg);
    api.get(`api/quotation/quotation/?${qs}`)
      .then((res) => {
        const raw = res.data;
        const data = normalize(raw);
        setList(data);
        setTotalCount(typeof raw?.count === "number" ? raw.count : data.length);
        setPage(pg);
      })
      .catch((err) => console.error("Quotation fetch error", err))
      .finally(() => setLoading(false));
  }, [filters, buildParams]);

  useEffect(() => { fetchQuotations(1); }, [fetchQuotations]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getLatestVersion = (q) => q.versions?.find((v) => v.is_active);
  const getOldVersions = (q) => (q.versions || []).filter((v) => !v.is_active).sort((a, b) => b.id - a.id);
  const toggleRow = (id) => setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── WhatsApp & Email Modals (Matches Lead.jsx) ──────────────────────────────
  const handleWhatsApp = (q, v) => {
    const latest = getLatestVersion(q);
    const ver = v || latest;
    const custEmail = q.customer_email || (q.customer_contact && q.customer_contact.includes("@") ? q.customer_contact : "");
    const custPhone = (q.customer_contact && !q.customer_contact.includes("@") ? q.customer_contact : "") || q.customer_phone || "";
    setEmailModalData({
      recipientEmail: custEmail,
      recipientName: q.customer_name || q.customer?.name || "",
      recipientPhone: custPhone,
      siteName: q.site_name_detail || q.site_name || "",
      requirements: q.subject || "Car Parking Systems & Automation",
      quotationNo: q.quotation_no || "",
      amount: ver?.grand_total ? `₹${fmt(ver.grand_total)}` : "",
      quotationId: q.id,
      versionId: ver?.id,
      type: "quotation",
      initialChannel: "whatsapp"
    });
    setShowEmailModal(true);
  };

  const handleEmail = (q, v) => {
    const latest = getLatestVersion(q);
    const ver = v || latest;
    const custEmail = q.customer_email || (q.customer_contact && q.customer_contact.includes("@") ? q.customer_contact : "");
    const custPhone = (q.customer_contact && !q.customer_contact.includes("@") ? q.customer_contact : "") || q.customer_phone || "";
    setEmailModalData({
      recipientEmail: custEmail,
      recipientName: q.customer_name || q.customer?.name || "",
      recipientPhone: custPhone,
      siteName: q.site_name_detail || q.site_name || "",
      requirements: q.subject || "Car Parking Systems & Automation",
      quotationNo: q.quotation_no || "",
      amount: ver?.grand_total ? `₹${fmt(ver.grand_total)}` : "",
      quotationId: q.id,
      versionId: ver?.id,
      type: "quotation",
      initialChannel: "email"
    });
    setShowEmailModal(true);
  };

  // ── PDF actions ─────────────────────────────────────────────────────────────
  const openPDF = async (quotationId, versionId, download = false) => {
    try {
      const url = versionId
        ? `api/quotation/quotation/${quotationId}/version/${versionId}/pdf/`
        : `api/quotation/quotation/${quotationId}/pdf/`;
      const res = await api.get(url, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const objUrl = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement("a");
        a.href = objUrl;
        a.download = `quotation_${quotationId}${versionId ? `_v${versionId}` : ""}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        window.open(objUrl, "_blank");
      }
      setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
    } catch {
      Swal.fire({ icon: "error", text: "Failed to load PDF" });
    }
  };

  const openPrintPDF = async (quotationId, versionId) => {
    try {
      const url = versionId
        ? `api/quotation/quotation/${quotationId}/version/${versionId}/print-pdf/`
        : `api/quotation/quotation/${quotationId}/print-pdf/`;
      const res = await api.get(url, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob), "_blank");
    } catch {
      Swal.fire({ icon: "error", text: "Failed to load print PDF" });
    }
  };

  // ── Delete version ──────────────────────────────────────────────────────────
  const deleteVersion = async (quotationId, versionId) => {
    if (!canDelete) return;
    const res = await Swal.fire({
      title: "Delete this version?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`api/quotation/quotation/${quotationId}/version/${versionId}/delete/`);
      Swal.fire({ icon: "success", text: "Version deleted", timer: 1200, showConfirmButton: false });
      fetchQuotations(page);
    } catch {
      Swal.fire({ icon: "error", text: "Delete failed" });
    }
  };

  const handleViewQuotationDrawing = (q) => {
    const existingReqs = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
    const custName = (q.customer_name || q.customer || "").trim().toLowerCase();
    
    // Flexible matching by customer name
    const foundReq = existingReqs.find(r => {
      const rName = (r.customerName || "").trim().toLowerCase();
      if (!rName) return false;
      return rName === custName || rName.includes(custName) || custName.includes(rName);
    });

    const drawingTitle = foundReq?.drawingTitle || `${q.customer_name || "Customer"} Gate & Parking Layout Plan`;
    const fileName = foundReq?.fileName || `${q.quotation_no ? q.quotation_no.replace(/\//g, "_") : "Quotation"}_CAD_Drawing.dwg`;
    const drawingSpecs = foundReq?.drawingSpecs || "AutoCAD CAD Drawing & General Arrangement Site Layout";
    const designerNotes = foundReq?.designerNotes || "AutoCAD site entrance and pit parking design layout completed.";
    const drawingUrl = foundReq?.drawingUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60";
    const fileType = foundReq?.fileType || "autocad";

    Swal.fire({
      title: `🎨 Attached Design Drawing`,
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <p><strong>Quotation No:</strong> ${q.quotation_no || "N/A"}</p>
          <p><strong>Customer:</strong> ${q.customer_name || "N/A"}</p>
          <p><strong>Drawing Title:</strong> ${drawingTitle}</p>
          <p><strong>File Name:</strong> ${fileName}</p>
          <p><strong>Format:</strong> ${fileType.toUpperCase()}</p>
          <p><strong>Technical Specs:</strong> ${drawingSpecs}</p>
          <p><strong>Designer Remarks:</strong> ${designerNotes}</p>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "📥 Download CAD/PDF Drawing",
      cancelButtonText: "Close",
      confirmButtonColor: "#10b981"
    }).then((res) => {
      if (res.isConfirmed) {
        const a = document.createElement("a");
        a.href = drawingUrl;
        a.download = fileName;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    });
  };

  // ── Action buttons (reused for main row and version rows — matches Lead.jsx) ──
  function ActionButtons({ q, v, isLatest = false }) {
    return (
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {/* View CAD / PDF Drawing */}
        <button onClick={() => handleViewQuotationDrawing(q)}
          title="View Attached Design Drawing"
          className="p-1.5 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-1 font-bold text-xs">
          <span>🎨 Drawing</span>
        </button>

        {/* View PDF */}
        <button onClick={() => openPDF(q.id, v?.id)}
          title="View PDF"
          className="p-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">
          <MdRemoveRedEye size={16} />
        </button>

        {/* Print PDF */}
        <button onClick={() => openPrintPDF(q.id, v?.id)}
          title="Print PDF"
          className="p-1.5 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
          <MdPrint size={16} />
        </button>

        {/* Download */}
        <button onClick={() => openPDF(q.id, v?.id, true)}
          title="Download PDF"
          className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200">
          <MdDownload size={16} />
        </button>

        {/* Send WhatsApp (Matches Lead.jsx style) */}
        <button
          onClick={() => handleWhatsApp(q, v)}
          className="inline-flex items-center px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
          title="Send WhatsApp"
        >
          <IoLogoWhatsapp className="w-3.5 h-3.5" />
        </button>

        {/* Send Email with PDF Attachment (Matches Lead.jsx style) */}
        <button
          onClick={() => handleEmail(q, v)}
          className="inline-flex items-center px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-medium transition-colors"
          title="Send Email (PDF Attached)"
        >
          <MdEmail className="w-3.5 h-3.5" />
        </button>

        {/* Edit — only on latest version */}
        {isLatest && canEdit && (
          <button onClick={() => onEdit(q.id)}
            title="Edit / New Version"
            className="p-1.5 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
            <MdEdit size={16} />
          </button>
        )}

        {/* Delete */}
        {canDelete && (
          <button onClick={() => deleteVersion(q.id, v?.id)}
            title="Delete version"
            className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200">
            <MdDelete size={16} />
          </button>
        )}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Quotations</h2>
          <div className="text-xs text-slate-500 font-medium">
            {loading ? "Loading…" : `${totalCount} total • ${list.length} shown`}
          </div>
        </div>
        {canCreate && (
          <button
            onClick={onAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition flex items-center gap-1.5"
          >
            + Add Quotation
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-10">SR.NO</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">QUOTATION NO</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">CUSTOMER</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">SITE</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">LATEST VERSION</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">TOTAL (₹)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">DATE</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">VERSIONS</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>

          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Loading quotations…</td></tr>
            )}

            {!loading && list.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">No quotations found.</td></tr>
            )}

            {!loading && list.map((q, i) => {
              const latest = getLatestVersion(q);
              const oldVersions = getOldVersions(q);
              const isExpanded = !!expandedRows[q.id];
              const totalVersions = q.versions?.length || 0;

              return (
                <React.Fragment key={q.id}>
                  {/* ── MAIN ROW (latest version) ─────────────────────────── */}
                  <tr className={`border-b hover:bg-slate-50 ${isExpanded ? "bg-blue-50/40" : ""}`}>
                    <td className="px-4 py-3 text-slate-500">{(page - 1) * PAGE_SIZE + i + 1}</td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-blue-700">{q.quotation_no}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{q.subject || "—"}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{q.customer_name}</div>
                      <div className="text-xs text-slate-400">{q.customer_contact}</div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">{q.site_name_detail || q.site_name || "—"}</td>

                    <td className="px-4 py-3">
                      {latest ? (
                        <VersionBadge versionNo={latest.version_no} isLatest={true} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      ₹{fmt(latest?.grand_total ?? latest?.total_amount)}
                    </td>

                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {fmtDate(latest?.created_at)}
                    </td>

                    {/* Versions toggle */}
                    <td className="px-4 py-3 text-center">
                      {totalVersions > 1 ? (
                        <button
                          onClick={() => toggleRow(q.id)}
                          className={`flex items-center gap-1 mx-auto px-2 py-1 rounded-full text-xs font-medium transition-colors
                            ${isExpanded
                              ? "bg-purple-200 text-purple-800"
                              : "bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700"
                            }`}
                          title="Show all versions">
                          <MdHistory size={14} />
                          {totalVersions}
                          {isExpanded ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">1</span>
                      )}
                    </td>

                    {/* Actions for latest version */}
                    <td className="px-4 py-3">
                      <ActionButtons q={q} v={latest} isLatest={true} />
                    </td>
                  </tr>

                  {/* ── EXPANDED VERSION HISTORY ──────────────────────────── */}
                  {isExpanded && oldVersions.length > 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-3 bg-slate-50 border-b">
                        <div className="flex items-center gap-2 mb-2">
                          <MdHistory className="text-purple-600" size={16} />
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            Previous Versions ({oldVersions.length})
                          </span>
                        </div>

                        <div className="space-y-2">
                          {oldVersions.map((v) => (
                            <div key={v.id}
                              className="flex items-center gap-4 bg-white rounded-lg border border-slate-200 px-4 py-2.5 hover:border-slate-300">

                              {/* Version badge */}
                              <div className="w-24 shrink-0">
                                <VersionBadge versionNo={v.version_no} isLatest={false} />
                              </div>

                              {/* Date */}
                              <div className="text-xs text-slate-500 w-24 shrink-0">
                                {fmtDate(v.created_at)}
                              </div>

                              {/* Amount */}
                              <div className="text-sm font-semibold text-slate-700 flex-1">
                                ₹{fmt(v.grand_total ?? v.total_amount)}
                              </div>

                              {/* GST Type */}
                              <div className="text-xs text-slate-400 w-24 shrink-0">
                                {v.gst_type || "—"}
                              </div>

                              {/* Actions */}
                              <ActionButtons q={q} v={v} isLatest={false} />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

        {/* ── Pagination ── */}
        {!loading && list.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500 font-medium">
              Page <span className="font-bold text-slate-700">{page}</span> of{" "}
              <span className="font-bold text-slate-700">{totalPages}</span>
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchQuotations(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Previous page"
              >
                <MdOutlineNavigateBefore className="w-4 h-4" />
              </button>

              <button
                onClick={() => fetchQuotations(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Next page"
              >
                <MdOutlineNavigateNext className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Send Email / WhatsApp Modal (Matches Lead.jsx) ────────────────────── */}
      <SendEmailModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        recipientEmail={emailModalData.recipientEmail}
        recipientName={emailModalData.recipientName}
        recipientPhone={emailModalData.recipientPhone}
        siteName={emailModalData.siteName}
        requirements={emailModalData.requirements}
        quotationNo={emailModalData.quotationNo}
        amount={emailModalData.amount}
        quotationId={emailModalData.quotationId}
        versionId={emailModalData.versionId}
        type="quotation"
        initialChannel={emailModalData.initialChannel || "email"}
        baseApi={BASE_API}
        token={localStorage.getItem("access")}
      />
    </div>
  );
}
