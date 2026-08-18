import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { MdClose } from "react-icons/md";
import { FiPhone, FiVideo, FiMapPin, FiCamera, FiTrash2 } from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io5";
import { HiOutlineMail, HiOutlineUserGroup, HiOutlineClipboardList } from "react-icons/hi";

// ----------------------------------------------------------------------
// History Modal - SIMPLE WHITE WITH SOFT COLORS
// ----------------------------------------------------------------------
const FollowupHistoryModal = ({ open, onClose, lead }) => {
  if (!open || !lead) return null;

  // Sort followups by date (latest first)
  const sortedFollowups = [...(lead.followups || [])].sort((a, b) => {
    const dateA = new Date(a.followup_date);
    const dateB = new Date(b.followup_date);
    return dateB - dateA;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[10000]">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header - Simple White */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Followup History</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
          {sortedFollowups.length > 0 ? (
            <div className="space-y-4">
              {sortedFollowups.map((fu, idx) => {
                const interactionLabel = 
                  fu.interaction_type === 'call' ? 'Call' :
                  fu.interaction_type === 'email' ? 'Email' :
                  fu.interaction_type === 'whatsapp' ? 'Whatsapp' :
                  fu.interaction_type === 'video_call' ? 'Video Call' :
                  fu.interaction_type === 'in_person' ? 'In-Person' :
                  fu.interaction_type === 'demo' ? 'Demo' :
                  fu.interaction_type === 'site_visit' ? 'Site Visit' : 'Call';

                const hasQualifying = fu.qualifying_info && (
                  fu.qualifying_info.site_location || 
                  fu.qualifying_info.cars_required || 
                  fu.qualifying_info.car_type || 
                  fu.qualifying_info.budget_range ||
                  fu.qualifying_info.installation_timeline ||
                  fu.qualifying_info.basement_available ||
                  fu.qualifying_info.pit_possible ||
                  fu.qualifying_info.site_challenges
                );

                const hasRequirement = fu.requirement_info && (
                  fu.requirement_info.site_length || 
                  fu.requirement_info.site_width || 
                  fu.requirement_info.site_height ||
                  fu.requirement_info.preferred_parking_type ||
                  fu.requirement_info.automation_required
                );

                return (
                  <div key={fu.id || idx} className="bg-white border-2 border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 text-xl">{fu.followup_date || '—'}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600 font-medium">{interactionLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {fu.client_response && (
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              fu.client_response === 'very_positive' ? 'bg-green-100 text-green-700' :
                              fu.client_response === 'positive' ? 'bg-green-100 text-green-700' :
                              fu.client_response === 'negative' ? 'bg-red-100 text-red-700' :
                              fu.client_response === 'call_back_later' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-200 text-gray-700'
                            }`}>
                              {fu.client_response === 'very_positive' ? 'Very Positive' :
                               fu.client_response === 'positive' ? 'Positive' :
                               fu.client_response === 'negative' ? 'Negative' :
                               fu.client_response === 'no_response' ? 'No Response' :
                               fu.client_response === 'call_back_later' ? 'Call Back Later' : 'Neutral'}
                            </span>
                          )}
                          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-600 text-white">
                            {fu.followup_status === 'completed' ? 'Completed' :
                             fu.followup_status === 'pending' ? 'Pending' : 'Completed'}
                          </span>
                        </div>
                      </div>
                      
                      {(fu.created_by_full_name || fu.conducted_by || fu.contacted_person) && (
                        <p className="text-sm text-gray-500 mb-3">
                          {(fu.created_by_full_name || fu.conducted_by) && (
                            <span>By <strong className="text-gray-700">{fu.created_by_full_name || fu.conducted_by}</strong></span>
                          )}
                          {(fu.created_by_full_name || fu.conducted_by) && fu.contacted_person && <span> · Contact </span>}
                          {fu.contacted_person && <strong className="text-gray-700">{fu.contacted_person}</strong>}
                        </p>
                      )}

                      {fu.faq_answers && fu.faq_answers.length > 0 && fu.faq_answers[0].answer && (
                        <p className="text-sm text-blue-600 font-semibold mb-3">F001</p>
                      )}

                      {fu.site_name && (
                        <p className="text-sm text-indigo-700 font-semibold mb-2">
                          📍 Site: {fu.site_name}
                        </p>
                      )}

                      {fu.site_photo && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">📷 Site Photo:</p>
                          <a href={fu.site_photo} target="_blank" rel="noopener noreferrer">
                            <img src={fu.site_photo} alt="Site Photo" className="h-28 w-auto rounded-lg border border-gray-300 shadow-sm hover:opacity-90 transition object-cover" />
                          </a>
                        </div>
                      )}

                      {/* Discussion & Questions */}
                      {(fu.remarks || fu.discussion_notes || fu.followup_summary) && (
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                          {fu.remarks || fu.discussion_notes || fu.followup_summary}
                        </p>
                      )}

                      {fu.followup_question && (
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mb-4">
                          <h5 className="text-xs font-bold text-amber-700 uppercase mb-1">FOLLOW-UP QUESTION / INQUIRY</h5>
                          <p className="text-sm text-gray-800">{fu.followup_question}</p>
                        </div>
                      )}

                      {/* Commitments */}
                      {(fu.client_commitment || fu.our_commitment) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {fu.client_commitment && (
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                              <h5 className="text-xs font-bold text-green-700 uppercase mb-2">CLIENT COMMITMENT</h5>
                              <p className="text-sm text-gray-800">{fu.client_commitment}</p>
                            </div>
                          )}
                          {fu.our_commitment && (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <h5 className="text-xs font-bold text-blue-700 uppercase mb-2">OUR COMMITMENT</h5>
                              <p className="text-sm text-gray-800">{fu.our_commitment}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stage Progression */}
                      {(fu.previous_stage || fu.current_stage) && (
                        <div className="flex items-center gap-3 mb-4 text-sm">
                          <span className="text-gray-500">Stage:</span>
                          {fu.previous_stage && (
                            <>
                              <span className="text-gray-600 font-medium">{fu.previous_stage}</span>
                              <span className="text-gray-400">→</span>
                            </>
                          )}
                          {fu.current_stage && (
                            <span className="text-blue-600 font-bold">{fu.current_stage}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Qualifying Info */}
                    {hasQualifying && (
                      <div className="mx-6 mb-4 bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <h5 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">Q</span>
                          Qualifying Information
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                          {fu.qualifying_info.site_location && (
                            <div>
                              <span className="text-purple-600 text-xs font-semibold block mb-1">Site Location</span>
                              <span className="text-gray-900 font-medium">{fu.qualifying_info.site_location}</span>
                            </div>
                          )}
                          {fu.qualifying_info.cars_required && (
                            <div>
                              <span className="text-purple-600 text-xs font-semibold block mb-1">Cars Required</span>
                              <span className="text-gray-900 font-medium">{fu.qualifying_info.cars_required}</span>
                            </div>
                          )}
                          {fu.qualifying_info.car_type && (
                            <div>
                              <span className="text-purple-600 text-xs font-semibold block mb-1">Car Type</span>
                              <span className="text-gray-900 font-medium capitalize">{fu.qualifying_info.car_type}</span>
                            </div>
                          )}
                          {fu.qualifying_info.budget_range && (
                            <div>
                              <span className="text-purple-600 text-xs font-semibold block mb-1">Budget Range</span>
                              <span className="text-gray-900 font-medium">{fu.qualifying_info.budget_range}</span>
                            </div>
                          )}
                          {fu.qualifying_info.installation_timeline && (
                            <div>
                              <span className="text-purple-600 text-xs font-semibold block mb-1">Timeline</span>
                              <span className="text-gray-900 font-medium">{fu.qualifying_info.installation_timeline}</span>
                            </div>
                          )}
                          {fu.qualifying_info.basement_available && (
                            <div>
                              <span className="text-purple-600 text-xs font-semibold block mb-1">Basement</span>
                              <span className="text-gray-900 font-medium capitalize">{fu.qualifying_info.basement_available}</span>
                            </div>
                          )}
                          {fu.qualifying_info.pit_possible && (
                            <div>
                              <span className="text-purple-600 text-xs font-semibold block mb-1">Pit Possible</span>
                              <span className="text-gray-900 font-medium capitalize">{fu.qualifying_info.pit_possible}</span>
                            </div>
                          )}
                          {fu.qualifying_info.site_challenges && (
                            <div className="col-span-2 md:col-span-3">
                              <span className="text-purple-600 text-xs font-semibold block mb-1">Site Challenges</span>
                              <span className="text-gray-900 font-medium">{fu.qualifying_info.site_challenges}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Requirement Info */}
                    {hasRequirement && (
                      <div className="mx-6 mb-4 bg-orange-50 rounded-xl p-4 border border-orange-200">
                        <h5 className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">R</span>
                          Requirement Details
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                          {fu.requirement_info.site_length && (
                            <div>
                              <span className="text-orange-600 text-xs font-semibold block mb-1">Dimensions</span>
                              <span className="text-gray-900 font-medium">
                                {fu.requirement_info.site_length} × {fu.requirement_info.site_width || '—'} × {fu.requirement_info.site_height || '—'} ft
                              </span>
                            </div>
                          )}
                          {fu.requirement_info.preferred_parking_type && (
                            <div>
                              <span className="text-orange-600 text-xs font-semibold block mb-1">Parking Type</span>
                              <span className="text-gray-900 font-medium">{fu.requirement_info.preferred_parking_type}</span>
                            </div>
                          )}
                          {fu.requirement_info.automation_required && (
                            <div>
                              <span className="text-orange-600 text-xs font-semibold block mb-1">Automation</span>
                              <span className="text-gray-900 font-medium">{fu.requirement_info.automation_required}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Next Follow-up */}
                    {fu.next_followup_date && (
                      <div className="px-6 pb-4 flex items-center justify-between text-sm border-t border-gray-100 pt-3">
                        <span className="text-gray-500">Next Follow-up:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{fu.next_followup_date}</span>
                          <span className="text-gray-400 text-xs">via {interactionLabel.toLowerCase()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-400 font-semibold">No follow-ups recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Component – FIXED AND IMPROVED
// ----------------------------------------------------------------------
export default function AddLeadFollowUpFormNew({
  open,
  onClose,
  onSuccess,
  baseApi,
  leadId,
  followup = null,
}) {
  const BASE_API = baseApi || import.meta.env.VITE_BASE_API_URL;

  // ---------- State (all fields) ----------
  const [followupDate, setFollowupDate] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [status, setStatus] = useState("open");
  const [remarks, setRemarks] = useState("");
  const [discussionNotes, setDiscussionNotes] = useState("");

  // Follow-up mode & details
  const [siteName, setSiteName] = useState("");
  const [sitePhoto, setSitePhoto] = useState(null);
  const [sitePhotoPreview, setSitePhotoPreview] = useState(null);
  const [followupQuestion, setFollowupQuestion] = useState("");
  const [followupMode, setFollowupMode] = useState("call");
  const [followupStatus, setFollowupStatus] = useState("completed");
  const [conductedBy, setConductedBy] = useState("");
  const [clientResponse, setClientResponse] = useState("");
  const [followupSummary, setFollowupSummary] = useState("");
  const [commitmentByClient, setCommitmentByClient] = useState("");
  const [commitmentByUs, setCommitmentByUs] = useState("");

  // Qualifying – general
  const [decisionMaker, setDecisionMaker] = useState("");
  const [budgetStatus, setBudgetStatus] = useState("");
  const [timeline, setTimeline] = useState("");
  const [competition, setCompetition] = useState("");

  // Qualifying – site
  const [siteLocation, setSiteLocation] = useState("");
  const [carsRequired, setCarsRequired] = useState("");
  const [carType, setCarType] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [basementAvailable, setBasementAvailable] = useState("");
  const [pitPossible, setPitPossible] = useState("");
  const [installationTimeline, setInstallationTimeline] = useState("");
  const [siteChallenges, setSiteChallenges] = useState("");

  // Requirement (optional)
  const [showRequirement, setShowRequirement] = useState(false);
  const [siteLength, setSiteLength] = useState("");
  const [siteWidth, setSiteWidth] = useState("");
  const [siteHeight, setSiteHeight] = useState("");
  const [preferredParkingType, setPreferredParkingType] = useState("");
  const [automationRequired, setAutomationRequired] = useState("");

  // Suggested Products
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  // FAQ
  const [faqList, setFaqList] = useState([]);
  const [faqAnswers, setFaqAnswers] = useState({});
  const [faqLoading, setFaqLoading] = useState(false);

  // Products list
  const [productsList, setProductsList] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Users list for "Conducted By"
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // History modal toggle
  const [showHistory, setShowHistory] = useState(false);

  const [loading, setLoading] = useState(false);
  const [leadData, setLeadData] = useState(null);

  const token = useMemo(
    () =>
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      "",
    []
  );

  // ---------- Effects ----------
  // Fetch lead
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
        setLeadData(null);
      }
    };
    fetchLead();
  }, [open, leadId, BASE_API, token]);

  // Fetch FAQs
  useEffect(() => {
    if (!open) return;
    const fetchFaqs = async () => {
      setFaqLoading(true);
      try {
        const res = await fetch(`${BASE_API}/lead/lead-faqs/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          console.error("Failed to load FAQs");
          return;
        }
        const data = await res.json();
        const items = Array.isArray(data?.results) ? data.results : data;
        setFaqList(items || []);
        setFaqAnswers((prev) => {
          const next = { ...prev };
          (items || []).forEach((faq) => {
            if (next[faq.id] === undefined) next[faq.id] = "";
          });
          return next;
        });
      } catch (err) {
        console.error("FAQ fetch error", err);
      } finally {
        setFaqLoading(false);
      }
    };
    fetchFaqs();
  }, [open, BASE_API, token]);

  // Fetch parking products
  useEffect(() => {
    if (!open) return;
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await fetch(`${BASE_API}/parking/products/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          console.error("Failed to load parking products");
          return;
        }
        const data = await res.json();
        const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        setProductsList(items || []);
      } catch (err) {
        console.error("Parking products fetch error", err);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [open, BASE_API, token]);

  // Fetch users for "Conducted By"
  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await fetch(`${BASE_API}/users/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          console.error("Failed to load users");
          // Fallback to static list
          setUsersList([
            { id: "rajesh", name: "Rajesh Kumar" },
            { id: "rahul", name: "Rahul Mehta" },
            { id: "priya", name: "Priya Sharma" },
          ]);
          return;
        }
        const data = await res.json();
        // Assumes API returns an array of objects with 'id' and 'name' or 'full_name'
        const items = Array.isArray(data) ? data : data?.results || [];
        setUsersList(items);
      } catch (err) {
        console.error("Users fetch error", err);
        // Fallback
        setUsersList([
          { id: "rajesh", name: "Rajesh Kumar" },
          { id: "rahul", name: "Rahul Mehta" },
          { id: "priya", name: "Priya Sharma" },
        ]);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [open, BASE_API, token]);

  // Pre-fill when editing (followup is provided)
  useEffect(() => {
    if (followup) {
      // Basic fields
      setFollowupDate(followup.followup_date ?? "");
      setNextFollowupDate(followup.next_followup_date ?? "");
      setStatus(followup.status ?? "open");
      setRemarks(followup.remarks ?? "");
      setDiscussionNotes(followup.discussion_notes ?? "");

      // Followup mode, site, questions, conducted by, etc.
      setSiteName(followup.site_name ?? "");
      setSitePhotoPreview(followup.site_photo ?? null);
      setFollowupQuestion(followup.followup_question ?? "");
      setFollowupMode(followup.interaction_type ?? "call");  // Changed from followup_mode
      setFollowupStatus(followup.followup_status ?? "completed");  // Added
      setConductedBy(followup.conducted_by ?? "");
      setClientResponse(followup.client_response ?? "");
      setFollowupSummary(followup.followup_summary ?? "");
      setCommitmentByClient(followup.client_commitment ?? "");  // Changed from commitment_by_client
      setCommitmentByUs(followup.our_commitment ?? "");  // Changed from commitment_by_us

      // Qualifying – general
      const q = followup.qualifying_info || {};
      setDecisionMaker(q.decision_maker ?? "");
      setBudgetStatus(q.budget_status ?? "");
      setTimeline(q.timeline ?? "");
      setCompetition(q.competition ?? "");

      // Qualifying – site
      setSiteLocation(q.site_location ?? "");
      setCarsRequired(q.cars_required ?? "");
      setCarType(q.car_type ?? "");
      setBudgetRange(q.budget_range ?? "");
      setBasementAvailable(q.basement_available ?? "");
      setPitPossible(q.pit_possible ?? "");
      setInstallationTimeline(q.installation_timeline ?? "");
      setSiteChallenges(q.site_challenges ?? "");

      // Requirement info
      const r = followup.requirement_info || {};
      const hasReq = r.site_length || r.site_width || r.site_height || r.preferred_parking_type || r.automation_required;
      setShowRequirement(!!hasReq);
      setSiteLength(r.site_length ?? "");
      setSiteWidth(r.site_width ?? "");
      setSiteHeight(r.site_height ?? "");
      setPreferredParkingType(r.preferred_parking_type ?? "");
      setAutomationRequired(r.automation_required ?? "");

      // Suggested solutions
      if (followup.suggested_solution && Array.isArray(followup.suggested_solution)) {
        setSuggestedProducts(followup.suggested_solution);
      } else {
        setSuggestedProducts([]);
      }

      // FAQ answers
      if (followup.faq_answers?.length) {
        const initial = {};
        followup.faq_answers.forEach((item) => {
          initial[item.faq] = item.answer || "";
        });
        setFaqAnswers(initial);
      } else {
        setFaqAnswers({});
      }
    } else {
      // Reset all fields when not editing (optional)
      // But we want to keep default values for mode, status, etc.
      setFollowupDate("");
      setNextFollowupDate("");
      setStatus("open");
      setRemarks("");
      setDiscussionNotes("");
      setFollowupMode("call");
      setFollowupStatus("completed");
      setConductedBy("");
      setClientResponse("");
      setFollowupSummary("");
      setCommitmentByClient("");
      setCommitmentByUs("");
      setDecisionMaker("");
      setBudgetStatus("");
      setTimeline("");
      setCompetition("");
      setSiteLocation("");
      setCarsRequired("");
      setCarType("");
      setBudgetRange("");
      setBasementAvailable("");
      setPitPossible("");
      setInstallationTimeline("");
      setSiteChallenges("");
      setShowRequirement(false);
      setSiteLength("");
      setSiteWidth("");
      setSiteHeight("");
      setPreferredParkingType("");
      setAutomationRequired("");
      setSuggestedProducts([]);
      setFaqAnswers({});
    }
  }, [followup]);

  // ---------- Handlers ----------
  const handleAddProduct = () => {
    setSuggestedProducts([
      ...suggestedProducts,
      {
        product_id: "",
        product_name: "",
        category: "",
        capacity: null,
        reason: "",
      },
    ]);
  };

  const handleRemoveProduct = (index) => {
    setSuggestedProducts(suggestedProducts.filter((_, i) => i !== index));
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...suggestedProducts];
    updated[index][field] = value;

    if (field === "product_id" && value) {
      const selectedProduct = productsList.find((p) => p.id === Number(value));
      if (selectedProduct) {
        updated[index].product_name = selectedProduct.product_name || "";
        updated[index].category = selectedProduct.category_name || "";
        updated[index].capacity = selectedProduct.car_capacity || null;
      }
    }

    setSuggestedProducts(updated);
  };

  // Enhanced validation with inline error tracking
  const [validationErrors, setValidationErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!leadId && !followup) {
      errors.lead = "Lead is required to create follow-up.";
    }
    if (!followupDate) {
      errors.followupDate = "Follow-up date is required.";
    }
    if (!status) {
      errors.status = "Status is required.";
    }
    if (!followupMode) {
      errors.followupMode = "Please select a follow-up mode.";
    }
    if (!clientResponse) {
      errors.clientResponse = "Please select a client response.";
    }
    // Optionally validate conductedBy, but not required
    // Optionally validate followupSummary (we marked as required? we can add if needed)

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Show first error in Swal for visibility
      const firstError = Object.values(errors)[0];
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: firstError,
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Build FAQ payload
      const faqPayload = Object.entries(faqAnswers)
        .filter(([, ans]) => ans && ans.toString().trim() !== "")
        .map(([faqId, ans]) => ({
          faq: Number(faqId),
          answer: ans.toString().trim(),
        }));

      // Suggested solutions payload
      const suggestedSolutionPayload = suggestedProducts
        .filter((p) => p.product_id)
        .map((p) => ({
          product_id: Number(p.product_id),
          product_name: p.product_name,
          category: p.category,
          capacity: p.capacity,
          reason: p.reason?.trim() || "",
        }));

      const payload = {
        lead: leadId,
        site_name: siteName.trim(),
        followup_question: followupQuestion.trim(),
        followup_date: followupDate,
        next_followup_date: nextFollowupDate || null,
        status,
        remarks: remarks.trim(),
        discussion_notes: discussionNotes.trim(),
        interaction_type: followupMode,  // Changed from followup_mode to interaction_type
        conducted_by: conductedBy,
        client_response: clientResponse,
        followup_status: followupStatus || 'completed',  // Added followup_status
        followup_summary: followupSummary.trim(),
        client_commitment: commitmentByClient.trim(),
        our_commitment: commitmentByUs.trim(),
        qualifying_info: {
          // general
          decision_maker: decisionMaker,
          budget_status: budgetStatus,
          timeline: timeline,
          competition: competition,
          // site
          site_location: siteLocation.trim(),
          cars_required: carsRequired.trim(),
          car_type: carType,
          budget_range: budgetRange.trim(),
          basement_available: basementAvailable,
          pit_possible: pitPossible,
          installation_timeline: installationTimeline.trim(),
          site_challenges: siteChallenges.trim(),
        },
      };

      // Add requirement if any field filled
      if (
        siteLength ||
        siteWidth ||
        siteHeight ||
        preferredParkingType ||
        automationRequired
      ) {
        payload.requirement_info = {
          site_length: siteLength.trim(),
          site_width: siteWidth.trim(),
          site_height: siteHeight.trim(),
          preferred_parking_type: preferredParkingType,
          automation_required: automationRequired,
        };
      }

      if (faqPayload.length) payload.faq_answers = faqPayload;
      if (suggestedSolutionPayload.length > 0)
        payload.suggested_solution = suggestedSolutionPayload;

      const url = followup
        ? `${BASE_API}/lead/lead-followups/${followup.id}/`
        : `${BASE_API}/lead/lead-followups/`;
      const method = followup ? "PATCH" : "POST";

      let body;
      let headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (sitePhoto instanceof File) {
        const formData = new FormData();
        Object.keys(payload).forEach((k) => {
          if (typeof payload[k] === "object" && payload[k] !== null) {
            formData.append(k, JSON.stringify(payload[k]));
          } else if (payload[k] !== null && payload[k] !== undefined) {
            formData.append(k, payload[k]);
          }
        });
        formData.append("site_photo", sitePhoto);
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(payload);
      }

      const res = await fetch(url, {
        method,
        headers,
        body,
      });

      let data;
      try {
        data = await res.json();
      } catch (_) {
        data = {};
      }

      if (!res.ok) {
        const msg = data?.detail || JSON.stringify(data) || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      Swal.fire({
        icon: "success",
        text: followup ? "Follow-up updated successfully" : "Follow-up added successfully",
        timer: 1200,
        showConfirmButton: false,
      });

      onSuccess && onSuccess(data);
      onClose && onClose();
    } catch (err) {
      console.error("Submit error:", err);
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

  // ---------- Render ----------
  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          {/* Header */}
          <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {followup ? "Edit Follow-up" : "Add Follow-up"} — {leadData?.customer_name || ""}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(true)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                📜 History
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Follow-up Mode & Conducted By */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Follow-up Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "call", label: "Call", icon: <FiPhone /> },
                      { value: "whatsapp", label: "WhatsApp", icon: <IoLogoWhatsapp /> },
                      { value: "email", label: "Email", icon: <HiOutlineMail /> },
                      { value: "video_call", label: "Video Call", icon: <FiVideo /> },
                      { value: "in_person", label: "In-Person", icon: <HiOutlineUserGroup /> },
                      { value: "demo", label: "Demo", icon: <HiOutlineClipboardList /> },
                      { value: "site_visit", label: "Site Visit", icon: <FiMapPin /> },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setFollowupMode(item.value)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          followupMode === item.value
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        } ${item.value === "site_visit" ? "col-span-2" : ""}`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {validationErrors.followupMode && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.followupMode}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter site name / project location"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Site Photo (optional)
                    </label>
                    {sitePhotoPreview ? (
                      <div className="flex items-center justify-between w-full px-3 h-[42px] bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={sitePhotoPreview}
                            alt="Site Preview"
                            className="h-7 w-7 object-cover rounded border border-slate-300 shadow-sm shrink-0"
                          />
                          <span className="text-xs font-medium text-slate-700 truncate whitespace-nowrap">
                            {sitePhoto?.name || "Photo Attached"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSitePhoto(null); setSitePhotoPreview(null); }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition shrink-0 ml-2"
                          title="Remove Photo"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-between w-full px-3 h-[42px] border border-dashed border-gray-300 rounded-lg cursor-pointer bg-slate-50/60 hover:bg-orange-50/50 hover:border-orange-400 transition group overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0 text-slate-600 group-hover:text-orange-600">
                          <FiCamera className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition shrink-0" />
                          <span className="text-xs font-medium truncate whitespace-nowrap">Upload Site Photo</span>
                        </div>
                        <span className="text-[11px] font-semibold text-orange-600 bg-orange-100 px-2.5 py-1 rounded-md group-hover:bg-orange-600 group-hover:text-white transition shrink-0 ml-2">
                          Browse
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setSitePhoto(file);
                              setSitePhotoPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Dates & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Follow-up Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      validationErrors.followupDate ? "border-red-500" : "border-gray-300"
                    }`}
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                  />
                  {validationErrors.followupDate && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.followupDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Next Follow-up Date (optional)
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={nextFollowupDate}
                    onChange={(e) => setNextFollowupDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    validationErrors.status ? "border-red-500" : "border-gray-300"
                  }`}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="close_win">Close Win</option>
                  <option value="close_loss">Close Loss</option>
                </select>
                {validationErrors.status && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.status}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Remarks (Brief)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Brief summary..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Discussion Notes (Detailed)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows={4}
                  value={discussionNotes}
                  onChange={(e) => setDiscussionNotes(e.target.value)}
                  placeholder="Enter detailed conversation notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Follow-up Question / Inquiry
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  rows={3}
                  value={followupQuestion}
                  onChange={(e) => setFollowupQuestion(e.target.value)}
                  placeholder="Enter questions, requirements, or inquiries raised during follow-up..."
                />
              </div>

              {/* 3. Client Response */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-blue-700 mb-4 uppercase">Response</h3>
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
                  {validationErrors.clientResponse && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.clientResponse}</p>
                  )}
                </div>
              </div>

              {/* 4. Discussion Notes & Commitments */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-blue-700 mb-4 uppercase">Discussion Notes</h3>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Follow-up Summary / Key Discussion Points
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
                      placeholder="e.g., Will share PO by Friday..."
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
                      placeholder="e.g., Sending revised proposal..."
                    />
                  </div>
                </div>
              </div>

              

              {/* 6. Qualifying Questions – Site */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-blue-700 mb-4 uppercase">
                  Qualifying Questions – Site Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Location
                    </label>
                    <input
                      type="text"
                      value={siteLocation}
                      onChange={(e) => setSiteLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                      placeholder="e.g., Andheri West, Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Cars Required
                    </label>
                    <input
                      type="text"
                      value={carsRequired}
                      onChange={(e) => setCarsRequired(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                      placeholder="e.g., 20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Car Type
                    </label>
                    <select
                      value={carType}
                      onChange={(e) => setCarType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Range
                    </label>
                    <input
                      type="text"
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                      placeholder="e.g., ₹30-40 Lakhs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Basement Available
                    </label>
                    <select
                      value={basementAvailable}
                      onChange={(e) => setBasementAvailable(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pit Possible
                    </label>
                    <select
                      value={pitPossible}
                      onChange={(e) => setPitPossible(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Installation Timeline
                    </label>
                    <input
                      type="text"
                      value={installationTimeline}
                      onChange={(e) => setInstallationTimeline(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                      placeholder="e.g., 3 months"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Challenges
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                      rows={2}
                      value={siteChallenges}
                      onChange={(e) => setSiteChallenges(e.target.value)}
                      placeholder="Any specific challenges at the site?"
                    />
                  </div>
                </div>
              </div>

              {/* 7. Suggested Solutions */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">Suggested Solutions</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Recommend parking products to the customer
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1"
                  >
                    <span className="text-lg leading-none">+</span> Add Product
                  </button>
                </div>

                <div className="space-y-3">
                  {suggestedProducts.map((product, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-sm text-gray-900">Product {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MdClose className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product <span className="text-red-500">*</span>
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            value={product.product_id}
                            onChange={(e) =>
                              handleProductChange(index, "product_id", e.target.value)
                            }
                          >
                            <option value="">Select Product</option>
                            {productsList.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.product_name || p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm"
                            value={product.category || ""}
                            disabled
                            placeholder="Auto-filled"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason for Suggestion
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                          rows={2}
                          value={product.reason || ""}
                          onChange={(e) =>
                            handleProductChange(index, "reason", e.target.value)
                          }
                          placeholder="Why is this product recommended?"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {suggestedProducts.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-500">No products suggested yet</p>
                    <p className="text-xs text-gray-400">Click "Add Product" to recommend a solution</p>
                  </div>
                )}
              </div>

              {/* 8. Requirement (optional) */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">
                      Add Requirement (Optional)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Detailed site measurements and preferences
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRequirement(!showRequirement)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {showRequirement ? "🔼 Hide" : "🔽 Show"}
                  </button>
                </div>

                {showRequirement && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Site Length (feet)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                          value={siteLength}
                          onChange={(e) => setSiteLength(e.target.value)}
                          placeholder="e.g., 50"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Site Width (feet)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                          value={siteWidth}
                          onChange={(e) => setSiteWidth(e.target.value)}
                          placeholder="e.g., 40"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Site Height (feet)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                          value={siteHeight}
                          onChange={(e) => setSiteHeight(e.target.value)}
                          placeholder="e.g., 30"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Parking Type
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                          value={preferredParkingType}
                          onChange={(e) => setPreferredParkingType(e.target.value)}
                        >
                          <option value="">Select Type</option>
                          <option value="Stack Parking">Stack Parking</option>
                          <option value="Puzzle Parking">Puzzle Parking</option>
                          <option value="Tower Parking">Tower Parking</option>
                          <option value="Pit Parking">Pit Parking</option>
                          <option value="Cantilever">Cantilever</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Automation Required
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                          value={automationRequired}
                          onChange={(e) => setAutomationRequired(e.target.value)}
                        >
                          <option value="">Select Automation</option>
                          <option value="Fully Automatic">Fully Automatic</option>
                          <option value="Semi Automatic">Semi Automatic</option>
                          <option value="Manual">Manual</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 9. Standard FAQs */}
              {faqList.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-semibold text-gray-900">Standard Questions</h3>
                    {faqLoading && <span className="text-xs text-gray-500">Loading…</span>}
                  </div>
                  <div className="space-y-3">
                    {faqList.map((faq) => (
                      <div key={faq.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {faq.question}
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                          rows={2}
                          value={faqAnswers[faq.id] ?? ""}
                          onChange={(e) =>
                            setFaqAnswers((prev) => ({
                              ...prev,
                              [faq.id]: e.target.value,
                            }))
                          }
                          placeholder="Enter your answer..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  {loading ? (followup ? "Updating..." : "Saving...") : followup ? "Update" : "Add Follow-up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* History Modal (separate overlay) */}
      {showHistory && (
        <FollowupHistoryModal
          open={showHistory}
          onClose={() => setShowHistory(false)}
          lead={leadData}
        />
      )}
    </>
  );
}