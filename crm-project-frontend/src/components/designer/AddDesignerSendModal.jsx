import React, { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { FiSend, FiPaperclip, FiTrash2, FiCamera, FiUploadCloud } from "react-icons/fi";
import { resolveUserDisplayName, getCurrentUserDisplayName, healDesignRequests, isSameDesignRequest } from "../../utils/auth";
import { safeSaveDesignRequests } from "../../utils/designFileStorage";
import Swal from "sweetalert2";

export default function AddDesignerSendModal({
  open,
  onClose,
  onSuccess,
  baseApi,
  token = "",
  initialData = null,
}) {
  if (!open) return null;

  const [availableLeads, setAvailableLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [salesPersonName, setSalesPersonName] = useState(() => {
    return initialData?.salesPersonName || getCurrentUserDisplayName() || "";
  });

  const [formData, setFormData] = useState({
    salutation: "M/s.",
    clientCoName: "",
    projectName: "",
    projectAddress: "",
    contactPersonSalutation: "MS.",
    contactPerson: "",
    contactNumber: "",
    requirements: "",
    quantity: "As per STD",
    remark: "-",
    layoutFile: null,
    layoutFileName: "",
    layoutPreview: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically resolve logged in user's real name if missing or placeholder
  useEffect(() => {
    let active = true;
    const resolveCurrentUser = async () => {
      const stored = localStorage.getItem("user_name");
      if (stored && stored !== "Sales Person") {
        if (active) setSalesPersonName(stored);
        return;
      }
      const t = token || localStorage.getItem("access");
      const api = baseApi || import.meta.env.VITE_BASE_API_URL;
      if (!api || !t) return;

      try {
        const res = await fetch(`${api.replace(/\/$/, "")}/auth/me/`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (res.ok) {
          const user = await res.json();
          const resolved = resolveUserDisplayName(user);
          if (resolved) {
            localStorage.setItem("user_name", resolved);
            if (active) setSalesPersonName(resolved);
            healDesignRequests(resolved);
          }
        }
      } catch (err) {
        console.warn("Could not fetch user name in modal:", err);
      }
    };
    resolveCurrentUser();
    return () => { active = false; };
  }, [baseApi, token]);

  // Fetch active leads for quick pre-fill
  useEffect(() => {
    let isMounted = true;
    const fetchLeads = async () => {
      if (!baseApi) return;
      setLoadingLeads(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${baseApi.replace(/\/$/, "")}/lead/lead/?page_size=300`, { headers });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.results || [];
          if (isMounted) setAvailableLeads(list);
        }
      } catch (err) {
        console.warn("Failed to fetch leads for prefill:", err);
      } finally {
        if (isMounted) setLoadingLeads(false);
      }
    };
    fetchLeads();
    return () => { isMounted = false; };
  }, [baseApi, token]);

  // Load initialData if editing
  useEffect(() => {
    if (initialData) {
      const client = initialData.clientCoName || initialData.customerName || initialData.company_name || initialData.customer_name || "";
      const contact = initialData.contactPerson || initialData.contact_person_name || "";

      // Extract salutation if already prefixed
      let sal = initialData.salutation || "M/s.";
      let clientClean = client;
      if (client.startsWith("M/s.")) {
        sal = "M/s.";
        clientClean = client.replace(/^M\/s\.\s*/i, "");
      }

      let cSal = initialData.contactPersonSalutation || "MS.";
      let contactClean = contact;
      if (contact.startsWith("MS.")) {
        cSal = "MS.";
        contactClean = contact.replace(/^MS\.\s*/i, "");
      } else if (contact.startsWith("Mr.")) {
        cSal = "Mr.";
        contactClean = contact.replace(/^Mr\.\s*/i, "");
      }

      setFormData({
        salutation: sal,
        clientCoName: clientClean,
        projectName: initialData.projectName || initialData.project_name || "",
        projectAddress: initialData.projectAddress || initialData.project_adderess || initialData.site_location || initialData.location || "",
        contactPersonSalutation: cSal,
        contactPerson: contactClean,
        contactNumber: initialData.contactNumber || initialData.contact_person_number || initialData.customer_contact || "",
        requirements: initialData.requirements || initialData.requirements_details || initialData.site_requirement || "",
        quantity: initialData.quantity || "As per STD",
        remark: initialData.remark || initialData.remarks || "-",
        layoutFile: null,
        layoutFileName: initialData.customerLayoutName || initialData.customer_layout_name || "",
        layoutPreview: initialData.customerLayoutUrl || initialData.customer_layout || "",
      });
      if (initialData.leadId) setSelectedLeadId(String(initialData.leadId));
    } else {
      // Default sample values matching the user's form if empty
      setFormData({
        salutation: "M/s.",
        clientCoName: "",
        projectName: "",
        projectAddress: "",
        contactPersonSalutation: "MS.",
        contactPerson: "",
        contactNumber: "",
        requirements: "",
        quantity: "As per STD",
        remark: "-",
        layoutFile: null,
        layoutFileName: "",
        layoutPreview: "",
      });
      setSelectedLeadId("");
    }
  }, [initialData]);

  // Handle lead prefill selection
  const handleLeadSelect = (e) => {
    const leadId = e.target.value;
    setSelectedLeadId(leadId);
    if (!leadId) return;

    const lead = availableLeads.find((l) => String(l.id) === String(leadId));
    if (lead) {
      const coName = lead.company_name || lead.customer_name || lead.customer?.name || "";
      const contactPerson = lead.contact_person_name || lead.customer_name || "";
      const req = lead.site_requirement || lead.requirements_details || "";

      setFormData((prev) => ({
        ...prev,
        clientCoName: coName.replace(/^M\/s\.\s*/i, ""),
        projectName: lead.project_name || "",
        projectAddress: lead.site_location || lead.project_adderess || lead.customer_address || lead.customer?.site_address || "",
        contactPerson: contactPerson.replace(/^(MS\.|Mr\.|Mrs\.)\s*/i, ""),
        contactNumber: lead.contact_person_number || lead.customer_contact || lead.customer?.contact_number || "",
        requirements: req || prev.requirements,
        layoutFileName: lead.customer_layout_name || lead.cad_file_name || "",
        layoutPreview: lead.customer_layout_url || lead.customer_layout || lead.cad_file || "",
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isImg = file.type.startsWith("image/");
      setFormData((prev) => ({
        ...prev,
        layoutFile: file,
        layoutFileName: file.name,
        layoutPreview: isImg ? URL.createObjectURL(file) : "",
      }));
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      layoutFile: null,
      layoutFileName: "",
      layoutPreview: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientCoName.trim()) {
      Swal.fire("Required", "Please enter Client/Co Name", "warning");
      return;
    }
    if (!formData.projectName.trim()) {
      Swal.fire("Required", "Please enter Project Name", "warning");
      return;
    }
    if (!formData.contactPerson.trim()) {
      Swal.fire("Required", "Please enter Contact Person Name", "warning");
      return;
    }
    if (!formData.contactNumber.trim()) {
      Swal.fire("Required", "Please enter Contact Number", "warning");
      return;
    }
    if (!formData.requirements.trim()) {
      Swal.fire("Required", "Please enter Requirements", "warning");
      return;
    }

    setIsSubmitting(true);

    const fullClientName = `${formData.salutation} ${formData.clientCoName.trim()}`.trim();
    const fullContactPerson = `${formData.contactPersonSalutation} ${formData.contactPerson.trim()}`.trim();
    const newId = initialData?.id || `DS-${Math.floor(100 + Math.random() * 900)}`;

    try {
      // 1. If backend lead endpoint is available, call send-to-designer API
      if (baseApi && selectedLeadId) {
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const bodyPayload = {
            project_name: formData.projectName.trim(),
            location: formData.projectAddress.trim(),
            requirements: `${formData.requirements.trim()} | Qty: ${formData.quantity.trim()} | Note: ${formData.remark.trim()}`,
            requirements_details: formData.requirements.trim(),
            customer_layout_name: formData.layoutFileName,
            customer_layout_url: formData.layoutPreview,
            is_sent: true,
            is_received: false,
          };

          if (formData.layoutFile) {
            const formDataObj = new FormData();
            Object.keys(bodyPayload).forEach((k) => formDataObj.append(k, bodyPayload[k]));
            formDataObj.append("customer_layout", formData.layoutFile);
            await fetch(`${baseApi.replace(/\/$/, "")}/lead/lead/${selectedLeadId}/send-to-designer/`, {
              method: "POST",
              headers,
              body: formDataObj,
            });
          } else {
            headers["Content-Type"] = "application/json";
            await fetch(`${baseApi.replace(/\/$/, "")}/lead/lead/${selectedLeadId}/send-to-designer/`, {
              method: "POST",
              headers,
              body: JSON.stringify(bodyPayload),
            });
          }
        } catch (apiErr) {
          console.warn("Direct backend lead update notification:", apiErr);
        }
      }

      // 2. Persist in local storage nnit_design_requests for instant designer queue sync
      const existing = JSON.parse(localStorage.getItem("nnit_design_requests") || "[]");
      const record = {
        id: newId,
        reqNo: newId,
        leadId: selectedLeadId || null,
        salutation: formData.salutation,
        clientCoName: fullClientName,
        customerName: fullClientName,
        projectName: formData.projectName.trim(),
        projectAddress: formData.projectAddress.trim(),
        location: formData.projectAddress.trim(),
        contactPersonSalutation: formData.contactPersonSalutation,
        contactPerson: fullContactPerson,
        contactNumber: formData.contactNumber.trim(),
        requirements: formData.requirements.trim(),
        quantity: formData.quantity.trim() || "As per STD",
        remark: formData.remark.trim() || "-",
        customerLayoutName: formData.layoutFileName,
        customerLayoutUrl: formData.layoutPreview,
        created_by_id: initialData?.created_by_id || localStorage.getItem("user_id") || null,
        userId: initialData?.userId || localStorage.getItem("user_id") || null,
        salesPersonName: (salesPersonName || localStorage.getItem("user_name") || getCurrentUserDisplayName() || "Sales Person").trim(),
        salesPersonEmail: initialData?.salesPersonEmail || localStorage.getItem("user_email") || "",
        status: initialData?.status || "pending_drawing",
        is_sent: 1,
        is_received: initialData?.is_received ? 1 : 0,
        sentDate: initialData?.sentDate || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        drawingTitle: initialData?.drawingTitle || "",
        drawingSpecs: initialData?.drawingSpecs || "",
        drawingUrl: initialData?.drawingUrl || "",
        designerNotes: initialData?.designerNotes || "",
      };

      let updatedList;
      if (initialData?.id) {
        updatedList = existing.map((item) => (isSameDesignRequest(item, initialData) ? { ...item, ...record } : item));
      } else {
        updatedList = [record, ...existing.filter((item) => !isSameDesignRequest(item, record))];
      }

      safeSaveDesignRequests(updatedList);

      // Trigger app-wide event for real-time reactivity
      window.dispatchEvent(new Event("designRequestUpdated"));
      window.dispatchEvent(new Event("storage"));

      // Heal existing requests if any were saved as "Sales Person"
      if (record.salesPersonName && record.salesPersonName !== "Sales Person") {
        healDesignRequests(record.salesPersonName);
      }

      Swal.fire({
        icon: "success",
        title: initialData ? "Request Updated!" : "Sent to Designer!",
        text: `Design request for "${formData.projectName}" has been successfully sent to the Designer Queue.`,
        timer: 2000,
        showConfirmButton: false,
      });

      if (onSuccess) onSuccess(record);
      onClose();
    } catch (err) {
      console.error("Submission failed:", err);
      Swal.fire("Error", "Could not complete submission: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-300 flex flex-col my-auto max-h-[92vh]">
        {/* Header - Sleek Dark Theme */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-700 shrink-0 text-white">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl text-indigo-300">
              🎨
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {initialData ? "Edit Designer Request" : "Send Request to Designer"}
              </h2>
              <p className="text-xs text-slate-300">
                Provide client requirements, layout, and drawing details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lead Prefill Selector */}
            <div className="bg-white border border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Optional: Select Existing Lead to Pre-fill
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically fills Client Name, Project, Contact, and Requirements
                </p>
              </div>
              <select
                value={selectedLeadId}
                onChange={handleLeadSelect}
                disabled={loadingLeads}
                className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 shadow-xs"
              >
                <option value="">-- Choose Lead (or Manual) --</option>
                {availableLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    #{l.id} - {l.company_name || l.customer_name || l.customer?.name || "Lead"} ({l.project_name || "Project"})
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Person Info Bar */}
            <div className="bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border border-indigo-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  👤
                </span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    Sending As (Sales Person)
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {salesPersonName || "Detecting user..."}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 font-semibold whitespace-nowrap">Sales Person Name:</label>
                <input
                  type="text"
                  required
                  value={salesPersonName}
                  onChange={(e) => setSalesPersonName(e.target.value)}
                  placeholder="e.g., Bharat, Jigar Patel"
                  className="text-xs font-bold px-3 py-1.5 border border-indigo-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[170px] text-slate-800"
                />
              </div>
            </div>

            {/* 1. Client & Project Details */}
            <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-150">
                1. Client & Project Information
              </h3>

              {/* Client/Co Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Client/Co Name <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.salutation}
                    onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                    className="w-24 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="M/s.">M/s.</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="">None</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Shree Associate"
                    value={formData.clientCoName}
                    onChange={(e) => setFormData({ ...formData, clientCoName: e.target.value })}
                    className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Project Name & Project Address in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Avdhut Residency"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Project Add (Location/Address)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Guruwar peth"
                    value={formData.projectAddress}
                    onChange={(e) => setFormData({ ...formData, projectAddress: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Contact Details */}
            <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-150">
                2. Contact Person Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Person */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.contactPersonSalutation}
                      onChange={(e) => setFormData({ ...formData, contactPersonSalutation: e.target.value })}
                      className="w-20 px-2.5 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="MS.">MS.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="M/s.">M/s.</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Jigar Patel"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Contact No. */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Contact No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., 9890907870"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. Requirements, Quantity & Remarks */}
            <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-150">
                3. Technical Requirements & Specifications
              </h3>

              {/* Requirements 's */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Requirements 's <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g., 2DP101 STACK & 3DP304 STACK & CANTILEVER CP401"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 leading-relaxed font-mono"
                />
              </div>

              {/* Quantity & Remark in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., As per STD"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    Remark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., -"
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Customer Layout / Drawing File */}
            <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs">
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Customer Layout / Reference Drawing (optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload CAD file (.dwg/.dxf), PDF layout, or site sketch for the designer
              </p>

              {formData.layoutFileName ? (
                <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      📄
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-indigo-950 truncate">
                        {formData.layoutFileName}
                      </p>
                      <p className="text-xs text-indigo-600">Attachment Ready</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Remove File"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/30 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition group">
                  <FiUploadCloud className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 transition" />
                  <p className="text-sm font-medium text-gray-700 mt-2">
                    Click to browse or drop drawing/layout file here
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Supports DWG, DXF, PDF, JPG, PNG up to 50MB
                  </p>
                  <input
                    type="file"
                    accept=".dwg,.dxf,.pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-300 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <FiSend className="w-4 h-4" />
                {isSubmitting ? "Sending..." : initialData ? "Save Changes" : "Send to Designer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
