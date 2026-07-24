// QuotationList.jsx — Full version-aware quotation table
import { useEffect, useState, useCallback, useRef } from "react";
import React from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  MdRemoveRedEye, MdDownload, MdEdit, MdDelete,
  MdEmail, MdExpandMore, MdExpandLess, MdPrint,
  MdSend, MdClose, MdHistory,
} from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";

const BASE_API = import.meta.env.VITE_BASE_API_URL ?? "http://127.0.0.1:8000";

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

// ── Send Quotation Modal ──────────────────────────────────────────────────────
function SendModal({ quotation, version, onClose }) {
  const [email, setEmail] = useState(quotation?.customer_contact || "");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const handleWhatsApp = () => {
    const phone = quotation?.customer_contact?.replace(/\D/g, "") || "";
    const text = encodeURIComponent(
      `Dear ${quotation?.customer_name},\n\nPlease find your quotation ${quotation?.quotation_no} (${version?.version_no}).\n\n${note}`
    );
    window.open(`https://wa.me/91${phone}?text=${text}`, "_blank");
    onClose();
  };

  const handleEmail = async () => {
    setSending(true);
    try {
      await api.post(`api/quotation/quotation/${quotation.id}/send-email/`, {
        email,
        note,
        version_id: version?.id,
      });
      Swal.fire({ icon: "success", text: "Email sent!", timer: 1500, showConfirmButton: false });
      onClose();
    } catch {
      Swal.fire({ icon: "error", text: "Email failed. Check backend config." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 text-slate-500 hover:text-slate-900"><MdClose size={20} /></button>
        <h3 className="text-lg font-bold mb-4">Send Quotation</h3>
        <p className="text-sm text-slate-500 mb-4">
          <span className="font-semibold text-slate-700">{quotation?.quotation_no}</span> — <VersionBadge versionNo={version?.version_no} isLatest={version?.is_active} />
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Email / Phone</label>
            <input className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm"
              value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@email.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Note (optional)</label>
            <textarea className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm" rows={3}
              value={note} onChange={e => setNote(e.target.value)} placeholder="Add a personal note..." />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium">
            <FaWhatsapp size={16} /> WhatsApp
          </button>
          <button onClick={handleEmail} disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50">
            <MdEmail size={16} /> {sending ? "Sending…" : "Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main QuotationList ────────────────────────────────────────────────────────
export default function QuotationList({ onAdd, onEdit, filters = {} }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});   // { [quotation.id]: bool }
  const [sendModal, setSendModal] = useState(null);        // { quotation, version }
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

  // ── Action buttons (reused for main row and version rows) ──────────────────
  function ActionButtons({ q, v, isLatest = false }) {
    return (
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
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

        {/* Send (WhatsApp / Email) */}
        <button onClick={() => setSendModal({ quotation: q, version: v })}
          title="Send"
          className="p-1.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
          <MdSend size={16} />
        </button>

        {/* Edit — only on latest version */}
        {isLatest && (
          <button onClick={() => onEdit(q.id)}
            title="Edit / New Version"
            className="p-1.5 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
            <MdEdit size={16} />
          </button>
        )}

        {/* Delete */}
        <button onClick={() => deleteVersion(q.id, v?.id)}
          title="Delete version"
          className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200">
          <MdDelete size={16} />
        </button>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Quotation Management</h2>
          <p className="text-sm text-slate-500">
            {loading ? "Loading…" : `${totalCount} quotation(s) found`}
          </p>
        </div>
        <button onClick={onAdd}
          className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 text-sm font-medium">
          + Add Quotation
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 w-10">#</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Quotation No</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Customer</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Site</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Latest Version</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Total (₹)</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Versions</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Actions</th>
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

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages} · {totalCount} total
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => fetchQuotations(page - 1)}
                className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-40 hover:bg-slate-100">
                ← Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => fetchQuotations(page + 1)}
                className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-40 hover:bg-slate-100">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Send Modal ───────────────────────────────────────────────────────── */}
      {sendModal && (
        <SendModal
          quotation={sendModal.quotation}
          version={sendModal.version}
          onClose={() => setSendModal(null)}
        />
      )}
    </div>
  );
}
