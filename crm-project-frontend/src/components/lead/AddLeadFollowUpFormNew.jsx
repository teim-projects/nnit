import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { MdClose } from "react-icons/md";
import { FiPhone, FiVideo, FiMapPin } from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io5";
import { HiOutlineMail, HiOutlineUserGroup, HiOutlineClipboardList } from "react-icons/hi";

export default function AddLeadFollowUpFormNew({
  open,
  onClose,
  onSuccess,
  baseApi,
  leadId,
  followup = null,
}) {
  const BASE_API = baseApi || import.meta.env.VITE_BASE_API_URL;

  // Form state
  const [followupDate, setFollowupDate] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [status, setStatus] = useState("in_process");
  const [remarks, setRemarks] = useState("");
  const [discussionNotes, setDiscussionNotes] = useState("");
  
  // New fields matching your image
  const [followupMode, setFollowupMode] = useState("call");
  const [conductedBy, setConductedBy] = useState("");
  const [clientResponse, setClientResponse] = useState("");
  const [followupSummary, setFollowupSummary] = useState("");
  const [commitmentByClient, setCommitmentByClient] = useState("");
  const [commitmentByUs, setCommitmentByUs] = useState("");
  
  // Qualifying Questions
  const [decisionMaker, setDecisionMaker] = useState("");
  const [budgetStatus, setBudgetStatus] = useState("");
  const [timeline, setTimeline] = useState("");
  const [competition, setCompetition] = useState("");

  const [loading, setLoading] = useState(false);
  const [leadData, setLeadData] = useState(null);

  const token = useMemo(
    () =>
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      "",
    []
  );

  // Fetch lead data
  useEffect(() => {
    if (!open || !leadId) return;

    const fetchLead = async () => {
      try {
        const res = await fetch(`${BASE_API}/lead/lead/${leadId}/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to load lead");
        const data = await res.json();
        setLeadData(data);
      } catch (err) {
        console.error("Lead fetch error:", err);
      }
    };

    fetchLead();
  }, [open, leadId, BASE_API, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!followupDate) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Follow-up date is required",
      });
      return;
    }

    if (!followupMode) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Please select follow-up mode",
      });
      return;
    }

    if (!clientResponse) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Please select client response",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        lead: leadId,
        followup_date: followupDate,
        next_followup_date: nextFollowupDate || null,
        status,
        remarks: remarks.trim(),
        discussion_notes: followupSummary.trim(),
        followup_mode: followupMode,
        conducted_by: conductedBy,
        client_response: clientResponse,
        commitment_by_client: commitmentByClient.trim(),
        commitment_by_us: commitmentByUs.trim(),
        qualifying_info: {
          decision_maker: decisionMaker,
          budget_status: budgetStatus,
          timeline: timeline,
          competition: competition,
        },
      };

      const url = `${BASE_API}/lead/lead-followups/`;
      const method = "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Failed to save");
      }

      Swal.fire({
        icon: "success",
        text: "Follow-up added successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to save follow-up",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Add Follow-up — {leadData?.customer_name || ""}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Follow-up Mode & Conducted By */}
            <div className="grid grid-cols-2 gap-6">
              {/* Follow-up Mode */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Follow-up Mode <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFollowupMode("call")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      followupMode === "call"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FiPhone className="w-4 h-4" />
                    Call
                  </button>

                  <button
                    type="button"
                    onClick={() => setFollowupMode("whatsapp")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      followupMode === "whatsapp"
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <IoLogoWhatsapp className="w-4 h-4" />
                    WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => setFollowupMode("email")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      followupMode === "email"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <HiOutlineMail className="w-4 h-4" />
                    Email
                  </button>

                  <button
                    type="button"
                    onClick={() => setFollowupMode("video_call")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      followupMode === "video_call"
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FiVideo className="w-4 h-4" />
                    Video Call
                  </button>

                  <button
                    type="button"
                    onClick={() => setFollowupMode("in_person")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      followupMode === "in_person"
                        ? "bg-orange-600 text-white shadow-md"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <HiOutlineUserGroup className="w-4 h-4" />
                    In-Person
                  </button>

                  <button
                    type="button"
                    onClick={() => setFollowupMode("demo")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      followupMode === "demo"
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <HiOutlineClipboardList className="w-4 h-4" />
                    Demo
                  </button>

                  <button
                    type="button"
                    onClick={() => setFollowupMode("site_visit")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all col-span-2 ${
                      followupMode === "site_visit"
                        ? "bg-teal-600 text-white shadow-md"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FiMapPin className="w-4 h-4" />
                    Site Visit
                  </button>
                </div>
              </div>

              {/* Conducted By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Conducted By <span className="text-red-500">*</span>
                </label>
                <select
                  value={conductedBy}
                  onChange={(e) => setConductedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Team Member</option>
                  <option value="rajesh">Rajesh Kumar</option>
                  <option value="rahul">Rahul Mehta</option>
                  <option value="priya">Priya Sharma</option>
                </select>
              </div>
            </div>

            {/* STAGE & RESPONSE - Current Stage & Move to Stage removed */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-blue-700 mb-4 uppercase">
                Response
              </h3>

              {/* Client Response only */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Client Response <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "very_positive", label: "Very Positive", color: "green" },
                    { value: "positive", label: "Positive", color: "green" },
                    { value: "neutral", label: "Neutral", color: "gray" },
                    { value: "negative", label: "Negative", color: "red" },
                    { value: "no_response", label: "No Response", color: "gray" },
                    { value: "call_back_later", label: "Call Back Later", color: "blue" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setClientResponse(item.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        clientResponse === item.value
                          ? `bg-${item.color}-600 text-white shadow-md`
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DISCUSSION NOTES */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-blue-700 mb-4 uppercase">
                Discussion Notes
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Follow-up Summary / Key Discussion Points <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={followupSummary}
                  onChange={(e) => setFollowupSummary(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="What was discussed? Key pain points shared, objections raised, decisions taken..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commitment by Client
                  </label>
                  <textarea
                    value={commitmentByClient}
                    onChange={(e) => setCommitmentByClient(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="e.g., Will share PO by Friday, Arranging technical team..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commitment by Us
                  </label>
                  <textarea
                    value={commitmentByUs}
                    onChange={(e) => setCommitmentByUs(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="e.g., Sending revised proposal, Escalating discount request..."
                  />
                </div>
              </div>
            </div>

            {/* QUALIFYING QUESTIONS */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-blue-700 mb-4 uppercase">
                Qualifying Questions
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision Maker Contacted?
                  </label>
                  <select
                    value={decisionMaker}
                    onChange={(e) => setDecisionMaker(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  >
                    <option value="">— Select —</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Status
                  </label>
                  <select
                    value={budgetStatus}
                    onChange={(e) => setBudgetStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  >
                    <option value="">— Select —</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="not_defined">Not Defined</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeline / Urgency
                  </label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="e.g., 3 months"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Competition (Other Vendors Evaluated)
                  </label>
                  <input
                    type="text"
                    value={competition}
                    onChange={(e) => setCompetition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="e.g., Vendor A, Vendor B"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Add Follow-up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}