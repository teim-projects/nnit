import React, { useState, useEffect } from "react";
import Base from "../components/Base";
import { EMAIL_TEMPLATES } from "../utils/emailTemplates";
import { MdAdd, MdEdit, MdDelete, MdRemoveRedEye, MdEmail, MdMessage, MdContentCopy, MdClose, MdCheckCircle } from "react-icons/md";
import Swal from "sweetalert2";

export default function TemplateManagement() {
  const [templates, setTemplates] = useState([]);
  const [filterChannel, setFilterChannel] = useState("all"); // "all", "email", "whatsapp"
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formChannel, setFormChannel] = useState("email");
  const [formCategory, setFormCategory] = useState("leads");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");

  // Initial template seed
  useEffect(() => {
    const saved = localStorage.getItem("nnit_custom_templates");
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        initDefaultTemplates();
      }
    } else {
      initDefaultTemplates();
    }
  }, []);

  const initDefaultTemplates = () => {
    const defaults = [
      {
        id: "tpl_1",
        name: "Service WhatsApp Template",
        channel: "whatsapp",
        category: "services",
        subject: "None",
        body: "Hello {customer_name}, your service call for site {site_name} has been scheduled for tomorrow. - NNIT Support"
      },
      {
        id: "tpl_2",
        name: "Hot Lead WhatsApp",
        channel: "whatsapp",
        category: "leads",
        subject: "None",
        body: "Hi {customer_name}, thanks for inquiring about NNIT Car Parking Systems for {site_name}. Can we discuss your layout requirements today?"
      },
      {
        id: "tpl_3",
        name: "Service Schedule Email",
        channel: "email",
        category: "services",
        subject: "Service Schedule - {customer_name}",
        body: "Dear {customer_name},\n\nYour service call for {site_name} is scheduled. Contact: {mobile_number}.\n\nBest Regards,\nNNIT Team"
      },
      {
        id: "tpl_4",
        name: "Quotation WhatsApp",
        channel: "whatsapp",
        category: "quotations",
        subject: "None",
        body: "Dear {customer_name}, your official quotation {quotation_no} for ₹{amount} is ready. Please review details."
      },
      {
        id: "tpl_5",
        name: "Quotation Email",
        channel: "email",
        category: "quotations",
        subject: "Hello {customer_name} - Official Quotation {quotation_no}",
        body: "Dear {customer_name},\n\nPlease find our official commercial quotation {quotation_no} for amount ₹{amount} for site {site_name}.\n\nBest Regards,\nNNIT Car Parking Systems"
      },
      ...EMAIL_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        channel: "email",
        category: t.category || "leads",
        subject: t.subject,
        body: t.getText({ customerName: "{customer_name}", mobileNumber: "{mobile_number}", siteName: "{site_name}", quotationNo: "{quotation_no}", amount: "{amount}" })
      }))
    ];
    setTemplates(defaults);
    localStorage.setItem("nnit_custom_templates", JSON.stringify(defaults));
  };

  const saveToStorage = (updated) => {
    setTemplates(updated);
    localStorage.setItem("nnit_custom_templates", JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormChannel("email");
    setFormCategory("leads");
    setFormSubject("");
    setFormBody("");
    setShowModal(true);
  };

  const handleOpenEdit = (tpl) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormChannel(tpl.channel || "email");
    setFormCategory(tpl.category || "leads");
    setFormSubject(tpl.subject || "");
    setFormBody(tpl.body || "");
    setShowModal(true);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete Template?",
      text: "This template will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#ef4444"
    }).then((res) => {
      if (res.isConfirmed) {
        const updated = templates.filter(t => t.id !== id);
        saveToStorage(updated);
        Swal.fire({ icon: "success", title: "Deleted!", timer: 1000, showConfirmButton: false });
      }
    });
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      Swal.fire({ icon: "warning", title: "Required", text: "Please enter a template name." });
      return;
    }

    if (editingTemplate) {
      const updated = templates.map(t => t.id === editingTemplate.id ? {
        ...t,
        name: formName,
        channel: formChannel,
        category: formCategory,
        subject: formSubject || (formChannel === 'whatsapp' ? 'None' : ''),
        body: formBody
      } : t);
      saveToStorage(updated);
      Swal.fire({ icon: "success", title: "Template Updated!", timer: 1200, showConfirmButton: false });
    } else {
      const newTpl = {
        id: `tpl_${Date.now()}`,
        name: formName,
        channel: formChannel,
        category: formCategory,
        subject: formSubject || (formChannel === 'whatsapp' ? 'None' : ''),
        body: formBody
      };
      saveToStorage([newTpl, ...templates]);
      Swal.fire({ icon: "success", title: "Template Created!", timer: 1200, showConfirmButton: false });
    }
    setShowModal(false);
  };

  const insertPlaceholder = (tag) => {
    setFormBody(prev => prev + " " + tag);
  };

  const filteredTemplates = templates.filter(t => {
    if (filterChannel === "email") return t.channel === "email";
    if (filterChannel === "whatsapp") return t.channel === "whatsapp";
    return true;
  });

  return (
    <Base title="Message & Email Templates">
      <div className="space-y-6">
        
        {/* Top Header Toolbar */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Message Templates Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Create, edit, and organize email and WhatsApp templates with dynamic placeholders
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-md hover:shadow-indigo-200"
          >
            <MdAdd className="w-5 h-5" />
            Create Template
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterChannel("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterChannel === "all"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            All Templates ({templates.length})
          </button>
          <button
            onClick={() => setFilterChannel("email")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterChannel === "email"
                ? "bg-sky-600 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <MdEmail className="w-4 h-4" />
            Email Templates ({templates.filter(t => t.channel === "email").length})
          </button>
          <button
            onClick={() => setFilterChannel("whatsapp")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterChannel === "whatsapp"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <MdMessage className="w-4 h-4" />
            WhatsApp Templates ({templates.filter(t => t.channel === "whatsapp").length})
          </button>
        </div>

        {/* Main Templates Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Template Name</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-sm">
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No templates found. Click "Create Template" to add one!
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {tpl.name}
                      </td>

                      <td className="py-3 px-4">
                        {tpl.channel === "whatsapp" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                            <MdMessage className="w-3.5 h-3.5" />
                            WhatsApp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-bold">
                            <MdEmail className="w-3.5 h-3.5" />
                            Email
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="capitalize px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">
                          {tpl.category || "General"}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-600 max-w-xs truncate">
                        {tpl.subject || "None"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(tpl)}
                            className="p-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-md transition-colors shadow-sm"
                            title="Edit Template"
                          >
                            <MdEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPreviewTemplate(tpl)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md transition-colors"
                            title="View Preview"
                          >
                            <MdRemoveRedEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tpl.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md transition-colors"
                            title="Delete Template"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Create / Edit Template Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Service Schedule Email"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Channel</label>
                  <select
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="leads">Leads / Enquiries</option>
                    <option value="followups">Follow-ups</option>
                    <option value="quotations">Quotations</option>
                    <option value="customers">Customers</option>
                    <option value="services">Services</option>
                    <option value="payments">Payments / AMC</option>
                  </select>
                </div>
              </div>

              {formChannel === "email" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. Service schedule - {customer_name}"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">Message Body</label>
                  <span className="text-[11px] text-indigo-600 font-medium">Click chip to insert placeholder</span>
                </div>

                {/* Placeholder Chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["{customer_name}", "{mobile_number}", "{site_name}", "{quotation_no}", "{amount}"].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => insertPlaceholder(tag)}
                      className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-mono transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={6}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Enter template message text..."
                  className="w-full p-3 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Preview: {previewTemplate.name}</h3>
              <button onClick={() => setPreviewTemplate(null)} className="text-white/80 hover:text-white">
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div><strong>Channel:</strong> <span className="uppercase text-xs font-bold text-indigo-600">{previewTemplate.channel}</span></div>
              <div><strong>Subject:</strong> <span className="font-mono text-xs text-slate-700">{previewTemplate.subject || "None"}</span></div>
              <div>
                <strong>Body Text:</strong>
                <pre className="mt-1 p-3 bg-slate-100 rounded-lg text-xs font-mono whitespace-pre-wrap text-slate-800 border border-slate-200">
                  {previewTemplate.body}
                </pre>
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </Base>
  );
}
