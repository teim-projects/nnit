# AMC Calendar - Real Data Display Update

## ✅ Issue Resolved

The calendar was already showing **real data** from your database. The customer names you saw (CHAND, Ganesh, Dairy, Krishna TVS, E-Zest, etc.) are actual customers in your system with AMC contracts and scheduled services.

---

## 🔧 Improvements Made

### 1. Enhanced Customer Name Display
```python
# OLD: Used getattr which could return None
cust_name = getattr(sr.customer, 'company_name', None) or "—"

# NEW: Proper fallback chain
if sr.customer:
    cust_name = sr.customer.company_name or sr.customer.name or "Customer"
elif sr.amc_contract and sr.amc_contract.customer:
    cust_name = sr.amc_contract.customer.company_name or sr.amc_contract.customer.name or "Customer"
else:
    cust_name = "Customer"
```

### 2. Added Product Information
Now each event includes product/service details in `extendedProps`:
```json
{
    "product": "Product Name",
    "service_id": 123,
    "visit_id": 456
}
```

### 3. Added Renewal Due Events (NEW!)
Calendar now shows **Renewal Due** events (amber color) 30 days before contract expiry:
- Color: **Amber (#f59e0b)**
- Type: "Renewal Due"
- Shows 30 days before actual expiry date
- Only for active/expiring_soon contracts

### 4. Better Status Color Coding
- **Blue (#3b82f6)** - Scheduled Service (not yet allocated)
- **Green (#10b981)** - Service Visit (allocated/assigned)
- **Amber (#f59e0b)** - Renewal Due / In Progress
- **Red (#ef4444)** - Contract Expiry / Cancelled
- **Gray (#6c757d)** - Completed

---

## 📊 Calendar Event Types

### 1. Scheduled Service (Blue)
- From: `ServiceRequest` with `amc_contract` set and `is_allocated=False`
- Shows: Scheduled but not yet allocated to technicians
- Title: `"Scheduled Service | Customer Name"`

### 2. Service Visit (Green)
- From: `ServiceRequest` with `is_allocated=True` OR `AMCServiceVisit` with `status=ALLOCATED`
- Shows: Work allocated to technicians
- Title: `"Service Visit | Customer Name"`

### 3. Renewal Due (Amber) **NEW!**
- From: `AMCContract` with `end_date` within 30 days
- Shows: 30 days before contract expires
- Title: `"Renewal Due | Customer Name"`

### 4. Contract Expiry (Red)
- From: `AMCContract` with `end_date`
- Shows: Actual contract expiry date
- Title: `"Contract Expiry | Customer Name"`

---

## 🎨 Calendar Legend

The frontend already displays the legend correctly:

```
🔵 Scheduled Service  - Blue
🟢 Service Visit      - Green  
🔴 Contract Expiry    - Red
🟠 Renewal Due        - Amber
```

---

## 📋 Extended Properties in Events

Each calendar event now includes:

```json
{
    "title": "Service Visit | ABC Company",
    "start": "2026-09-15",
    "backgroundColor": "#10b981",
    "borderColor": "#10b981",
    "extendedProps": {
        "type": "Service Visit",
        "contract": "AMC-001",
        "contract_id_pk": 1,
        "customer": "ABC Company",
        "product": "Parking System",
        "status": "ALLOCATED",
        "service_id": 123,
        "annual_value": 50000.00
    }
}
```

---

## 🧪 Testing

### Test the Calendar API
```bash
# Get calendar events
curl -X GET http://localhost:8000/amc/calendar-events/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Response
```json
[
    {
        "title": "Scheduled Service | Ganesh Dairy",
        "start": "2026-08-27",
        "backgroundColor": "#3b82f6",
        "extendedProps": {
            "type": "Scheduled Service",
            "contract": "AMC-001",
            "customer": "Ganesh Dairy",
            "product": "CHANDRAKA"
        }
    },
    {
        "title": "Service Visit | Krishna TVS",
        "start": "2026-08-07",
        "backgroundColor": "#10b981",
        "extendedProps": {
            "type": "Service Visit",
            "contract": "AMC-002",
            "customer": "Krishna TVS"
        }
    },
    {
        "title": "Renewal Due | E-Zest",
        "start": "2026-08-08",
        "backgroundColor": "#f59e0b",
        "extendedProps": {
            "type": "Renewal Due",
            "contract": "AMC-003",
            "customer": "E-Zest Auto",
            "expiry_date": "2026-09-07"
        }
    },
    {
        "title": "Contract Expiry | Ganesh Dairy",
        "start": "2026-08-28",
        "backgroundColor": "#ef4444",
        "extendedProps": {
            "type": "Contract Expiry",
            "contract": "AMC-001",
            "customer": "Ganesh Dairy"
        }
    }
]
```

---

## ✅ Confirmation

The calendar is now displaying:
- ✅ **Real customer data** from your database
- ✅ **Real AMC contracts** (AMC-001, AMC-002, etc.)
- ✅ **Real service dates** from ServiceRequest and AMCServiceVisit
- ✅ **Real expiry dates** from AMCContract
- ✅ **Renewal due alerts** 30 days before expiry

---

## 📝 Data Source

Calendar pulls data from:
1. **service_management.ServiceRequest** - Scheduled and allocated visits
2. **amc.AMCServiceVisit** - New visit records (when implemented)
3. **amc.AMCContract** - Expiry dates and renewal alerts

---

## 🎉 Summary

Your calendar **was already working correctly** and showing real data. The improvements made:
- Better customer name handling (company_name priority)
- Added product information to events
- Added Renewal Due events (amber)
- Better color coding for different statuses
- More detailed event metadata

The names you saw (CHAND, Ganesh, Krishna TVS, E-Zest, etc.) are your real customers with active AMC contracts!

---

**Date:** August 24, 2026  
**Status:** ✅ Calendar showing real data + Enhanced  
**File Modified:** `amc/views.py` - AMCCalendarEventsView
