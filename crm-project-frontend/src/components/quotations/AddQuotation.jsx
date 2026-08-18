import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { MdAdd, MdDelete, MdClose } from "react-icons/md";
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

const fmtLakhs = (lakhs) => {
  const n = parseFloat(lakhs) || 0;
  return `₹${n.toFixed(2)} Lakhs`;
};

export default function AddQuotation({ id = null, onBack, leadData = null }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [refLoading, setRefLoading] = useState(true);

  const [customerId, setCustomerId] = useState("");
  const [gstPercent, setGstPercent] = useState(18);
  const [selectedTerms, setSelectedTerms] = useState([]);

  // Additional Charges State (in ₹)
  const [transportCharges, setTransportCharges] = useState("");
  const [packingForwardingCharges, setPackingForwardingCharges] = useState("");
  const [loadingUnloadingCharges, setLoadingUnloadingCharges] = useState("");
  const [insuranceCharges, setInsuranceCharges] = useState("");
  const [miscellaneousCharges, setMiscellaneousCharges] = useState("");

  // Multi-product items state (same form layout)
  const [items, setItems] = useState([
    {
      id: 1,
      parking_product_id: "",
      description: "",
      quantity: 1,
      unitPriceLakhs: "",
      installationLakhs: "",
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load reference data
  useEffect(() => {
    const load = async () => {
      setRefLoading(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get("lead/customer/?page_size=500&is_lead_only=false"),
          api.get("parking/products/?is_active=true&page_size=500"),
        ]);
        setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data?.results || []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.results || []);
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
        setGstPercent(d.gst_percent ?? 18);
        setTransportCharges(d.transportation_charges ? String(d.transportation_charges) : "");
        setPackingForwardingCharges(d.packing_forwarding_charges ? String(d.packing_forwarding_charges) : "");
        setLoadingUnloadingCharges(d.loading_unloading_charges ? String(d.loading_unloading_charges) : "");
        setInsuranceCharges(d.insurance_charges ? String(d.insurance_charges) : "");
        setMiscellaneousCharges(d.miscellaneous_charges ? String(d.miscellaneous_charges) : "");

        if (Array.isArray(d.items) && d.items.length > 0) {
          setItems(
            d.items.map((it, idx) => ({
              id: it.id || idx + 1,
              parking_product_id: String(it.parking_product_id || ""),
              description: it.description || "",
              quantity: it.quantity || 1,
              unitPriceLakhs: it.unit_price > 0 ? String(it.unit_price / 100000) : "",
              installationLakhs: it.installation_charges > 0 ? String(it.installation_charges / 100000) : "",
            }))
          );
        } else if (d.parking_product_id) {
          const rawPrice = parseFloat(d.unit_price) || 0;
          setItems([
            {
              id: 1,
              parking_product_id: String(d.parking_product_id),
              description: d.subject || "",
              quantity: d.quantity || 1,
              unitPriceLakhs: rawPrice > 0 ? String(rawPrice / 100000) : "",
              installationLakhs: "",
            }
          ]);
        }
      })
      .catch((e) => console.error("Edit load failed", e));
  }, [id]);

  // Item handlers
  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        parking_product_id: "",
        description: "",
        quantity: 1,
        unitPriceLakhs: "",
        installationLakhs: "",
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const currentItem = { ...updated[index], [field]: value };

      if (field === "parking_product_id") {
        const prod = products.find((p) => String(p.id) === String(value));
        if (prod) {
          if (prod.base_price != null && (!currentItem.unitPriceLakhs || currentItem.unitPriceLakhs === "0")) {
            currentItem.unitPriceLakhs = String(parseFloat(prod.base_price) || "");
          }
          if (!currentItem.description) {
            const catName = typeof prod.category === "object" ? prod.category?.display_name : prod.category_name || "";
            let capStr = "";
            if (prod.load_capacity) {
              const val = parseFloat(prod.load_capacity);
              if (val >= 1000) {
                const ton = val / 1000;
                capStr = ` (${Number.isInteger(ton) ? ton : ton.toFixed(1)} Ton Capacity)`;
              } else if (val > 0) {
                capStr = ` (${val} Ton Capacity)`;
              }
            }
            currentItem.description = `${prod.product_name}${catName ? ` (${catName})` : ""}${capStr}`;
          }
        }
      }

      updated[index] = currentItem;
      return updated;
    });
  };

  // Calculations
  const summary = useMemo(() => {
    let subtotalLakhs = 0;
    let totalCarsCount = 0;

    const computedItems = items.map((it) => {
      const q = parseInt(it.quantity) || 0;
      const rateL = parseFloat(it.unitPriceLakhs) || 0;
      const instL = parseFloat(it.installationLakhs) || 0;
      
      const lineSubtotalL = (q * rateL) + (q * instL);
      subtotalLakhs += lineSubtotalL;

      const prod = products.find((p) => String(p.id) === String(it.parking_product_id));
      const cap = prod ? (parseInt(prod.car_capacity) || 1) : 1;
      totalCarsCount += cap * q;

      return {
        ...it,
        lineSubtotalL,
        cars: cap * q
      };
    });

    const trans = parseFloat(transportCharges) || 0;
    const pack = parseFloat(packingForwardingCharges) || 0;
    const loadChg = parseFloat(loadingUnloadingCharges) || 0;
    const ins = parseFloat(insuranceCharges) || 0;
    const misc = parseFloat(miscellaneousCharges) || 0;
    const addChargesTotalRs = trans + pack + loadChg + ins + misc;
    const addChargesLakhs = addChargesTotalRs / 100000;

    const gst = parseFloat(gstPercent) || 0;
    const gstLakhs = (subtotalLakhs * gst) / 100;
    const grandTotalLakhs = subtotalLakhs + gstLakhs + addChargesLakhs;

    return {
      computedItems,
      subtotalLakhs,
      gstLakhs,
      addChargesTotalRs,
      addChargesLakhs,
      grandTotalLakhs,
      totalCarsCount
    };
  }, [items, products, gstPercent, transportCharges, packingForwardingCharges, loadingUnloadingCharges, insuranceCharges, miscellaneousCharges]);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.parking_product_id) {
        setError(`Product #${i + 1}: Please select a parking product.`);
        return;
      }
      if ((parseInt(it.quantity) || 0) < 1) {
        setError(`Product #${i + 1}: Quantity must be at least 1.`);
        return;
      }
      if ((parseFloat(it.unitPriceLakhs) || 0) <= 0) {
        setError(`Product #${i + 1}: Unit price must be greater than 0.`);
        return;
      }
    }

    const itemsPayload = items.map((it) => ({
      parking_product_id: parseInt(it.parking_product_id),
      quantity: parseInt(it.quantity) || 1,
      unit_price: (parseFloat(it.unitPriceLakhs) || 0) * 100000,
      installation_charges: (parseFloat(it.installationLakhs) || 0) * 100000,
      description: it.description || "",
    }));

    const payload = {
      customer: parseInt(customerId),
      items: itemsPayload,
      gst_percent: parseFloat(gstPercent) || 18,
      transportation_charges: parseFloat(transportCharges) || 0,
      packing_forwarding_charges: parseFloat(packingForwardingCharges) || 0,
      loading_unloading_charges: parseFloat(loadingUnloadingCharges) || 0,
      insurance_charges: parseFloat(insuranceCharges) || 0,
      miscellaneous_charges: parseFloat(miscellaneousCharges) || 0,
      terms_ids: selectedTerms,
    };

    setLoading(true);
    try {
      if (id) {
        await api.put(`api/quotation/simple-quotation/${id}/update/`, payload);
        Swal.fire("Success", "Quotation updated successfully!", "success");
      } else {
        await api.post("api/quotation/simple-quotation/", payload);
        Swal.fire("Success", "Quotation created successfully!", "success");
      }
      if (onBack) onBack();
    } catch (err) {
      console.error("Save quotation error:", err);
      const errMsg =
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        "Failed to save quotation";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 pt-12 z-[1050]">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-sans">
        
        {/* Modal Header (Exact as screenshot) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h1 className="text-base font-bold text-slate-800">
              {id ? "Edit Quotation" : "Create New Quotation"}
            </h1>
            <p className="text-xs text-slate-500">
              Fill in customer, product, pricing, and terms details below
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          {refLoading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Loading quotation form...
            </div>
          ) : (
            <form id="quotation-modal-form" onSubmit={handleSubmit} className="space-y-4">
              
              {/* Select Customer (Exact as screenshot) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition bg-white"
                >
                  <option value="">Choose customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company_name ? `(${c.company_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Details Section (Supports multiple products in exact original layout!) */}
              <div className="space-y-4">
                {summary.computedItems.map((item, index) => (
                  <div key={item.id} className="space-y-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50 relative">
                    {items.length > 1 && (
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>Product #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-0.5"
                        >
                          <MdDelete className="text-sm" /> Remove
                        </button>
                      </div>
                    )}

                    {/* Select Product (Exact as screenshot) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Select Product {items.length > 1 ? `#${index + 1}` : ""} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={item.parking_product_id}
                        onChange={(e) => handleItemChange(index, "parking_product_id", e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition bg-white"
                      >
                        <option value="">Choose product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.product_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity / Units & Total Capacity (Exact as screenshot) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Quantity / Units <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Total Capacity
                        </label>
                        <div className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-800 bg-slate-100">
                          {item.cars} cars
                        </div>
                      </div>
                    </div>

                    {/* Unit Price (Lakhs ₹) (Exact as screenshot) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Unit Price (Lakhs ₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPriceLakhs}
                          onChange={(e) => handleItemChange(index, "unitPriceLakhs", e.target.value)}
                          placeholder="e.g. 6.5"
                          className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition bg-white pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                          Lakhs
                        </span>
                      </div>
                    </div>

                    {/* Specification / Description (Optional) */}
                    <div>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        placeholder="Specification / Annexure line item description (Optional)"
                        className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                      />
                    </div>
                  </div>
                ))}

                {/* + Add Another Product Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 border border-indigo-200 px-3 py-1.5 rounded-md bg-indigo-50/50 hover:bg-indigo-50 transition"
                  >
                    <MdAdd className="text-sm" /> Add Another Product
                  </button>
                </div>
              </div>

              {/* Additional Charges Section */}
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">
                  Additional Charges (Optional)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Transport Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 15000"
                      value={transportCharges}
                      onChange={(e) => setTransportCharges(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Packing & Forwarding Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 5000"
                      value={packingForwardingCharges}
                      onChange={(e) => setPackingForwardingCharges(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Loading & Unloading Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 8000"
                      value={loadingUnloadingCharges}
                      onChange={(e) => setLoadingUnloadingCharges(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Insurance Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 3000"
                      value={insuranceCharges}
                      onChange={(e) => setInsuranceCharges(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-700 mb-1">Miscellaneous Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 2000"
                      value={miscellaneousCharges}
                      onChange={(e) => setMiscellaneousCharges(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-md border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Basic Subtotal:</span>
                  <span className="font-semibold text-slate-800">{fmtLakhs(summary.subtotalLakhs)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">GST ({gstPercent}%):</span>
                  <span className="font-semibold text-slate-800">{fmtLakhs(summary.gstLakhs)}</span>
                </div>
                {summary.addChargesTotalRs > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Additional Charges Total:</span>
                    <span className="font-semibold text-slate-800">₹{summary.addChargesTotalRs.toLocaleString("en-IN")} ({fmtLakhs(summary.addChargesLakhs)})</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Total Amount:</span>
                  <span className="text-xl font-bold text-blue-600">{fmtLakhs(summary.grandTotalLakhs)}</span>
                </div>
              </div>

              {/* Terms & Conditions (Exact as screenshot) */}
              <div className="border border-slate-200 rounded-md p-4">
                <QuotationTermsSelector selectedTerms={selectedTerms} setSelectedTerms={setSelectedTerms} />
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer (Exact as screenshot) */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="quotation-modal-form"
            disabled={loading || refLoading}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {loading ? "Saving..." : id ? "Update Quotation" : "Create Quotation"}
          </button>
        </div>

      </div>
    </div>
  );
}