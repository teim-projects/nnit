# AMC System - Full Migration Plan

## Current Status
- ✅ AMC app exists with basic models
- ⚠️ Needs enhancement based on old Django system
- ❌ No frontend components yet

## Migration Sessions

### SESSION 1: Core Backend (NOW) ⏳
**Files to Update:**
- `amc/models.py` - Add ServiceVisit, Schedule, Renewal models
- `amc/serializers.py` - Create all serializers  
- `amc/views.py` - Create ViewSets with proper permissions
- `amc/urls.py` - Register all routes

**Models to implement:**
1. ✅ AMCContract (enhance existing)
2. 🆕 AMCServiceSchedule (planned visits)
3. 🆕 AMCServiceVisit (actual visits)
4. 🆕 AMCRenewal (renewal tracking)

---

### SESSION 2: Service Management
- Service visit allocation
- Technician assignment logic
- Work allocation integration
- Visit rescheduling

---

### SESSION 3: Automation
- Celery tasks setup
- Email reminders (15 days before expiry)
- Auto-allocation task (2 days before visit)
- Expiry handling

---

### SESSION 4: Frontend - List & Forms
- AMC Contract List page
- Create/Edit AMC Form
- Service Visit Management
- Technician Assignment

---

### SESSION 5: Frontend - Dashboard
- AMC Dashboard with stats
- Calendar view (FullCalendar)
- Expiring AMCs alerts
- Renewal requests management

---

## Key Features to Implement

### Contract Management
- [x] Create AMC with customer & service
- [x] Product-wise frequency support
- [x] Duration in months per product
- [x] Auto-calculate end date
- [x] Per-visit amount calculation

### Service Scheduling
- [ ] Auto-generate service dates based on frequency
- [ ] Multiple products with different frequencies
- [ ] Service visit tracking (pending/allocated/completed)
- [ ] Reschedule visits

### Technician Management
- [ ] Assign default technicians to contract
- [ ] Auto-assign based on location (10km radius)
- [ ] Smart allocation for same-day visits
- [ ] Work allocation integration

### Renewal System
- [ ] Email reminder 15 days before expiry
- [ ] Yes/No links in email
- [ ] Admin approval workflow
- [ ] Auto-renew with new cycle

### Notifications
- [ ] Expiry reminders
- [ ] Service visit reminders
- [ ] Technician assignment emails
- [ ] Customer confirmation emails

---

## Database Tables

```
amc_amccontract
amc_amcserviceschedule
amc_amcservicevisit
amc_amcrenewal
```

---

## API Endpoints Structure

```
/amc/contracts/                    # List/Create
/amc/contracts/{id}/               # Retrieve/Update/Delete
/amc/contracts/{id}/visits/        # Get all visits
/amc/contracts/{id}/assign-tech/   # Assign technicians
/amc/visits/                       # List all visits
/amc/visits/{id}/                  # Visit detail
/amc/visits/{id}/allocate/         # Allocate work
/amc/schedules/                    # Planned schedules
/amc/renewals/                     # Renewal requests
/amc/dashboard/                    # Dashboard stats
/amc/calendar-events/              # Calendar data
```

---

## Frontend Components Structure

```
src/pages/
  ├── AmcDashboard.jsx
  ├── AmcList.jsx
  └── AmcDetail.jsx

src/components/amc/
  ├── AmcContractForm.jsx
  ├── AmcVisitCard.jsx
  ├── AmcCalendar.jsx
  ├── TechnicianAssignment.jsx
  └── RenewalRequestCard.jsx
```

---

**STATUS: Starting Session 1...**
