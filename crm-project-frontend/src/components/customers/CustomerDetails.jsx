import { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { MdPhone, MdEmail, MdLocationOn } from "react-icons/md";
import { AiOutlineFileText } from "react-icons/ai";
import axios from "axios";

const fmtDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d) ? val : d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fmtL = (val) => {
  const n = parseFloat(val) || 0;
  return n === 0 ? "—" : `₹${n.toFixed(2)}L`;
};

export default function CustomerDetails({ customerId, baseApi, token, onBack }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requirements");

  // Quotations state
  const [quotations, setQuotations] = useState([]);
  const [quotLoading, setQuotLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  // Load customer
  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    axios.get(`${baseApi}/lead/customer/${customerId}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => setCustomer(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [customerId, baseApi, token]);

  // Load quotations when tab opens
  useEffect(() => {
    if (activeTab !== "quotations" || !customerId) return;
    setQuotLoading(true);
    axios.get(`${baseApi}/quotation/quotation/?customer=${customerId}&page_size=50`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : r.data?.results || [];
        setQuotations(data);
      })
      .catch(console.error)
      .finally(() => setQuotLoading(false));
  }, [activeTab, customerId, baseApi, token]);

  const quotCount = quotations.length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-24">
        Loading…
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-24">
        Customer not found.
      </div>
    );
  }

  // Requirements: gather from lead follow-ups (linked via leads)
  const requirements = (customer.leads || []).flatMap((lead) =>
    (lead.followups || []).filter((fu) => fu.requirement_info)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT: Customer Info ────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            {/* Title */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Customer Information
              </p>
              <h2 className="text-2xl font-bold text-slate-900">{customer.name}</h2>
              <div className="mt-2">
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold
                  ${customer.is_lead_only
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : "bg-green-50 text-green-700 border border-green-200"}`}>
                  {customer.is_lead_only ? "Lead" : "Active Customer"}
                </span>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
              {customer.contact_number && (
                <div className="flex items-center gap-3 text-slate-600">
                  <MdPhone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">
                    +{customer.contact_number.replace(/^\+/, "")}
                  </span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3 text-slate-600">
                  <MdEmail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{customer.email}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex items-center gap-3 text-slate-600">
                  <MdLocationOn className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">
                    {[customer.city, customer.state].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="pt-4 border-t border-slate-100 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Converted Date:</span>
                <span className="font-bold text-slate-800">{fmtDate(customer.updated_at || customer.created_at)}</span>
              </div>
              {(customer.leads || []).length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Converted From Lead:</span>
                  <span className="text-blue-600 font-semibold text-xs cursor-default">View Lead</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Tabs ───────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-4">

          {/* Tab switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab("requirements")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition
                ${activeTab === "requirements"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"}`}
            >
              <AiOutlineFileText className="w-4 h-4" />
              Requirements
            </button>
            <button
              onClick={() => setActiveTab("quotations")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition
                ${activeTab === "quotations"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"}`}
            >
              <AiOutlineFileText className="w-4 h-4" />
              Quotations {quotCount > 0 && `(${quotCount})`}
            </button>
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-48">

            {/* ── Requirements tab ────────────────────────────────── */}
            {activeTab === "requirements" && (
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-4">
                  Requirements from Follow-ups
                </h3>
                {requirements.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No requirements yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requirements.map((fu, i) => (
                      <div key={i} className="border border-slate-100 rounded-xl p-4 text-sm space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          {fu.requirement_info.site_length && (
                            <div>
                              <p className="text-xs text-slate-400">Dimensions</p>
                              <p className="font-semibold text-slate-700">
                                {fu.requirement_info.site_length} × {fu.requirement_info.site_width || "—"} × {fu.requirement_info.site_height || "—"} ft
                              </p>
                            </div>
                          )}
                          {fu.qualifying_info?.cars_required && (
                            <div>
                              <p className="text-xs text-slate-400">Cars Required</p>
                              <p className="font-semibold text-slate-700">{fu.qualifying_info.cars_required}</p>
                            </div>
                          )}
                          {fu.requirement_info.preferred_parking_type && (
                            <div>
                              <p className="text-xs text-slate-400">Preferred Type</p>
                              <p className="font-semibold text-slate-700">{fu.requirement_info.preferred_parking_type}</p>
                            </div>
                          )}
                          {fu.qualifying_info?.budget_range && (
                            <div>
                              <p className="text-xs text-slate-400">Budget</p>
                              <p className="font-semibold text-slate-700">{fu.qualifying_info.budget_range}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Quotations tab ──────────────────────────────────── */}
            {activeTab === "quotations" && (
              <div className="space-y-4">
                {quotLoading && (
                  <div className="py-12 text-center text-slate-400 text-sm">Loading quotations…</div>
                )}
                {!quotLoading && quotations.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm">No quotations yet</div>
                )}

                {!quotLoading && quotations.map((q) => {
                  const latest = q.versions?.find((v) => v.is_active) || q.versions?.[0];
                  const oldVersions = (q.versions || []).filter((v) => !v.is_active).sort((a, b) => b.id - a.id);
                  const isExpanded = !!expanded[q.id];

                  const item = latest?.high_side_items?.[0];
                  const productName = item?.product_data?.name || q.subject || "—";
                  const qty = item?.quantity ?? "—";
                  const capacity = item?.product_data?.car_capacity
                    ? item.product_data.car_capacity * (item.quantity || 1)
                    : null;
                  const grandTotalL = (parseFloat(latest?.grand_total || 0) / 100000).toFixed(2);
                  const versionLabel = latest?.version_no?.split("-R").pop() ?? "1";
                  const quoteDate = latest?.created_at
                    ? fmtDate(latest.created_at) : "—";

                  return (
                    <div key={q.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                      {/* Main card */}
                      <div className="bg-blue-50/60 px-5 py-4">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{productName}</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                              V{versionLabel} (Latest)
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">Draft</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">
                          Quote #{q.quotation_no} &bull; {quoteDate}
                        </p>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-slate-400">Quantity:</p>
                            <p className="text-sm font-bold text-slate-800">{qty} unit(s)</p>
                          </div>
                          {capacity && (
                            <div>
                              <p className="text-xs text-slate-400">Capacity:</p>
                              <p className="text-sm font-bold text-slate-800">{capacity} cars</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500 font-medium">Total Amount:</span>
                          <span className="text-lg font-bold text-blue-600">₹{grandTotalL}L</span>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => {
                              const base = baseApi.replace(/\/$/, "");
                              const tok = localStorage.getItem("access");
                              window.open(`${base}/quotation/quotation/${q.id}/view-pdf/?token=${tok}`, "_blank");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                          >
                            View Quotation
                          </button>
                        </div>
                      </div>

                      {/* Previous versions toggle */}
                      {oldVersions.length > 0 && (
                        <>
                          <button
                            onClick={() => setExpanded((p) => ({ ...p, [q.id]: !p[q.id] }))}
                            className="w-full px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-center gap-1 border-t border-slate-200 transition"
                          >
                            {isExpanded ? "↑ Hide" : "↓ Show"} Previous Versions ({oldVersions.length})
                          </button>
                          {isExpanded && (
                            <div className="divide-y divide-slate-100 border-t border-slate-200">
                              {oldVersions.map((v, vi) => {
                                const vItem = v.high_side_items?.[0];
                                const vName = vItem?.product_data?.name || q.subject || "—";
                                const vQty = vItem?.quantity ?? "—";
                                const vTotalL = (parseFloat(v.grand_total || 0) / 100000).toFixed(2);
                                const vNum = v.version_no?.split("-R").pop() ?? vi + 1;
                                const vDate = v.created_at ? fmtDate(v.created_at) : "—";
                                return (
                                  <div key={v.id} className="px-5 py-3 bg-white flex items-center gap-4 text-sm flex-wrap">
                                    <span className="text-xs font-bold text-slate-400 w-8">V{vNum}</span>
                                    <span className="font-medium text-slate-700 flex-1">{vName}</span>
                                    <span className="text-slate-500">Qty: {vQty}</span>
                                    <span className="text-slate-600 font-semibold">Amount: ₹{vTotalL}L</span>
                                    <span className="text-slate-400 text-xs">Date: {vDate}</span>
                                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">Sent</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
