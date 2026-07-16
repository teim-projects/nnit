# Add Requirement Form - Implementation Guide

## Backend Changes

### 1. Run Migration

```bash
cd crm-project-backend
python manage.py makemigrations lead_management -n add_requirement_info
python manage.py migrate
```

### 2. Model Updated
✅ File: `lead_management/models.py`
- Added `requirement_info` JSONField to `LeadFollowUp` model

### 3. Serializer Updated  
✅ File: `lead_management/serializers.py`
- Added `requirement_info` to LeadFollowUpSerializer fields

## Frontend Implementation

The form will have a toggle button that shows/hides requirement fields.

### Fields in Requirement Section:
1. **Site Length** (number, feet)
2. **Site Width** (number, feet)
3. **Site Height** (number, feet)
4. **Preferred Parking Type** (dropdown: Stack/Puzzle/Tower/Pit/Cantilever)
5. **Automation Required** (dropdown: Fully Automatic/Semi Automatic/Manual)

### Data Structure (JSON):
```json
{
  "site_length": "40",
  "site_width": "30",
  "site_height": "35",
  "preferred_parking_type": "stack_parking",
  "automation_required": "fully_automatic"
}
```

## Testing

### Backend API Test (Postman):

**Create Follow-up with Requirement:**
```json
POST /lead/lead-followup/
{
  "lead": 1,
  "followup_date": "2026-07-20",
  "status": "in_process",
  "remarks": "Discussed requirements",
  "requirement_info": {
    "site_length": "40",
    "site_width": "30",
    "site_height": "35",
    "preferred_parking_type": "stack_parking",
    "automation_required": "fully_automatic"
  }
}
```

**Get Follow-up:**
```json
GET /lead/lead-followup/{id}/
Response includes requirement_info
```

## UI Flow

1. User clicks "Add Follow-up"
2. Form opens
3. User scrolls to "Add Requirement (Optional)"
4. User clicks "Show Requirement Form" button
5. Requirement fields appear
6. User fills fields (all optional)
7. User clicks "Hide Requirement Form" to collapse
8. On save, requirement_info sent to backend as JSON

