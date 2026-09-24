import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def build_pdf(filename="NNIT_CRM_API_Integration_Documentation.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        alignment=TA_LEFT,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#334155"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f8fafc"),
        borderColor=colors.HexColor("#e2e8f0"),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=8,
        leftIndent=4,
        rightIndent=4
    )

    tbl_header_style = ParagraphStyle(
        'TblHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    tbl_cell_style = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#334155")
    )

    tbl_cell_code = ParagraphStyle(
        'TblCellCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    # Title Banner
    story.append(Paragraph("NNIT CRM – API Integration Documentation", title_style))
    story.append(Paragraph("Production API Documentation for External System & n8n Automation Integration", subtitle_style))
    story.append(Paragraph("<b>CRM:</b> NNIT CRM (NNIT Smart Parking & CRM)", body_style))
    story.append(Paragraph("<b>Production Base URL:</b> https://chronolms.com", body_style))
    story.append(Paragraph("<b>Authentication Method:</b> JWT (JSON Web Token via Bearer Header)", body_style))
    story.append(Spacer(1, 10))

    # Section 1
    story.append(Paragraph("1. Integration Overview", h1_style))
    story.append(Paragraph("NNIT CRM exposes RESTful APIs for external systems (such as <b>n8n</b>, custom portals, and automated workflows) to securely access CRM data. External systems must communicate with NNIT CRM through HTTPS APIs only. Direct database or server access is strictly prohibited.", body_style))
    
    diagram_text = (
        "External System / n8n Workflow<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;HTTPS REST API (JSON)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v<br/>"
        "NNIT CRM Production API (https://chronolms.com)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;Django REST Framework + SimpleJWT<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v<br/>"
        "NNIT CRM Database (PostgreSQL / MySQL)"
    )
    story.append(Paragraph(diagram_text, code_style))

    # Section 2
    story.append(Paragraph("2. Production API Base URL & API Groups", h1_style))
    story.append(Paragraph("<b>Base URL:</b> <code>https://chronolms.com</code>", body_style))
    story.append(Paragraph("<b>Active API Endpoint Groups:</b>", body_style))

    api_groups_code = (
        "https://chronolms.com/token/                 (JWT Authentication)<br/>"
        "https://chronolms.com/lead/lead/            (Leads Management)<br/>"
        "https://chronolms.com/lead/customer/        (Customer Management)<br/>"
        "https://chronolms.com/lead/lead-followups/  (Follow-up Records)<br/>"
        "https://chronolms.com/lead/lead-faqs/       (Qualifying FAQ Master)<br/>"
        "https://chronolms.com/api/quotation/         (Quotations)<br/>"
        "https://chronolms.com/product/               (Products Catalog)<br/>"
        "https://chronolms.com/api/amc/              (AMC Contracts & Visits)"
    )
    story.append(Paragraph(api_groups_code, code_style))

    # Section 3
    story.append(Paragraph("3. API Interactive Documentation", h1_style))
    story.append(Paragraph("Live Swagger UI and ReDoc OpenAPI documentations are available for interactive endpoint testing:", body_style))
    story.append(Paragraph("• <b>Swagger UI:</b> https://chronolms.com/swagger/", body_style))
    story.append(Paragraph("• <b>ReDoc Interface:</b> https://chronolms.com/redoc/", body_style))

    # Section 4 & 5
    story.append(Paragraph("4. API Authentication (JWT)", h1_style))
    story.append(Paragraph("NNIT CRM uses JWT (JSON Web Token) authentication. Static API keys are not used. All requests to protected endpoints must pass the access token in the standard HTTP Authorization header:", body_style))
    story.append(Paragraph("<code>Authorization: Bearer &lt;access_token&gt;</code>", code_style))

    story.append(Paragraph("5. Obtain Access Token", h1_style))
    story.append(Paragraph("Send a POST request with valid service account credentials to generate an access token and refresh token.", body_style))
    story.append(Paragraph("<code>POST https://chronolms.com/token/</code>", code_style))
    
    req_res_token = (
        "<b>Request Body:</b><br/>"
        "{\n"
        '  "username": "SERVICE_ACCOUNT_USERNAME",\n'
        '  "password": "SERVICE_ACCOUNT_PASSWORD"\n'
        "}<br/><br/>"
        "<b>Response (HTTP 200 OK):</b><br/>"
        "{\n"
        '  "refresh": "eyJhbGciOiJIUzI1NiIsIn...",\n'
        '  "access": "eyJhbGciOiJIUzI1NiIsIn..."\n'
        "}"
    )
    story.append(Paragraph(req_res_token, code_style))

    # Section 6 & 7
    story.append(Paragraph("6. Refresh Access Token", h1_style))
    story.append(Paragraph("When an access token expires (default 60 minutes), send the refresh token to receive a new access token.", body_style))
    story.append(Paragraph("<code>POST https://chronolms.com/token/refresh/</code>", code_style))
    ref_code = (
        'Request:  { "refresh": "&lt;refresh_token&gt;" }<br/>'
        'Response: { "access": "&lt;new_access_token&gt;" }'
    )
    story.append(Paragraph(ref_code, code_style))

    story.append(Paragraph("7. Verify Token", h1_style))
    story.append(Paragraph("Verify if an existing access token is active and valid.", body_style))
    story.append(Paragraph("<code>POST https://chronolms.com/token/verify/</code>", code_style))
    ver_code = 'Request: { "token": "&lt;access_token&gt;" }  ==> Returns HTTP 200 OK if valid.'
    story.append(Paragraph(ver_code, code_style))

    # Section 8 & 9
    story.append(Paragraph("8. Dedicated Service Account for n8n", h1_style))
    story.append(Paragraph("For n8n workflows and team integrations, create a dedicated service account in NNIT CRM rather than using employee credentials.", body_style))
    story.append(Paragraph("<b>Recommended Account:</b> Username: <code>n8n_automation</code> | Email: <code>n8n.automation@nnitcrm.com</code> | Role: API / Integration Service Account", body_style))

    story.append(Paragraph("9. Recommended System Permissions", h1_style))
    
    perm_data = [
        [Paragraph("<b>Module</b>", tbl_header_style), Paragraph("<b>Endpoint Path</b>", tbl_header_style), Paragraph("<b>Recommended Access</b>", tbl_header_style)],
        [Paragraph("Lead Management", tbl_cell_style), Paragraph("/lead/lead/", tbl_cell_code), Paragraph("Read, Create, Update, Filter, Search", tbl_cell_style)],
        [Paragraph("Customer Management", tbl_cell_style), Paragraph("/lead/customer/", tbl_cell_code), Paragraph("Read, Create, Update, Lookup", tbl_cell_style)],
        [Paragraph("Lead Follow-ups", tbl_cell_style), Paragraph("/lead/lead-followups/", tbl_cell_code), Paragraph("Read, Create, Update", tbl_cell_style)],
        [Paragraph("Lead FAQ Master", tbl_cell_style), Paragraph("/lead/lead-faqs/", tbl_cell_code), Paragraph("Read Only", tbl_cell_style)],
        [Paragraph("Quotations", tbl_cell_style), Paragraph("/api/quotation/", tbl_cell_code), Paragraph("Read / Create (If required)", tbl_cell_style)],
        [Paragraph("AMC Contracts", tbl_cell_style), Paragraph("/api/amc/", tbl_cell_code), Paragraph("Read Only (If required)", tbl_cell_style)],
        [Paragraph("User Management", tbl_cell_style), Paragraph("/auth/staff/", tbl_cell_code), Paragraph("No Access", tbl_cell_style)],
        [Paragraph("System Settings", tbl_cell_style), Paragraph("/admin/", tbl_cell_code), Paragraph("No Access", tbl_cell_style)]
    ]
    t_perm = Table(perm_data, colWidths=[110, 160, 270])
    t_perm.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_perm)
    story.append(Spacer(1, 10))

    # Section 10 - Lead API
    story.append(Paragraph("10. Lead API Documentation", h1_style))
    story.append(Paragraph("<b>Endpoint:</b> <code>https://chronolms.com/lead/lead/</code>", body_style))
    story.append(Paragraph("<b>Supported HTTP Methods:</b> GET, POST, PUT, PATCH, DELETE", body_style))

    story.append(Paragraph("10.1 Create Lead Request Payload & Fields", h2_style))
    story.append(Paragraph("When creating a lead, pass the existing customer ID under the <code>customer</code> field. If creating via n8n, ensure the customer exists first (or create one using the Customer API).", body_style))

    lead_fields_data = [
        [Paragraph("<b>Field</b>", tbl_header_style), Paragraph("<b>Type</b>", tbl_header_style), Paragraph("<b>Description / Allowed Values</b>", tbl_header_style)],
        [Paragraph("customer", tbl_cell_code), Paragraph("Integer", tbl_cell_style), Paragraph("<b>Required.</b> Primary key of Customer record", tbl_cell_style)],
        [Paragraph("requirements_details", tbl_cell_code), Paragraph("Text", tbl_cell_style), Paragraph("Requirements & specifications (e.g. 4 level stacker parking)", tbl_cell_style)],
        [Paragraph("lead_source", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("<b>Required.</b> Enum: google_ads, indiamart, bni, justdial, reference, architect/interior_designer, builder, existing_customer, ka_staff, other", tbl_cell_style)],
        [Paragraph("lead_source_input", tbl_cell_code), Paragraph("JSON", tbl_cell_style), Paragraph("Additional source context metadata object", tbl_cell_style)],
        [Paragraph("status", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Enum: open, in_process, close_win, close_loss, closed (Default: open)", tbl_cell_style)],
        [Paragraph("lead_type", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Type of lead (e.g. Commercial, Residential)", tbl_cell_style)],
        [Paragraph("is_service_lead", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Enum: sales, service, both", tbl_cell_style)],
        [Paragraph("service_type", tbl_cell_code), Paragraph("JSON", tbl_cell_style), Paragraph("Service categories/types details", tbl_cell_style)],
        [Paragraph("company_name", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Company or site title", tbl_cell_style)],
        [Paragraph("project_name", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Name of project/site location", tbl_cell_style)],
        [Paragraph("project_adderess", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Address of project site", tbl_cell_style)],
        [Paragraph("contact_person_name", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Specific contact person for this lead", tbl_cell_style)],
        [Paragraph("contact_person_number", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Phone number of contact person", tbl_cell_style)],
        [Paragraph("assign_to", tbl_cell_code), Paragraph("Integer", tbl_cell_style), Paragraph("User ID of CRM staff member assigned", tbl_cell_style)],
        [Paragraph("enquiry_date", tbl_cell_code), Paragraph("Date", tbl_cell_style), Paragraph("Format: YYYY-MM-DD", tbl_cell_style)],
        [Paragraph("followup_date", tbl_cell_code), Paragraph("Date", tbl_cell_style), Paragraph("Next follow-up date (Format: YYYY-MM-DD)", tbl_cell_style)],
        [Paragraph("remarks", tbl_cell_code), Paragraph("Text", tbl_cell_style), Paragraph("Initial remarks or notes", tbl_cell_style)],
        [Paragraph("is_qualified", tbl_cell_code), Paragraph("Boolean", tbl_cell_style), Paragraph("Lead qualification status (default: false)", tbl_cell_style)],
        [Paragraph("qualifying_answers", tbl_cell_code), Paragraph("JSON", tbl_cell_style), Paragraph('Object mapping FAQ IDs to answers: {"1": "Budget 10L"}', tbl_cell_style)]
    ]
    t_lead = Table(lead_fields_data, colWidths=[130, 60, 350])
    t_lead.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_lead)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Sample Create Lead Request (POST /lead/lead/):</b>", body_style))
    create_lead_json = (
        "{\n"
        '  "customer": 105,\n'
        '  "requirements_details": "Customer requires 6-level puzzle parking system for commercial building.",\n'
        '  "lead_source": "google_ads",\n'
        '  "status": "open",\n'
        '  "lead_type": "Commercial Parking",\n'
        '  "is_service_lead": "sales",\n'
        '  "company_name": "Apex Commercial Hub",\n'
        '  "project_name": "Apex Tower Project",\n'
        '  "project_adderess": "Plot 42, Vashi, Navi Mumbai",\n'
        '  "contact_person_name": "Rajesh Malhotra",\n'
        '  "contact_person_number": "9876543210",\n'
        '  "enquiry_date": "2026-09-10",\n'
        '  "followup_date": "2026-09-15",\n'
        '  "remarks": "High priority lead from Google Ads campaign."\n'
        "}"
    )
    story.append(Paragraph(create_lead_json, code_style))

    # Section 11, 12, 13, 14, 15, 16, 17, 18, 19
    story.append(Paragraph("11. Lead Status & Source Enums", h1_style))
    story.append(Paragraph("<b>Supported Lead Status Values:</b> <code>open</code> | <code>in_process</code> | <code>close_win</code> | <code>close_loss</code> | <code>closed</code>", body_style))
    story.append(Paragraph("<b>Supported Lead Source Values:</b> <code>google_ads</code> | <code>indiamart</code> | <code>bni</code> | <code>justdial</code> | <code>reference</code> | <code>architect/interior_designer</code> | <code>builder</code> | <code>existing_customer</code> | <code>ka_staff</code> | <code>other</code>", body_style))

    story.append(Paragraph("12. Search, Filter, & Sort Leads", h1_style))
    story.append(Paragraph("<b>Search Endpoint:</b> <code>GET /lead/lead/?search=9876543210</code> (Searches Customer ID, Name, Contact, Email, Project Name, Lead Source)", body_style))
    story.append(Paragraph("<b>Filtering Options:</b>", body_style))
    filter_code = (
        "GET /lead/lead/?status=open<br/>"
        "GET /lead/lead/?assign_to=5<br/>"
        "GET /lead/lead/?followup_date=2026-09-15<br/>"
        "GET /lead/lead/?followup_today=true<br/>"
        "GET /lead/lead/?overdue=true<br/>"
        "GET /lead/lead/?date_from=2026-09-01&date_to=2026-09-30<br/>"
        "GET /lead/lead/?followup_date_from=2026-09-10&followup_date_to=2026-09-20"
    )
    story.append(Paragraph(filter_code, code_style))
    story.append(Paragraph("<b>Sorting Options:</b> <code>GET /lead/lead/?ordering=-date</code> (Supported fields: <code>date</code>, <code>followup_date</code>, <code>customer__name</code>, <code>status</code>)", body_style))

    story.append(Paragraph("13. Fetch Latest Lead by Mobile Number", h1_style))
    story.append(Paragraph("Fetch the latest lead associated with a given phone number (ideal for WhatsApp / IVR / n8n incoming call routing).", body_style))
    story.append(Paragraph("<code>GET https://chronolms.com/lead/lead/latest-lead-by-mobile/?mobile=9876543210</code>", code_style))

    story.append(Paragraph("14. Convert Lead to Customer", h1_style))
    story.append(Paragraph("Converts a lead into a verified customer record, sets <code>is_lead_only=False</code>, marks <code>is_converted=True</code>, and updates lead status to <code>close_win</code>.", body_style))
    story.append(Paragraph("<code>POST https://chronolms.com/lead/lead/{id}/convert-to-customer/</code>", code_style))

    # Section 20 - Customer API
    story.append(Paragraph("20. Customer API Documentation", h1_style))
    story.append(Paragraph("<b>Endpoint Base Path:</b> <code>https://chronolms.com/lead/customer/</code>", body_style))
    story.append(Paragraph("<b>Supported Operations:</b> GET (list/retrieve), POST (create), PUT/PATCH (update), DELETE", body_style))
    story.append(Paragraph("<b>Special Endpoints:</b>", body_style))
    story.append(Paragraph("• <code>GET /lead/customer/lookup/?search=9876543210</code> — Lookup customer by name, contact, or email across all records", body_style))
    story.append(Paragraph("• <code>GET /lead/customer/{id}/leads/</code> — Fetch all leads belonging to this customer", body_style))
    story.append(Paragraph("• <code>GET /lead/customer/{id}/followup-history/</code> — Fetch complete follow-up history for customer", body_style))

    story.append(Paragraph("Customer Object Fields Table:", h2_style))
    cust_fields_data = [
        [Paragraph("<b>Field Name</b>", tbl_header_style), Paragraph("<b>Type</b>", tbl_header_style), Paragraph("<b>Description</b>", tbl_header_style)],
        [Paragraph("id", tbl_cell_code), Paragraph("Integer", tbl_cell_style), Paragraph("Read-only. Primary Key", tbl_cell_style)],
        [Paragraph("name", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Customer / Client Name (Required)", tbl_cell_style)],
        [Paragraph("contact_number", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("<b>Unique.</b> Main contact phone number", tbl_cell_style)],
        [Paragraph("secondary_contact_number", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Alternative phone number", tbl_cell_style)],
        [Paragraph("email", tbl_cell_code), Paragraph("Email", tbl_cell_style), Paragraph("Customer primary email address", tbl_cell_style)],
        [Paragraph("secondary_email", tbl_cell_code), Paragraph("Email", tbl_cell_style), Paragraph("Secondary email address", tbl_cell_style)],
        [Paragraph("poc_name", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Point of contact person name", tbl_cell_style)],
        [Paragraph("poc_contact_number", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Point of contact phone number", tbl_cell_style)],
        [Paragraph("land_line_no", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Landline office phone", tbl_cell_style)],
        [Paragraph("address", tbl_cell_code), Paragraph("Text", tbl_cell_style), Paragraph("Billing / Office address", tbl_cell_style)],
        [Paragraph("city", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Billing city", tbl_cell_style)],
        [Paragraph("state", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Billing state", tbl_cell_style)],
        [Paragraph("pin_code", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Billing PIN code", tbl_cell_style)],
        [Paragraph("both_address_is_same", tbl_cell_code), Paragraph("Boolean", tbl_cell_style), Paragraph("If site address is same as billing (Default: false)", tbl_cell_style)],
        [Paragraph("site_address", tbl_cell_code), Paragraph("Text", tbl_cell_style), Paragraph("Project site address", tbl_cell_style)],
        [Paragraph("site_city", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Project site city", tbl_cell_style)],
        [Paragraph("site_state", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Project site state", tbl_cell_style)],
        [Paragraph("site_pin_code", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Project site PIN code", tbl_cell_style)],
        [Paragraph("gst", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("GST Identification Number (15 chars)", tbl_cell_style)],
        [Paragraph("pan", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("PAN Number (10 chars)", tbl_cell_style)],
        [Paragraph("is_lead_only", tbl_cell_code), Paragraph("Boolean", tbl_cell_style), Paragraph("Read-only. True if created from lead prior to conversion", tbl_cell_style)]
    ]
    t_cust = Table(cust_fields_data, colWidths=[140, 60, 340])
    t_cust.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_cust)
    story.append(Spacer(1, 10))

    # Section 21 - Creation Flow for n8n
    story.append(Paragraph("21. Recommended Customer & Lead Creation Flow for n8n", h1_style))
    story.append(Paragraph("Because <code>contact_number</code> on Customer is unique, external systems & n8n workflows MUST follow this standard lookup-first architecture to prevent duplicate entries:", body_style))

    flow_diagram = (
        "Incoming Webhook / Lead Form Data (Name, Phone, Email, Requirement)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v<br/>"
        "Step 1: Search Customer by Phone<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;GET /lead/customer/lookup/?search=&lt;phone&gt;<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-------+-------+<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br/>"
        "&nbsp;&nbsp;[Customer Exists]&nbsp;&nbsp;[Not Found]<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v<br/>"
        "Use existing&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Step 2: Create Customer<br/>"
        "Customer ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;POST /lead/customer/<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+-------+-------+<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v<br/>"
        "Step 3: Create Lead Record linked to Customer ID<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;POST /lead/lead/<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Payload: { customer: &lt;customer_id&gt;, requirements_details: '...', lead_source: '...' }"
    )
    story.append(Paragraph(flow_diagram, code_style))

    # Section 22 - Lead Follow-up API
    story.append(Paragraph("22. Lead Follow-up API Documentation", h1_style))
    story.append(Paragraph("<b>Endpoint Base Path:</b> <code>https://chronolms.com/lead/lead-followups/</code>", body_style))
    story.append(Paragraph("<b>Supported Operations:</b> GET, POST, PUT, PATCH, DELETE", body_style))
    story.append(Paragraph("<b>Filter Follow-ups by Lead ID:</b> <code>GET /lead/lead-followups/?lead=105</code>", body_style))
    story.append(Paragraph("<b>Lead Follow-up Timeline:</b> <code>GET /lead/lead-followups/timeline/{lead_id}/</code>", body_style))

    story.append(Paragraph("Lead Follow-up Fields Table:", h2_style))
    fup_fields_data = [
        [Paragraph("<b>Field Name</b>", tbl_header_style), Paragraph("<b>Type</b>", tbl_header_style), Paragraph("<b>Description & Enums</b>", tbl_header_style)],
        [Paragraph("lead", tbl_cell_code), Paragraph("Integer", tbl_cell_style), Paragraph("<b>Required.</b> Primary key of Lead record", tbl_cell_style)],
        [Paragraph("followup_date", tbl_cell_code), Paragraph("Date", tbl_cell_style), Paragraph("<b>Required.</b> Date of follow-up (YYYY-MM-DD)", tbl_cell_style)],
        [Paragraph("followup_time", tbl_cell_code), Paragraph("Time", tbl_cell_style), Paragraph("Time of follow-up (HH:MM:SS)", tbl_cell_style)],
        [Paragraph("next_followup_date", tbl_cell_code), Paragraph("Date", tbl_cell_style), Paragraph("Next scheduled follow-up date", tbl_cell_style)],
        [Paragraph("remarks", tbl_cell_code), Paragraph("Text", tbl_cell_style), Paragraph("Follow-up remarks", tbl_cell_style)],
        [Paragraph("discussion_notes", tbl_cell_code), Paragraph("Text", tbl_cell_style), Paragraph("Detailed discussion notes", tbl_cell_style)],
        [Paragraph("interaction_type", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Enum: call, whatsapp, email, video_call, in_person, demo, site_visit", tbl_cell_style)],
        [Paragraph("client_response", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Enum: very_positive, positive, neutral, negative, no_response, call_back_later", tbl_cell_style)],
        [Paragraph("followup_status", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Enum: completed, pending, scheduled (Default: completed)", tbl_cell_style)],
        [Paragraph("status", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Lead status update (open, in_process, close_win, close_loss, closed)", tbl_cell_style)],
        [Paragraph("conducted_by", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Team member who conducted follow-up", tbl_cell_style)],
        [Paragraph("contacted_person", tbl_cell_code), Paragraph("String", tbl_cell_style), Paragraph("Name of person contacted", tbl_cell_style)],
        [Paragraph("followup_summary", tbl_cell_code), Paragraph("Text", tbl_cell_style), Paragraph("Key summary points", tbl_cell_style)],
        [Paragraph("client_commitment", tbl_cell_code), Paragraph("Text", tbl_cell_style), Paragraph("Client promises / action items", tbl_cell_style)],
        [Paragraph("our_commitment", tbl_cell_code), Paragraph("Text", tbl_cell_style), Paragraph("Our promised deliverables / quote date", tbl_cell_style)],
        [Paragraph("qualifying_info", tbl_cell_code), Paragraph("JSON", tbl_cell_style), Paragraph("Object containing site details, budget, decision maker, timeline", tbl_cell_style)],
        [Paragraph("requirement_info", tbl_cell_code), Paragraph("JSON", tbl_cell_style), Paragraph("Object containing length, width, height, parking type, automation", tbl_cell_style)],
        [Paragraph("faq_answers", tbl_cell_code), Paragraph("Array", tbl_cell_style), Paragraph("List of FAQ answer objects: [{ faq: 1, answer: 'Budget is 15L' }]", tbl_cell_style)]
    ]
    t_fup = Table(fup_fields_data, colWidths=[130, 60, 350])
    t_fup.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_fup)
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Sample Create Follow-up Request (POST /lead/lead-followups/):</b>", body_style))
    fup_json = (
        "{\n"
        '  "lead": 105,\n'
        '  "followup_date": "2026-09-12",\n'
        '  "followup_time": "14:30:00",\n'
        '  "next_followup_date": "2026-09-18",\n'
        '  "interaction_type": "call",\n'
        '  "client_response": "positive",\n'
        '  "followup_status": "completed",\n'
        '  "status": "in_process",\n'
        '  "remarks": "Discussed parking layout options with client.",\n'
        '  "discussion_notes": "Client requested proposal for 6-level puzzle parking.",\n'
        '  "client_commitment": "Will share site CAD drawing by Monday.",\n'
        '  "our_commitment": "Will provide formal quotation within 48 hours.",\n'
        '  "qualifying_info": {\n'
        '    "decision_maker": "Mr. Rajesh Malhotra (MD)",\n'
        '    "budget_range": "25 - 30 Lakhs",\n'
        '    "timeline": "Immediate (Within 1 Month)",\n'
        '    "car_type": "suv"\n'
        '  },\n'
        '  "faq_answers": [\n'
        '    { "faq": 1, "answer": "Budget confirmed around 28 Lakhs." },\n'
        '    { "faq": 2, "answer": "Decision maker is the Managing Director." }\n'
        '  ]\n'
        "}"
    )
    story.append(Paragraph(fup_json, code_style))

    # Section 23 - Lead FAQ Master API
    story.append(Paragraph("23. Lead FAQ Master API", h1_style))
    story.append(Paragraph("<b>Endpoint Base Path:</b> <code>https://chronolms.com/lead/lead-faqs/</code>", body_style))
    story.append(Paragraph("<b>Fields:</b> <code>id</code> (Integer), <code>question</code> (String), <code>is_active</code> (Boolean), <code>sort_order</code> (Integer)", body_style))

    # Section 24 - n8n Workflow Guide
    story.append(Paragraph("24. n8n Node Configuration Quick Reference Guide", h1_style))
    story.append(Paragraph("When configuring an <b>n8n HTTP Request Node</b> to communicate with NNIT CRM:", body_style))
    story.append(Paragraph("1. <b>Authentication:</b> Use Header Auth or automated JWT login sub-workflow. Set Header Key: <code>Authorization</code> and Value: <code>Bearer {{$node['JWT Login'].json['access']}}</code>", body_style))
    story.append(Paragraph("2. <b>Content-Type:</b> Set <code>Content-Type: application/json</code>", body_style))
    story.append(Paragraph("3. <b>Customer Lookup Node:</b> Method: <code>GET</code> | URL: <code>https://chronolms.com/lead/customer/lookup/?search={{ $json.phone }}</code>", body_style))
    story.append(Paragraph("4. <b>If Node:</b> Check if <code>{{ $json.length }} > 0</code>. If yes, take customer ID <code>{{ $json[0].id }}</code>. If no, route to Create Customer node.", body_style))
    story.append(Paragraph("5. <b>Create Lead Node:</b> Method: <code>POST</code> | URL: <code>https://chronolms.com/lead/lead/</code>", body_style))

    # Section 25 - Security & Checklist
    story.append(Paragraph("25. Security Requirements & Production Checklist", h1_style))
    story.append(Paragraph("• Do not share production server SSH keys, Django admin credentials, or database passwords in code repositories or n8n exported workflows.", body_style))
    story.append(Paragraph("• Always use HTTPS for API endpoints.", body_style))
    story.append(Paragraph("• Store the service account password securely in n8n Credentials or Environment Variables.", body_style))

    # Section 26 - Handover Table
    story.append(Paragraph("26. Final Integration & Handover Summary", h1_style))

    handover_data = [
        [Paragraph("<b>Requirement</b>", tbl_header_style), Paragraph("<b>Production Status / Value</b>", tbl_header_style)],
        [Paragraph("Production Base URL", tbl_cell_style), Paragraph("https://chronolms.com", tbl_cell_code)],
        [Paragraph("JWT Authentication Endpoint", tbl_cell_style), Paragraph("POST https://chronolms.com/token/", tbl_cell_code)],
        [Paragraph("JWT Refresh Endpoint", tbl_cell_style), Paragraph("POST https://chronolms.com/token/refresh/", tbl_cell_code)],
        [Paragraph("Lead API Endpoint", tbl_cell_style), Paragraph("https://chronolms.com/lead/lead/", tbl_cell_code)],
        [Paragraph("Customer API Endpoint", tbl_cell_style), Paragraph("https://chronolms.com/lead/customer/", tbl_cell_code)],
        [Paragraph("Lead Follow-up Endpoint", tbl_cell_style), Paragraph("https://chronolms.com/lead/lead-followups/", tbl_cell_code)],
        [Paragraph("Lead FAQ Master Endpoint", tbl_cell_style), Paragraph("https://chronolms.com/lead/lead-faqs/", tbl_cell_code)],
        [Paragraph("Swagger UI Documentation", tbl_cell_style), Paragraph("https://chronolms.com/swagger/", tbl_cell_code)],
        [Paragraph("ReDoc Documentation", tbl_cell_style), Paragraph("https://chronolms.com/redoc/", tbl_cell_code)],
        [Paragraph("n8n Dedicated Service Account", tbl_cell_style), Paragraph("Username: n8n_automation (To be created in CRM)", tbl_cell_style)],
        [Paragraph("Service Account Permissions", tbl_cell_style), Paragraph("Lead, Customer, Follow-up (Read, Create, Update)", tbl_cell_style)]
    ]
    t_ho = Table(handover_data, colWidths=[200, 340])
    t_ho.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_ho)

    doc.build(story)
    print(f"[SUCCESS] PDF generated successfully: {filename}")

def build_docx(filename="NNIT_CRM_API_Integration_Documentation.docx"):
    doc = docx.Document()

    # Set Margins
    for s in doc.sections:
        s.top_margin = Inches(0.5)
        s.bottom_margin = Inches(0.5)
        s.left_margin = Inches(0.5)
        s.right_margin = Inches(0.5)

    # Styles
    styles = doc.styles

    def add_title(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(20)
        run.bold = True
        run.font.color.rgb = RGBColor(15, 23, 42)

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(12)
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(71, 85, 105)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(13)
        run.bold = True
        run.font.color.rgb = RGBColor(30, 41, 59)

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(11)
        run.bold = True
        run.font.color.rgb = RGBColor(51, 65, 85)

    def add_body(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.font.name = 'Arial'
            r_pre.font.size = Pt(9.5)
            r_pre.bold = True
            r_pre.font.color.rgb = RGBColor(30, 41, 59)
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(51, 65, 85)

    def add_code_block(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.left_indent = Inches(0.15)
        p.paragraph_format.right_indent = Inches(0.15)
        run = p.add_run(text)
        run.font.name = 'Consolas'
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(15, 23, 42)

    def format_table(table, col_widths):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for row_idx, row in enumerate(table.rows):
            for col_idx, cell in enumerate(row.cells):
                cell.width = Inches(col_widths[col_idx])
                # Shading for header
                if row_idx == 0:
                    shading = parse_xml(r'<w:shd {} w:fill="F1F5F9"/>'.format(nsdecls('w')))
                    cell._tc.get_or_add_tcPr().append(shading)
                for p in cell.paragraphs:
                    p.paragraph_format.space_after = Pt(2)
                    p.paragraph_format.space_before = Pt(2)
                    for r in p.runs:
                        r.font.name = 'Arial'
                        r.font.size = Pt(8.5)
                        if row_idx == 0:
                            r.bold = True
                            r.font.color.rgb = RGBColor(15, 23, 42)

    # Document Content
    add_title("NNIT CRM – API Integration Documentation")
    add_subtitle("Production API Documentation for External System & n8n Automation Integration")

    add_body(" NNIT CRM (NNIT Smart Parking & CRM)", "CRM Name:")
    add_body(" https://chronolms.com", "Production Base URL:")
    add_body(" JWT (JSON Web Token via Bearer Header)", "Authentication:")

    add_h1("1. Integration Overview")
    add_body("NNIT CRM exposes RESTful APIs for external systems (such as n8n, custom portals, and automated workflows) to securely access CRM data. External systems must communicate with NNIT CRM through HTTPS APIs only.")
    add_code_block("External System / n8n Workflow\n    |\n    v  HTTPS REST API\nNNIT CRM Production API (https://chronolms.com)\n    |\n    v  Django REST Framework + SimpleJWT\nNNIT CRM Database")

    add_h1("2. Production API Base URL & API Groups")
    add_body(" https://chronolms.com", "Base URL:")
    add_code_block("https://chronolms.com/token/                 (JWT Authentication)\nhttps://chronolms.com/lead/lead/            (Leads Management)\nhttps://chronolms.com/lead/customer/        (Customer Management)\nhttps://chronolms.com/lead/lead-followups/  (Follow-up Records)\nhttps://chronolms.com/lead/lead-faqs/       (Qualifying FAQ Master)")

    add_h1("3. API Documentation")
    add_body(" https://chronolms.com/swagger/", "Swagger UI:")
    add_body(" https://chronolms.com/redoc/", "ReDoc:")

    add_h1("4. API Authentication (JWT)")
    add_body("NNIT CRM uses JWT authentication. Include token in Header:")
    add_code_block("Authorization: Bearer <access_token>")

    add_h1("5. Obtain Access Token")
    add_code_block("POST https://chronolms.com/token/\n\nRequest:\n{\n  \"username\": \"SERVICE_ACCOUNT_USERNAME\",\n  \"password\": \"SERVICE_ACCOUNT_PASSWORD\"\n}\n\nResponse (200 OK):\n{\n  \"refresh\": \"<refresh_token>\",\n  \"access\": \"<access_token>\"\n}")

    add_h1("6. Refresh Access Token")
    add_code_block("POST https://chronolms.com/token/refresh/\nRequest:  { \"refresh\": \"<refresh_token>\" }\nResponse: { \"access\": \"<new_access_token>\" }")

    add_h1("7. Verify Token")
    add_code_block("POST https://chronolms.com/token/verify/\nRequest:  { \"token\": \"<access_token>\" }")

    add_h1("8. Service Account")
    add_body("Recommended Service Account: Username: n8n_automation | Email: n8n.automation@nnitcrm.com | Role: Integration Service Account")

    add_h1("9. Recommended Permissions")
    tbl_perm = doc.add_table(rows=6, cols=3)
    rows_p = [
        ["Module", "Endpoint Path", "Recommended Access"],
        ["Lead Management", "/lead/lead/", "Read, Create, Update, Filter, Search"],
        ["Customer Management", "/lead/customer/", "Read, Create, Update, Lookup"],
        ["Lead Follow-ups", "/lead/lead-followups/", "Read, Create, Update"],
        ["Lead FAQ Master", "/lead/lead-faqs/", "Read Only"],
        ["User Management", "/auth/staff/", "No Access"]
    ]
    for r_idx, r_data in enumerate(rows_p):
        for c_idx, val in enumerate(r_data):
            tbl_perm.rows[r_idx].cells[c_idx].paragraphs[0].text = val
    format_table(tbl_perm, [2.0, 2.5, 3.0])

    add_h1("10. Lead API Documentation")
    add_body("https://chronolms.com/lead/lead/", "Endpoint:")
    add_body("GET, POST, PUT, PATCH, DELETE", "Supported Methods:")
    add_h2("10.1 Create Lead Request Payload & Fields")

    tbl_l = doc.add_table(rows=11, cols=3)
    rows_l = [
        ["Field", "Type", "Description / Allowed Values"],
        ["customer", "Integer", "Required. Primary Key of Customer record"],
        ["requirements_details", "Text", "Requirements details (e.g. 4 level puzzle parking)"],
        ["lead_source", "String", "Required. Enum: google_ads, indiamart, bni, justdial, reference, architect/interior_designer, builder, existing_customer, ka_staff, other"],
        ["status", "String", "Enum: open, in_process, close_win, close_loss, closed (Default: open)"],
        ["lead_type", "String", "Type of lead (e.g. Commercial Parking)"],
        ["is_service_lead", "String", "Enum: sales, service, both"],
        ["project_name", "String", "Project / Site Title"],
        ["project_adderess", "String", "Project Site Address"],
        ["contact_person_name", "String", "Contact person name"],
        ["followup_date", "Date", "Next follow-up date (YYYY-MM-DD)"]
    ]
    for r_idx, r_data in enumerate(rows_l):
        for c_idx, val in enumerate(r_data):
            tbl_l.rows[r_idx].cells[c_idx].paragraphs[0].text = val
    format_table(tbl_l, [1.8, 1.2, 4.5])

    add_code_block("POST https://chronolms.com/lead/lead/\n{\n  \"customer\": 105,\n  \"requirements_details\": \"Customer requires 6-level puzzle parking system.\",\n  \"lead_source\": \"google_ads\",\n  \"status\": \"open\",\n  \"project_name\": \"Apex Tower Project\",\n  \"contact_person_name\": \"Rajesh Malhotra\",\n  \"contact_person_number\": \"9876543210\",\n  \"followup_date\": \"2026-09-15\"\n}")

    add_h1("11. Lead Status & Source Enums")
    add_body("open, in_process, close_win, close_loss, closed", "Status Enums:")
    add_body("google_ads, indiamart, bni, justdial, reference, architect/interior_designer, builder, existing_customer, ka_staff, other", "Source Enums:")

    add_h1("12. Search, Filter & Sort Leads")
    add_code_block("GET /lead/lead/?search=9876543210\nGET /lead/lead/?status=open\nGET /lead/lead/?assign_to=5\nGET /lead/lead/?followup_today=true\nGET /lead/lead/?overdue=true\nGET /lead/lead/?ordering=-date")

    add_h1("13. Latest Lead by Mobile")
    add_code_block("GET https://chronolms.com/lead/lead/latest-lead-by-mobile/?mobile=9876543210")

    add_h1("14. Convert Lead to Customer")
    add_code_block("POST https://chronolms.com/lead/lead/{id}/convert-to-customer/")

    add_h1("15. Customer API Documentation")
    add_body("https://chronolms.com/lead/customer/", "Endpoint:")
    add_code_block("GET /lead/customer/                     (List converted customers)\nGET /lead/customer/lookup/?search=9876543210  (Search ALL customers including lead-only)\nGET /lead/customer/{id}/leads/          (Fetch leads for customer)\nGET /lead/customer/{id}/followup-history/ (Fetch customer followup history)")

    add_h1("16. Recommended Customer/Lead Creation Flow for n8n")
    add_code_block("Step 1: Search Customer by Phone (GET /lead/customer/lookup/?search=<phone>)\nStep 2: If Exists -> Use Customer ID | If Not Found -> Create Customer (POST /lead/customer/)\nStep 3: Create Lead Record linked to Customer ID (POST /lead/lead/)")

    add_h1("17. Lead Follow-up API Documentation")
    add_body("https://chronolms.com/lead/lead-followups/", "Endpoint:")
    add_code_block("GET /lead/lead-followups/?lead=105       (Filter followups by Lead ID)\nGET /lead/lead-followups/timeline/{lead_id}/ (Timeline for lead)\n\nPOST /lead/lead-followups/\n{\n  \"lead\": 105,\n  \"followup_date\": \"2026-09-12\",\n  \"interaction_type\": \"call\",\n  \"client_response\": \"positive\",\n  \"followup_status\": \"completed\",\n  \"status\": \"in_process\",\n  \"remarks\": \"Discussed parking layout options.\",\n  \"client_commitment\": \"Will share site layout CAD.\"\n}")

    add_h1("18. Final Handover Information")
    tbl_ho = doc.add_table(rows=7, cols=2)
    rows_h = [
        ["Requirement", "Production Status / Value"],
        ["Production Base URL", "https://chronolms.com"],
        ["JWT Token Endpoint", "POST https://chronolms.com/token/"],
        ["Lead API Endpoint", "https://chronolms.com/lead/lead/"],
        ["Customer API Endpoint", "https://chronolms.com/lead/customer/"],
        ["Lead Follow-up Endpoint", "https://chronolms.com/lead/lead-followups/"],
        ["Swagger UI Documentation", "https://chronolms.com/swagger/"]
    ]
    for r_idx, r_data in enumerate(rows_h):
        for c_idx, val in enumerate(r_data):
            tbl_ho.rows[r_idx].cells[c_idx].paragraphs[0].text = val
    format_table(tbl_ho, [3.0, 4.5])

    doc.save(filename)
    print(f"[SUCCESS] DOCX generated successfully: {filename}")

if __name__ == "__main__":
    build_pdf("NNIT_CRM_API_Integration_Documentation.pdf")
    build_docx("NNIT_CRM_API_Integration_Documentation.docx")
    build_pdf("NNIT_CRM_N8N_API_Documentation.pdf")
    build_docx("NNIT_CRM_N8N_API_Documentation.docx")
