import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { MdClose } from "react-icons/md";

// Local reusable component for Followup History Modal
const FollowupHistoryModal = ({ open, onClose, lead }) => {
  if (!open || !lead) return null;

  return (
    <div className="followup-modal">
      <div className="followup-modal-header">
        <h2 className="text-lg font-semibold text-gray-900">Followup History</h2>
        <button
          onClick={onClose}
          className="btn-icon hover:bg-gray-100"
          aria-label="Close"
        >
          <MdClose className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="px-6 py-4 overflow-y-auto flex-1 custom-scrollbar">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-gray-900">Follow-up Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <span className="font-medium text-gray-600">Enquiry date:</span>{" "}
              {lead.enquiry_date || "—"}
            </div>
            <div>
              <span className="font-medium text-gray-600">Next followup:</span>{" "}
              {lead.followup_date || "—"}
            </div>
            <div>
              <span className="font-medium text-gray-600">Current status:</span>{" "}
              {lead.status || "—"}
            </div>
          </div>

          <div>
            <div className="font-medium text-gray-700 mb-2">Followup history</div>

            {lead.followups && lead.followups.length > 0 ? (
              <div className="space-y-4">
                {lead.followups.map((fu, idx) => (
                  <div key={fu.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            🕐 {fu.followup_date}
                          </span>
                          <span className={`status-badge ${
                            fu.status === 'open' ? 'status-badge-open' :
                            fu.status === 'in_process' ? 'status-badge-in-process' :
                            'status-badge-closed'
                          }`}>
                            {fu.status}
                          </span>
                        </div>

                        {fu.remarks && (
                          <div className="text-sm mb-2 text-gray-700">
                            <span className="font-medium">Remarks:</span> {fu.remarks}
                          </div>
                        )}

                        {fu.discussion_notes && (
                          <div className="discussion-notes-container">
                            <span className="discussion-notes-label">Discussion:</span>
                            <p className="discussion-notes-text">{fu.discussion_notes}</p>
                          </div>
                        )}

                        {fu.suggested_solution && fu.suggested_solution.length > 0 && (
                          <div className="mt-3">
                            <div className="font-medium text-sm mb-2 text-gray-700">Suggested Solutions:</div>
                            <div className="space-y-2">
                              {fu.suggested_solution.map((product, pIdx) => (
                                <div key={pIdx} className="product-suggestion-card">
                                  <div className="product-name">
                                    🏗️ {product.product_name}
                                  </div>
                                  <div className="product-meta">
                                    {product.category} {product.capacity ? `| Capacity: ${product.capacity} cars` : ''}
                                  </div>
                                  {product.reason && (
                                    <div className="product-reason">
                                      <span className="font-medium">Reason:</span> {product.reason}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {fu.faq_answers && fu.faq_answers.length > 0 && (
                          <div className="mt-3 text-xs">
                            <div className="font-medium mb-1 text-gray-700">FAQs:</div>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                              {fu.faq_answers.map((faq) => (
                                <li key={faq.id}>
                                  <span className="font-medium">{faq.faq_question}:</span> {faq.answer}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {fu.next_followup_date && (
                          <div className="text-xs text-gray-500 mt-2">
                            Next: {fu.next_followup_date}
                          </div>
                        )}
                      </div>

                      {fu.created_by_name && (
                        <div className="text-xs text-gray-500 ml-4">
                          By: {fu.created_by_name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No followups recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * AddLeadFollowUpForm - UPDATED WITH NEW FIELDS
 */
export default function AddLeadFollowUpForm({
  open,
  onClose,
  onSuccess,
  baseApi,
  leadId,
  followup = null,
}) {
  const DEFAULT_API = "http://127.0.0.1:8000";
  const BASE_API = baseApi ?? DEFAULT_API;

  // Form state
  const [followupDate, setFollowupDate] = useState(followup?.followup_date ?? "");
  const [nextFollowupDate, setNextFollowupDate] = useState(followup?.next_followup_date ?? "");
  const [status, setStatus] = useState(followup?.status ?? "in_process");
  const [remarks, setRemarks] = useState(followup?.remarks ?? "");
  const [discussionNotes, setDiscussionNotes] = useState(followup?.discussion_notes ?? "");
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Qualifying Questions state
  const [siteLocation, setSiteLocation] = useState("");
  const [carsRequired, setCarsRequired] = useState("");
  const [carType, setCarType] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [basementAvailable, setBasementAvailable] = useState("");
  const [pitPossible, setPitPossible] = useState("");
  const [installationTimeline, setInstallationTimeline] = useState("");
  const [siteChallenges, setSiteChallenges] = useState("");
  const [showQualifyingQuestions, setShowQualifyingQuestions] = useState(true);

  // Requirement state (NEW)
  const [showRequirement, setShowRequirement] = useState(false);
  const [siteLength, setSiteLength] = useState("");
  const [siteWidth, setSiteWidth] = useState("");
  const [siteHeight, setSiteHeight] = useState("");
  const [preferredParkingType, setPreferredParkingType] = useState("");
  const [automationRequired, setAutomationRequired] = useState("");

  // FAQ state
  const [faqList, setFaqList] = useState([]);
  const [faqAnswers, setFaqAnswers] = useState({});

  // Products list
  const [productsList, setProductsList] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [faqLoading, setFaqLoading] = useState(false);
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

  useEffect(() => {
    setFollowupDate(followup?.followup_date ?? "");
    setNextFollowupDate(followup?.next_followup_date ?? "");
    setStatus(followup?.status ?? "in_process");
    setRemarks(followup?.remarks ?? "");
    setDiscussionNotes(followup?.discussion_notes ?? "");

    if (followup?.suggested_solution && Array.isArray(followup.suggested_solution)) {
      setSuggestedProducts(followup.suggested_solution);
    } else {
      setSuggestedProducts([]);
    }

    if (followup?.faq_answers?.length) {
      const initial = {};
      followup.faq_answers.forEach((item) => {
        initial[item.faq] = item.answer || "";
      });
      setFaqAnswers(initial);
    } else {
      setFaqAnswers({});
    }

    setLoading(false);
  }, [followup, open]);

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

  useEffect(() => {
    if (!open) return;

    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        // Fetch parking products instead of regular products
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
        const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setProductsList(items || []);
      } catch (err) {
        console.error("Parking products fetch error", err);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [open, BASE_API, token]);

  if (!open) return null;

  const handleAddProduct = () => {
    setSuggestedProducts([...suggestedProducts, {
      product_id: '',
      product_name: '',
      category: '',
      capacity: null,
      reason: ''
    }]);
  };

  const handleRemoveProduct = (index) => {
    setSuggestedProducts(suggestedProducts.filter((_, i) => i !== index));
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...suggestedProducts];
    updated[index][field] = value;

    if (field === 'product_id' && value) {
      const selectedProduct = productsList.find(p => p.id === Number(value));
      if (selectedProduct) {
        // Updated to match parking products structure
        updated[index].product_name = selectedProduct.product_name || '';
        updated[index].category = selectedProduct.category_name || '';
        updated[index].capacity = selectedProduct.car_capacity || null;
      }
    }

    setSuggestedProducts(updated);
  };

  const validate = () => {
    if (!leadId && !followup) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Lead is required to create follow-up.",
      });
      return false;
    }

    if (!followupDate) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Follow-up date is required",
      });
      return false;
    }

    if (!status) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Status is required",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const faqPayload = Object.entries(faqAnswers)
        .filter(([, ans]) => ans && ans.toString().trim() !== "")
        .map(([faqId, ans]) => ({
          faq: Number(faqId),
          answer: ans.toString().trim(),
        }));

      const suggestedSolutionPayload = suggestedProducts
        .filter(p => p.product_id)
        .map(p => ({
          product_id: Number(p.product_id),
          product_name: p.product_name,
          category: p.category,
          capacity: p.capacity,
          reason: p.reason?.trim() || ''
        }));

      const payload = {
        lead: leadId,
        followup_date: followupDate,
        next_followup_date: nextFollowupDate || null,
        status,
        remarks: remarks.trim(),
        discussion_notes: discussionNotes.trim(),
      };

      // Add qualifying questions if filled
      if (siteLocation || carsRequired || carType || budgetRange || basementAvailable || pitPossible || installationTimeline || siteChallenges) {
        payload.qualifying_info = {
          site_location: siteLocation.trim(),
          cars_required: carsRequired.trim(),
          car_type: carType,
          budget_range: budgetRange.trim(),
          basement_available: basementAvailable,
          pit_possible: pitPossible,
          installation_timeline: installationTimeline.trim(),
          site_challenges: siteChallenges.trim(),
        };
      }

      // Add requirement info if filled (NEW)
      if (siteLength || siteWidth || siteHeight || preferredParkingType || automationRequired) {
        payload.requirement_info = {
          site_length: siteLength.trim(),
          site_width: siteWidth.trim(),
          site_height: siteHeight.trim(),
          preferred_parking_type: preferredParkingType,
          automation_required: automationRequired,
        };
      }

      if (faqPayload.length) {
        payload.faq_answers = faqPayload;
      }

      if (suggestedSolutionPayload.length > 0) {
        payload.suggested_solution = suggestedSolutionPayload;
      }

      const url = followup
        ? `${BASE_API}/lead/lead-followups/${followup.id}/`
        : `${BASE_API}/lead/lead-followups/`;
      const method = followup ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
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
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to save follow-up",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 animate-fade-in">
        <div className={`flex gap-4 transition-all duration-300 ${showHistory ? "max-w-[95vw]" : "max-w-4xl"} w-full`}>
          <div className={`followup-modal animate-slide-in ${showHistory ? "max-w-3xl" : "w-full"}`}>
            <div className="followup-modal-header">
              <h2 className="text-lg font-semibold text-gray-900">
                {followup ? "Edit Follow-up" : "Add Follow-up"}
              </h2>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowHistory(true)}
                  className="btn-secondary text-sm"
                >
                  📜 History
                </button>
                <button
                  onClick={onClose}
                  className="btn-icon"
                  aria-label="Close"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1 custom-scrollbar" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="followup-form-field">
                    <label className="followup-form-label">
                      Follow-up Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="followup-form-input"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                    />
                  </div>

                  <div className="followup-form-field">
                    <label className="followup-form-label">
                      Next Follow-up Date (optional)
                    </label>
                    <input
                      type="date"
                      className="followup-form-input"
                      value={nextFollowupDate}
                      onChange={(e) => setNextFollowupDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="followup-form-field">
                  <label className="followup-form-label">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="followup-form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="in_process">In Process</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="followup-form-field">
                  <label className="followup-form-label">Remarks (Brief)</label>
                  <textarea
                    className="followup-form-textarea"
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Brief summary..."
                  />
                </div>

                <div className="followup-form-field">
                  <label className="followup-form-label">
                    Discussion Notes (Detailed)
                  </label>
                  <textarea
                    className="followup-form-textarea"
                    rows={6}
                    value={discussionNotes}
                    onChange={(e) => setDiscussionNotes(e.target.value)}
                    placeholder="Enter detailed conversation notes, customer requirements, concerns, budget discussions..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Add comprehensive details about the discussion with customer
                  </p>
                </div>

                {/* Qualifying Questions Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-md font-semibold text-gray-900">Qualifying Questions</h3>
                      <p className="text-xs text-gray-500 mt-1">Collect site and requirement details</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="followup-form-field mb-0">
                        <label className="followup-form-label">Site Location</label>
                        <input
                          type="text"
                          className="followup-form-input"
                          value={siteLocation}
                          onChange={(e) => setSiteLocation(e.target.value)}
                          placeholder="e.g., Andheri West, Mumbai"
                        />
                      </div>

                      <div className="followup-form-field mb-0">
                        <label className="followup-form-label">Number of Cars Required</label>
                        <input
                          type="text"
                          className="followup-form-input"
                          value={carsRequired}
                          onChange={(e) => setCarsRequired(e.target.value)}
                          placeholder="e.g., 20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="followup-form-field mb-0">
                        <label className="followup-form-label">Car Type</label>
                        <select
                          className="followup-form-select"
                          value={carType}
                          onChange={(e) => setCarType(e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="sedan">Sedan</option>
                          <option value="suv">SUV</option>
                          <option value="hatchback">Hatchback</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>

                      <div className="followup-form-field mb-0">
                        <label className="followup-form-label">Budget Range</label>
                        <input
                          type="text"
                          className="followup-form-input"
                          value={budgetRange}
                          onChange={(e) => setBudgetRange(e.target.value)}
                          placeholder="e.g., ₹30-40 Lakhs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="followup-form-field mb-0">
                        <label className="followup-form-label">Basement Available</label>
                        <select
                          className="followup-form-select"
                          value={basementAvailable}
                          onChange={(e) => setBasementAvailable(e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>

                      <div className="followup-form-field mb-0">
                        <label className="followup-form-label">Pit Possible</label>
                        <select
                          className="followup-form-select"
                          value={pitPossible}
                          onChange={(e) => setPitPossible(e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>

                    <div className="followup-form-field mb-0">
                      <label className="followup-form-label">Installation Timeline</label>
                      <input
                        type="text"
                        className="followup-form-input"
                        value={installationTimeline}
                        onChange={(e) => setInstallationTimeline(e.target.value)}
                        placeholder="e.g., 3 months"
                      />
                    </div>

                    <div className="followup-form-field mb-0">
                      <label className="followup-form-label">Site Challenges</label>
                      <textarea
                        className="followup-form-textarea"
                        rows={2}
                        value={siteChallenges}
                        onChange={(e) => setSiteChallenges(e.target.value)}
                        placeholder="Any specific challenges at the site?"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
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
                      className="btn-primary text-sm"
                    >
                      <span>+</span> Add Product
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
                            className="btn-icon text-red-500 hover:text-red-700"
                          >
                            <MdClose className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="followup-form-field mb-0">
                            <label className="followup-form-label">
                              Product <span className="text-red-500">*</span>
                            </label>
                            <select
                              className="followup-form-select"
                              value={product.product_id}
                              onChange={(e) => handleProductChange(index, 'product_id', e.target.value)}
                            >
                              <option value="">Select Product</option>
                              {productsList.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.product_name || p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="followup-form-field mb-0">
                            <label className="followup-form-label">
                              Category
                            </label>
                            <input
                              type="text"
                              className="followup-form-input bg-gray-100"
                              value={product.category || ''}
                              disabled
                              placeholder="Auto-filled"
                            />
                          </div>
                        </div>

                        <div className="followup-form-field mb-0">
                          <label className="followup-form-label">
                            Reason for Suggestion
                          </label>
                          <textarea
                            className="followup-form-textarea"
                            rows={2}
                            value={product.reason || ''}
                            onChange={(e) => handleProductChange(index, 'reason', e.target.value)}
                            placeholder="Why is this product recommended?"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {suggestedProducts.length === 0 && (
                    <div className="empty-state">
                      <svg className="empty-state-icon mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="empty-state-text">
                        No products suggested yet
                      </p>
                      <p className="empty-state-subtext">
                        Click "Add Product" to recommend a solution
                      </p>
                    </div>
                  )}
                </div>

                {/* Requirement Form Section (Optional) */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-md font-semibold text-gray-900">Add Requirement (Optional)</h3>
                      <p className="text-xs text-gray-500 mt-1">Detailed site measurements and preferences</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRequirement(!showRequirement)}
                      className="btn-secondary text-sm"
                    >
                      {showRequirement ? '🔼 Hide Requirement' : '🔽 Show Requirement'}
                    </button>
                  </div>

                  {showRequirement && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="followup-form-field mb-0">
                          <label className="followup-form-label">Site Length (feet)</label>
                          <input
                            type="number"
                            className="followup-form-input"
                            value={siteLength}
                            onChange={(e) => setSiteLength(e.target.value)}
                            placeholder="e.g., 50"
                            step="0.01"
                          />
                        </div>

                        <div className="followup-form-field mb-0">
                          <label className="followup-form-label">Site Width (feet)</label>
                          <input
                            type="number"
                            className="followup-form-input"
                            value={siteWidth}
                            onChange={(e) => setSiteWidth(e.target.value)}
                            placeholder="e.g., 40"
                            step="0.01"
                          />
                        </div>

                        <div className="followup-form-field mb-0">
                          <label className="followup-form-label">Site Height (feet)</label>
                          <input
                            type="number"
                            className="followup-form-input"
                            value={siteHeight}
                            onChange={(e) => setSiteHeight(e.target.value)}
                            placeholder="e.g., 30"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="followup-form-field mb-0">
                          <label className="followup-form-label">Preferred Parking Type</label>
                          <select
                            className="followup-form-select"
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

                        <div className="followup-form-field mb-0">
                          <label className="followup-form-label">Automation Required</label>
                          <select
                            className="followup-form-select"
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

                {faqList.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-md font-semibold text-gray-900">Standard Questions</h3>
                      {faqLoading && (
                        <span className="text-xs text-gray-500">Loading…</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {faqList.map((faq) => (
                        <div key={faq.id} className="followup-form-field">
                          <label className="followup-form-label">
                            {faq.question}
                          </label>
                          <textarea
                            className="followup-form-textarea"
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

                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading
                      ? followup
                        ? "Updating..."
                        : "Saving..."
                      : followup
                        ? "Update"
                        : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {showHistory && (
            <FollowupHistoryModal
              open={showHistory}
              onClose={() => setShowHistory(false)}
              lead={leadData}
            />
          )}
        </div>
      </div>
    </>
  );
}
