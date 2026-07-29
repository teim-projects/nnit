import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import QuotationTermsSelector from "../QuotationTermsSelector";

const BASE_API = import.meta.env.VITE_BASE_API_URL;
console.log("AddQuotation BASE_API =", BASE_API);

if (!BASE_API) {
  console.error("AddQuotation: VITE_BASE_API_URL is not defined!");
}

const api = axios.create({ baseURL: `${BASE_API}/` });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("access");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// base_price is stored in Lakhs (e.g. 6.5 = ₹6.5 Lakhs)
// All price state is kept in Lakhs for display/input
// Raw rupees = Lakhs × 100000  (used only for backend submission)

const fmtLakhs = (lakhs) => {
  const n = parseFloat(lakhs) || 0;
  return `₹${n.toFixed(2)} Lakhs`;
};

const fmtL = (val) => {
  const n = parseFloat(val) || 0;
  if (n === 0) return "";
  return `₹${n.toFixed(2)}L`;
};

export default function AddQuotation({ id = null, onBack, leadData = null }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [termsOptions, setTermsOptions] = useState([]);
  const [refLoading, setRefLoading] = useState(true);

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  // unitPriceLakhs: value in Lakhs (e.g. 6.5 = ₹6.5L)
  const [unitPriceLakhs, setUnitPriceLakhs] = useState("");
  const [gstPercent, setGstPercent] = useState(18);
  const [selectedTerms, setSelectedTerms] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditLoaded, setIsEditLoaded] = useState(false);

  // ── Load reference data ───────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setRefLoading(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get("lead/customer/?page_size=500&is_lead_only=false"),
          api.get("parking/products/?is_active=true&page_size=500"),
          // Removed: inventory/terms - module removed from backend
        ]);
        setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data?.results || []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.results || []);
        // setTermsOptions(Array.isArray(termsRes.data) ? termsRes.data : termsRes.data?.results || []);
        setTermsOptions([]); // Empty - inventory module removed
      } catch (e) {
        console.error("Reference data failed", e);
      } finally {
        setRefLoading(false);
      }
    };
    load();
  }, []);

  // Pre-fill customer from lead
  useEffect(() => {
    if (leadData?.customer_id) setCustomerId(String(leadData.customer_id));
  }, [leadData]);

  // Load existing quotation for edit
  useEffect(() => {
    if (!id) return;
    api.get(`api/quotation/simple-quotation/${id}/`)
      .then((res) => {
        const d = res.data;
        setCustomerId(String(d.customer ?? ""));
        setProductId(String(d.parking_product_id ?? ""));
        setQuantity(d.quantity ?? 1);
        // unit_price from backend is in raw rupees → convert to Lakhs
        const rawPrice = parseFloat(d.unit_price) || 0;
        setUnitPriceLakhs(rawPrice > 0 ? String(rawPrice / 100000) : "");
        setGstPercent(d.gst_percent ?? 18);
        setIsEditLoaded(true); // Mark that edit data has been loaded
      })
      .catch((e) => console.error("Edit load failed", e));
  }, [id]);

  // Selected product
  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(productId)) || null,
    [products, productId]
  );

  // Auto-fill price (in Lakhs) from product base_price (also stored in Lakhs)
  // Only auto-fill when creating new quotation, not when editing
  useEffect(() => {
    if (id && !isEditLoaded) return; // Wait for edit data to load first
    if (id && isEditLoaded) return; // Don't auto-fill when editing
    if (selectedProduct?.base_price != null) {
      setUnitPriceLakhs(String(parseFloat(selectedProduct.base_price) || ""));
    }
  }, [selectedProduct, id, isEditLoaded]);

  // ── Derived calculations (all in Lakhs) ──────────────────────────────────
  const qty = parseInt(quantity) || 0;
  const priceL = parseFloat(unitPriceLakhs) || 0;   // price in Lakhs
  const gst = parseFloat(gstPercent) || 0;

  const subtotalL = qty * priceL;
  const gstL = (subtotalL * gst) / 100;
  const totalL = subtotalL + gstL;

  const totalCars = selectedProduct ? selectedProduct.car_capacity * qty : 0;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerId)     { setError("Please select a customer."); return; }
    if (!productId)      { setError("Please select a product."); return; }
    if (qty < 1)         { setError("Quantity must be at least 1."); return; }
    if (priceL <= 0)     { setError("Unit price must be greater than 0."); return; }

    // Convert Lakhs → raw rupees for backend
    const unitPriceRaw = priceL * 100000;

    const payload = {
      customer: parseInt(customerId),
      parking_product_id: parseInt(productId),
      quantity: qty,
      unit_price: unitPriceRaw,
      gst_percent: gst,
      terms_ids: selectedTerms,  // Add selected terms
      // terms_conditions: termsOptions.map((t) => t.id), // Inventory module removed
    };

    setLoading(true);
    try {
      if (id) {
        await api.put(`api/quotation/simple-quotation/${id}/update/`, payload);
      } else {
        await api.post("api/quotation/simple-quotation/", payload);
      }
      Swal.fire({
        icon: "success",
        title: id ? "Quotation updated!" : "Quotation created!",
        timer: 1500,
        showConfirmButton: false,
      });
      onBack && onBack();
    } catch (err) {
      const data = err.response?.data;
      const msg =
        typeof data === "string"
          ? data
          : data?.detail ||
            (Array.isArray(data) ? data[0] : null) ||
            JSON.stringify(data) ||
            "Failed to save quotation.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {id ? "Edit Quotation" : "Create New Quotation"}
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Fill in customer, product, pricing, and terms details below
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">

          {/* Inner Scrollable Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">

            {error && (
              <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Select Customer */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  disabled={refLoading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                >
                  <option value="">Choose customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.contact_number ? ` — ${c.contact_number}` : ""}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-base">▾</span>
              </div>
            </div>

            {/* Select Product */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Select Product <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  disabled={refLoading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                >
                  <option value="">Choose product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} - {p.category_name} ({p.car_capacity} cars)
                      {p.base_price ? ` - ${fmtL(p.base_price)}` : ""}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-base">▾</span>
              </div>
            </div>

            {/* Quantity + Total Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Quantity / Units <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Total Capacity</label>
                <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-sm font-bold select-none">
                  {totalCars > 0 ? `${totalCars} cars` : "0 cars"}
                </div>
              </div>
            </div>

            {/* Unit Price in Lakhs */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Unit Price (Lakhs ₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={unitPriceLakhs}
                  onChange={(e) => setUnitPriceLakhs(e.target.value)}
                  placeholder="e.g. 6.5"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                  Lakhs
                </span>
              </div>
              {priceL > 0 && (
                <p className="mt-1.5 text-xs font-semibold text-blue-600">
                  = ₹{(priceL * 100000).toLocaleString("en-IN")}
                </p>
              )}
            </div>

            <hr className="border-slate-200 my-2" />

            {/* Subtotal / GST Summary Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex justify-between text-sm text-slate-600 font-semibold">
                <span>Basic Subtotal:</span>
                <span className="font-bold text-slate-800">{fmtLakhs(subtotalL)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 font-semibold">
                <span>GST ({gst}%):</span>
                <span className="font-bold text-slate-800">{fmtLakhs(gstL)}</span>
              </div>
            </div>

            {/* Total Amount Card */}
            <div className="flex justify-between items-center bg-blue-50 rounded-xl px-5 py-3.5 border border-blue-200">
              <span className="text-base font-extrabold text-slate-800">Total Amount:</span>
              <span className="text-2xl font-black text-blue-700">{fmtLakhs(totalL)}</span>
            </div>

            {/* Terms & Conditions Selector */}
            <div className="pt-2">
              <QuotationTermsSelector
                quotationId={id}
                onTermsChange={(terms) => setSelectedTerms(terms)}
              />
            </div>

          </div>

          {/* Sticky Modal Action Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="btn-secondary px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || refLoading}
              className="btn-primary px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold shadow-sm transition disabled:opacity-50"
            >
              {loading
                ? id ? "Updating…" : "Creating…"
                : id ? "Update Quotation" : "Create Quotation"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
