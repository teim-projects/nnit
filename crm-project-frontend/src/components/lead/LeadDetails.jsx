import { useEffect, useState } from "react";
import { MdClose, MdPhone, MdEmail, MdLocationOn } from "react-icons/md";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import { HiCheckCircle } from "react-icons/hi";
import { AiOutlineFileText } from "react-icons/ai";
import axios from "axios";
import AddLeadFollowUpForm from "./AddLeadFollowUpForm";

// Helper to generate dynamic ordinal labels (1st, 2nd, 3rd...)
const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const LeadDetails = ({ open, onClose, leadId, baseApi, token }) => {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("followups"); 
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:p-6 lg:p-8 backdrop-blur-sm">
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
                  <span className="inline-block mt-2 px-3 py-1 text-xs font-bold bg-[#DEF7EC] text-[#03543F] rounded-full uppercase tracking-wider">
                    {lead.status?.replace('_', ' ') || "QUALIFIED"}
                  </span>
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
                  className="w-full py-3 bg-[#00ac4f] hover:bg-[#009643] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-green-100 transition-all text-sm"
                  onClick={() => console.log("Convert to Customer action triggered")}
                >
                  <HiCheckCircle className="w-5 h-5" />
                  Convert to Customer
                </button>
                <button 
                  className="w-full py-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
                  onClick={() => setShowFollowUpForm(true)}
                >
                  <FiPlus className="w-5 h-5 text-gray-500" />
                  Add Follow-up
                </button>
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
                  Quotations ({lead.quotations_count || 0})
                </button>
              </div>

              {/* Tab Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-1">
                {activeTab === "followups" ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900">Follow-up History & Timeline</h3>

                    {lead.followups && lead.followups.length > 0 ? (
                      <div className="relative pl-6 border-l-2 border-[#1c64f2]/15 space-y-8">
                        {lead.followups.map((fu, idx) => (
                          <div key={fu.id || idx} className="relative">
                            
                            {/* Blue Timeline Node */}
                            <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#1c64f2] border-4 border-white shadow-sm ring-2 ring-[#1c64f2]/15"></span>
                            
                            {/* Timeline Node Header */}
                            <div className="flex items-center gap-3 flex-wrap mb-3">
                              <span className="px-3 py-1 bg-[#1c64f2] text-white rounded-lg text-xs font-bold">
                                {getOrdinal(idx + 1)} Follow-up
                              </span>
                              <span className="text-gray-500 font-bold text-sm">
                                {fu.followup_date || "—"}
                              </span>
                              {fu.followup_time && (
                                <span className="text-gray-400 text-xs font-semibold">
                                  {fu.followup_time}
                                </span>
                              )}
                              <span className="ml-auto px-2.5 py-0.5 text-xs font-bold bg-[#DEF7EC] text-[#03543F] rounded-full uppercase">
                                {fu.status?.replace('_', ' ') || "OPEN"}
                              </span>
                            </div>

                            {/* Remarks */}
                            <p className="text-sm text-gray-500 mb-5 font-medium leading-relaxed">
                              {fu.remarks || fu.discussion_notes || "No discussion notes recorded."}
                            </p>

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
                        onClick={() => console.log("Create Quotation action triggered")}
                      >
                        <AiOutlineFileText className="w-4 h-4 text-gray-500" />
                        Create Quotation
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-bold text-gray-800 text-sm">No quotations yet</p>
                    <p className="text-xs text-gray-400 mt-1">Create a quotation to generate calculations.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>

      {/* Dynamic Modal Form popup */}
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