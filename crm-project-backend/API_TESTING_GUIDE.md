# NNIT CRM - API Testing Guide

Complete API testing guide for Staff, Lead, Customer, and Follow-up modules.

---

## 🔐 AUTHENTICATION

### 1. Login (Get JWT Token)
```bash
POST /auth/dj-rest-auth/login/
Content-Type: application/json

{
  "email_or_mobile": "admin@example.com",
  "password": "your_password"
}

# Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "mobile_no": "9876543210"
  }
}
```

**Use the `access` token in all subsequent requests:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## 👥 STAFF MANAGEMENT APIs

### 1. Create New Staff
```bash
POST /auth/staff/
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "email": "sales1@nnit.com",
  "mobile_no": "9876543210",
  "first_name": "Rajesh",
  "last_name": "Kumar",
  "role": 3,
  "password": "SecurePass@123",
  "is_active": true
}

# Response: 201 Created
{
  "id": 5,
  "email": "sales1@nnit.com",
  "mobile_no": "9876543210",
  "first_name": "Rajesh",
  "last_name": "Kumar",
  "full_name": "Rajesh Kumar",
  "role": {
    "id": 3,
    "name": "Sales"
  },
  "profile_photo": null,
  "is_active": true,
  "date_joined": "2026-07-15T10:30:00Z"
}
```

### 2. List All Staff
```bash
GET /auth/staff/
Authorization: Bearer <your_token>

# With pagination (default 10 per page)
GET /auth/staff/?page=1&page_size=20

# Search by name or email
GET /auth/staff/?search=rajesh

# Filter by role
GET /auth/staff/?role=3

# Response:
{
  "count": 15,
  "next": "http://api.example.com/auth/staff/?page=2",
  "previous": null,
  "results": [
    {
      "id": 5,
      "email": "sales1@nnit.com",
      "full_name": "Rajesh Kumar",
      "role": {"id": 3, "name": "Sales"}
    }
  ]
}
```

### 3. Get Staff Details
```bash
GET /auth/staff/5/
Authorization: Bearer <your_token>

# Response:
{
  "id": 5,
  "email": "sales1@nnit.com",
  "mobile_no": "9876543210",
  "first_name": "Rajesh",
  "last_name": "Kumar",
  "full_name": "Rajesh Kumar",
  "role": {
    "id": 3,
    "name": "Sales"
  },
  "is_active": true
}
```

### 4. Update Staff
```bash
PUT /auth/staff/5/
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "first_name": "Rajesh",
  "last_name": "Sharma",
  "mobile_no": "9876543210",
  "role": 3
}

# Partial Update (PATCH)
PATCH /auth/staff/5/
{
  "is_active": false
}
```

### 5. Get Current User Details
```bash
GET /auth/me/
Authorization: Bearer <your_token>

# Response:
{
  "id": 5,
  "email": "sales1@nnit.com",
  "full_name": "Rajesh Kumar",
  "role": {"id": 3, "name": "Sales"}
}
```

---

## 👤 CUSTOMER MANAGEMENT APIs

### 1. Create Customer
```bash
POST /lead/customer/
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "name": "Sharma Builders Pvt Ltd",
  "contact_number": "9876543210",
  "secondary_contact_number": "9876543211",
  "email": "info@sharmabuilders.com",
  "secondary_email": "contact@sharmabuilders.com",
  "poc_name": "Mr. Amit Sharma",
  "poc_contact_number": "9876543212",
  "land_line_no": "022-12345678",
  "address": "123, MG Road, Andheri East",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pin_code": "400069",
  "both_address_is_same": false,
  "site_address": "Plot No 45, Sector 12, Vashi",
  "site_city": "Navi Mumbai",
  "site_state": "Maharashtra",
  "site_pin_code": "400703",
  "gst": "27AABCS1234F1Z5",
  "pan": "AABCS1234F"
}

# Response: 201 Created
{
  "id": 10,
  "name": "Sharma Builders Pvt Ltd",
  "contact_number": "9876543210",
  "email": "info@sharmabuilders.com",
  "city": "Mumbai",
  "total_leads": 0,
  "active_leads": 0,
  "created_at": "2026-07-15T10:30:00Z"
}
```

### 2. List Customers
```bash
GET /lead/customer/
Authorization: Bearer <your_token>

# Search by name, email, or contact
GET /lead/customer/?search=sharma

# Search by exact email
GET /lead/customer/?search==info@sharmabuilders.com

# Order by name or created date
GET /lead/customer/?ordering=name
GET /lead/customer/?ordering=-created_at

# Response:
{
  "count": 25,
  "results": [
    {
      "id": 10,
      "name": "Sharma Builders Pvt Ltd",
      "contact_number": "9876543210",
      "email": "info@sharmabuilders.com",
      "city": "Mumbai",
      "total_leads": 3,
      "active_leads": 2
    }
  ]
}
```

### 3. Get Customer Details
```bash
GET /lead/customer/10/
Authorization: Bearer <your_token>

# Response: Full customer details with all fields
```

### 4. Get Customer's Leads
```bash
GET /lead/customer/10/leads/
Authorization: Bearer <your_token>

# Response:
[
  {
    "id": 15,
    "customer_name": "Sharma Builders Pvt Ltd",
    "project_name": "Residential Tower A",
    "status": "in_process",
    "followup_date": "2026-07-20",
    "total_followups": 5
  }
]
```

### 5. Get Customer's Follow-up History
```bash
GET /lead/customer/10/followup-history/
Authorization: Bearer <your_token>

# Response: All follow-ups across all leads for this customer
[
  {
    "id": 25,
    "lead": 15,
    "followup_date": "2026-07-15",
    "status": "in_process",
    "discussion_notes": "Discussed plot dimensions...",
    "suggested_solution": [...]
  }
]
```

---

## 📞 LEAD MANAGEMENT APIs

### 1. Create Lead
```bash
POST /lead/lead/
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "customer": 10,
  "lead_source": "indiamart",
  "project_name": "Residential Tower A",
  "project_adderess": "Plot 45, Vashi, Navi Mumbai",
  "requirements_details": "Need parking solution for 50 cars, 2-level basement available",
  "contact_person_name": "Mr. Amit Sharma",
  "contact_person_number": "9876543212",
  "enquiry_date": "2026-07-10",
  "followup_date": "2026-07-15",
  "status": "open",
  "assign_to": 5
}

# Response: 201 Created
{
  "id": 15,
  "customer": 10,
  "customer_name": "Sharma Builders Pvt Ltd",
  "customer_contact": "9876543210",
  "lead_source": "indiamart",
  "project_name": "Residential Tower A",
  "status": "open",
  "followup_date": "2026-07-15",
  "assign_to_details": {
    "id": 5,
    "full_name": "Rajesh Kumar"
  },
  "total_followups": 0,
  "date": "2026-07-15",
  "created_at": "2026-07-15T10:30:00Z"
}
```

### 2. List Leads
```bash
GET /lead/lead/
Authorization: Bearer <your_token>

# Filter by assigned user
GET /lead/lead/?assign_to=5

# Filter by status
GET /lead/lead/?status=open
GET /lead/lead/?status=in_process

# Filter by lead source
GET /lead/lead/?lead_source=indiamart

# Get overdue follow-ups
GET /lead/lead/?overdue=true

# Date range filters
GET /lead/lead/?date_from=2026-07-01&date_to=2026-07-15
GET /lead/lead/?followup_date_from=2026-07-15&followup_date_to=2026-07-20

# Search by customer name, contact, or project
GET /lead/lead/?search=sharma

# Combined filters
GET /lead/lead/?assign_to=5&status=in_process&ordering=-followup_date

# Response: Leads sorted by priority (today > future > overdue > none)
{
  "count": 50,
  "results": [
    {
      "id": 15,
      "customer_name": "Sharma Builders Pvt Ltd",
      "project_name": "Residential Tower A",
      "status": "in_process",
      "followup_date": "2026-07-15",
      "last_followup_date": "2026-07-10",
      "total_followups": 3,
      "latest_followup": {
        "id": 25,
        "followup_date": "2026-07-10",
        "status": "in_process"
      }
    }
  ]
}
```

### 3. Get Lead Details
```bash
GET /lead/lead/15/
Authorization: Bearer <your_token>

# Response: Complete lead details with followup history
{
  "id": 15,
  "customer": 10,
  "customer_name": "Sharma Builders Pvt Ltd",
  "customer_contact": "9876543210",
  "customer_email": "info@sharmabuilders.com",
  "customer_address": "123, MG Road, Andheri East",
  "project_name": "Residential Tower A",
  "status": "in_process",
  "followup_date": "2026-07-20",
  "last_followup_date": "2026-07-15",
  "total_followups": 3,
  "followups": [
    {
      "id": 25,
      "followup_date": "2026-07-15",
      "status": "in_process",
      "discussion_notes": "Discussed technical requirements",
      "suggested_solution": [...]
    }
  ]
}
```

### 4. Update Lead
```bash
PUT /lead/lead/15/
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "customer": 10,
  "status": "in_process",
  "followup_date": "2026-07-20",
  "remarks": "Customer showed interest in Stack Parking"
}

# Partial Update
PATCH /lead/lead/15/
{
  "status": "closed"
}
```

### 5. Get Latest Lead by Mobile
```bash
GET /lead/lead/latest-lead-by-mobile/?mobile=9876543210
Authorization: Bearer <your_token>

# Response:
{
  "project_name": "Residential Tower A",
  "address": "Plot 45, Vashi"
}
```

---

## 📝 FOLLOW-UP MANAGEMENT APIs

### 1. Create Follow-up (Simple)
```bash
POST /lead/lead-followups/
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "lead": 15,
  "followup_date": "2026-07-15",
  "next_followup_date": "2026-07-20",
  "status": "in_process",
  "remarks": "Customer interested in Stack Parking",
  "discussion_notes": "Discussed plot dimensions: 20x30x12 ft. Customer prefers fully automatic. Budget: 15-20 lakhs."
}

# Response: 201 Created
{
  "id": 25,
  "lead": 15,
  "lead_customer_name": "Sharma Builders Pvt Ltd",
  "followup_date": "2026-07-15",
  "next_followup_date": "2026-07-20",
  "status": "in_process",
  "remarks": "Customer interested in Stack Parking",
  "discussion_notes": "Discussed plot dimensions...",
  "suggested_solution": null,
  "created_by": 5,
  "created_by_name": "Rajesh",
  "created_at": "2026-07-15T10:30:00Z"
}
```

### 2. Create Follow-up with Suggested Solution
```bash
POST /lead/lead-followups/
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "lead": 15,
  "followup_date": "2026-07-15",
  "next_followup_date": "2026-07-20",
  "status": "in_process",
  "remarks": "Suggested parking solutions",
  "discussion_notes": "Customer requirements: 50 cars, 2-level basement, fully automatic",
  "suggested_solution": [
    {
      "product_id": 5,
      "product_name": "2DP 101",
      "category": "Stack Parking",
      "capacity": 4,
      "reason": "Best fit for 2-level basement parking, fully automatic"
    },
    {
      "product_id": 12,
      "product_name": "Puzzle 201",
      "category": "Puzzle Parking",
      "capacity": 8,
      "reason": "Alternative if basement height is sufficient (min 12ft)"
    }
  ],
  "faq_answers": [
    {
      "faq": 1,
      "answer": "20x30x12 feet"
    },
    {
      "faq": 2,
      "answer": "50 cars"
    }
  ]
}

# Response: 201 Created with suggested_solution and faq_answers
```

### 3. List Follow-ups
```bash
GET /lead/lead-followups/
Authorization: Bearer <your_token>

# Get follow-ups for specific lead
GET /lead/lead-followups/?lead=15

# Filter by status
GET /lead/lead-followups/?status=in_process

# Filter by date range
GET /lead/lead-followups/?followup_date=2026-07-15

# Search by remarks or customer name
GET /lead/lead-followups/?search=parking

# Order by date
GET /lead/lead-followups/?ordering=-followup_date

# Response:
{
  "count": 10,
  "results": [
    {
      "id": 25,
      "lead": 15,
      "followup_date": "2026-07-15",
      "status": "in_process",
      "suggested_solution": [...]
    }
  ]
}
```

### 4. Get Follow-up Timeline for Lead
```bash
GET /lead/lead-followups/timeline/15/
Authorization: Bearer <your_token>

# Response: All follow-ups for lead #15 in chronological order
[
  {
    "id": 27,
    "followup_date": "2026-07-15",
    "status": "in_process",
    "discussion_notes": "Latest discussion...",
    "suggested_solution": [...]
  },
  {
    "id": 25,
    "followup_date": "2026-07-10",
    "status": "open",
    "discussion_notes": "Initial contact..."
  }
]
```

### 5. Get Recent Follow-ups (Last 7 Days)
```bash
GET /lead/lead-followups/recent/
Authorization: Bearer <your_token>

# Response: Last 50 follow-ups from past 7 days
[
  {
    "id": 30,
    "lead": 18,
    "followup_date": "2026-07-15",
    "status": "in_process"
  }
]
```

### 6. Update Follow-up
```bash
PUT /lead/lead-followups/25/
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "lead": 15,
  "followup_date": "2026-07-15",
  "next_followup_date": "2026-07-22",
  "status": "in_process",
  "remarks": "Customer confirmed interest",
  "discussion_notes": "Updated discussion notes...",
  "suggested_solution": [
    {
      "product_id": 5,
      "product_name": "2DP 101",
      "selected": true
    }
  ]
}

# Partial Update
PATCH /lead/lead-followups/25/
{
  "status": "closed"
}
```

---

## 📊 FAQ MANAGEMENT

### 1. List FAQs
```bash
GET /lead/lead-faqs/
Authorization: Bearer <your_token>

# Response:
[
  {
    "id": 1,
    "question": "What is the plot dimension?",
    "is_active": true,
    "sort_order": 1
  },
  {
    "id": 2,
    "question": "Number of cars required?",
    "is_active": true,
    "sort_order": 2
  }
]
```

### 2. Create FAQ
```bash
POST /lead/lead-faqs/
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "question": "Preferred parking type?",
  "is_active": true,
  "sort_order": 5
}
```

---

## 🔧 ROLE MANAGEMENT

### List Roles
```bash
GET /auth/roles/
Authorization: Bearer <your_token>

# Response:
[
  {
    "id": 1,
    "name": "Admin"
  },
  {
    "id": 2,
    "name": "Sub-admin"
  },
  {
    "id": 3,
    "name": "Sales"
  }
]
```

---

## 🎯 REAL-WORLD WORKFLOW EXAMPLE

### Complete Lead to Follow-up Flow
```bash
# Step 1: Login
POST /auth/dj-rest-auth/login/
{
  "email_or_mobile": "sales@nnit.com",
  "password": "pass123"
}
# Get token: eyJ0eXAiOiJKV1Qi...

# Step 2: Create Customer
POST /lead/customer/
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
{
  "name": "ABC Builders",
  "contact_number": "9876543210",
  "email": "abc@builders.com",
  "city": "Mumbai"
}
# Response: customer_id = 10

# Step 3: Create Lead
POST /lead/lead/
{
  "customer": 10,
  "lead_source": "indiamart",
  "project_name": "Tower A",
  "followup_date": "2026-07-20"
}
# Response: lead_id = 15

# Step 4: Add First Follow-up
POST /lead/lead-followups/
{
  "lead": 15,
  "followup_date": "2026-07-15",
  "next_followup_date": "2026-07-20",
  "status": "open",
  "discussion_notes": "Initial inquiry"
}

# Step 5: Add Second Follow-up with Solution
POST /lead/lead-followups/
{
  "lead": 15,
  "followup_date": "2026-07-20",
  "next_followup_date": "2026-07-25",
  "status": "in_process",
  "discussion_notes": "Discussed requirements",
  "suggested_solution": [
    {
      "product_id": 5,
      "product_name": "2DP 101",
      "category": "Stack Parking"
    }
  ]
}

# Step 6: View Complete Lead History
GET /lead/lead/15/
# See all follow-ups with suggested solutions

# Step 7: View Customer's Complete History
GET /lead/customer/10/followup-history/
# See all follow-ups across all leads
```

---

## ⚠️ COMMON ERRORS

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```
**Solution:** Add `Authorization: Bearer <token>` header

### 400 Bad Request
```json
{
  "contact_number": ["Customer with this contact number already exists."]
}
```
**Solution:** Check validation errors and fix input

### 404 Not Found
```json
{
  "detail": "Not found."
}
```
**Solution:** Verify the ID exists

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```
**Solution:** Check user role permissions

---

## 🧪 POSTMAN COLLECTION

Import this collection to test all APIs:
```json
{
  "info": {
    "name": "NNIT CRM APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{access_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000"
    }
  ]
}
```

---

**Last Updated:** July 15, 2026
