# AMC System - API Quick Reference

## Base URL
```
http://localhost:8000/amc/
```

---

## 1. AMC Contracts

### List All Contracts
```http
GET /amc/contracts/
```
**Filters**: `?customer=1&status=active&amc_type=comprehensive`

### Create Contract
```http
POST /amc/contracts/
Content-Type: application/json

{
    "customer": 1,
    "product": "Product Name",
    "amc_type": "comprehensive",
    "start_date": "2026-09-01",
    "end_date": "2027-08-31",
    "annual_value": 50000.00,
    "payment_frequency": "quarterly",
    "scope_of_support": "Full support",
    "support_coordinator": 1
}
```

### Get Contract Detail
```http
GET /amc/contracts/{id}/
```

### Toggle Active/Inactive
```http
POST /amc/contracts/{id}/toggle-status/
```

### Renew Contract
```http
POST /amc/contracts/{id}/renew/
Content-Type: application/json

{
    "new_start_date": "2027-09-01",
    "new_end_date": "2028-08-31",
    "new_annual_value": 55000.00,
    "payment_frequency": "quarterly",
    "remarks": "Renewed with price increase"
}
```

### Assign Default Technician
```http
POST /amc/contracts/{id}/assign-technician/
Content-Type: application/json

{
    "technician_id": 1
}
```

### Generate Service Schedule
```http
POST /amc/contracts/{id}/generate-schedule/
```

### Generate Warranty Services
```http
POST /amc/contracts/{id}/generate-warranty-services/
```

---

## 2. Service Schedules

### List All Schedules
```http
GET /amc/schedules/
```
**Filters**: `?amc_contract=1&is_completed=false&is_approved=true`

### Create Schedule
```http
POST /amc/schedules/
Content-Type: application/json

{
    "amc_contract": 1,
    "service_date": "2026-09-15",
    "notes": "First quarterly service"
}
```

### Approve Schedule
```http
POST /amc/schedules/{id}/approve/
```

---

## 3. Service Visits

### List All Visits
```http
GET /amc/visits/
```
**Filters**: `?amc_contract=1&allocation_status=PENDING&product=1`

### Create Visit
```http
POST /amc/visits/
Content-Type: application/json

{
    "amc_contract": 1,
    "service_date": "2026-09-15",
    "product": 1,
    "allocation_status": "PENDING",
    "remarks": "Scheduled maintenance"
}
```

### Assign Technicians
```http
POST /amc/visits/{id}/assign-technicians/
Content-Type: application/json

{
    "technician_ids": [1, 2, 3]
}
```

### Allocate Work (Create CRM Service)
```http
POST /amc/visits/{id}/allocate-work/
```
**Note**: This creates a ServiceRequest in CRM and links it to the visit.

### Reschedule Visit
```http
POST /amc/visits/{id}/reschedule/
Content-Type: application/json

{
    "new_date": "2026-09-20",
    "reason": "Customer request - unavailable on original date"
}
```

---

## 4. Renewals

### List All Renewal Requests
```http
GET /amc/renewals/
```
**Filters**: `?amc_contract=1&status=REQUESTED`

### Create Renewal Request
```http
POST /amc/renewals/
Content-Type: application/json

{
    "amc_contract": 1,
    "status": "REQUESTED",
    "customer_response": "Customer confirmed interest in renewal"
}
```

### Approve Renewal (Creates New Cycle)
```http
POST /amc/renewals/{id}/approve/
Content-Type: application/json

{
    "new_start_date": "2027-09-01",
    "new_end_date": "2028-08-31",
    "new_annual_value": 55000.00,
    "payment_frequency": "quarterly",
    "admin_notes": "Approved with 10% increase"
}
```

### Reject Renewal
```http
POST /amc/renewals/{id}/reject/
Content-Type: application/json

{
    "admin_notes": "Customer declined due to budget constraints"
}
```

---

## 5. Dashboard & Analytics

### Get Dashboard Stats
```http
GET /amc/dashboard/
```

**Response:**
```json
{
    "total_contracts": 50,
    "active_contracts": 35,
    "expiring_soon": 5,
    "expired_contracts": 10,
    "renewal_requests_pending": 3,
    "upcoming_visits_count": 12,
    "visits_today": 2,
    "visits_this_week": 8
}
```

### Get Calendar Events
```http
GET /amc/calendar/
```

**Response:** (FullCalendar format)
```json
[
    {
        "title": "Visit: AMC-001",
        "start": "2026-09-15",
        "backgroundColor": "#0d6efd",
        "borderColor": "#0d6efd",
        "extendedProps": {
            "type": "Service Visit",
            "contract": "AMC-001",
            "customer": "ABC Company",
            "status": "PENDING"
        }
    },
    {
        "title": "Expiry: AMC-002",
        "start": "2026-12-31",
        "backgroundColor": "#dc3545",
        "borderColor": "#dc3545",
        "extendedProps": {
            "type": "AMC Expiry",
            "contract": "AMC-002",
            "customer": "XYZ Corp"
        }
    }
]
```

---

## Status Values

### AMC Contract Status
- `active` - Contract is active
- `inactive` - Contract is inactive
- `expiring_soon` - Expires within 30 days
- `expired` - Past end date
- `scheduled` - Future start date
- `renewed` - Has been renewed (multiple cycles)

### Payment Frequency
- `monthly` - 12 visits per year
- `quarterly` - 4 visits per year
- `half_yearly` - 2 visits per year
- `annual` - 1 visit per year

### AMC Type
- `comprehensive` - Full comprehensive AMC
- `non_comprehensive` - Non-comprehensive AMC
- `warranty` - 1 Year Warranty (4 quarterly free services)

### Visit Allocation Status
- `PENDING` - Not yet allocated
- `ALLOCATED` - Allocated to technicians
- `IN_PROGRESS` - Work in progress
- `COMPLETED` - Service completed
- `CANCELLED` - Visit cancelled

### Renewal Status
- `PENDING` - Initial state
- `REQUESTED` - Customer requested renewal
- `APPROVED` - Admin approved
- `REJECTED` - Admin rejected
- `NOT_RENEWED` - Customer declined
- `COMPLETED` - New cycle created

---

## Authentication

All endpoints require JWT authentication:

```http
Authorization: Bearer <your_jwt_token>
```

Get token:
```http
POST /auth/login/
Content-Type: application/json

{
    "username": "your_username",
    "password": "your_password"
}
```

---

## Common Workflows

### Workflow 1: Create New AMC Contract
1. `POST /amc/contracts/` - Create contract
2. `POST /amc/contracts/{id}/generate-schedule/` - Generate visits
3. Schedules & visits are auto-created based on frequency

### Workflow 2: Allocate Service Visit
1. `GET /amc/visits/?allocation_status=PENDING` - Find pending visits
2. `POST /amc/visits/{id}/assign-technicians/` - Assign techs
3. Admin approves schedule: `POST /amc/schedules/{id}/approve/`
4. `POST /amc/visits/{id}/allocate-work/` - Create CRM service

### Workflow 3: Renewal Process
1. System detects expiring contract (30 days before)
2. `POST /amc/renewals/` - Create renewal request
3. Customer confirms interest (status = REQUESTED)
4. `POST /amc/renewals/{id}/approve/` - Admin approves
5. New cycle automatically created
6. New visits auto-generated

### Workflow 4: Reschedule Visit
1. `POST /amc/visits/{id}/reschedule/` - Reschedule to new date
2. If visit was allocated, allocation is reset to PENDING
3. Need to re-assign technicians and re-allocate work

---

## Error Responses

### 400 Bad Request
```json
{
    "error": "Error message explaining what went wrong"
}
```

### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### 404 Not Found
```json
{
    "detail": "Not found."
}
```

---

**Last Updated:** August 24, 2026  
**Backend Version:** Django 4.x + DRF 3.x
