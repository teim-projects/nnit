import { useEffect, useState } from "react";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import { MdPhone, MdEmail, MdLocationOn } from "react-icons/md";
import { AiOutlineFileText } from "react-icons/ai";
import { HiCheckCircle } from "react-icons/hi";
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

// Helper to generate dynamic ordinal labels (1st, 2nd, 3rd...)
const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function CustomerDetails({ customerId, baseApi, token, onBack }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requirements");

  // Quotations state
  const [quotations, setQuotations] = useState([]);
  const [quotLoading, setQuotLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  // Requirements state
  const [requirements, setRequirements] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);

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
    axios.get(`${baseApi}/api/quotation/quotation/?customer=${customerId}&page_size=50`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : r.data?.results || [];
        setQuotations(data);
      })
      .catch(console.error)
      .finally(() => setQuotLoading(false));
  }, [activeTab, customerId, baseApi, token]);

  // Load requirements from leads when tab opens
  useEffect(() => {
    if (activeTab !== "requirements" || !customerId) return;
    setReqLoading(true);
    
    console.log("🔍 Fetching requirements for customer ID:", customerId);
    
    // Fetch all leads for this specific customer only
    axios.get(`${baseApi}/lead/lead/?customer=${customerId}&page_size=100`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        console.log("📦 Raw API response:", r.data);
        
        const leads = Array.isArray(r.data) ? r.data : r.data?.results || [];
        console.log("📋 Leads found:", leads.length, leads);
        
        // Double-check: filter only leads for THIS customer
        const customerLeads = leads.filter(lead => lead.customer === parseInt(customerId));
        console.log("✅ Customer-specific leads:", customerLeads.length, customerLeads);
        
        // Flatten all followups that have requirement_info or qualifying_info
        const allRequirements = customerLeads.flatMap((lead) => {
          console.log("🔎 Processing lead:", lead.id, "Followups:", lead.followups?.length);
          
          return (lead.followups || [])
            .filter((fu) => {
              const hasReq = fu.requirement_info || fu.qualifying_info;
              console.log("  Followup:", fu.id, "Has requirements?", hasReq);
              return hasReq;
            })
            .map((fu) => ({ 
              ...fu, 
              lead_id: lead.id,
              lead_name: lead.customer_name || customer?.name 
            }));
        });
        
        console.log("✨ Final requirements:", allRequirements.length, allRequirements);
        setRequirements(allRequirements);
      })
      .catch((err) => {
        console.error("❌ Requirements fetch error:", err);
        setRequirements([]);
      })
      .finally(() => setReqLoading(false));
  }, [activeTab, customerId, baseApi, token, customer]);

  const quotCount = quotations.length;
  const reqCount = requirements.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center py-24">
        <div className="text-gray-500 text-sm">Loading details...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center py-24">
        <div className="text-gray-500 text-sm">Customer not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Back bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold text-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ══════════════════════════════════════════════════════════ */}
        {/* LEFT SIDEBAR (4 Cols) - Customer Info Card */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-0 h-fit">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="text-gray-400 text-[11px] font-bold tracking-wider uppercase mb-2">
                Customer Information
              </h3>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {customer.name}
              </h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-block px-3 py-1 text-xs font-bold bg-[#DEF7EC] text-[#03543F] rounded-full uppercase tracking-wider">
                  Active Customer
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
              {customer.contact_number && (
                <div className="flex items-center gap-3">
                  <MdPhone className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-800">
                    {customer.contact_number}
                  </span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3">
                  <MdEmail className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-800">{customer.email}</span>
                </div>
              )}
              {(customer.city || customer.state) && (
                <div className="flex items-start gap-3">
                  <MdLocationOn className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="font-semibold text-gray-800">
                    {[customer.city, customer.state].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Meta Info */}
            <div className="pt-3 border-t border-gray-100 space-y-2.5 text-xs">
              {customer.gst && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold uppercase">GST:</span>
                  <span className="font-bold text-gray-800">{customer.gst}</span>
                </div>
              )}
              {customer.pan && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold uppercase">PAN:</span>
                  <span className="font-bold text-gray-800">{customer.pan}</span>
                </div>
              )}
              {customer.created_at && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold uppercase">Added On:</span>
                  <span className="font-bold text-gray-800">{fmtDate(customer.created_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Converted Badge */}
          {customer.created_at && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
              <HiCheckCircle className="w-4 h-4 shrink-0" />
              <span>Active Customer</span>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* RIGHT (8 Cols) — Tabs */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Tab Switcher */}
          <div className="bg-gray-200/50 p-1 rounded-xl flex items-center w-full">
            <button
              onClick={() => setActiveTab("requirements")}
              className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                activeTab === "requirements"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Follow-ups & Requirements ({reqCount})
            </button>
            <button
              onClick={() => setActiveTab("quotations")}
              className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                activeTab === "quotations"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Quotations ({quotCount})
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-1">
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
              Requirements {reqCount > 0 && `(${reqCount})`}
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
                {reqLoading && (
                  <div className="py-12 text-center text-slate-400 text-sm">Loading requirements…</div>
                )}
                {!reqLoading && requirements.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No requirements yet
                  </div>
                )}
                {!reqLoading && requirements.length > 0 && (
                  <div className="space-y-4">
                    {requirements.map((fu, i) => (
                      <div key={i} className="border border-slate-100 rounded-xl p-4 text-sm space-y-2">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs text-slate-400">Follow-up Date</p>
                            <p className="font-semibold text-slate-700">{fmtDate(fu.followup_date)}</p>
                          </div>
                          {fu.lead_name && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              {fu.lead_name}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          {fu.requirement_info?.site_length && (
                            <div>
                              <p className="text-xs text-slate-400">Dimensions (L×W×H)</p>
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
                          {fu.requirement_info?.preferred_parking_type && (
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
                          {fu.requirement_info?.automation_needed !== undefined && (
                            <div>
                              <p className="text-xs text-slate-400">Automation</p>
                              <p className="font-semibold text-slate-700">
                                {fu.requirement_info.automation_needed ? "Yes" : "No"}
                              </p>
                            </div>
                          )}
                        </div>
                        {fu.discussion_notes && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-400 mb-1">Discussion Notes</p>
                            <p className="text-sm text-slate-600">{fu.discussion_notes}</p>
                          </div>
                        )}
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
