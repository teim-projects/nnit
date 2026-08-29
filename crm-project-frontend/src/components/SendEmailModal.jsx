import React, { useState, useEffect, useMemo } from "react";
import { EMAIL_TEMPLATES, getAutoTemplateId } from "../utils/emailTemplates";
import { MdEmail, MdMessage, MdContentCopy, MdOpenInNew, MdSend, MdClose, MdCheckCircle } from "react-icons/md";
import { IoLogoWhatsapp } from "react-icons/io5";
import Swal from "sweetalert2";

export default function SendEmailModal({
  open,
  onClose,
  recipientEmail = "",
  recipientName = "",
  recipientPhone = "",
  siteName = "",
  requirements = "",
  quotationNo = "",
  amount = "",
  quotationId = null,
  versionId = null,
  followupCount = 0,
  type = "lead",
  initialChannel = "email", // "email" or "whatsapp"
  baseApi,
  token
}) {
  const [channel, setChannel] = useState(initialChannel); // "email" or "whatsapp"
  const [allTemplates, setAllTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [emailTo, setEmailTo] = useState(recipientEmail);
  const [phoneTo, setPhoneTo] = useState(recipientPhone);
  const [subject, setSubject] = useState("");
  const [activeTab, setActiveTab] = useState("html"); // "html" or "text"
  const [customText, setCustomText] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load custom templates from localStorage merged with defaults
  useEffect(() => {
    let custom = [];
    try {
      const saved = localStorage.getItem("nnit_custom_templates");
      if (saved) custom = JSON.parse(saved);
    } catch (e) {
      custom = [];
    }

    // Merge system defaults with custom templates
    const combined = [...custom];
    EMAIL_TEMPLATES.forEach(sysTpl => {
      if (!combined.some(c => c.id === sysTpl.id)) {
        combined.push({
          id: sysTpl.id,
          name: sysTpl.name,
          channel: "email",
          category: sysTpl.category || "leads",
          subject: sysTpl.subject,
          body: sysTpl.getText({ customerName: "{customer_name}", mobileNumber: "{mobile_number}", siteName: "{site_name}", quotationNo: "{quotation_no}", amount: "{amount}" })
        });
      }
    });

    setAllTemplates(combined);
  }, [open]);

  // Filter templates by current channel
  const availableTemplates = useMemo(() => {
    return allTemplates.filter(t => (t.channel || "email").toLowerCase() === channel);
  }, [allTemplates, channel]);

  // Reset and auto-select template when modal opens or channel changes
  useEffect(() => {
    if (open) {
      setEmailTo(recipientEmail || "");
      setPhoneTo(recipientPhone || "");
      setChannel(initialChannel || "email");

      const autoId = getAutoTemplateId({
        type: quotationId ? "quotation" : type,
        followupCount,
        quotationNo,
        amount,
        customerName: recipientName
      });

      // Find matching template in available list
      const matched = availableTemplates.find(t => t.id === autoId) || availableTemplates[0];
      if (matched) {
        setSelectedTemplateId(matched.id);
      }
    }
  }, [open, initialChannel, recipientEmail, recipientPhone, recipientName, followupCount, quotationNo, amount, type, quotationId, availableTemplates]);

  // Helper to replace dynamic placeholders
  const replacePlaceholders = (textStr = "") => {
    let res = String(textStr);
    res = res.replace(/\{customer_name\}|\{customername\}|\{name\}/gi, recipientName || "Valued Customer");
    res = res.replace(/\{mobile_number\}|\{mobile\}|\{contact_number\}|\{contact\}/gi, recipientPhone || "N/A");
    res = res.replace(/\{site_name\}|\{sitename\}|\{project_name\}/gi, siteName || "Project Site");
    res = res.replace(/\{requirements\}|\{requirement\}/gi, requirements || "Car Parking Systems & Automation");
    res = res.replace(/\{quotation_no\}|\{quotationno\}/gi, quotationNo || "Q-NNIT-2026");
    res = res.replace(/\{amount\}|\{total_amount\}/gi, amount || "N/A");
    res = res.replace(/\{sender_name\}/gi, "NNIT Support Team");
    return res;
  };

  // Current active template
  const currentTemplate = useMemo(() => {
    return availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];
  }, [availableTemplates, selectedTemplateId]);

  // Update subject and body text when template or inputs change
  useEffect(() => {
    if (currentTemplate) {
      setSubject(replacePlaceholders(currentTemplate.subject || ""));
      setCustomText(replacePlaceholders(currentTemplate.body || ""));
    } else {
      setSubject(quotationNo ? `Quotation ${quotationNo} — NNIT Car Parking Systems` : `Notice for ${recipientName || 'Customer'}`);
      setCustomText(`Dear ${recipientName || 'Customer'},\n\nPlease find details for ${quotationNo ? `Quotation ${quotationNo}` : 'your inquiry'}.\n\nBest Regards,\nNNIT Car Parking Systems`);
    }
  }, [currentTemplate, recipientName, recipientPhone, siteName, requirements, quotationNo, amount]);

  if (!open) return null;

  // Rendered HTML preview for Email channel
  const sysEmailTemplate = EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId);
  const renderedHtml = sysEmailTemplate
    ? sysEmailTemplate.getHtml({
        customerName: recipientName || "Valued Customer",
        mobileNumber: recipientPhone || "N/A",
        siteName: siteName || "Project Site",
        requirements: requirements || "Car Parking Systems",
        quotationNo: quotationNo || "Q-NNIT-2026",
        amount: amount || "N/A"
      })
    : `
<!DOCTYPE html>
<html>
<head><style>body{font-family:sans-serif;padding:20px;color:#333;}.card{background:#fff;border-radius:10px;padding:20px;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.05);}.hdr{background:#4f46e5;color:#fff;padding:15px;border-radius:8px;text-align:center;font-weight:bold;margin-bottom:15px;}</style></head>
<body>
  <div class="card">
    <div class="hdr">NNIT Car Parking Systems</div>
    <div style="white-space:pre-wrap;line-height:1.6;">${customText}</div>
  </div>
</body>
</html>`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Swal.fire({ icon: "success", title: "Copied!", text: "Message text copied to clipboard.", timer: 1200, showConfirmButton: false });
  };

  const handleOpenWhatsApp = () => {
    if (!phoneTo) {
      Swal.fire({ icon: "warning", title: "Missing Contact", text: "No contact number available for WhatsApp." });
      return;
    }
    const cleanNumber = phoneTo.replace(/[^0-9]/g, '');
    const whatsappNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(customText)}`;
    window.open(url, '_blank');
  };

  const handleOpenMailto = () => {
    if (!emailTo) {
      Swal.fire({ icon: "warning", title: "Missing Email", text: "Please enter a valid recipient email address." });
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(customText)}`;
    window.location.href = mailtoUrl;
  };

  const handleSendDirectApi = async () => {
    if (channel === "whatsapp") {
      handleOpenWhatsApp();
      return;
    }

    if (!emailTo) {
      Swal.fire({ icon: "warning", title: "Missing Email", text: "Please enter a valid recipient email address." });
      return;
    }

    setSending(true);
    try {
      const authToken = token || localStorage.getItem("access");
      const baseApiUrl = baseApi || import.meta.env.VITE_BASE_API_URL;
      
      let url = `${baseApiUrl}/lead/send-email/`;
      let payload = {
        recipient_email: emailTo,
        subject: subject,
        html_content: renderedHtml,
        text_content: customText
      };

      if (quotationId) {
        url = `${baseApiUrl}/api/quotation/quotation/${quotationId}/send-email/`;
        payload = {
          email: emailTo,
          recipient_email: emailTo,
          subject: subject,
          html_content: renderedHtml,
          text_content: customText,
          note: customText,
          version_id: versionId
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();

      if (!res.ok || resData.error || (resData.detail && resData.detail.toLowerCase().includes("failed"))) {
        Swal.fire({
          icon: "error",
          title: "Email Delivery Failed",
          text: resData.error || resData.detail || "Could not deliver email to recipient. Please check recipient address or credentials.",
          confirmButtonColor: "#ef4444"
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Email Sent Successfully!",
        text: resData.message || resData.detail || `Email dispatched with PDF attachment to ${emailTo}`,
        confirmButtonColor: "#4f46e5"
      });
      onClose();
    } catch (err) {
      console.warn("Direct API Email dispatch error:", err);
      Swal.fire({
        icon: "error",
        title: "Network / Server Error",
        text: err.message || "Failed to connect to email service."
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header with Channel Switcher */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              {channel === "whatsapp" ? <IoLogoWhatsapp className="w-6 h-6 text-emerald-400" /> : <MdEmail className="w-6 h-6 text-sky-400" />}
            </div>
            <div>
              <h3 className="text-lg font-bold">Send Template Message</h3>
              <p className="text-xs text-indigo-100 opacity-90">Auto-filled template generator for Leads & Customers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors">
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Channel Selection Bar */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChannel("email")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                channel === "email"
                  ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <MdEmail className="w-4 h-4 text-sky-500" />
              Email Channel
            </button>
            <button
              onClick={() => setChannel("whatsapp")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                channel === "whatsapp"
                  ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <IoLogoWhatsapp className="w-4 h-4 text-emerald-500" />
              WhatsApp Channel
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-500">
            Recipient: <strong className="text-slate-800">{recipientName || "Customer"}</strong>
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Top Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {channel === "whatsapp" ? "Recipient Mobile Number" : "Recipient Email Address"}
              </label>
              {channel === "whatsapp" ? (
                <input
                  type="text"
                  value={phoneTo}
                  onChange={(e) => setPhoneTo(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              ) : (
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Template ({availableTemplates.length} available)
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 shadow-sm"
              >
                {availableTemplates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Line (Email Only) */}
          {channel === "email" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
              />
            </div>
          )}

          {/* Preview Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pt-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("html")}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                  activeTab === "html"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {channel === "whatsapp" ? "Formatted Message Preview" : "Visual HTML Card Preview"}
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                  activeTab === "text"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Edit Raw Message Text
              </button>
            </div>

            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              {copied ? <MdCheckCircle className="w-4 h-4 text-emerald-600" /> : <MdContentCopy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Text"}
            </button>
          </div>

          {/* Tab Views */}
          {activeTab === "html" && channel === "email" ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 max-h-[320px] overflow-y-auto shadow-inner">
              <iframe title="Email Preview" srcDoc={renderedHtml} className="w-full min-h-[300px] bg-transparent border-0" />
            </div>
          ) : (
            <textarea
              rows={10}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-3.5 text-xs font-mono bg-slate-900 text-slate-100 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors">
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {channel === "whatsapp" ? (
              <button
                onClick={handleOpenWhatsApp}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <IoLogoWhatsapp className="w-4 h-4" />
                Send via WhatsApp Web / App
              </button>
            ) : (
              <>
                <button
                  onClick={handleOpenMailto}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  <MdOpenInNew className="w-4 h-4" />
                  Open in Gmail / App
                </button>

                <button
                  onClick={handleSendDirectApi}
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                >
                  <MdSend className="w-4 h-4" />
                  {sending ? "Sending..." : "Send Direct Email"}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
