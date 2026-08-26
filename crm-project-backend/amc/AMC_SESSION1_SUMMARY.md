# AMC Migration - SESSION 1 Summary

## What We're Adding to Existing AMC App

### New Models to Add:
1. **AMCServiceSchedule** - Planned service dates
2. **AMCServiceVisit** - Actual service visits with technician allocation
3. **AMCRenewal** - Track renewal requests separately

### Updates to Existing AMCContract Model:
- Add fields for service visit tracking
- Add methods for auto-schedule generation based on frequency
- Add renewal reminder flags
- Integration with product frequencies

### Key Features:
- ✅ Multiple products with different service frequencies
- ✅ Auto-calculate total visits & per-visit amount
- ✅ Smart technician allocation (location-based)
- ✅ Service visit workflow (pending → allocated → completed)
- ✅ Email reminder system integration points
- ✅ Renewal request workflow

## Files Being Created/Updated:

### Backend:
1. `amc/models.py` - Add 3 new models + enhance AMCContract
2. `amc/serializers.py` - Create serializers for all models
3. `amc/views.py` - Create ViewSets with business logic
4. `amc/urls.py` - Register all API endpoints
5. `amc/admin.py` - Register new models in admin

### Next Session (Frontend):
- React components for AMC management
- Dashboard with calendar
- Visit allocation UI
- Renewal workflow UI

## Migration Steps:
```bash
# After model changes:
python manage.py makemigrations amc
python manage.py migrate amc
```

## API Endpoints Created:
```
GET    /amc/contracts/              # List all AMCs
POST   /amc/contracts/              # Create new AMC
GET    /amc/contracts/{id}/         # Get AMC detail
PUT    /amc/contracts/{id}/         # Update AMC
DELETE /amc/contracts/{id}/         # Delete AMC

GET    /amc/visits/                 # List all visits
POST   /amc/visits/                 # Create visit (usually auto-generated)
GET    /amc/visits/{id}/            # Visit detail
PUT    /amc/visits/{id}/            # Update visit (reschedule, etc)
POST   /amc/visits/{id}/allocate/   # Allocate work to technician

GET    /amc/schedules/              # List scheduled services
GET    /amc/renewals/               # List renewal requests
POST   /amc/renewals/{id}/approve/  # Approve renewal
POST   /amc/renewals/{id}/reject/   # Reject renewal

GET    /amc/dashboard/              # Dashboard stats
GET    /amc/calendar-events/        # Calendar data
```

---

## ✅ SESSION 1 COMPLETED!

### What Was Done:

#### 1. Backend Models (✅ DONE)
- ✅ Added `AMCServiceSchedule` model to `amc/models.py`
- ✅ Added `AMCServiceVisit` model to `amc/models.py`
- ✅ Added `AMCRenewal` model to `amc/models.py`
- ✅ All models include comprehensive fields and business logic methods

#### 2. Backend Serializers (✅ DONE)
- ✅ Created `AMCServiceScheduleSerializer` in `amc/serializers.py`
- ✅ Created `AMCServiceVisitSerializer` in `amc/serializers.py`
- ✅ Created `AMCRenewalSerializer` in `amc/serializers.py`
- ✅ Created `AMCDashboardStatsSerializer` in `amc/serializers.py`
- ✅ Created `CalendarEventSerializer` in `amc/serializers.py`

#### 3. Backend Views (✅ DONE)
- ✅ Created `AMCServiceScheduleViewSet` with approve action
- ✅ Created `AMCServiceVisitViewSet` with allocate-work, reschedule, assign-technicians actions
- ✅ Created `AMCRenewalViewSet` with approve and reject actions
- ✅ Created `AMCDashboardView` for statistics
- ✅ Created `AMCCalendarEventsView` for calendar integration

#### 4. URL Configuration (✅ DONE)
- ✅ Updated `amc/urls.py` to register all new ViewSets
- ✅ Added dashboard and calendar API routes
- ✅ All routes properly configured

#### 5. Admin Panel (✅ DONE)
- ✅ Registered `AMCServiceSchedule` in admin
- ✅ Registered `AMCServiceVisit` in admin with filter_horizontal for technicians
- ✅ Registered `AMCRenewal` in admin
- ✅ All admin panels have proper list displays and filters

#### 6. Database Migrations (✅ DONE)
- ✅ Created migration: `0011_amcrenewal_amcservicevisit_amcserviceschedule.py`
- ✅ Migration applied successfully to database
- ✅ All 3 new tables created

### API Endpoints Now Available:

#### AMC Contracts
```
GET    /amc/contracts/                              # List all AMCs
POST   /amc/contracts/                              # Create new AMC
GET    /amc/contracts/{id}/                         # Get AMC detail
PUT    /amc/contracts/{id}/                         # Update AMC
DELETE /amc/contracts/{id}/                         # Delete AMC
POST   /amc/contracts/{id}/toggle-status/           # Toggle active/inactive
POST   /amc/contracts/{id}/renew/                   # Create renewal cycle
POST   /amc/contracts/{id}/assign-technician/       # Assign default technician
POST   /amc/contracts/{id}/generate-schedule/       # Generate service visits
```

#### Service Schedules
```
GET    /amc/schedules/                              # List all schedules
POST   /amc/schedules/                              # Create schedule
GET    /amc/schedules/{id}/                         # Schedule detail
PUT    /amc/schedules/{id}/                         # Update schedule
POST   /amc/schedules/{id}/approve/                 # Approve schedule
```

#### Service Visits
```
GET    /amc/visits/                                 # List all visits
POST   /amc/visits/                                 # Create visit
GET    /amc/visits/{id}/                            # Visit detail
PUT    /amc/visits/{id}/                            # Update visit
POST   /amc/visits/{id}/allocate-work/              # Allocate to technicians & create CRM service
POST   /amc/visits/{id}/reschedule/                 # Reschedule visit
POST   /amc/visits/{id}/assign-technicians/         # Assign technicians
```

#### Renewals
```
GET    /amc/renewals/                               # List renewal requests
POST   /amc/renewals/                               # Create renewal request
GET    /amc/renewals/{id}/                          # Renewal detail
PUT    /amc/renewals/{id}/                          # Update renewal
POST   /amc/renewals/{id}/approve/                  # Approve & create new cycle
POST   /amc/renewals/{id}/reject/                   # Reject renewal
```

#### Dashboard & Analytics
```
GET    /amc/dashboard/                              # Dashboard statistics
GET    /amc/calendar/                               # Calendar events (FullCalendar format)
```

### Database Tables Created:
1. `amc_service_schedules` - Planned service dates with reminder tracking
2. `amc_service_visits` - Actual visits with technician allocation
3. `amc_renewals` - Renewal workflow tracking

---

## 🎯 NEXT STEPS (Session 2):

### Celery Tasks for Automation
1. **Email Reminder Tasks**
   - Send reminders 15 days before service
   - Send reminders 7 days before expiry
   - Renewal request emails to customers

2. **Auto-Allocation Tasks**
   - Auto-allocate visits based on location
   - Smart technician assignment based on workload

3. **Status Update Tasks**
   - Daily task to update contract statuses (expiring_soon, expired)
   - Sync service visit statuses with CRM service requests

### Signals for Real-time Sync
1. Auto-sync schedules → visits
2. Auto-update contract status when cycle changes
3. Trigger renewal workflow on expiry

### Frontend Components (Session 3-5)
- AMC list with filters
- AMC create/edit forms
- Visit management dashboard
- Calendar view (FullCalendar)
- Renewal workflow UI

---

**Status: SESSION 1 COMPLETE ✅ - Backend foundation is ready!**
