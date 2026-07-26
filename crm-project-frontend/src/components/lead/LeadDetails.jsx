import { useEffect, useState } from "react";
import { MdClose, MdPhone, MdEmail, MdLocationOn } from "react-icons/md";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import { HiCheckCircle } from "react-icons/hi";
import { AiOutlineFileText } from "react-icons/ai";
import axios from "axios";
import Swal from "sweetalert2";
import AddLeadFollowUpForm from "./AddLeadFollowUpForm";

// Helper to generate dynamic ordinal labels (1st, 2nd, 3rd...)
const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const LeadDetails = ({ open, onClose, leadId, baseApi, token, onCreateQuotation, inline = false }) => {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("followups");
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [converting, setConverting] = useState(false);

  // Quotation tab state
  const [quotations, setQuotations] = useState([]);
  const [quotLoading, setQuotLoading] = useState(false);
  const [expandedQuot, setExpandedQuot] = useState({});

  useEffect(() => {
    if (!open || !leadId) return;

    const fetchLead = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${baseApi}/lead/lead/${leadId}/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        setLead(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || String(err));
        setLead(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [open, leadId, baseApi, token]);

  // Fetch quotations for this lead's customer
  const fetchQuotations = () => {
    if (!lead?.customer) return;
    setQuotLoading(true);
    axios.get(`${baseApi}/api/quotation/quotation/?customer=${lead.customer}&page_size=50`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setQuotations(data);
      })
      .catch((e) => console.error("Quotation fetch failed", e))
      .finally(() => setQuotLoading(false));
  };

  useEffect(() => {
    if (activeTab === "quotations" && lead?.customer) fetchQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, lead]);

  const handleFollowUpSuccess = () => {
    setShowFollowUpForm(false);
    if (leadId) {
      axios.get(`${baseApi}/lead/lead/${leadId}/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      .then(response => setLead(response.data))
      .catch(err => console.error("Failed to refresh lead:", err));
    }
  };

  const handleConvertToCustomer = async () => {
    if (!lead) return;

    // Already converted — show info and stop
    if (lead.is_converted) {
      Swal.fire({
        icon: "info",
        title: "Already Converted",
        text: `This lead is already converted to customer: ${lead.customer_name}`,
        confirmButtonColor: "#00ac4f",
      });
      return;
    }

    // Confirmation dialog
    const result = await Swal.fire({
      title: "Convert to Customer?",
      html: `
        <div style="text-align:left; font-size:14px; color:#374151;">
          <p style="margin-bottom:8px;">You are about to convert this lead to a customer:</p>
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:12px; margin-bottom:8px;">
            <strong>${lead.customer_name || "—"}</strong><br/>
            ${lead.customer_contact ? `📞 ${lead.customer_contact}` : ""}
            ${lead.customer_email ? `<br/>✉️ ${lead.customer_email}` : ""}
          </div>
          <p style="color:#6b7280; font-size:13px;">The lead status will be set to <strong>Closed</strong> and marked as converted.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00ac4f",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Convert",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setConverting(true);
    try {
      const response = await axios.post(
        `${baseApi}/lead/lead/${leadId}/convert-to-customer/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = response.data;

      // Refresh lead data
      const refreshed = await axios.get(`${baseApi}/lead/lead/${leadId}/`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      setLead(refreshed.data);

      Swal.fire({
        icon: "success",
        title: "Converted!",
        html: `
          <div style="text-align:left; font-size:14px;">
            <p><strong>${data.customer?.name}</strong> has been added as a customer.</p>
            ${data.customer?.contact_number ? `<p>📞 ${data.customer.contact_number}</p>` : ""}
          </div>
        `,
        confirmButtonColor: "#00ac4f",
        confirmButtonText: "Done",
      });
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to convert";
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setConverting(false);
    }
  };

  if (!open) return null;

  // ── Inline (full-page) wrapper ────────────────────────────────────────────
  if (inline) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        {/* Back bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Leads</span>
          </button>
        </div>

        {loading && <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Loading details...</div>}
        {error && <div className="flex items-center justify-center py-24 text-red-500 text-sm">{error}</div>}
        {!loading && !lead && !error && <div className="flex items-center justify-center py-24 text-gray-500 text-sm">No lead details found</div>}

        {!loading && lead && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT SIDEBAR (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-0 h-fit">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-gray-400 text-[11px] font-bold tracking-wider uppercase mb-2">Lead Information</h3>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{lead.customer_name || "—"}</h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-block px-3 py-1 text-xs font-bold bg-[#DEF7EC] text-[#03543F] rounded-full uppercase tracking-wider">
                      {lead.status?.replace('_', ' ') || "OPEN"}
                    </span>
                    {lead.is_converted && (
                      <span className="inline-block px-3 py-1 text-xs font-bold bg-green-600 text-white rounded-full uppercase tracking-wider">Customer ✓</span>
                    )}
                  </div>
                </div>
                <div className="space-y-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                  <div className="flex items-center gap-3"><MdPhone className="w-5 h-5 text-gray-400 shrink-0" /><span className="font-semibold text-gray-800">{lead.customer_contact || "—"}</span></div>
                  <div className="flex items-center gap-3"><MdEmail className="w-5 h-5 text-gray-400 shrink-0" /><span className="font-semibold text-gray-800">{lead.customer_email || "—"}</span></div>
                  <div className="flex items-start gap-3"><MdLocationOn className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" /><span className="font-semibold text-gray-800">{[lead.customer_city, lead.customer_state].filter(Boolean).join(", ") || "—"}</span></div>
                </div>
                <div className="pt-3 border-t border-gray-100 space-y-2.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold uppercase">Source:</span><span className="font-bold text-gray-800 capitalize">{lead.lead_source?.replace('_', ' ') || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold uppercase">Created:</span><span className="font-bold text-gray-800">{lead.date || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold uppercase">Next Follow-up:</span><span className="font-bold text-orange-500">{lead.followup_date || "—"}</span></div>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <button onClick={handleConvertToCustomer} disabled={converting || lead.is_converted}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all text-sm ${lead.is_converted ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#00ac4f] hover:bg-[#009643] text-white"}`}>
                  <HiCheckCircle className="w-5 h-5" />
                  {converting ? "Converting..." : lead.is_converted ? "Already Converted ✓" : "Convert to Customer"}
                </button>

                {/* Follow-up Button (only old form) */}
                <button 
                  className="w-full py-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-sm" 
                  onClick={() => setShowFollowUpForm(true)}
                >
                  <FiPlus className="w-5 h-5 text-gray-500" /> Add Follow-up
                </button>

                {lead.is_converted && lead.converted_at && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                    <HiCheckCircle className="w-4 h-4 shrink-0" />
                    <span>Converted on {new Date(lead.converted_at).toLocaleDateString("en-IN")}</span>
                  </div>
                )}
              </div>
            </div>
            {/* RIGHT (8 Cols) — reuse same tab content */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="bg-gray-200/50 p-1 rounded-xl flex items-center w-full">
                <button onClick={() => setActiveTab("followups")} className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${activeTab === "followups" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>Follow-ups & Requirements</button>
                <button onClick={() => setActiveTab("quotations")} className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${activeTab === "quotations" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
                  Quotations ({quotations.length || lead.quotations_count || 0})
                </button>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-1">
                {activeTab === "followups" ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">Follow-up History &amp; Timeline</h3>
                      <button
                        onClick={() => setShowFollowUpForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1c64f2] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all"
                      >
                        <FiPlus className="w-4 h-4" />
                        Add Follow-up
                      </button>
                    </div>
                    {lead.followups && lead.followups.length > 0 ? (
                      <div className="relative pl-6 border-l-2 border-[#1c64f2]/15 space-y-8">
                        {lead.followups.map((fu, idx) => (
                          <div key={fu.id || idx} className="relative">
                            <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#1c64f2] border-4 border-white shadow-sm ring-2 ring-[#1c64f2]/15"></span>
                            
                            <div className="flex items-center gap-3 flex-wrap mb-3">
                              <span className="px-3 py-1 bg-[#1c64f2] text-white rounded-lg text-xs font-bold uppercase">
                                {fu.interaction_type === 'call' ? '📞 LEAD ENTRY' : 
                                 fu.interaction_type === 'email' ? '✉️ EMAIL' :
                                 fu.interaction_type === 'whatsapp' ? '💬 WHATSAPP' :
                                 fu.interaction_type === 'video_call' ? '📹 VIDEO CALL' :
                                 fu.interaction_type === 'in_person' ? '🤝 IN-PERSON' :
                                 fu.interaction_type === 'demo' ? '🎯 DEMO' :
                                 fu.interaction_type === 'site_visit' ? '🏗️ SITE VISIT' : 'LEAD ENTRY'}
                              </span>
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold capitalize">
                                {fu.interaction_type?.replace('_', ' ') || 'Call'}
                              </span>
                              <span className="text-gray-500 font-bold text-sm">{fu.followup_date || "—"}</span>
                              {fu.client_response && (
                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ml-auto ${
                                  fu.client_response === 'very_positive' || fu.client_response === 'positive' ? 'bg-green-100 text-green-700' :
                                  fu.client_response === 'negative' ? 'bg-red-100 text-red-700' :
                                  fu.client_response === 'no_response' ? 'bg-gray-100 text-gray-600' :
                                  fu.client_response === 'call_back_later' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {fu.client_response === 'very_positive' ? 'Very Positive' :
                                   fu.client_response === 'positive' ? 'Positive' :
                                   fu.client_response === 'negative' ? 'Negative' :
                                   fu.client_response === 'no_response' ? 'No Response' :
                                   fu.client_response === 'call_back_later' ? 'Call Back Later' :
                                   'Neutral'}
                                </span>
                              )}
                              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                                fu.followup_status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                fu.followup_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {fu.followup_status || 'Completed'}
                              </span>
                            </div>

                            {(fu.created_by_full_name || fu.contacted_person) && (
                              <p className="text-xs text-gray-400 mb-3">
                                {fu.created_by_full_name && <span>By <strong className="text-gray-600">{fu.created_by_full_name}</strong></span>}
                                {fu.created_by_full_name && fu.contacted_person && <span> · </span>}
                                {fu.contacted_person && <span>Contacted: <strong className="text-gray-600">{fu.contacted_person}</strong></span>}
                              </p>
                            )}

                            <p className="text-sm text-gray-700 mb-5 font-medium leading-relaxed">{fu.remarks || fu.discussion_notes || "No discussion notes recorded."}</p>

                            {(fu.client_commitment || fu.our_commitment) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                {fu.client_commitment && (
                                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <h5 className="text-xs font-bold text-green-700 uppercase mb-2">CLIENT COMMITMENT</h5>
                                    <p className="text-sm text-green-900 font-medium">{fu.client_commitment}</p>
                                  </div>
                                )}
                                {fu.our_commitment && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <h5 className="text-xs font-bold text-blue-700 uppercase mb-2">OUR COMMITMENT</h5>
                                    <p className="text-sm text-blue-900 font-medium">{fu.our_commitment}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {(fu.previous_stage || fu.current_stage) && (
                              <div className="flex items-center gap-3 mb-5 text-sm flex-wrap">
                                <span className="text-gray-400 font-medium">Stage:</span>
                                {fu.previous_stage && (
                                  <>
                                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg font-bold text-xs">{fu.previous_stage}</span>
                                    <span className="text-gray-400">→</span>
                                  </>
                                )}
                                {fu.current_stage && (
                                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs">{fu.current_stage}</span>
                                )}
                                {fu.next_followup_date && (
                                  <>
                                    <span className="text-gray-400 ml-2">Next:</span>
                                    <span className="font-bold text-gray-700">{fu.next_followup_date}</span>
                                    {fu.interaction_type && <span className="text-gray-400 text-xs">via {fu.interaction_type}</span>}
                                  </>
                                )}
                              </div>
                            )}

                            {fu.requirement_info && (
                              <div className="mb-5">
                                <button 
                                  onClick={() => onCreateQuotation && onCreateQuotation(lead)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <AiOutlineFileText className="w-4 h-4" />
                                  Quote from this follow-up
                                </button>
                              </div>
                            )}
                            {fu.qualifying_info && (
                              <div className="bg-[#f8fafc]/80 border border-gray-100 rounded-2xl p-5 mb-5">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">Qualifying Information</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                  <div><span className="text-gray-400 block mb-0.5 text-xs font-medium">Site Location:</span><span className="font-bold text-gray-800">{fu.qualifying_info.site_location || "—"}</span></div>
                                  <div><span className="text-gray-400 block mb-0.5 text-xs font-medium">Cars Required:</span><span className="font-bold text-gray-800">{fu.qualifying_info.cars_required || "—"}</span></div>
                                  <div><span className="text-gray-400 block mb-0.5 text-xs font-medium">Car Type:</span><span className="font-bold text-gray-800 capitalize">{fu.qualifying_info.car_type || "—"}</span></div>
                                  <div><span className="text-gray-400 block mb-0.5 text-xs font-medium">Budget Range:</span><span className="font-bold text-gray-800">{fu.qualifying_info.budget_range || "—"}</span></div>
                                  <div><span className="text-gray-400 block mb-0.5 text-xs font-medium">Installation Timeline:</span><span className="font-bold text-gray-800">{fu.qualifying_info.installation_timeline || "—"}</span></div>
                                  <div><span className="text-gray-400 block mb-0.5 text-xs font-medium">Basement Available:</span><span className="font-bold text-gray-800 capitalize">{fu.qualifying_info.basement_available || "—"}</span></div>
                                  <div className="sm:col-span-2"><span className="text-gray-400 block mb-0.5 text-xs font-medium">Site Challenges:</span><span className="font-bold text-gray-800">{fu.qualifying_info.site_challenges || "—"}</span></div>
                                </div>
                              </div>
                            )}
                            {fu.requirement_info && (
                              <div className="bg-[#f8fafc]/80 border border-gray-100 rounded-2xl p-5">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">Requirement Details</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                                  <div><span className="text-gray-400 block mb-0.5 text-xs font-medium">Site Dimensions:</span><span className="font-bold text-gray-800">{fu.requirement_info.site_length ? `${fu.requirement_info.site_length} ft × ${fu.requirement_info.site_width || "—"} ft × ${fu.requirement_info.site_height || "—"} ft` : "—"}</span></div>
                                  <div><span className="text-gray-400 block mb-0.5 text-xs font-medium">Cars Required:</span><span className="font-bold text-gray-800">{fu.qualifying_info?.cars_required || "—"}</span></div>
                                  <div><span className="text-gray-400 block mb-0.5 text-xs font-medium">Preferred Type:</span><span className="font-bold text-gray-800">{fu.requirement_info.preferred_parking_type || "—"}</span></div>
                                  <div><span className="text-gray-400 block mb-0.5 text-xs font-medium">Budget:</span><span className="font-bold text-gray-800">{fu.qualifying_info?.budget_range || "—"}</span></div>
                                  <div><span className="text-gray-400 block mb-0.5 text-xs font-medium">Automation:</span><span className="font-bold text-gray-800">{fu.requirement_info.automation_required || "—"}</span></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl"><p className="text-sm text-gray-400 font-semibold">No follow-ups recorded yet.</p></div>
                    )}
                    <div className="pt-5 border-t border-gray-100 flex justify-start">
                      <button className="py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-xl font-bold flex items-center gap-2 shadow-sm text-xs" onClick={() => onCreateQuotation && onCreateQuotation(lead)}>
                        <AiOutlineFileText className="w-4 h-4 text-gray-500" /> Create Quotation
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">Quotation History</h3>
                      <button onClick={() => onCreateQuotation && onCreateQuotation(lead)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-xs font-bold shadow transition-all">
                        <FiPlus className="w-4 h-4" /> New Quotation
                      </button>
                    </div>
                    {quotLoading && <div className="py-10 text-center text-sm text-gray-400">Loading quotations…</div>}
                    {!quotLoading && quotations.length === 0 && (
                      <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                        <AiOutlineFileText className="w-10 h-10 text-gray-300" />
                        <p className="font-bold text-gray-700 text-sm">No quotations yet</p>
                        <p className="text-xs text-gray-400">Click "New Quotation" to create one.</p>
                      </div>
                    )}
                    {!quotLoading && quotations.map((q) => {
                      const latest = q.versions?.find((v) => v.is_active) || q.versions?.[0];
                      const oldVersions = (q.versions || []).filter((v) => !v.is_active).sort((a, b) => b.id - a.id);
                      const isExpanded = !!expandedQuot[q.id];
                      const latestItem = latest?.high_side_items?.[0];
                      const productName = latestItem?.product_data?.name || q.subject || "—";
                      const qty = latestItem?.quantity ?? "—";
                      const capacity = latestItem?.product_data?.car_capacity ? latestItem.product_data.car_capacity * (latestItem.quantity || 1) : null;
                      const grandTotalL = (parseFloat(latest?.grand_total || 0) / 100000).toFixed(2);
                      const versionLabel = latest?.version_no?.split("-R").pop() ?? "1";
                      const quoteDate = latest?.created_at ? new Date(latest.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
                      return (
                        <div key={q.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="bg-blue-50/60 px-5 py-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-sm">{productName}</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">V{versionLabel} (Latest)</span>
                              </div>
                              <span className="text-xs text-gray-400 font-medium">Draft</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Quote #{q.quotation_no} &bull; {quoteDate}</p>
                            <div className="mt-3 grid grid-cols-3 gap-4">
                              <div><p className="text-xs text-gray-400 font-medium">Follow-up:</p><p className="text-sm font-bold text-gray-800">{lead.followup_date || "—"}</p></div>
                              <div><p className="text-xs text-gray-400 font-medium">Quantity:</p><p className="text-sm font-bold text-gray-800">{qty} unit(s)</p></div>
                              {capacity && <div><p className="text-xs text-gray-400 font-medium">Capacity:</p><p className="text-sm font-bold text-gray-800">{capacity} cars</p></div>}
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-600">Total Amount:</span>
                              <span className="text-lg font-bold text-blue-600">&#8377;{grandTotalL}L</span>
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
                          {oldVersions.length > 0 && (
                            <>
                              <button className="w-full px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-500 flex items-center justify-center gap-1 border-t border-gray-200 transition" onClick={() => setExpandedQuot((p) => ({ ...p, [q.id]: !p[q.id] }))}>
                                {isExpanded ? "Hide" : "Show"} Previous Versions ({oldVersions.length})
                              </button>
                              {isExpanded && (
                                <div className="divide-y divide-gray-100 border-t border-gray-200">
                                  {oldVersions.map((v, vi) => {
                                    const vItem = v.high_side_items?.[0];
                                    const vName = vItem?.product_data?.name || q.subject || "—";
                                    const vQty = vItem?.quantity ?? "—";
                                    const vTotalL = (parseFloat(v.grand_total || 0) / 100000).toFixed(2);
                                    const vNum = v.version_no?.split("-R").pop() ?? vi + 1;
                                    const vDate = v.created_at ? new Date(v.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
                                    return (
                                      <div key={v.id} className="px-5 py-3 bg-white flex items-center gap-4 text-sm flex-wrap">
                                        <span className="text-xs font-bold text-gray-400 w-8">V{vNum}</span>
                                        <span className="font-medium text-gray-700 flex-1">{vName}</span>
                                        <span className="text-gray-500">Qty: {vQty}</span>
                                        <span className="text-gray-600 font-semibold">Amount: &#8377;{vTotalL}L</span>
                                        <span className="text-gray-400 text-xs">Date: {vDate}</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Sent</span>
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
        )}

        {/* OLD Follow-up Form for Inline View */}
        {showFollowUpForm && (
          <AddLeadFollowUpForm
            open={showFollowUpForm}
            onClose={() => setShowFollowUpForm(false)}
            baseApi={baseApi}
            leadId={leadId}
            onSuccess={handleFollowUpSuccess}
          />
        )}
      </div>
    );
  }

  // ── Modal (original) wrapper ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-4 md:p-6 lg:p-8 backdrop-blur-sm">
      {/* Container wrapper keeping modal to comfortable, responsive sizes */}
      <div className="bg-[#f8fafc] rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[92vh] flex flex-col overflow-hidden text-gray-800 border border-gray-100">
        
        {/* Top Sticky Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-semibold text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Leads</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-800"
            aria-label="Close"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Dynamic States */}
        {loading && (
          <div className="flex-1 flex items-center justify-center text-sm font-medium text-gray-500">
            Loading details...
          </div>
        )}
        {error && (
          <div className="flex-1 flex items-center justify-center text-sm font-semibold text-red-600">
            {error}
          </div>
        )}
        {!loading && !lead && !error && (
          <div className="flex-1 flex items-center justify-center text-sm font-medium text-gray-500">
            No lead details found
          </div>
        )}

        {/* Scrollable Interior Layout */}
        {!loading && lead && (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT SIDEBAR (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-0 h-fit">
              
              {/* Contact Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-gray-400 text-[11px] font-bold tracking-wider uppercase mb-2">Lead Information</h3>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {lead.customer_name || "—"}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-block px-3 py-1 text-xs font-bold bg-[#DEF7EC] text-[#03543F] rounded-full uppercase tracking-wider">
                      {lead.status?.replace('_', ' ') || "OPEN"}
                    </span>
                    {lead.is_converted && (
                      <span className="inline-block px-3 py-1 text-xs font-bold bg-green-600 text-white rounded-full uppercase tracking-wider">
                        Customer ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact Attributes */}
                <div className="space-y-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <MdPhone className="w-5 h-5 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-800">{lead.customer_contact || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MdEmail className="w-5 h-5 text-gray-400 shrink-0" />
                    <span className="truncate font-semibold text-gray-800" title={lead.customer_email}>
                      {lead.customer_email || "—"}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdLocationOn className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="font-semibold text-gray-800">
                      {[lead.customer_city, lead.customer_state].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="pt-3 border-t border-gray-100 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-semibold uppercase">Source:</span>
                    <span className="font-bold text-gray-800 capitalize">
                      {lead.lead_source?.replace('_', ' ') || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-semibold uppercase">Created:</span>
                    <span className="font-bold text-gray-800">
                      {lead.date || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-semibold uppercase">Next Follow-up:</span>
                    <span className="font-bold text-orange-500">
                      {lead.followup_date || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sidebar Primary Actions */}
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={handleConvertToCustomer}
                  disabled={converting || lead.is_converted}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all text-sm
                    ${lead.is_converted
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#00ac4f] hover:bg-[#009643] text-white shadow-green-100"
                    }`}
                >
                  <HiCheckCircle className="w-5 h-5" />
                  {converting
                    ? "Converting..."
                    : lead.is_converted
                    ? "Already Converted ✓"
                    : "Convert to Customer"
                  }
                </button>
                
                {/* Follow-up Button (only old form) */}
                <button 
                  className="w-full py-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
                  onClick={() => setShowFollowUpForm(true)}
                >
                  <FiPlus className="w-5 h-5 text-gray-500" />
                  Add Follow-up
                </button>

                {/* Converted badge */}
                {lead.is_converted && lead.converted_at && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                    <HiCheckCircle className="w-4 h-4 shrink-0" />
                    <span>Converted on {new Date(lead.converted_at).toLocaleDateString("en-IN")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT MAIN WINDOW (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              
              {/* Tab Switcher Headers */}
              <div className="bg-gray-200/50 p-1 rounded-xl flex items-center w-full shrink-0">
                <button
                  onClick={() => setActiveTab("followups")}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                    activeTab === "followups"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Follow-ups & Requirements
                </button>
                <button
                  onClick={() => setActiveTab("quotations")}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                    activeTab === "quotations"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Quotations ({quotations.length || lead.quotations_count || 0})
                </button>
              </div>

              {/* Tab Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-1">
                {activeTab === "followups" ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">Follow-up History & Timeline</h3>
                      <button
                        onClick={() => setShowFollowUpForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1c64f2] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all"
                      >
                        <FiPlus className="w-4 h-4" />
                        Add Follow-up
                      </button>
                    </div>

                    {lead.followups && lead.followups.length > 0 ? (
                      <div className="relative pl-6 border-l-2 border-[#1c64f2]/15 space-y-8">
                        {lead.followups.map((fu, idx) => (
                          <div key={fu.id || idx} className="relative">
                            
                            {/* Blue Timeline Node */}
                            <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#1c64f2] border-4 border-white shadow-sm ring-2 ring-[#1c64f2]/15"></span>
                            
                            {/* Timeline Node Header */}
                            <div className="flex items-center gap-3 flex-wrap mb-3">
                              <span className="px-3 py-1 bg-[#1c64f2] text-white rounded-lg text-xs font-bold uppercase">
                                {fu.interaction_type === 'call' ? '📞 LEAD ENTRY' : 
                                 fu.interaction_type === 'email' ? '✉️ EMAIL' :
                                 fu.interaction_type === 'whatsapp' ? '💬 WHATSAPP' :
                                 fu.interaction_type === 'video_call' ? '📹 VIDEO CALL' :
                                 fu.interaction_type === 'in_person' ? '🤝 IN-PERSON' :
                                 fu.interaction_type === 'demo' ? '🎯 DEMO' :
                                 fu.interaction_type === 'site_visit' ? '🏗️ SITE VISIT' : 'LEAD ENTRY'}
                              </span>
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold capitalize">
                                {fu.interaction_type?.replace('_', ' ') || 'Call'}
                              </span>
                              <span className="text-gray-500 font-bold text-sm">
                                {fu.followup_date || "—"}
                              </span>
                              {fu.followup_time && (
                                <span className="text-gray-400 text-xs font-semibold">
                                  {fu.followup_time}
                                </span>
                              )}
                              {fu.client_response && (
                                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ml-auto ${
                                  fu.client_response === 'very_positive' || fu.client_response === 'positive' ? 'bg-green-100 text-green-700' :
                                  fu.client_response === 'negative' ? 'bg-red-100 text-red-700' :
                                  fu.client_response === 'no_response' ? 'bg-gray-100 text-gray-600' :
                                  fu.client_response === 'call_back_later' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {fu.client_response === 'very_positive' ? 'Very Positive' :
                                   fu.client_response === 'positive' ? 'Positive' :
                                   fu.client_response === 'negative' ? 'Negative' :
                                   fu.client_response === 'no_response' ? 'No Response' :
                                   fu.client_response === 'call_back_later' ? 'Call Back Later' :
                                   'Neutral'}
                                </span>
                              )}
                              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                                fu.followup_status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                fu.followup_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {fu.followup_status || 'Completed'}
                              </span>
                            </div>

                            {/* Created By and Contacted Person */}
                            {(fu.created_by_full_name || fu.contacted_person) && (
                              <p className="text-xs text-gray-400 mb-3">
                                {fu.created_by_full_name && <span>By <strong className="text-gray-600">{fu.created_by_full_name}</strong></span>}
                                {fu.created_by_full_name && fu.contacted_person && <span> · </span>}
                                {fu.contacted_person && <span>Contacted: <strong className="text-gray-600">{fu.contacted_person}</strong></span>}
                              </p>
                            )}

                            {/* Remarks/Discussion Notes */}
                            <p className="text-sm text-gray-700 mb-5 font-medium leading-relaxed">
                              {fu.remarks || fu.discussion_notes || "No discussion notes recorded."}
                            </p>

                            {/* Commitments Section */}
                            {(fu.client_commitment || fu.our_commitment) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                {fu.client_commitment && (
                                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <h5 className="text-xs font-bold text-green-700 uppercase mb-2">CLIENT COMMITMENT</h5>
                                    <p className="text-sm text-green-900 font-medium">{fu.client_commitment}</p>
                                  </div>
                                )}
                                {fu.our_commitment && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <h5 className="text-xs font-bold text-blue-700 uppercase mb-2">OUR COMMITMENT</h5>
                                    <p className="text-sm text-blue-900 font-medium">{fu.our_commitment}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Stage Progression */}
                            {(fu.previous_stage || fu.current_stage) && (
                              <div className="flex items-center gap-3 mb-5 text-sm">
                                <span className="text-gray-400 font-medium">Stage:</span>
                                {fu.previous_stage && (
                                  <>
                                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg font-bold text-xs">{fu.previous_stage}</span>
                                    <span className="text-gray-400">→</span>
                                  </>
                                )}
                                {fu.current_stage && (
                                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs">{fu.current_stage}</span>
                                )}
                                {fu.next_followup_date && (
                                  <>
                                    <span className="text-gray-400 ml-2">Next:</span>
                                    <span className="font-bold text-gray-700">{fu.next_followup_date}</span>
                                    {fu.interaction_type && <span className="text-gray-400 text-xs">via {fu.interaction_type}</span>}
                                  </>
                                )}
                              </div>
                            )}

                            {/* Quote Button */}
                            {fu.requirement_info && (
                              <div className="mb-5">
                                <button 
                                  onClick={() => onCreateQuotation && onCreateQuotation(lead)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <AiOutlineFileText className="w-4 h-4" />
                                  Quote from this follow-up
                                </button>
                              </div>
                            )}

                            {/* Subcard 1: Qualifying Info */}
                            {fu.qualifying_info && (
                              <div className="bg-[#f8fafc]/80 border border-gray-100 rounded-2xl p-5 mb-5">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">
                                  Qualifying Information
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Site Location:</span>
                                    <span className="font-bold text-gray-800">
                                      {fu.qualifying_info.site_location || "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Cars Required:</span>
                                    <span className="font-bold text-gray-800">
                                      {fu.qualifying_info.cars_required || "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Car Type:</span>
                                    <span className="font-bold text-gray-800 capitalize">
                                      {fu.qualifying_info.car_type || "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Budget Range:</span>
                                    <span className="font-bold text-gray-800">
                                      {fu.qualifying_info.budget_range || "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Installation Timeline:</span>
                                    <span className="font-bold text-gray-800">
                                      {fu.qualifying_info.installation_timeline || "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Basement Available:</span>
                                    <span className="font-bold text-gray-800 capitalize">
                                      {fu.qualifying_info.basement_available || "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Pit Possible:</span>
                                    <span className="font-bold text-gray-800 capitalize">
                                      {fu.qualifying_info.text_challenges || fu.qualifying_info.pit_possible || "—"}
                                    </span>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Site Challenges:</span>
                                    <span className="font-bold text-gray-800">
                                      {fu.qualifying_info.site_challenges || "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Subcard 2: Requirement Details */}
                            {fu.requirement_info && (
                              <div className="bg-[#f8fafc]/80 border border-gray-100 rounded-2xl p-5">
                                <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                                  <h4 className="text-sm font-bold text-gray-900">
                                    Requirement Details
                                  </h4>
                                  <button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                                    View Suggested Solutions
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Site Dimensions:</span>
                                    <span className="font-bold text-gray-800">
                                      {fu.requirement_info.site_length 
                                        ? `${fu.requirement_info.site_length} ft × ${fu.requirement_info.site_width || '—'} ft × ${fu.requirement_info.site_height || '—'} ft`
                                        : "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Cars Required:</span>
                                    <span className="font-bold text-gray-800">
                                      {fu.qualifying_info?.cars_required || "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Preferred Type:</span>
                                    <span className="font-bold text-gray-800">
                                      {fu.requirement_info.preferred_parking_type || "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Budget:</span>
                                    <span className="font-bold text-gray-800">
                                      {fu.qualifying_info?.budget_range || "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block mb-0.5 text-xs font-medium">Automation:</span>
                                    <span className="font-bold text-gray-800">
                                      {fu.requirement_info.automation_required || "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center">
                        <p className="text-sm text-gray-400 font-semibold">No follow-ups recorded yet.</p>
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="pt-5 border-t border-gray-100 flex justify-start">
                      <button 
                        className="py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-xs"
                        onClick={() => onCreateQuotation && onCreateQuotation(lead)}
                      >
                        <AiOutlineFileText className="w-4 h-4 text-gray-500" />
                        Create Quotation
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── QUOTATIONS TAB ─────────────────────────────── */
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">Quotation History</h3>
                      <button
                        onClick={() => onCreateQuotation && onCreateQuotation(lead)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-xs font-bold shadow transition-all"
                      >
                        <FiPlus className="w-4 h-4" />
                        New Quotation
                      </button>
                    </div>

                    {/* Loading */}
                    {quotLoading && (
                      <div className="py-10 text-center text-sm text-gray-400">Loading quotations…</div>
                    )}

                    {/* Empty state */}
                    {!quotLoading && quotations.length === 0 && (
                      <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                        <AiOutlineFileText className="w-10 h-10 text-gray-300" />
                        <p className="font-bold text-gray-700 text-sm">No quotations yet</p>
                        <p className="text-xs text-gray-400">Click "New Quotation" to create one.</p>
                      </div>
                    )}

                    {/* Quotation Cards */}
                    {!quotLoading && quotations.map((q) => {
                      const latest = q.versions?.find((v) => v.is_active) || q.versions?.[0];
                      const oldVersions = (q.versions || []).filter((v) => !v.is_active).sort((a, b) => b.id - a.id);
                      const isExpanded = !!expandedQuot[q.id];

                      const latestItem = latest?.high_side_items?.[0];
                      const productName = latestItem?.product_data?.name || q.subject || "—";
                      const qty = latestItem?.quantity ?? "—";
                      const capacity = latestItem?.product_data?.car_capacity
                        ? latestItem.product_data.car_capacity * (latestItem.quantity || 1)
                        : null;
                      const grandTotalRaw = parseFloat(latest?.grand_total || 0);
                      const grandTotalL = (grandTotalRaw / 100000).toFixed(2);
                      const versionLabel = latest?.version_no?.split("-R").pop() ?? "1";
                      const quoteDate = latest?.created_at
                        ? new Date(latest.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : "—";

                      return (
                        <div key={q.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                          {/* Main row */}
                          <div className="bg-blue-50/60 px-5 py-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-sm">{productName}</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                                  V{versionLabel} (Latest)
                                </span>
                              </div>
                              <span className="text-xs text-gray-400 font-medium">Draft</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Quote #{q.quotation_no} &bull; {quoteDate}
                            </p>
                            <div className="mt-3 grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-400 font-medium">Follow-up:</p>
                                <p className="text-sm font-bold text-gray-800">{lead.followup_date || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 font-medium">Quantity:</p>
                                <p className="text-sm font-bold text-gray-800">{qty} unit(s)</p>
                              </div>
                              {capacity && (
                                <div>
                                  <p className="text-xs text-gray-400 font-medium">Capacity:</p>
                                  <p className="text-sm font-bold text-gray-800">{capacity} cars</p>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-600">Total Amount:</span>
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

                          {/* Old versions toggle */}
                          {oldVersions.length > 0 && (
                            <>
                              <button
                                className="w-full px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-500 flex items-center justify-center gap-1 border-t border-gray-200 transition"
                                onClick={() => setExpandedQuot((p) => ({ ...p, [q.id]: !p[q.id] }))}
                              >
                                {isExpanded ? "↑ Hide" : "↓ Show"} Previous Versions ({oldVersions.length})
                              </button>

                              {isExpanded && (
                                <div className="divide-y divide-gray-100 border-t border-gray-200">
                                  {oldVersions.map((v, vi) => {
                                    const vItem = v.high_side_items?.[0];
                                    const vProductName = vItem?.product_data?.name || q.subject || "—";
                                    const vQty = vItem?.quantity ?? "—";
                                    const vTotal = parseFloat(v.grand_total || 0);
                                    const vTotalL = (vTotal / 100000).toFixed(2);
                                    const vNum = v.version_no?.split("-R").pop() ?? vi + 1;
                                    const vDate = v.created_at
                                      ? new Date(v.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
                                      : "—";
                                    return (
                                      <div key={v.id} className="px-5 py-3 bg-white flex items-center gap-4 text-sm flex-wrap">
                                        <span className="text-xs font-bold text-gray-400 w-8">V{vNum}</span>
                                        <span className="font-medium text-gray-700 flex-1">{vProductName}</span>
                                        <span className="text-gray-500">Qty: {vQty}</span>
                                        <span className="text-gray-600 font-semibold">Amount: ₹{vTotalL}L</span>
                                        <span className="text-gray-400 text-xs">Date: {vDate}</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Sent</span>
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
        )}
      </div>

      {/* Dynamic Modal Form popup - OLD FORM */}
      {showFollowUpForm && (
        <AddLeadFollowUpForm
          open={showFollowUpForm}
          onClose={() => setShowFollowUpForm(false)}
          baseApi={baseApi}
          leadId={leadId}
          onSuccess={handleFollowUpSuccess}
        />
      )}
    </div>
  );
};

export default LeadDetails;