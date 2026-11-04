// servicePdfGenerator.js
// Utility to generate, view and print Service Work Order & Completion Report PDF (Single A4 Page Layout)

export function openServicePdf(service) {
  if (!service) return;

  const getCustName = (s) => {
    if (s.customer_details) {
      return (
        s.customer_details.name ||
        s.customer_details.company_name ||
        s.customer_details.poc_name ||
        "Customer #" + s.customer
      );
    }
    return s.customer_name || s.client_name || "Valued Customer";
  };

  const getCustPhone = (s) => {
    if (s.customer_details) {
      return (
        s.customer_details.phone ||
        s.customer_details.contact_number ||
        s.customer_details.primary_contact ||
        "N/A"
      );
    }
    return s.customer_phone || s.phone || "N/A";
  };

  const getCustEmail = (s) => {
    if (s.customer_details) {
      return s.customer_details.email || s.customer_details.secondary_email || "N/A";
    }
    return s.customer_email || "N/A";
  };

  const getCustAddress = (s) => {
    if (s.customer_details) {
      return (
        s.customer_details.site_address ||
        s.customer_details.address ||
        s.customer_details.city ||
        "N/A"
      );
    }
    return s.site_address || s.address || "N/A";
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "N/A";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const serviceIdStr = service.service_id || ("SRV-" + (service.id || "001"));
  const custName = getCustName(service);
  const custPhone = getCustPhone(service);
  const custEmail = getCustEmail(service);
  const custAddress = getCustAddress(service);
  const techName = service.assigned_technician_details?.name || service.assigned_technician_name || "N/A";
  const techPhone = service.assigned_technician_details?.phone || "N/A";
  const statusDisplay = (service.status_display || service.status || "Assigned").toUpperCase();
  const serviceTypeDisplay = service.service_type_display || (service.service_type === 'amc' ? 'AMC Service' : service.service_type === 'warranty' ? 'Warranty Service' : 'Paid Maintenance');
  const priorityDisplay = (service.priority_display || service.priority || "Medium").toUpperCase();
  const scheduledDate = service.scheduled_date || "Not Specified";
  const completionDate = formatDate(service.completion_date || service.updated_at);
  const serviceCost = parseFloat(service.service_cost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const amcAnnualValue = service.amc_contract_details?.annual_value || service.amc_contract_annual_value || null;
  const amcAnnualFormatted = amcAnnualValue ? parseFloat(amcAnnualValue).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : null;

  const headerBannerImg = "https://files.catbox.moe/4i67y4.jpg";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Service Work Order Report - ${serviceIdStr}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 5mm 6mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      background: #f1f5f9;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5px;
      color: #1e293b;
      line-height: 1.38;
      padding: 10px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      overflow: hidden;
      page-break-inside: avoid;
    }
    .header-banner {
      width: 100%;
      height: auto;
      display: block;
      border-bottom: 2.5px solid #2563eb;
    }
    .main-body {
      padding: 16px 20px;
    }
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      margin-bottom: 12px;
      border-bottom: 1.5px solid #e2e8f0;
    }
    .doc-type {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .doc-type span {
      color: #2563eb;
    }
    .work-id-badge {
      text-align: right;
    }
    .work-id-number {
      font-size: 14px;
      font-weight: 800;
      color: #1e40af;
      background: #eff6ff;
      padding: 3px 10px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
      display: inline-block;
    }
    .badges-flex {
      display: flex;
      gap: 5px;
      justify-content: flex-end;
      margin-top: 4px;
    }
    .badge {
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-completed { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-progress { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-pending { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-priority { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .card-header {
      font-size: 10.5px;
      font-weight: 700;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .table-details {
      width: 100%;
      border-collapse: collapse;
    }
    .table-details td {
      padding: 2px 0;
      vertical-align: top;
      font-size: 10.5px;
    }
    .lbl {
      width: 110px;
      font-weight: 600;
      color: #64748b;
    }
    .val {
      font-weight: 600;
      color: #0f172a;
    }
    
    .section-head {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      margin: 10px 0 4px 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .desc-box {
      background: #faf5ff;
      border-left: 3.5px solid #8b5cf6;
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 10.5px;
      color: #3b0764;
      margin-bottom: 10px;
      border: 1px solid #f3e8ff;
      border-left-width: 3.5px;
    }
    .resolution-box {
      background: #ecfdf5;
      border-left: 3.5px solid #10b981;
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 10.5px;
      color: #064e3b;
      margin-bottom: 10px;
      border: 1px solid #d1fae5;
      border-left-width: 3.5px;
    }
    
    .photos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 10px;
    }
    .photo-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px;
      text-align: center;
    }
    .photo-title {
      font-weight: 700;
      font-size: 9.5px;
      color: #475569;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .photo-card img {
      max-height: 120px;
      width: 100%;
      object-fit: contain;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
    }
    
    .sig-section {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .sig-badge {
      font-weight: 700;
      color: #15803d;
      font-size: 11.5px;
    }
    .sig-time {
      font-size: 9.5px;
      color: #166534;
      margin-top: 2px;
    }
    .sig-img {
      max-height: 50px;
      max-width: 200px;
      object-fit: contain;
    }

    .footer-sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-top: 14px;
      padding-top: 6px;
      border-top: 1px dashed #cbd5e1;
    }
    .sig-block {
      text-align: center;
    }
    .sig-space {
      height: 28px;
    }
    .sig-line-text {
      border-top: 1px solid #94a3b8;
      padding-top: 4px;
      font-weight: 700;
      font-size: 9.5px;
      color: #334155;
    }

    .no-print-bar {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 14px;
    }
    .btn {
      padding: 8px 20px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #64748b; color: #fff; }

    @media print {
      @page {
        size: A4 portrait;
        margin: 5mm 6mm;
      }
      html, body {
        padding: 0 !important;
        margin: 0 !important;
        background: #fff !important;
      }
      .no-print-bar { display: none !important; }
      .container {
        border: none !important;
        box-shadow: none !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>

  <div class="no-print-bar">
    <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save A4 PDF</button>
    <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
  </div>

  <div class="container">
    <!-- Header Banner Image (Uncropped Aspect Ratio) -->
    <img src="${headerBannerImg}" alt="NNIT Car Parking Systems Header" class="header-banner" />

    <div class="main-body">
      <!-- Title & Document ID -->
      <div class="title-row">
        <div>
          <div class="doc-type">SERVICE <span>WORK ORDER REPORT</span></div>
          <div style="font-size:10px; color:#64748b; margin-top:2px;">Automated Car Parking & Mechanical Systems Service Record</div>
        </div>
        <div class="work-id-badge">
          <div class="work-id-number">${serviceIdStr}</div>
          <div class="badges-flex">
            <span class="badge ${service.status === 'completed' ? 'badge-completed' : service.status === 'in_progress' ? 'badge-progress' : 'badge-pending'}">
              ${statusDisplay}
            </span>
            <span class="badge badge-priority">
              ${priorityDisplay} PRIORITY
            </span>
          </div>
        </div>
      </div>

      <!-- Overview Cards Grid -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header">🏢 Customer Information</div>
          <table class="table-details">
            <tr><td class="lbl">Customer Name:</td><td class="val">${custName}</td></tr>
            <tr><td class="lbl">Contact Number:</td><td class="val">${custPhone}</td></tr>
            <tr><td class="lbl">Email Address:</td><td class="val">${custEmail}</td></tr>
            <tr><td class="lbl">Service Address:</td><td class="val">${custAddress}</td></tr>
          </table>
        </div>

        <div class="card">
          <div class="card-header">🛠️ Service Specifications</div>
          <table class="table-details">
            <tr><td class="lbl">Service Type:</td><td class="val">${serviceTypeDisplay}</td></tr>
            <tr><td class="lbl">Product / Equipment:</td><td class="val">${service.product_name || 'Car Parking System'}</td></tr>
            <tr><td class="lbl">Scheduled Date:</td><td class="val" style="color:#2563eb;">${scheduledDate}</td></tr>
            <tr><td class="lbl">Field Engineer:</td><td class="val">${techName} (${techPhone})</td></tr>
            ${(service.service_type === 'amc' || amcAnnualFormatted) ? `
              <tr><td class="lbl">AMC Contract Amount:</td><td class="val" style="color:#059669; font-weight:800;">₹${amcAnnualFormatted || serviceCost}</td></tr>
            ` : parseFloat(service.service_cost || 0) > 0 ? `
              <tr><td class="lbl">Service Charge:</td><td class="val" style="color:#059669; font-weight:800;">₹${serviceCost}</td></tr>
            ` : `
              <tr><td class="lbl">Service Charge:</td><td class="val" style="color:#059669;">Included in Warranty / Free</td></tr>
            `}
          </table>
        </div>
      </div>

      <!-- Work Subject & Description -->
      <div class="section-head">📌 Work Description & Problem Reported</div>
      <div class="desc-box">
        <strong>${service.title || 'Routine Maintenance & Inspection Service'}</strong><br>
        ${service.description || 'Routine maintenance inspection and operational safety check of the car parking system.'}
      </div>

      <!-- Service Photos (Before & After) -->
      ${(service.before_service_photo || service.after_service_photo) ? `
        <div class="section-head">📸 Service Inspection Verification Photos</div>
        <div class="photos-grid">
          <div class="photo-card">
            <div class="photo-title">1. BEFORE SERVICE PHOTO</div>
            ${service.before_service_photo ? `<img src="${service.before_service_photo}" alt="Before Service" />` : '<div style="padding:25px; color:#94a3b8; font-size:10px;">No Photo Uploaded</div>'}
          </div>
          <div class="photo-card">
            <div class="photo-title">2. AFTER SERVICE PHOTO</div>
            ${service.after_service_photo ? `<img src="${service.after_service_photo}" alt="After Service" />` : '<div style="padding:25px; color:#94a3b8; font-size:10px;">No Photo Uploaded</div>'}
          </div>
        </div>
      ` : ''}

      <!-- Resolution & Completion Summary -->
      <div class="section-head">✅ Resolution Notes & Job Completion Summary</div>
      <div class="resolution-box">
        ${service.resolution_notes || 'All routine maintenance points, lubrication, limit switches, and safety sensors checked. Work completed as per operational standards.'}
      </div>

      <!-- Customer Authorization & Digital Signature -->
      ${service.customer_signature ? `
        <div class="section-head">✍️ Customer Inspection & Digital Approval</div>
        <div class="sig-section">
          <div>
            <div class="sig-badge">✓ Customer Verified & Satisfied</div>
            <div class="sig-time">Sign-off Timestamp: ${completionDate}</div>
          </div>
          <img class="sig-img" src="${service.customer_signature}" alt="Customer Signature" />
        </div>
      ` : ''}

      <!-- Signatures Footer -->
      <div class="footer-sig-grid">
        <div class="sig-block">
          <div class="sig-space"></div>
          <div class="sig-line-text">Service Technician Signature</div>
        </div>
        <div class="sig-block">
          <div class="sig-space"></div>
          <div class="sig-line-text">Customer Approval / Stamp</div>
        </div>
        <div class="sig-block">
          <div class="sig-space"></div>
          <div class="sig-line-text">Authorized NNIT Supervisor</div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
