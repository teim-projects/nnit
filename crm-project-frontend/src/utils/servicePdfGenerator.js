// servicePdfGenerator.js
// Utility to generate, view and print Service Work Order & Completion Report PDF

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
    return s.customer_name || s.client_name || "N/A";
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

  const getCustAddress = (s) => {
    if (s.customer_details) {
      return s.customer_details.address || s.customer_details.city || "N/A";
    }
    return s.address || s.site_address || "N/A";
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
  const custAddress = getCustAddress(service);
  const techName = service.assigned_technician_details?.name || service.assigned_technician_name || "N/A";
  const techPhone = service.assigned_technician_details?.phone || "N/A";
  const statusDisplay = (service.status_display || service.status || "Assigned").toUpperCase();
  const createdDate = formatDate(service.created_at);
  const completionDate = formatDate(service.completion_date || service.updated_at);

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Service Report - ${serviceIdStr}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      color: #1e293b;
      background: #fff;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      padding: 24px;
      border-radius: 8px;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-b: 2px solid #4f46e5;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .logo-section h1 {
      font-size: 20px;
      font-weight: 800;
      color: #1e1b4b;
      letter-spacing: 0.5px;
    }
    .logo-section p {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .report-title {
      text-align: right;
    }
    .report-title h2 {
      font-size: 16px;
      font-weight: 700;
      color: #4f46e5;
    }
    .report-title p {
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin-top: 2px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .badge-completed {
      background: #dcfce7;
      color: #15803d;
    }
    .badge-pending {
      background: #fef3c7;
      color: #b45309;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #4338ca;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
    }
    .info-row {
      display: flex;
      margin-bottom: 4px;
    }
    .info-label {
      width: 120px;
      font-weight: 600;
      color: #64748b;
    }
    .info-val {
      flex: 1;
      font-weight: 600;
      color: #0f172a;
    }
    .desc-box {
      background: #f1f5f9;
      border-left: 3px solid #6366f1;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 11px;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .photo-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
      background: #fafafa;
    }
    .photo-card img {
      max-height: 160px;
      width: 100%;
      object-fit: contain;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      background: #fff;
    }
    .signature-container {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .signature-img {
      max-height: 70px;
      object-fit: contain;
    }
    .footer-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
    }
    .sig-line {
      width: 200px;
      text-align: center;
    }
    .sig-line div {
      border-top: 1px dashed #94a3b8;
      margin-top: 40px;
      padding-top: 4px;
      font-weight: 600;
      font-size: 11px;
      color: #334155;
    }
    .no-print-bar {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .btn {
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: #4f46e5;
      color: #fff;
    }
    .btn-secondary {
      background: #64748b;
      color: #fff;
    }
    @media print {
      .no-print-bar {
        display: none;
      }
      body {
        padding: 0;
      }
      .container {
        border: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>

  <div class="no-print-bar">
    <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button class="btn btn-secondary" onclick="window.close()">✕ Close Window</button>
  </div>

  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <h1>NNIT AIR CONDITIONING SYSTEMS PVT. LTD.</h1>
        <p>HVAC, Electrical, Mechanical & Building Maintenance Services</p>
      </div>
      <div class="report-title">
        <h2>SERVICE WORK ORDER REPORT</h2>
        <p>Work ID: ${serviceIdStr}</p>
        <span class="badge ${service.status === 'completed' ? 'badge-completed' : 'badge-pending'}">
          ${statusDisplay}
        </span>
      </div>
    </div>

    <!-- Customer & Service Overview -->
    <div class="grid-2">
      <div class="info-box">
        <div class="section-title">Customer Information</div>
        <div class="info-row"><span class="info-label">Customer Name:</span><span class="info-val">${custName}</span></div>
        <div class="info-row"><span class="info-label">Contact Number:</span><span class="info-val">${custPhone}</span></div>
        <div class="info-row"><span class="info-label">Service Address:</span><span class="info-val">${custAddress}</span></div>
      </div>

      <div class="info-box">
        <div class="section-title">Service Specifications</div>
        <div class="info-row"><span class="info-label">Service Type:</span><span class="info-val">${service.service_type_display || service.service_type || 'General Service'}</span></div>
        <div class="info-row"><span class="info-label">Product / Equipment:</span><span class="info-val">${service.product_name || 'Air Conditioning System'}</span></div>
        <div class="info-row"><span class="info-label">Scheduled Date:</span><span class="info-val">${service.scheduled_date || createdDate}</span></div>
        <div class="info-row"><span class="info-label">Assigned Technician:</span><span class="info-val">${techName} (${techPhone})</span></div>
      </div>
    </div>

    <!-- Work Description -->
    <div class="section-title">Work Description & Scope</div>
    <div class="desc-box">
      ${service.description || service.title || 'General Maintenance & Routine Inspection Service Call.'}
    </div>

    <!-- Completion Photos if available -->
    ${(service.before_service_photo || service.after_service_photo) ? `
      <div class="section-title">Service Verification Photos</div>
      <div class="photos-grid">
        <div class="photo-card">
          <div style="font-weight:700; margin-bottom:4px; font-size:11px; color:#475569;">1. BEFORE SERVICE PHOTO</div>
          ${service.before_service_photo ? `<img src="${service.before_service_photo}" alt="Before Service" />` : '<div style="padding:20px; color:#94a3b8;">No Photo Uploaded</div>'}
        </div>
        <div class="photo-card">
          <div style="font-weight:700; margin-bottom:4px; font-size:11px; color:#475569;">2. AFTER SERVICE PHOTO</div>
          ${service.after_service_photo ? `<img src="${service.after_service_photo}" alt="After Service" />` : '<div style="padding:20px; color:#94a3b8;">No Photo Uploaded</div>'}
        </div>
      </div>
    ` : ''}

    <!-- Resolution remarks -->
    <div class="section-title">Completion Remarks / Resolution Summary</div>
    <div class="desc-box" style="border-left-color: #10b981;">
      ${service.resolution_notes || 'Work completed successfully as per operational quality standards.'}
    </div>

    <!-- Customer Signature & Approval -->
    ${service.customer_signature ? `
      <div class="section-title">Customer Verification & Authorization</div>
      <div class="signature-container">
        <div>
          <div style="font-weight:700; color:#15803d; font-size:12px;">✓ Customer Inspected & Approved</div>
          <div style="font-size:10px; color:#64748b; margin-top:2px;">Completion Timestamp: ${completionDate}</div>
        </div>
        <img class="signature-img" src="${service.customer_signature}" alt="Customer Signature" />
      </div>
    ` : ''}

    <!-- Signatures Footer -->
    <div class="footer-signatures">
      <div class="sig-line">
        <div>Technician Signature</div>
      </div>
      <div class="sig-line">
        <div>Customer Signature / Stamp</div>
      </div>
      <div class="sig-line">
        <div>Authorized Supervisor</div>
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
