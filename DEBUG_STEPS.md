# Debug Steps - Qualifying Info & Requirement Details Not Showing

## Problem
Qualifying Information and Requirement Details are not showing in the timeline even though the code is there.

## Root Cause
The `qualifying_info` field was not added to the database. You need to run migrations.

## Solution Steps

### Step 1: Run Migrations (CRITICAL)
```bash
cd crm-project-backend
python manage.py makemigrations lead_management
python manage.py migrate
```

Expected output:
```
Migrations for 'lead_management':
  lead_management\migrations\0006_leadfollowup_qualifying_info.py
    - Add field qualifying_info to leadfollowup
```

### Step 2: Restart Django Server
```bash
# Stop the current server (CTRL+C)
python manage.py runserver
```

### Step 3: Test in Browser

1. Open Lead Details page
2. Click "Add Follow-up"
3. Fill in all sections:
   - Follow-up Date
   - Status
   - Discussion Notes
   
4. Fill **Qualifying Questions**:
   - Site Location: "Andheri West, Mumbai"
   - Number of Cars Required: "20"
   - Car Type: "Mixed"
   - Budget Range: "₹30-40 Lakhs"
   - Basement Available: "Yes"
   - Pit Possible: "Yes"
   - Installation Timeline: "3 months"
   - Site Challenges: "Limited access"

5. Click **"Show Requirement"** button

6. Fill **Requirement Form**:
   - Site Length: 40
   - Site Width: 30
   - Site Height: 35
   - Preferred Parking Type: "Stack Parking"
   - Automation Required: "Semi Automatic"

7. Click **Save**

### Step 4: Verify Display

After saving, check the timeline. You should see:

1. **Qualifying Information** section with:
   - Site Location: Andheri West, Mumbai
   - Cars Required: 20
   - Car Type: Mixed
   - Budget Range: ₹30-40 Lakhs
   - Installation Timeline: 3 months
   - Basement Available: Yes
   - Pit Possible: Yes
   - Site Challenges: Limited access

2. **Requirement Details** section with:
   - Site Dimensions: 40 ft × 30 ft × 35 ft
   - Cars Required: 20
   - Preferred Type: Stack Parking
   - Budget: ₹30-40 Lakhs
   - Automation: Semi Automatic

### Step 5: Check API Response (Optional)

Open browser DevTools (F12) → Network tab → Look for API call to:
```
http://127.0.0.1:8000/lead/lead/{id}/
```

Response should include:
```json
{
  "followups": [
    {
      "qualifying_info": {
        "site_location": "Andheri West, Mumbai",
        "cars_required": "20",
        "car_type": "mixed",
        "budget_range": "₹30-40 Lakhs",
        "basement_available": "yes",
        "pit_possible": "yes",
        "installation_timeline": "3 months",
        "site_challenges": "Limited access"
      },
      "requirement_info": {
        "site_length": "40",
        "site_width": "30",
        "site_height": "35",
        "preferred_parking_type": "Stack Parking",
        "automation_required": "Semi Automatic"
      }
    }
  ]
}
```

## If Still Not Working

### Check 1: Verify Field in Database
```bash
cd crm-project-backend
python manage.py dbshell
```

```sql
-- Check if column exists
PRAGMA table_info(lead_management_leadfollowup);

-- Should show:
-- qualifying_info | text | 1 | NULL | 0
-- requirement_info | text | 1 | NULL | 0
```

### Check 2: Check Console for Errors
- Open browser DevTools (F12)
- Go to Console tab
- Look for any JavaScript errors

### Check 3: Verify Data is Being Sent
- Open DevTools → Network tab
- Filter: "lead-followups"
- Click on POST request
- Check "Payload" tab
- Should see `qualifying_info` and `requirement_info` objects

## Common Issues

### Issue 1: Migration Not Run
**Symptom**: Error "column qualifying_info does not exist"
**Solution**: Run `python manage.py migrate`

### Issue 2: Server Not Restarted
**Symptom**: Old code still running
**Solution**: Stop server (CTRL+C) and start again

### Issue 3: Browser Cache
**Symptom**: Old frontend code cached
**Solution**: Hard refresh (CTRL+SHIFT+R) or clear browser cache

### Issue 4: Data Not in Timeline
**Symptom**: Form saves but timeline doesn't show data
**Solution**: Check if `qualifying_info` is null in API response
