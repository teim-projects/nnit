# NNIT Car Parking System - Updated Modules Documentation

## Overview
This document details the updates made to the **Staff, Lead, Customer, and Follow-up** modules for the NNIT Car Parking CRM System.

---

## 🎯 KEY CHANGES SUMMARY

### **What Was Removed from Follow-up Form:**
- Site location
- Basement available (Yes/No)
- Pit possible (Yes/No)
- Type of cars (SUV/Sedan/Mixed)
- Budget range
- Timeline for installation
- Site challenges

**Note:** These fields remain in the **Requirement Form** where they belong.

### **What Was Added:**
1. **Discussion Notes** field in follow-up for detailed conversation records
2. **Suggested Solution** (JSONField) to store recommended parking products
3. **Last Follow-up Date** tracking in leads
4. **Timeline tracking** with `created_at` and `updated_at` for all models
5. **Enhanced customer detail views** showing follow-up history
6. **Better filtering and search** capabilities

---

## 📊 MODULE DETAILS

### 1️⃣ **STAFF MODULE** (`api` app)

#### **Models**
- **CustomUser**: Email/mobile authentication with role-based access
- **Role**: Admin, Sub-admin, Sales staff
- **BranchManagement**: Branch/office locations
- **SiteManagement**: Project site details

#### **Key Fields (CustomUser)**
```python
- email (unique)
- mobile_no (unique, 10 digits)
- first_name
- last_name
- role (ForeignKey to Role)
- profile_photo
- is_active
- is_staff
- is_superuser
- date_joined
```

#### **API Endpoints**
```
GET    /auth/staff/                    # List all staff
POST   /auth/staff/                    # Create new staff
GET    /auth/staff/{id}/               # Get staff details
PUT    /auth/staff/{id}/               # Update staff
DELETE /auth/staff/{id}/               # Delete staff (admin only)
GET    /auth/staff/all/                # Get all staff without pagination
GET    /auth/me/                       # Get current user details
GET    /auth/roles/                    # List all roles
POST   /auth/roles/                    # Create new role
```

#### **Permissions**
- **Admin/Superuser**: Full CRUD access
- **Sub-admin**: Can view, create, update but cannot delete
- **Sales**: Can only view assigned leads/customers

---

### 2️⃣ **CUSTOMER MODULE** (`lead_management` app)

#### **Model: Customer**
```python
class Customer(models.Model):
    # Basic Information
    name
    contact_number (unique)
    secondary_contact_number
    email
    secondary_email
    
    # POC Details
    poc_name
    poc_contact_number
    land_line_no
    
    # Billing Address
    address
    city
    state
    pin_code
    
    # Site Address
    both_address_is_same
    site_address
    site_city
    site_state
    site_pin_code
    
    # Business Details
    gst
    pan
    
    # Timestamps
    created_at
    updated_at
```

#### **API Endpoints**
```
GET    /lead/customer/                      # List all customers
POST   /lead/customer/                      # Create new customer
GET    /lead/customer/{id}/                 # Get customer details
PUT    /lead/customer/{id}/                 # Update customer
DELETE /lead/customer/{id}/                 # Delete customer
GET    /lead/customer/{id}/leads/           # Get all leads for customer
GET    /lead/customer/{id}/followup-history/ # Get complete followup history
```

#### **Response Enhancements**
```json
{
  "id": 1,
  "name": "John Doe",
  "contact_number": "9876543210",
  "email": "john@example.com",
  "total_leads": 5,
  "active_leads": 3,
  ...
}
```

#### **Search Fields**
- Name
- Email (exact match with `=`)
- Contact numbers
- POC details
- City, State
- PIN code

---

### 3️⃣ **LEAD MODULE** (`lead_management` app)

#### **Model: lead_management**
```python
class lead_management(models.Model):
    # Customer Reference
    customer (ForeignKey)
    
    # Lead Details
    requirements_details
    lead_type
    lead_source
    lead_source_input (JSONField)
    is_service_lead
    service_type (JSONField)
    status (open/closed/in_process)
    
    # Assignment
    assign_to (ForeignKey to User)
    creatd_by (ForeignKey to User)
    
    # Dates
    date
    enquiry_date
    followup_date
    last_followup_date  # NEW
    
    # Project Info
    project_name
    project_adderess
    contact_person_name
    contact_person_number
    remarks
    
    # Qualification
    is_qualified
    qualifying_answers (JSONField)
    
    # Timestamps
    created_at  # NEW
    updated_at  # NEW
```

#### **Lead Sources**
- `google_ads` - Google Ads
- `indiamart` - IndiaMART
- `bni` - BNI
- `justdial` - Justdial
- `reference` - Reference
- `architect/interior_designer` - Architect/Interior Designer
- `builder` - Builder
- `existing_customer` - Existing Customer
- `ka_staff` - KA Staff
- `other` - Other (custom input)

#### **Lead Status**
- `open` - Open (New leads)
- `in_process` - In Process (Active follow-ups)
- `closed` - Closed (Won/Lost)

#### **API Endpoints**
```
GET    /lead/lead/                          # List all leads
POST   /lead/lead/                          # Create new lead
GET    /lead/lead/{id}/                     # Get lead details
PUT    /lead/lead/{id}/                     # Update lead
DELETE /lead/lead/{id}/                     # Delete lead
GET    /lead/lead/latest-lead-by-mobile/    # Get latest lead by mobile
```

#### **Lead Response Enhancement**
```json
{
  "id": 1,
  "customer": 1,
  "customer_name": "John Doe",
  "customer_contact": "9876543210",
  "status": "in_process",
  "followup_date": "2026-07-20",
  "last_followup_date": "2026-07-15",
  "total_followups": 8,
  "latest_followup": {
    "id": 25,
    "followup_date": "2026-07-15",
    "status": "in_process",
    "remarks": "Customer interested in 2DP 101"
  },
  "assign_to_details": {
    "id": 5,
    "full_name": "Sales Person Name",
    "email": "sales@example.com"
  },
  "followups": [...]  // Complete followup history
}
```

#### **Filtering Options**
- `assign_to` - Filter by assigned user
- `status` - Filter by lead status
- `followup_date` - Filter by followup date
- `date` - Filter by creation date
- `lead_source` - Filter by lead source
- `overdue=true` - Get overdue follow-ups

#### **Smart Ordering**
Leads are automatically sorted by:
1. **Today's follow-ups** (Priority 3)
2. **Future follow-ups** (Priority 2)
3. **Overdue follow-ups** (Priority 1)
4. **No follow-up date** (Priority 0)

---

### 4️⃣ **FOLLOW-UP MODULE** (`lead_management` app)

#### **Model: LeadFollowUp**
```python
class LeadFollowUp(models.Model):
    # Lead Reference
    lead (ForeignKey)
    
    # Follow-up Details
    followup_date
    next_followup_date
    remarks
    discussion_notes  # NEW - Detailed conversation notes
    status
    
    # Solution Tracking
    suggested_solution (JSONField)  # NEW - Stores recommended products
    
    # Audit
    created_by (ForeignKey)
    created_at
    updated_at  # NEW
```

#### **Suggested Solution Format**
```json
{
  "suggested_solution": [
    {
      "product_id": 5,
      "product_name": "2DP 101",
      "category": "Stack Parking",
      "capacity": 4,
      "reason": "Best fit for 2-level basement parking"
    },
    {
      "product_id": 12,
      "product_name": "Puzzle 201",
      "category": "Puzzle Parking",
      "capacity": 8,
      "reason": "Alternative if basement height is sufficient"
    }
  ]
}
```

#### **API Endpoints**
```
GET    /lead/lead-followups/                      # List all follow-ups
POST   /lead/lead-followups/                      # Create new follow-up
GET    /lead/lead-followups/{id}/                 # Get follow-up details
PUT    /lead/lead-followups/{id}/                 # Update follow-up
DELETE /lead/lead-followups/{id}/                 # Delete follow-up
GET    /lead/lead-followups/?lead={id}            # Get follow-ups for specific lead
GET    /lead/lead-followups/timeline/{lead_id}/   # Get follow-up timeline
GET    /lead/lead-followups/recent/               # Get recent follow-ups (last 7 days)
```

#### **Follow-up Response**
```json
{
  "id": 25,
  "lead": 1,
  "lead_customer_name": "John Doe",
  "followup_date": "2026-07-15",
  "next_followup_date": "2026-07-20",
  "remarks": "Customer interested in Stack Parking",
  "discussion_notes": "Discussed plot dimensions: 20x30x12 ft. Customer prefers fully automatic system. Budget: 15-20 lakhs.",
  "status": "in_process",
  "suggested_solution": [
    {
      "product_id": 5,
      "product_name": "2DP 101",
      "category": "Stack Parking",
      "capacity": 4
    }
  ],
  "created_by": 5,
  "created_by_name": "Sales Person",
  "created_at": "2026-07-15T10:30:00Z",
  "updated_at": "2026-07-15T14:20:00Z",
  "faq_answers": [
    {
      "faq": 1,
      "faq_question": "What is the plot dimension?",
      "answer": "20x30x12 feet"
    }
  ]
}
```

#### **Auto-sync with Lead**
When a follow-up is created/updated:
- Lead's `status` is updated to match follow-up status
- Lead's `followup_date` is set to `next_followup_date`
- Lead's `last_followup_date` is set to current `followup_date`
- Lead's `remarks` is updated if provided

#### **FAQ System**
- **LeadFAQ**: Predefined questions (e.g., "What is the plot dimension?")
- **LeadFollowUpFAQAnswer**: Answers linked to specific follow-ups

---

## 🔄 WORKFLOW CHANGES

### **Old Workflow (❌ Removed)**
```
Add Lead → Follow-up (with requirement questions) → Create Requirement
```

### **New Workflow (✅ Updated)**
```
1. Add Lead (basic info)
2. Follow-up (discussion notes + suggest solution)
3. Create Requirement (complete technical details)
4. View Suggested Solutions in follow-up history
5. Create Quotation → Invoice
```

---

## 📋 FOLLOW-UP FORM STRUCTURE

### **Fields in Follow-up Form:**
```
✅ Follow-up Date *
✅ Next Follow-up Date
✅ Status (open/in_process/closed) *
✅ Remarks
✅ Discussion Notes (detailed conversation)
✅ Suggested Solution (add recommended products)
✅ FAQ Answers (optional structured questions)
```

### **Fields REMOVED from Follow-up (now in Requirement):**
```
❌ Site location
❌ Basement available
❌ Pit possible
❌ Type of cars
❌ Budget range
❌ Timeline for installation
❌ Site challenges
```

---

## 🎨 FRONTEND UI RECOMMENDATIONS

### **Customer Detail Page**
```
┌─────────────────────────────────────────┐
│ Customer: John Doe                      │
│ Contact: 9876543210                     │
│ Email: john@example.com                 │
├─────────────────────────────────────────┤
│ [Leads Tab] [Follow-up History Tab]     │
├─────────────────────────────────────────┤
│ Follow-up Timeline (Latest First)       │
│                                         │
│ 🕐 July 15, 2026                        │
│ Status: In Process                      │
│ Discussion: Discussed plot dimensions...│
│ Suggested: 2DP 101 (Stack Parking)      │
│ Next: July 20, 2026                     │
│ ─────────────────────────────────       │
│ 🕐 July 10, 2026                        │
│ Status: Open                            │
│ Discussion: Initial inquiry...          │
│ Next: July 15, 2026                     │
└─────────────────────────────────────────┘
```

### **Follow-up Form**
```
┌─────────────────────────────────────────┐
│ Add Follow-up                           │
├─────────────────────────────────────────┤
│ Follow-up Date: [Date Picker] *         │
│ Next Follow-up: [Date Picker]           │
│ Status: [Dropdown] *                    │
│                                         │
│ Remarks: [Text Area]                    │
│                                         │
│ Discussion Notes: [Large Text Area]     │
│ (Detailed conversation, customer needs)  │
│                                         │
│ Suggested Solutions:                    │
│ [+ Add Product]                         │
│ ┌─────────────────────────────────┐     │
│ │ Product: 2DP 101                │     │
│ │ Category: Stack Parking         │     │
│ │ Reason: Best for 2-level...     │     │
│ │ [Remove]                        │     │
│ └─────────────────────────────────┘     │
│                                         │
│ [Cancel] [Save Follow-up]               │
└─────────────────────────────────────────┘
```

### **Lead List Page**
```
┌────────────────────────────────────────────────────────┐
│ 📊 Today's Follow-ups (3) 🔴 Overdue (5)              │
├────────────────────────────────────────────────────────┤
│ Customer      | Contact    | Status     | Next F/U    │
├────────────────────────────────────────────────────────┤
│ John Doe      | 9876543210 | In Process | Today       │
│ Jane Smith    | 9876543211 | Open       | Tomorrow    │
│ Bob Wilson    | 9876543212 | In Process | Jul 20      │
└────────────────────────────────────────────────────────┘
```

---

## 🔐 PERMISSIONS & ACCESS CONTROL

### **Admin/Superuser**
- Full CRUD access to all modules
- Can delete staff, customers, leads, follow-ups
- Can assign leads to any user
- Can view all leads regardless of assignment

### **Sub-admin**
- Can create, read, and update
- Cannot delete records
- Can assign leads to any user
- Can view all leads

### **Sales Staff**
- Can only view/edit leads assigned to them
- Can create customers and leads
- Can add follow-ups to their leads
- Cannot delete any records
- Cannot reassign leads

---

## 🗄️ DATABASE MIGRATION

### **Run Migration**
```bash
python manage.py makemigrations
python manage.py migrate
```

### **Migration Operations**
1. Add `created_at`, `updated_at` to Customer
2. Add `last_followup_date`, `created_at`, `updated_at` to lead_management
3. Add `discussion_notes`, `suggested_solution`, `updated_at` to LeadFollowUp

---

## 🧪 TESTING RECOMMENDATIONS

### **API Testing Sequence**
```python
# 1. Create Staff
POST /auth/staff/
{
  "email": "sales@example.com",
  "mobile_no": "9876543210",
  "first_name": "Sales",
  "last_name": "Person",
  "role": 3,  # Sales role
  "password": "securepass123"
}

# 2. Create Customer
POST /lead/customer/
{
  "name": "John Doe",
  "contact_number": "9876543210",
  "email": "john@example.com",
  "city": "Mumbai",
  "state": "Maharashtra"
}

# 3. Create Lead
POST /lead/lead/
{
  "customer": 1,
  "lead_source": "indiamart",
  "project_name": "Residential Complex",
  "requirements_details": "Need 10-car parking solution"
}

# 4. Add Follow-up with Suggested Solution
POST /lead/lead-followups/
{
  "lead": 1,
  "followup_date": "2026-07-15",
  "next_followup_date": "2026-07-20",
  "status": "in_process",
  "remarks": "Customer interested",
  "discussion_notes": "Discussed plot dimensions and budget",
  "suggested_solution": [
    {
      "product_id": 5,
      "product_name": "2DP 101",
      "category": "Stack Parking",
      "capacity": 4,
      "reason": "Best fit for basement"
    }
  ]
}

# 5. Get Follow-up Timeline
GET /lead/lead-followups/timeline/1/

# 6. Get Customer with Follow-up History
GET /lead/customer/1/followup-history/
```

---

## 📈 PERFORMANCE OPTIMIZATIONS

### **Database Query Optimizations**
- `select_related` for ForeignKey lookups (customer, user, role)
- `prefetch_related` for reverse ForeignKeys (followups, leads)
- Indexed fields: email, contact_number, followup_date
- Optimized ordering with annotated priority

### **Caching Strategy** (if needed)
```python
# Cache customer lead count for 5 minutes
cache_key = f"customer_{customer_id}_lead_count"
lead_count = cache.get(cache_key)
if not lead_count:
    lead_count = customer.leads.count()
    cache.set(cache_key, lead_count, 300)
```

---

## 🚀 NEXT STEPS

1. ✅ **Run migrations** to update database schema
2. ✅ **Test all API endpoints** with Postman/Swagger
3. ✅ **Update frontend** to use new fields
4. ✅ **Remove old requirement fields** from follow-up forms
5. ✅ **Add suggested solution UI** in follow-up history
6. ✅ **Test user permissions** for different roles
7. ✅ **Add validation** for suggested_solution JSONField format

---

## 📞 SUPPORT

For questions or issues:
- Backend Documentation: `/swagger/` or `/redoc/`
- Check migration status: `python manage.py showmigrations lead_management`
- Debug mode logs: Check console output when `DEBUG=True`

---

**Last Updated:** July 15, 2026
**Version:** 2.0
**Author:** NNIT Development Team
