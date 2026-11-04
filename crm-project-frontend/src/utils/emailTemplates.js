/**
 * Email Templates definition for NNIT Car Parking Systems & HVAC Solutions.
 * Uses public HTTPS image URL for header banner (NO email file attachments!).
 */

export const HEADER_BANNER_URL = "https://files.catbox.moe/4i67y4.jpg";

export const EMAIL_TEMPLATES = [
  {
    id: "lead_welcome",
    name: "📩 New Lead / Welcome Enquiry",
    category: "leads",
    subject: "Thank you for your enquiry with NNIT Car Parking Systems",
    getText: (data) => `Dear ${data.customerName || 'Valued Customer'},

Thank you for reaching out to NNIT Car Parking Systems & HVAC Solutions!

We have received your enquiry for ${data.siteName || 'your project site'}. Our engineering team is currently reviewing your requirements and will reach out to you shortly at ${data.mobileNumber || 'your registered number'}.

Key Project Details:
- Customer Name: ${data.customerName || 'N/A'}
- Mobile: ${data.mobileNumber || 'N/A'}
- Site / Project: ${data.siteName || 'N/A'}
- Requirements: ${data.requirements || 'Car Parking System & Smart Automation'}

Should you have any immediate questions, please feel free to reply to this email or call us directly.

Best Regards,
Sales & Customer Support Team
NNIT Car Parking Systems
Phone: +91 98765 43210
Website: www.nnitparking.com`,
    getHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header-banner { width: 100%; display: block; border-radius: 12px 12px 0 0; border: 0; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 15px; }
    .info-box { background: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 6px; margin: 20px 0; }
    .info-row { display: flex; margin-bottom: 8px; font-size: 14px; }
    .info-label { font-weight: 600; width: 140px; color: #64748b; }
    .info-val { color: #0f172a; font-weight: 500; }
    .footer { background: #0f172a; color: #94a3b8; padding: 20px 25px; text-align: center; font-size: 12px; }
    .footer a { color: #818cf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${HEADER_BANNER_URL}" alt="NNIT Car Parking Systems Header" class="header-banner" />
    <div class="content">
      <div class="greeting">Dear ${data.customerName || 'Valued Customer'},</div>
      <p>Thank you for expressing interest in <strong>NNIT Car Parking Systems</strong>! We are delighted to assist you with high-performance automated parking and HVAC solutions.</p>
      
      <div class="info-box">
        <div class="info-row"><span class="info-label">Customer Name:</span> <span class="info-val">${data.customerName || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Contact Number:</span> <span class="info-val">${data.mobileNumber || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Site / Project:</span> <span class="info-val">${data.siteName || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Requirements:</span> <span class="info-val">${data.requirements || 'Multilevel Stacker / Puzzle Parking System'}</span></div>
      </div>

      <p>Our technical team is reviewing your project details and will connect with you shortly to schedule an initial consultation or site survey.</p>

      <p style="margin-top: 25px;">Warm regards,<br><strong>Sales & Technical Team</strong><br>NNIT Car Parking Systems</p>
    </div>
    <div class="footer">
      &copy; 2026 NNIT Car Parking Systems. All rights reserved.<br>
      Contact: +91 98765 43210 | Email: <a href="mailto:info@nnitparking.com">info@nnitparking.com</a>
    </div>
  </div>
</body>
</html>`
  },

  {
    id: "lead_followup_1",
    name: "🔄 1st Follow-Up Email",
    category: "leads",
    subject: "Following up on your parking system enquiry — NNIT",
    getText: (data) => `Dear ${data.customerName || 'Valued Customer'},

I hope this email finds you well.

I am following up regarding your enquiry for ${data.siteName || 'your project'}. We would love to discuss how our automated stacker & puzzle parking solutions can optimize your parking space efficiency.

Project Summary:
- Customer Name: ${data.customerName || 'N/A'}
- Mobile: ${data.mobileNumber || 'N/A'}
- Project / Site: ${data.siteName || 'N/A'}

Could we schedule a brief 10-minute call or site inspection this week? Please let us know your preferred time.

Best Regards,
${data.senderName || 'Pravin Dare'}
NNIT Car Parking Systems
Phone: +91 98765 43210`,
    getHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header-banner { width: 100%; display: block; border-radius: 12px 12px 0 0; border: 0; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 12px; margin-bottom: 15px; }
    .info-box { background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px; border-radius: 6px; margin: 20px 0; }
    .footer { background: #0f172a; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${HEADER_BANNER_URL}" alt="NNIT Car Parking Systems Header" class="header-banner" />
    <div class="content">
      <span class="badge">FIRST FOLLOW-UP</span>
      <div style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">Dear ${data.customerName || 'Valued Customer'},</div>
      <p>I am reaching out to follow up on your recent enquiry regarding <strong>${data.siteName || 'your parking infrastructure project'}</strong>.</p>
      
      <p>At NNIT, we design custom multi-level parking systems (Stacker, Pit, & Puzzle Parking) tailored to maximize space and lower cost per car bay.</p>

      <div class="info-box">
        <div><strong>Customer:</strong> ${data.customerName || 'N/A'}</div>
        <div><strong>Mobile:</strong> ${data.mobileNumber || 'N/A'}</div>
        <div><strong>Site / Location:</strong> ${data.siteName || 'N/A'}</div>
      </div>

      <p>Would you be available for a short 10-minute call or site survey this week? Let us know your preferred date and time.</p>

      <p style="margin-top: 25px;">Best Regards,<br><strong>${data.senderName || 'NNIT Support Team'}</strong><br>NNIT Car Parking Systems</p>
    </div>
    <div class="footer">
      NNIT Car Parking Systems | +91 98765 43210 | info@nnitparking.com
    </div>
  </div>
</body>
</html>`
  },

  {
    id: "lead_followup_2",
    name: "🔄 2nd Follow-Up Email",
    category: "leads",
    subject: "Update regarding your project proposal — NNIT Car Parking",
    getText: (data) => `Dear ${data.customerName || 'Valued Customer'},

I wanted to send a quick second follow-up regarding your project for ${data.siteName || 'your site'}.

We have recently finalized structural layouts and cost options for similar projects that might match your requirements.

Customer: ${data.customerName || 'N/A'} (${data.mobileNumber || 'N/A'})
Site: ${data.siteName || 'N/A'}

Please let us know if you would like us to share a customized proposal or visit your site for precise layout measurements.

Best Regards,
${data.senderName || 'NNIT Team'}
Phone: +91 98765 43210`,
    getHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header-banner { width: 100%; display: block; border-radius: 12px 12px 0 0; border: 0; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .badge { display: inline-block; background: #fef3c7; color: #b45309; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 12px; margin-bottom: 15px; }
    .highlight-box { background: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
    .footer { background: #0f172a; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${HEADER_BANNER_URL}" alt="NNIT Car Parking Systems Header" class="header-banner" />
    <div class="content">
      <span class="badge">SECOND FOLLOW-UP</span>
      <div style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">Dear ${data.customerName || 'Valued Customer'},</div>
      <p>I am sending a quick follow-up regarding your planned parking installation at <strong>${data.siteName || 'your site'}</strong>.</p>
      
      <div class="highlight-box">
        <strong>Project Contact:</strong> ${data.customerName || 'N/A'} (${data.mobileNumber || 'N/A'})<br>
        <strong>Location:</strong> ${data.siteName || 'N/A'}<br>
        <strong>Status:</strong> Ready for layout design & quotation
      </div>

      <p>Our design team can provide a free 2D/3D layout diagram showing how many additional car bays can be created at your site.</p>

      <p>Are you available for a brief conversation tomorrow?</p>

      <p style="margin-top: 25px;">Best Regards,<br><strong>${data.senderName || 'NNIT Team'}</strong><br>NNIT Car Parking Systems</p>
    </div>
    <div class="footer">
      NNIT Car Parking Systems | +91 98765 43210 | info@nnitparking.com
    </div>
  </div>
</body>
</html>`
  },

  {
    id: "quotation_sent",
    name: "📄 Quotation Delivery",
    category: "quotations",
    subject: `Official Quotation ${'${data.quotationNo ? "#" + data.quotationNo : ""}'} — NNIT Car Parking Systems`,
    getText: (data) => `Dear ${data.customerName || 'Valued Customer'},

Please find attached/below our official quotation for your project.

Quotation Details:
- Quotation No: ${data.quotationNo || 'Q-NNIT-2026'}
- Customer Name: ${data.customerName || 'N/A'}
- Contact Number: ${data.mobileNumber || 'N/A'}
- Site Name: ${data.siteName || 'N/A'}
- Total Amount: ₹${data.amount || 'As specified in proposal'}

We look forward to partnering with you on this project. Please feel free to reach out with any questions or modifications.

Best Regards,
NNIT Car Parking Systems
Phone: +91 98765 43210`,
    getHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header-banner { width: 100%; display: block; border-radius: 12px 12px 0 0; border: 0; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .quote-badge { background: #d1fae5; color: #047857; font-weight: 700; padding: 6px 16px; border-radius: 20px; font-size: 13px; display: inline-block; margin-bottom: 15px; }
    .quote-box { background: #f0fdf4; border: 1px solid #a7f3d0; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .quote-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }
    .quote-row:last-child { border-bottom: none; font-weight: 700; font-size: 16px; color: #047857; margin-top: 6px; }
    .footer { background: #0f172a; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${HEADER_BANNER_URL}" alt="NNIT Car Parking Systems Header" class="header-banner" />
    <div class="content">
      <span class="quote-badge">QUOTATION ${data.quotationNo ? '#' + data.quotationNo : ''}</span>
      <div style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">Dear ${data.customerName || 'Valued Customer'},</div>
      <p>Thank you for choosing <strong>NNIT Car Parking Systems</strong>. We are pleased to submit our commercial quotation for your site.</p>

      <div class="quote-box">
        <div class="quote-row"><span>Customer:</span> <strong>${data.customerName || 'N/A'}</strong></div>
        <div class="quote-row"><span>Contact:</span> <strong>${data.mobileNumber || 'N/A'}</strong></div>
        <div class="quote-row"><span>Site Name:</span> <strong>${data.siteName || 'N/A'}</strong></div>
        <div class="quote-row"><span>Quotation Ref:</span> <strong>${data.quotationNo || 'Q-NNIT-2026'}</strong></div>
        <div class="quote-row"><span>Total Value:</span> <strong>₹${data.amount || 'N/A'}</strong></div>
      </div>

      <p>Our quotation includes complete design, manufacturing, installation, testing, and commissioning with safety warranty support.</p>

      <p style="margin-top: 25px;">Best Regards,<br><strong>Commercial Sales Team</strong><br>NNIT Car Parking Systems</p>
    </div>
    <div class="footer">
      NNIT Car Parking Systems | +91 98765 43210 | sales@nnitparking.com
    </div>
  </div>
</body>
</html>`
  },

  {
    id: "customer_welcome",
    name: "🤝 Customer Onboarding Welcome",
    category: "customers",
    subject: `Welcome to the NNIT Family — ${'${data.customerName || "Valued Client"}'}`,
    getText: (data) => `Dear ${data.customerName || 'Valued Customer'},

Welcome to NNIT Car Parking Systems & HVAC Solutions!

We are honored to have you as a valued customer. Your account details have been created:

Customer Name: ${data.customerName || 'N/A'}
Contact Number: ${data.mobileNumber || 'N/A'}
Site Location: ${data.siteName || 'N/A'}

For any service, maintenance, or technical queries, our customer service team is available at +91 98765 43210.

Warm Regards,
Customer Success Management
NNIT Car Parking Systems`,
    getHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header-banner { width: 100%; display: block; border-radius: 12px 12px 0 0; border: 0; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .welcome-box { background: #f5f3ff; border: 1px solid #ddd6fe; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .footer { background: #0f172a; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${HEADER_BANNER_URL}" alt="NNIT Car Parking Systems Header" class="header-banner" />
    <div class="content">
      <div style="font-size: 20px; font-weight: 700; color: #5b21b6; margin-bottom: 12px;">Welcome Aboard, ${data.customerName || 'Valued Client'}!</div>
      <p>Thank you for partnering with <strong>NNIT Car Parking Systems</strong>. We are committed to providing top-tier service, safety, and reliability.</p>

      <div class="welcome-box">
        <div><strong>Customer Name:</strong> ${data.customerName || 'N/A'}</div>
        <div><strong>Registered Mobile:</strong> ${data.mobileNumber || 'N/A'}</div>
        <div><strong>Site / Location:</strong> ${data.siteName || 'N/A'}</div>
      </div>

      <p>Should you need any support or maintenance assistance, please contact our support desk.</p>

      <p style="margin-top: 25px;">Warm Regards,<br><strong>Customer Success Team</strong><br>NNIT Car Parking Systems</p>
    </div>
    <div class="footer">
      NNIT Car Parking Systems | Support: +91 98765 43210 | info@nnitparking.com
    </div>
  </div>
</body>
</html>`
  },

  {
    id: "payment_reminder",
    name: "💳 Payment & AMC Renewal Reminder",
    category: "payment",
    subject: `Payment & Contract Renewal Notice — ${'${data.customerName || "Valued Client"}'}`,
    getText: (data) => `Dear ${data.customerName || 'Valued Customer'},

This is a friendly reminder regarding your pending payment / AMC contract renewal for ${data.siteName || 'your site'}.

Account Details:
- Customer Name: ${data.customerName || 'N/A'}
- Mobile: ${data.mobileNumber || 'N/A'}
- Site: ${data.siteName || 'N/A'}
- Outstanding Amount: ₹${data.amount || 'As per invoice'}

Please arrange for the payment at your earliest convenience to maintain continuous service support.

Bank Account Details:
Bank: HDFC Bank
Account Name: NNIT Car Parking Systems Pvt Ltd
A/C No: 50200012345678
IFSC: HDFC0001234

Warm Regards,
Accounts & Billing Team
NNIT Car Parking Systems`,
    getHtml: (data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header-banner { width: 100%; display: block; border-radius: 12px 12px 0 0; border: 0; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .pay-box { background: #fff1f2; border: 1px solid #fecdd3; padding: 18px; border-radius: 8px; margin: 20px 0; }
    .bank-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-size: 13px; margin-top: 15px; }
    .footer { background: #0f172a; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${HEADER_BANNER_URL}" alt="NNIT Car Parking Systems Header" class="header-banner" />
    <div class="content">
      <div style="font-size: 18px; font-weight: 600; color: #881337; margin-bottom: 12px;">Dear ${data.customerName || 'Valued Customer'},</div>
      <p>This is a polite reminder regarding your pending payment / AMC renewal for <strong>${data.siteName || 'your site'}</strong>.</p>

      <div class="pay-box">
        <div><strong>Customer:</strong> ${data.customerName || 'N/A'}</div>
        <div><strong>Contact:</strong> ${data.mobileNumber || 'N/A'}</div>
        <div><strong>Site / Location:</strong> ${data.siteName || 'N/A'}</div>
        <div style="margin-top:8px; font-size:16px; font-weight:700; color:#be123c;">Amount Due: ₹${data.amount || 'As per invoice'}</div>
      </div>

      <div class="bank-box">
        <strong style="color:#0f172a;">Bank Transfer Details:</strong><br>
        Account Name: NNIT Car Parking Systems Pvt Ltd<br>
        Bank: HDFC Bank<br>
        A/C Number: 50200012345678 | IFSC Code: HDFC0001234
      </div>

      <p style="margin-top: 25px;">Warm Regards,<br><strong>Accounts & Billing Team</strong><br>NNIT Car Parking Systems</p>
    </div>
    <div class="footer">
      NNIT Car Parking Systems | Billing Dept: +91 98765 43210
    </div>
  </div>
</body>
</html>`
  }
];

/**
 * Auto-select appropriate template based on context
 */
export function getAutoTemplateId(contextData = {}) {
  if (contextData.type === 'quotation' || contextData.quotationNo) {
    return 'quotation_sent';
  }
  if (contextData.type === 'payment' || contextData.amount) {
    return 'payment_reminder';
  }
  if (contextData.type === 'customer' || contextData.isCustomer) {
    return 'customer_welcome';
  }
  if (contextData.followupCount === 1 || contextData.followups?.length === 1) {
    return 'lead_followup_1';
  }
  if (contextData.followupCount >= 2 || contextData.followups?.length >= 2) {
    return 'lead_followup_2';
  }
  return 'lead_welcome';
}
