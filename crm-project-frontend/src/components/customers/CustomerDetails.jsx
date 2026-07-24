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
    
    // Fetch all leads for this specific customer
    axios.get(`${baseApi}/lead/lead/?customer=${customerId}&page_size=100`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        const leads = Array.isArray(r.data) ? r.data : r.data?.results || [];
        
        // Filter only leads for THIS customer
        const customerLeads = leads.filter(lead => lead.customer === parseInt(customerId));
        
        // Flatten all followups
        const allRequirements = customerLeads.flatMap((lead) =>
          (lead.followups || [])
            .map((fu) => ({ 
              ...fu, 
              lead_id: lead.id,
              lead_name: lead.customer_name || customer?.name 
            }))
        );
        
        setRequirements(allRequirements);
      })
      .catch((err) => {
        console.error("Requirements fetch error:", err);
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
        {/* LEFT SIDEBAR (4 Cols) - Customer Info */}
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
                  <span className="font-semibold text-gray-800">{customer.contact_number}</span>
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

          {/* Active Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
            <HiCheckCircle className="w-4 h-4 shrink-0" />
            <span>Active Customer</span>
          </div>
        </div>

        {/* RIGHT (8 Cols) — Tabs */}
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
            {/* Requirements Tab */}
            {activeTab === "requirements" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Follow-up History &amp; Timeline</h3>
                
                {reqLoading && (
                  <div className="py-10 text-center text-sm text-gray-400">Loading requirements…</div>
                )}
                
                {!reqLoading && requirements.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                    <p className="text-sm text-gray-400 font-semibold">No follow-ups recorded yet.</p>
                  </div>
                )}
                
                {!reqLoading && requirements.length > 0 && (
                  <div className="relative pl-6 border-l-2 border-[#1c64f2]/15 space-y-8">
                    {requirements.map((fu, idx) => (
                      <div key={fu.id || idx} className="relative">
                        <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#1c64f2] border-4 border-white shadow-sm ring-2 ring-[#1c64f2]/15"></span>
                        
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                          <span className="px-3 py-1 bg-[#1c64f2] text-white rounded-lg text-xs font-bold">
                            {getOrdinal(idx + 1)} Follow-up
                          </span>
                          <span className="text-gray-500 font-bold text-sm">{fmtDate(fu.followup_date)}</span>
                          <span className="ml-auto px-2.5 py-0.5 text-xs font-bold bg-[#DEF7EC] text-[#03543F] rounded-full uppercase">
                            {fu.status?.replace('_', ' ') || "OPEN"}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 mb-5 font-medium leading-relaxed">
                          {fu.remarks || fu.discussion_notes || "No discussion notes recorded."}
                        </p>

                        {fu.qualifying_info && (
                          <div className="bg-[#f8fafc]/80 border border-gray-100 rounded-2xl p-5 mb-5">
                            <h4 className="text-sm font-bold text-gray-900 mb-4">Qualifying Information</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                              {fu.qualifying_info.site_location && (
                                <div>
                                  <span className="text-gray-400 block mb-0.5 text-xs font-medium">Site Location:</span>
                                  <span className="font-bold text-gray-800">{fu.qualifying_info.site_location}</span>
                                </div>
                              )}
                              {fu.qualifying_info.cars_required && (
                                <div>
                                  <span className="text-gray-400 block mb-0.5 text-xs font-medium">Cars Required:</span>
                                  <span className="font-bold text-gray-800">{fu.qualifying_info.cars_required}</span>
                                </div>
                              )}
                              {fu.qualifying_info.car_type && (
                                <div>
                                  <span className="text-gray-400 block mb-0.5 text-xs font-medium">Car Type:</span>
                                  <span className="font-bold text-gray-800 capitalize">{fu.qualifying_info.car_type}</span>
                                </div>
                              )}
                              {fu.qualifying_info.budget_range && (
                                <div>
                                  <span className="text-gray-400 block mb-0.5 text-xs font-medium">Budget Range:</span>
                                  <span className="font-bold text-gray-800">{fu.qualifying_info.budget_range}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {fu.requirement_info && (
                          <div className="bg-[#f8fafc]/80 border border-gray-100 rounded-2xl p-5">
                            <h4 className="text-sm font-bold text-gray-900 mb-4">Requirement Details</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                              {fu.requirement_info.site_length && (
                                <div>
                                  <span className="text-gray-400 block mb-0.5 text-xs font-medium">Site Dimensions:</span>
                                  <span className="font-bold text-gray-800">
                                    {fu.requirement_info.site_length} × {fu.requirement_info.site_width || "—"} × {fu.requirement_info.site_height || "—"} ft
                                  </span>
                                </div>
                              )}
                              {fu.requirement_info.preferred_parking_type && (
                                <div>
                                  <span className="text-gray-400 block mb-0.5 text-xs font-medium">Preferred Type:</span>
                                  <span className="font-bold text-gray-800">{fu.requirement_info.preferred_parking_type}</span>
                                </div>
                              )}
                              {fu.requirement_info.automation_needed !== undefined && (
                                <div>
                                  <span className="text-gray-400 block mb-0.5 text-xs font-medium">Automation:</span>
                                  <span className="font-bold text-gray-800">{fu.requirement_info.automation_needed ? "Yes" : "No"}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quotations Tab */}
            {activeTab === "quotations" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Quotation History</h3>
                
                {quotLoading && (
                  <div className="py-10 text-center text-sm text-gray-400">Loading quotations…</div>
                )}
                
                {!quotLoading && quotations.length === 0 && (
                  <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <AiOutlineFileText className="w-10 h-10 text-gray-300" />
                    <p className="font-bold text-gray-700 text-sm">No quotations yet</p>
                  </div>
                )}
                
                {!quotLoading && quotations.map((q) => {
                  const latest = q.versions?.find((v) => v.is_active) || q.versions?.[0];
                  const grandTotalL = (parseFloat(latest?.grand_total || 0) / 100000).toFixed(2);
                  const versionLabel = latest?.version_no?.split("-R").pop() ?? "1";
                  const quoteDate = latest?.created_at ? fmtDate(latest.created_at) : "—";
                  
                  return (
                    <div key={q.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-blue-50/60 px-5 py-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">{q.subject || "Quotation"}</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                              V{versionLabel} (Latest)
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Quote #{q.quotation_no} &bull; {quoteDate}</p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-600">Total Amount:</span>
                          <span className="text-lg font-bold text-blue-600">₹{grandTotalL}L</span>
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => {
                              const base = baseApi.replace(/\/$/, "");
                              const tok = localStorage.getItem("access");
                              window.open(`${base}/api/quotation/quotation/${q.id}/version/${latest.id}/pdf/?token=${tok}`, "_blank");
                            }}
                            className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-sm transition-all"
                          >
                            View PDF
                          </button>
                        </div>
                      </div>
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
