import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { MdClose } from "react-icons/md";

// Local reusable component for Followup History Modal
const FollowupHistoryModal = ({ open, onClose, lead }) => {
  if (!open || !lead) return null;

  return (
    <div className="bg-white rounded-md shadow-lg w-full max-w-3xl relative max-h-[85vh] flex flex-col">
      <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Followup History</h2>
        <button
          onClick={onClose}
          className="text-xl font-bold hover:text-red-500"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="px-6 py-4 overflow-y-auto flex-1">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Follow-up Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <span className="font-medium text-slate-600">Enquiry date:</span>{" "}
              {lead.enquiry_date || "—"}
            </div>
            <div>
              <span className="font-medium text-slate-600">Next followup:</span>{" "}
              {lead.followup_date || "—"}
            </div>
            <div>
              <span className="font-medium text-slate-600">Current status:</span>{" "}
              {lead.status || "—"}
            </div>
          </div>

          <div>
            <div className="font-medium text-slate-600 mb-2">Followup history</div>

            {lead.followups && lead.followups.length > 0 ? (
              <div className="space-y-4">
                {lead.followups.map((fu, idx) => (
                  <div key={fu.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium">
                            🕐 {fu.followup_date}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            fu.status === 'open' ? 'bg-blue-100 text-blue-700' :
                            fu.status === 'in_process' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {fu.status}
                          </span>
                        </div>

                        {/* Remarks */}
                        {fu.remarks && (
                          <div className="text-sm mb-2">
                            <span className="font-medium">Remarks:</span> {fu.remarks}
                          </div>
                        )}

                        {/* ✅ NEW: Discussion Notes */}
                        {fu.discussion_notes && (
                          <div className="text-sm mb-3 bg-gray-50 p-3 rounded">
                            <span className="font-medium">Discussion:</span>
                            <p className="mt-1 text-gray-700">{fu.discussion_notes}</p>
                          </div>
                        )}

                        {/* ✅ NEW: Suggested Solutions */}
                        {fu.suggested_solution && fu.suggested_solution.length > 0 && (
                          <div className="mt-3">
                            <div className="font-medium text-sm mb-2">Suggested Solutions:</div>
                            <div className="space-y-2">
                              {fu.suggested_solution.map((product, pIdx) => (
                                <div key={pIdx} className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-blue-900">
                                        🏗️ {product.product_name}
                                      </div>
                                      <div className="text-xs text-blue-700 mt-1">
                                        {product.category} {product.capacity ? `| Capacity: ${product.capacity} cars` : ''}
                                      </div>
                                      {product.reason && (
                                        <div className="text-xs text-gray-600 mt-1">
                                          <span className="font-medium">Reason:</span> {product.reason}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* FAQ Answers (existing) */}
                        {fu.faq_answers && fu.faq_answers.length > 0 && (
                          <div className="mt-3 text-xs">
                            <div className="font-medium mb-1">FAQs:</div>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                              {fu.faq_answers.map((faq) => (
                                <li key={faq.id}>
                                  <span className="font-medium">{faq.faq_question}:</span> {faq.answer}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Next Follow-up */}
                        {fu.next_followup_date && (
                          <div className="text-xs text-gray-500 mt-2">
                            Next: {fu.next_followup_date}
                          </div>
                        )}
                      </div>

                      {/* Created By */}
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
              <div className="text-sm text-slate-500">
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
 * AddLeadFollowUpForm - UPDATED VERSION
 *
 * Props:
 * - open: boolean
 * - onClose: fn()
 * - onSuccess: fn(data)
 * - baseApi: optional base url string
 * - leadId: number (required for creating followup)
 * - followup: optional object (when provided → edit mode)
 */
export default function AddLeadFollowUpForm({
  open,
  onClose,
  onSuccess,
  baseApi,
  leadId,
  followup = null,
}) {
  const BASE_API = baseApi || import.meta.env.VITE_BASE_API_URL;
  console.log("AddLeadFollowUpForm_UPDATED BASE_API =", BASE_API);

  if (!BASE_API) {
    console.error("AddLeadFollowUpForm_UPDATED: VITE_BASE_API_URL is not defined!");
  }

  // --- Form state ---
  const [followupDate, setFollowupDate] = useState(followup?.followup_date ?? "");
  const [nextFollowupDate, setNextFollowupDate] = useState(
    followup?.next_followup_date ?? ""
  );
  const [status, setStatus] = useState(followup?.status ?? "in_process");
  const [remarks, setRemarks] = useState(followup?.remarks ?? "");
  
  // ✅ NEW FIELDS
  const [discussionNotes, setDiscussionNotes] = useState(followup?.discussion_notes ?? "");
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  
  const [showHistory, setShowHistory] = useState(false);

  // FAQ state
  const [faqList, setFaqList] = useState([]);
  const [faqAnswers, setFaqAnswers] = useState({});

  // Products list for dropdown
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

  // Fetch lead data
  useEffect(() => {
    if (!open || !leadId) return;

    const fetchLead = async () => {
      try {
        const res = await fetch(
          `${BASE_API}/lead/lead/${leadId}/`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

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

  // Sync form when followup or modal open changes
  useEffect(() => {
    setFollowupDate(followup?.followup_date ?? "");
    setNextFollowupDate(followup?.next_followup_date ?? "");
    setStatus(followup?.status ?? "in_process");
    setRemarks(followup?.remarks ?? "");
    setDiscussionNotes(followup?.discussion_notes ?? "");

    // Prefill suggested products when editing
    if (followup?.suggested_solution && Array.isArray(followup.suggested_solution)) {
      setSuggestedProducts(followup.suggested_solution);
    } else {
      setSuggestedProducts([]);
    }

    // Prefill FAQ answers when editing
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

  // Load FAQ master list when modal opens
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
          console.error("Failed to load FAQs", await res.text());
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

  // ✅ NEW: Load products list
  useEffect(() => {
    if (!open) return;

    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await fetch(`${BASE_API}/product/products/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          console.error("Failed to load products");
          return;
        }

        const data = await res.json();
        const items = Array.isArray(data?.results) ? data.results : data;
        setProductsList(items || []);
      } catch (err) {
        console.error("Products fetch error", err);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [open, BASE_API, token]);

  if (!open) return null;

  // ✅ NEW: Product handlers
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

    // Auto-fill product details when product is selected
    if (field === 'product_id' && value) {
      const selectedProduct = productsList.find(p => p.id === Number(value));
      if (selectedProduct) {
        updated[index].product_name = selectedProduct.product_name || selectedProduct.name || '';
        updated[index].category = selectedProduct.category || '';
        updated[index].capacity = selectedProduct.capacity || null;
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
      // Build FAQ payload (only non-empty answers)
      const faqPayload = Object.entries(faqAnswers)
        .filter(([, ans]) => ans && ans.toString().trim() !== "")
        .map(([faqId, ans]) => ({
          faq: Number(faqId),
          answer: ans.toString().trim(),
        }));

      // ✅ Build suggested solution payload (only valid products)
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
        discussion_notes: discussionNotes.trim(), // ✅ NEW
      };

      if (faqPayload.length) {
        payload.faq_answers = faqPayload;
      }

      // ✅ NEW: Add suggested solution if any
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
        const msg =
          data?.detail || JSON.stringify(data) || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      Swal.fire({
        icon: "success",
        text: followup
          ? "Follow-up updated successfully"
          : "Follow-up added successfully",
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
      <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50 p-4">
        <div className={`flex gap-4 transition-all duration-300 ${showHistory ? "max-w-6xl" : "max-w-3xl"} w-full`}>
          <div className={`bg-white rounded-md shadow-lg w-full relative max-h-[85vh] flex flex-col transition-all duration-300 ${showHistory ? "max-w-3xl" : "max-w-3xl mx-auto"}`}>
            {/* ---- FIXED HEADER ---- */}
            <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {followup ? "Edit Follow-up" : "Add Follow-up"}
              </h2>

              <div className="flex items-center gap-3">
                {/* Followup History BUTTON */}
                <button
                  onClick={() => setShowHistory(true)}
                  className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                >
                  Followup History
                </button>

                {/* CLOSE BUTTON */}
                <button
                  onClick={onClose}
                  className="text-xl font-bold hover:text-red-500"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ---- SCROLLABLE FORM BODY ---- */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Follow-up Date + Next Follow-up Date in one row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-700 mb-1 block">
                      Follow-up Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-700 mb-1 block">
                      Next Follow-up Date (optional)
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={nextFollowupDate}
                      onChange={(e) => setNextFollowupDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm text-slate-700 mb-1 block">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="in_process">In Process</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Remarks (Brief) */}
                <div>
                  <label className="text-sm text-slate-700 mb-1 block">
                    Remarks (Brief Summary)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Brief summary..."
                  />
                </div>

                {/* ✅ NEW: Discussion Notes (Detailed) */}
                <div>
                  <label className="text-sm text-slate-700 mb-1 block">
                    Discussion Notes (Detailed)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    value={discussionNotes}
                    onChange={(e) => setDiscussionNotes(e.target.value)}
                    placeholder="Enter detailed conversation notes, customer requirements, concerns, budget discussions, etc..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Detailed notes about the discussion with customer
                  </p>
                </div>

                {/* ✅ NEW: Suggested Solutions Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-md font-semibold">Suggested Solutions</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Recommend parking products to the customer
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1"
                    >
                      <span>+</span> Add Product
                    </button>
                  </div>

                  {/* Product List */}
                  <div className="space-y-3">
                    {suggestedProducts.map((product, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-sm">Product {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(index)}
                            className="text-red-500 hover:text-red-700 text-lg"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Product Select */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-sm text-slate-700 mb-1 block">
                              Product <span className="text-red-500">*</span>
                            </label>
                            <select
                              className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm"
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

                          <div>
                            <label className="text-sm text-slate-700 mb-1 block">
                              Category
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 rounded-md border border-slate-200 bg-gray-100 text-sm"
                              value={product.category || ''}
                              disabled
                              placeholder="Auto-filled"
                            />
                          </div>
                        </div>

                        {/* Reason for Suggestion */}
                        <div>
                          <label className="text-sm text-slate-700 mb-1 block">
                            Reason for Suggestion
                          </label>
                          <textarea
                            className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm"
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
                    <div className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded border-2 border-dashed">
                      No products suggested yet. Click "Add Product" to recommend a solution.
                    </div>
                  )}
                </div>

                {/* FAQ section */}
                {faqList.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-md font-semibold">Standard Questions</h3>
                      {faqLoading && (
                        <span className="text-xs text-slate-500">Loading…</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {faqList.map((faq) => (
                        <div key={faq.id}>
                          <label className="text-sm text-slate-700 mb-1 block">
                            {faq.question}
                          </label>
                          <textarea
                            className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
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

          {/* History Modal */}
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
