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
  const [salesPersons, setSalesPersons] = useState([]);
  const [salesPersonId, setSalesPersonId] = useState("");
  const [salesPersonName, setSalesPersonName] = useState("");
  const [salesPersonPhone, setSalesPersonPhone] = useState("");

  // Lead Information State
  const [mobileNumber, setMobileNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [leadFetchLoading, setLeadFetchLoading] = useState(false);
  const [leadFetchMsg, setLeadFetchMsg] = useState("");

  const [gstPercent, setGstPercent] = useState(18);
  const [selectedTerms, setSelectedTerms] = useState([]);

  // Additional Charges State (in ₹) & Charge Types
  const [transportChargesType, setTransportChargesType] = useState("custom");
  const [transportCharges, setTransportCharges] = useState("");
  
  const [packingForwardingChargesType, setPackingForwardingChargesType] = useState("custom");
  const [packingForwardingCharges, setPackingForwardingCharges] = useState("");

  const [loadingUnloadingChargesType, setLoadingUnloadingChargesType] = useState("custom");
  const [loadingUnloadingCharges, setLoadingUnloadingCharges] = useState("");

  const [insuranceChargesType, setInsuranceChargesType] = useState("custom");
  const [insuranceCharges, setInsuranceCharges] = useState("");

  const [miscellaneousChargesType, setMiscellaneousChargesType] = useState("custom");
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
        const [custRes, prodRes, staffRes] = await Promise.all([
          api.get("lead/customer/?page_size=500&is_lead_only=false"),
          api.get("parking/products/?is_active=true&page_size=500"),
          api.get("auth/staff/?page_size=200").catch(() => null),
        ]);
        setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data?.results || []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.results || []);
        const sData = staffRes ? (Array.isArray(staffRes.data) ? staffRes.data : staffRes.data?.results || []) : [];
        const salesOnly = sData.filter((u) => {
          const rName = (typeof u.role === "object" ? u.role?.name : u.role) || "";
          return rName.toLowerCase() === "sales";
        });
        setSalesPersons(salesOnly.length > 0 ? salesOnly : sData);
      } catch (e) {
        console.error("Reference data failed", e);
      } finally {
        setRefLoading(false);
      }
    };
    load();
  }, []);

  const handleSalesPersonSelect = (spId) => {
    setSalesPersonId(spId);
    if (!spId) return;
    const found = salesPersons.find((sp) => String(sp.id) === String(spId));
    if (found) {
      const full = `${found.first_name || ""} ${found.last_name || ""}`.trim() || found.username || "";
      const mob = found.mobile_no || found.phone || found.contact_number || "";
      if (full) setSalesPersonName(full);
      if (mob) setSalesPersonPhone(mob);
    }
  };

  const handleCustomerSelect = (cId) => {
    setCustomerId(cId);
    if (!cId) return;
    const c = customers.find((cust) => String(cust.id) === String(cId));
    if (c) {
      if (c.contact_number) setMobileNumber(c.contact_number);
      if (c.company_name || c.name) setCompanyName(c.company_name || c.name);
      if (c.email) setEmailAddress(c.email);
    }
  };

  const handleMobileNumberChange = async (val) => {
    setMobileNumber(val);
    const clean = val.replace(/\D/g, "");
    if (clean.length >= 10) {
      setLeadFetchLoading(true);
      setLeadFetchMsg("Fetching lead data...");
      try {
        const res = await api.get(`api/quotation/fetch-lead-by-mobile/?mobile=${clean}`);
        if (res.data && res.data.found) {
          const d = res.data;
          if (d.customer_id) setCustomerId(String(d.customer_id));
          if (d.company_name) setCompanyName(d.company_name);
          if (d.email) setEmailAddress(d.email);
          if (d.sales_person_id) {
            setSalesPersonId(String(d.sales_person_id));
            if (d.sales_person_name) setSalesPersonName(d.sales_person_name);
            if (d.sales_person_phone) setSalesPersonPhone(d.sales_person_phone);
          }
          setLeadFetchMsg(`✓ Lead fetched: ${d.customer_name || d.company_name}`);
        } else {
          setLeadFetchMsg("No existing lead found. Enter details below.");
        }
      } catch (err) {
        console.error("Mobile fetch error:", err);
        setLeadFetchMsg("");
      } finally {
        setLeadFetchLoading(false);
      }
    } else {
      setLeadFetchMsg("");
    }
  };

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
        setSalesPersonId(d.sales_person ? String(d.sales_person) : "");
        setSalesPersonName(d.sales_person_name || "");
        setSalesPersonPhone(d.sales_person_phone || "");
        setGstPercent(d.gst_percent ?? 18);

        setTransportChargesType(d.transportation_charges_type || "custom");
        setTransportCharges(d.transportation_charges ? String(d.transportation_charges) : "");

        setPackingForwardingChargesType(d.packing_forwarding_charges_type || "custom");
        setPackingForwardingCharges(d.packing_forwarding_charges ? String(d.packing_forwarding_charges) : "");

        setLoadingUnloadingChargesType(d.loading_unloading_charges_type || "custom");
        setLoadingUnloadingCharges(d.loading_unloading_charges ? String(d.loading_unloading_charges) : "");

        setInsuranceChargesType(d.insurance_charges_type || "custom");
        setInsuranceCharges(d.insurance_charges ? String(d.insurance_charges) : "");

        setMiscellaneousChargesType(d.miscellaneous_charges_type || "custom");
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

    const trans = transportChargesType === "custom" ? (parseFloat(transportCharges) || 0) : 0;
    const pack = packingForwardingChargesType === "custom" ? (parseFloat(packingForwardingCharges) || 0) : 0;
    const loadChg = loadingUnloadingChargesType === "custom" ? (parseFloat(loadingUnloadingCharges) || 0) : 0;
    const ins = insuranceChargesType === "custom" ? (parseFloat(insuranceCharges) || 0) : 0;
    const misc = miscellaneousChargesType === "custom" ? (parseFloat(miscellaneousCharges) || 0) : 0;
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
  }, [items, products, gstPercent, transportChargesType, transportCharges, packingForwardingChargesType, packingForwardingCharges, loadingUnloadingChargesType, loadingUnloadingCharges, insuranceChargesType, insuranceCharges, miscellaneousChargesType, miscellaneousCharges]);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerId && !mobileNumber && !companyName) {
      setError("Please enter a Mobile Number or select a Customer.");
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
      customer: customerId ? parseInt(customerId) : null,
      contact_number: mobileNumber,
      company_name: companyName,
      email: emailAddress,
      sales_person: salesPersonId ? parseInt(salesPersonId) : null,
      sales_person_name: salesPersonName,
      sales_person_phone: salesPersonPhone,
      items: itemsPayload,
      gst_percent: parseFloat(gstPercent) || 18,
      transportation_charges: transportChargesType === "custom" ? (parseFloat(transportCharges) || 0) : 0,
      transportation_charges_type: transportChargesType,
      packing_forwarding_charges: packingForwardingChargesType === "custom" ? (parseFloat(packingForwardingCharges) || 0) : 0,
      packing_forwarding_charges_type: packingForwardingChargesType,
      loading_unloading_charges: loadingUnloadingChargesType === "custom" ? (parseFloat(loadingUnloadingCharges) || 0) : 0,
      loading_unloading_charges_type: loadingUnloadingChargesType,
      insurance_charges: insuranceChargesType === "custom" ? (parseFloat(insuranceCharges) || 0) : 0,
      insurance_charges_type: insuranceChargesType,
      miscellaneous_charges: miscellaneousChargesType === "custom" ? (parseFloat(miscellaneousCharges) || 0) : 0,
      miscellaneous_charges_type: miscellaneousChargesType,
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
              
              {/* LEAD INFORMATION SECTION (Exact match to uploaded image media_1788005386089.png) */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    LEAD INFORMATION
                  </span>
                  {leadFetchLoading && (
                    <span className="text-[11px] font-semibold text-indigo-600 animate-pulse">
                      Fetching lead data...
                    </span>
                  )}
                  {!leadFetchLoading && leadFetchMsg && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {leadFetchMsg}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Mobile Number Field (Auto-fetches Lead/Customer data!) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter mobile number to fetch lead data..."
                      value={mobileNumber}
                      onChange={(e) => handleMobileNumberChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Customer / Company Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Customer / Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Customer / Company Name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="contact@company.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales Representative / Executive Details */}
              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3">
                <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  👤 Sales Person / Executive Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Select Staff / Executive
                    </label>
                    <select
                      value={salesPersonId}
                      onChange={(e) => handleSalesPersonSelect(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    >
                      <option value="">Choose Staff / Executive</option>
                      {salesPersons.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {`${sp.first_name || ''} ${sp.last_name || ''}`.trim() || sp.username} {sp.mobile_no ? `(${sp.mobile_no})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Sales Person Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nilesh Sali"
                      value={salesPersonName}
                      onChange={(e) => setSalesPersonName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Sales Person Mobile No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9518377159"
                      value={salesPersonPhone}
                      onChange={(e) => setSalesPersonPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                  </div>
                </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Transport Charges */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Transport Charges</label>
                    <div className="flex gap-2">
                      <select
                        value={transportChargesType}
                        onChange={(e) => {
                          setTransportChargesType(e.target.value);
                          if (e.target.value !== "custom") setTransportCharges("");
                        }}
                        className="w-1/2 px-2 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-indigo-400 font-medium"
                      >
                        <option value="custom">Custom Amount (₹)</option>
                        <option value="extra_cost">At Extra Cost</option>
                        <option value="nil">NIL</option>
                        <option value="included">Included in Price</option>
                      </select>
                      {transportChargesType === "custom" ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 15000"
                          value={transportCharges}
                          onChange={(e) => setTransportCharges(e.target.value)}
                          className="w-1/2 px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-400"
                        />
                      ) : (
                        <div className="w-1/2 px-3 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-500 font-semibold text-xs flex items-center">
                          {transportChargesType === "extra_cost" && "At Extra Cost"}
                          {transportChargesType === "nil" && "NIL"}
                          {transportChargesType === "included" && "Included"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Packing & Forwarding Charges */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Packing &amp; Forwarding Charges</label>
                    <div className="flex gap-2">
                      <select
                        value={packingForwardingChargesType}
                        onChange={(e) => {
                          setPackingForwardingChargesType(e.target.value);
                          if (e.target.value !== "custom") setPackingForwardingCharges("");
                        }}
                        className="w-1/2 px-2 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-indigo-400 font-medium"
                      >
                        <option value="custom">Custom Amount (₹)</option>
                        <option value="extra_cost">At Extra Cost</option>
                        <option value="nil">NIL</option>
                        <option value="included">Included in Price</option>
                      </select>
                      {packingForwardingChargesType === "custom" ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 5000"
                          value={packingForwardingCharges}
                          onChange={(e) => setPackingForwardingCharges(e.target.value)}
                          className="w-1/2 px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-400"
                        />
                      ) : (
                        <div className="w-1/2 px-3 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-500 font-semibold text-xs flex items-center">
                          {packingForwardingChargesType === "extra_cost" && "At Extra Cost"}
                          {packingForwardingChargesType === "nil" && "NIL"}
                          {packingForwardingChargesType === "included" && "Included"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Loading & Unloading Charges */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Loading &amp; Unloading Charges</label>
                    <div className="flex gap-2">
                      <select
                        value={loadingUnloadingChargesType}
                        onChange={(e) => {
                          setLoadingUnloadingChargesType(e.target.value);
                          if (e.target.value !== "custom") setLoadingUnloadingCharges("");
                        }}
                        className="w-1/2 px-2 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-indigo-400 font-medium"
                      >
                        <option value="custom">Custom Amount (₹)</option>
                        <option value="extra_cost">At Extra Cost</option>
                        <option value="nil">NIL</option>
                        <option value="included">Included in Price</option>
                      </select>
                      {loadingUnloadingChargesType === "custom" ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 8000"
                          value={loadingUnloadingCharges}
                          onChange={(e) => setLoadingUnloadingCharges(e.target.value)}
                          className="w-1/2 px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-400"
                        />
                      ) : (
                        <div className="w-1/2 px-3 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-500 font-semibold text-xs flex items-center">
                          {loadingUnloadingChargesType === "extra_cost" && "At Extra Cost"}
                          {loadingUnloadingChargesType === "nil" && "NIL"}
                          {loadingUnloadingChargesType === "included" && "Included"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Insurance Charges */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Insurance Charges</label>
                    <div className="flex gap-2">
                      <select
                        value={insuranceChargesType}
                        onChange={(e) => {
                          setInsuranceChargesType(e.target.value);
                          if (e.target.value !== "custom") setInsuranceCharges("");
                        }}
                        className="w-1/2 px-2 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-indigo-400 font-medium"
                      >
                        <option value="custom">Custom Amount (₹)</option>
                        <option value="extra_cost">At Extra Cost</option>
                        <option value="nil">NIL</option>
                        <option value="included">Included in Price</option>
                      </select>
                      {insuranceChargesType === "custom" ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 3000"
                          value={insuranceCharges}
                          onChange={(e) => setInsuranceCharges(e.target.value)}
                          className="w-1/2 px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-400"
                        />
                      ) : (
                        <div className="w-1/2 px-3 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-500 font-semibold text-xs flex items-center">
                          {insuranceChargesType === "extra_cost" && "At Extra Cost"}
                          {insuranceChargesType === "nil" && "NIL"}
                          {insuranceChargesType === "included" && "Included"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Miscellaneous Charges */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Miscellaneous Charges</label>
                    <div className="flex gap-2">
                      <select
                        value={miscellaneousChargesType}
                        onChange={(e) => {
                          setMiscellaneousChargesType(e.target.value);
                          if (e.target.value !== "custom") setMiscellaneousCharges("");
                        }}
                        className="w-1/2 sm:w-1/4 px-2 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-indigo-400 font-medium"
                      >
                        <option value="custom">Custom Amount (₹)</option>
                        <option value="extra_cost">At Extra Cost</option>
                        <option value="nil">NIL</option>
                        <option value="included">Included in Price</option>
                      </select>
                      {miscellaneousChargesType === "custom" ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 2000"
                          value={miscellaneousCharges}
                          onChange={(e) => setMiscellaneousCharges(e.target.value)}
                          className="w-1/2 sm:w-3/4 px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-400"
                        />
                      ) : (
                        <div className="w-1/2 sm:w-3/4 px-3 py-1.5 rounded-md border border-slate-100 bg-slate-50 text-slate-500 font-semibold text-xs flex items-center">
                          {miscellaneousChargesType === "extra_cost" && "At Extra Cost"}
                          {miscellaneousChargesType === "nil" && "NIL"}
                          {miscellaneousChargesType === "included" && "Included"}
                        </div>
                      )}
                    </div>
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