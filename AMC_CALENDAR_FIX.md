# AMC Calendar Display Fix

## ❌ Problem
Calendar was showing empty - no events were displaying.

## 🔍 Root Cause
**URL Endpoint Mismatch:**
- Frontend calling: `/amc/calendar-events/`
- Backend URL configured as: `/amc/calendar/`

Result: 404 error, no data returned.

## ✅ Solution
Updated `amc/urls.py` to support both URLs:

```python
urlpatterns = [
    path('dashboard/', AMCDashboardView.as_view(), name='amc-dashboard'),
    path('calendar-events/', AMCCalendarEventsView.as_view(), name='amc-calendar-events'),  # ← Added
    path('calendar/', AMCCalendarEventsView.as_view(), name='amc-calendar'),  # Kept for compatibility
] + router.urls
```

Now both endpoints work:
- ✅ `/amc/calendar-events/` (used by frontend)
- ✅ `/amc/calendar/` (backward compatibility)

## 🧪 Testing

### Test the API directly:
```bash
# Method 1: Using calendar-events (frontend uses this)
curl -X GET http://localhost:8000/amc/calendar-events/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Method 2: Using calendar (also works)
curl -X GET http://localhost:8000/amc/calendar/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Response:
```json
[
    {
        "title": "Scheduled Service | Customer Name",
        "start": "2026-08-27",
        "backgroundColor": "#3b82f6",
        "borderColor": "#3b82f6",
        "extendedProps": {
            "type": "Scheduled Service",
            "contract": "AMC-001",
            "customer": "Customer Name",
            "product": "Product Name"
        }
    }
]
```

## 🚀 How to Apply Fix

1. **Restart Backend Server:**
   ```bash
   # Stop the running server (Ctrl+C)
   # Then start again:
   python manage.py runserver
   ```

2. **Refresh Frontend:**
   - Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear cache and reload

3. **Verify:**
   - Navigate to AMC → Calendar tab
   - Events should now display with colors:
     - 🔵 Blue: Scheduled Service
     - 🟢 Green: Service Visit
     - 🟠 Amber: Renewal Due
     - 🔴 Red: Contract Expiry

## 📋 Files Modified
- `amc/urls.py` - Added `calendar-events/` path

## ⚠️ Important Notes
- Calendar requires JWT authentication
- Ensure you're logged in to see events
- Events are pulled from ServiceRequest and AMCContract tables
- If no events show, check if you have:
  - AMC contracts with dates
  - Service requests linked to AMC contracts

---

**Status:** ✅ Fixed  
**Date:** August 24, 2026  
**Issue:** URL endpoint mismatch  
**Resolution:** Added correct URL pattern
