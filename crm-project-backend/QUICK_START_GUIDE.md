# NNIT CRM - Quick Start Guide

## 🚀 Getting Started with Updated Modules

This guide will help you quickly set up and test the updated Staff, Lead, Customer, and Follow-up modules.

---

## 📋 PREREQUISITES

- Python 3.8+
- MySQL/XAMPP running
- Virtual environment activated
- Required packages installed

---

## ⚡ QUICK SETUP (5 MINUTES)

### Step 1: Apply Database Migrations
```bash
# Navigate to project directory
cd c:\Users\OWNER\Desktop\nnit\Reuse-crm\crm-project-backend

# Create migrations
python manage.py makemigrations lead_management

# Apply migrations
python manage.py migrate

# Verify migrations
python manage.py showmigrations lead_management
```

Expected output:
```
lead_management
 [X] 0001_initial
 [X] 0002_initial
 [X] 0003_update_followup_fields
```

### Step 2: Run Development Server
```bash
python manage.py runserver
```

Server will start at: `http://127.0.0.1:8000/`

### Step 3: Access API Documentation
Open in browser:
- Swagger UI: `http://127.0.0.1:8000/swagger/`
- ReDoc: `http://127.0.0.1:8000/redoc/`

---

## 🧪 QUICK API TEST (2 MINUTES)

### Test 1: Login and Get Token
```bash
# Using curl (Windows CMD)
curl -X POST http://127.0.0.1:8000/auth/dj-rest-auth/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"email_or_mobile\":\"admin@example.com\",\"password\":\"yourpassword\"}"

# Save the access token from response
```

### Test 2: Create a Customer
```bash
curl -X POST http://127.0.0.1:8000/lead/customer/ ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Customer\",\"contact_number\":\"9876543210\",\"city\":\"Mumbai\"}"
```

### Test 3: Create a Lead
```bash
curl -X POST http://127.0.0.1:8000/lead/lead/ ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"customer\":1,\"lead_source\":\"indiamart\",\"project_name\":\"Test Project\"}"
```

### Test 4: Add Follow-up with Suggested Solution
```bash
curl -X POST http://127.0.0.1:8000/lead/lead-followups/ ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"lead\":1,\"followup_date\":\"2026-07-20\",\"status\":\"open\",\"discussion_notes\":\"Initial discussion\",\"suggested_solution\":[{\"product_id\":5,\"product_name\":\"2DP 101\",\"category\":\"Stack Parking\"}]}"
```

---

## 🎯 TESTING CHECKLIST

### ✅ Backend Testing
```bash
# Test customer creation
[ ] POST /lead/customer/

# Test customer list with search
[ ] GET /lead/customer/?search=test

# Test customer detail
[ ] GET /lead/customer/1/

# Test customer's leads
[ ] GET /lead/customer/1/leads/

# Test customer's followup history
[ ] GET /lead/customer/1/followup-history/

# Test lead creation
[ ] POST /lead/lead/

# Test lead list with filters
[ ] GET /lead/lead/?status=open
[ ] GET /lead/lead/?overdue=true

# Test lead detail
[ ] GET /lead/lead/1/

# Test follow-up creation
[ ] POST /lead/lead-followups/

# Test follow-up timeline
[ ] GET /lead/lead-followups/timeline/1/

# Test recent follow-ups
[ ] GET /lead/lead-followups/recent/
```

---

## 🔧 COMMON COMMANDS

### Database Management
```bash
# Create superuser (if needed)
python manage.py createsuperuser

# Check database status
python manage.py showmigrations

# Create new migration (after model changes)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Rollback migration
python manage.py migrate lead_management 0002_initial

# Reset all migrations (DANGER!)
python manage.py migrate lead_management zero
```

### Development
```bash
# Run development server
python manage.py runserver

# Run on specific port
python manage.py runserver 8080

# Run tests (if available)
python manage.py test lead_management

# Check for issues
python manage.py check

# Open Django shell
python manage.py shell
```

### Data Management
```bash
# Create data dump
python manage.py dumpdata lead_management > backup.json

# Load data
python manage.py loaddata backup.json

# Clear cache (if using Redis)
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
```

---

## 📱 TESTING WITH SWAGGER

### 1. Access Swagger UI
Navigate to: `http://127.0.0.1:8000/swagger/`

### 2. Authorize
1. Click **"Authorize"** button (top right)
2. Enter: `Bearer YOUR_ACCESS_TOKEN`
3. Click **"Authorize"**
4. Click **"Close"**

### 3. Test Endpoints
1. Expand any endpoint (e.g., `POST /lead/customer/`)
2. Click **"Try it out"**
3. Edit the request body
4. Click **"Execute"**
5. View response below

---

## 🐛 TROUBLESHOOTING

### Issue: Migration Error
```
Error: Unable to apply migrations
```
**Solution:**
```bash
python manage.py migrate --fake-initial
```

### Issue: Import Error
```
ModuleNotFoundError: No module named 'lead_management'
```
**Solution:**
```bash
# Check INSTALLED_APPS in settings.py
# Ensure 'lead_management' is listed
```

### Issue: Database Connection Error
```
Error: Can't connect to MySQL server
```
**Solution:**
1. Start XAMPP
2. Verify MySQL is running
3. Check database credentials in `settings.py`

### Issue: Token Expired
```
{"detail": "Token is invalid or expired"}
```
**Solution:**
```bash
# Login again to get new token
curl -X POST http://127.0.0.1:8000/auth/dj-rest-auth/login/ ...
```

### Issue: Permission Denied
```
{"detail": "You do not have permission to perform this action."}
```
**Solution:**
- Check user role
- Admin-only actions require admin role
- Sales staff can only access their own leads

---

## 📊 VERIFY CHANGES

### Check Model Updates
```bash
python manage.py shell
```
```python
from lead_management.models import Customer, lead_management, LeadFollowUp

# Check Customer fields
print(Customer._meta.get_fields())

# Check if new fields exist
customer = Customer.objects.first()
print(customer.created_at)
print(customer.updated_at)

# Check Lead fields
lead = lead_management.objects.first()
print(lead.last_followup_date)
print(lead.created_at)

# Check Follow-up fields
followup = LeadFollowUp.objects.first()
print(followup.discussion_notes)
print(followup.suggested_solution)
print(followup.updated_at)
```

### Check API Endpoints
```bash
# List all available URLs
python manage.py show_urls | findstr lead
```

Expected output should include:
```
/lead/customer/
/lead/customer/<id>/
/lead/customer/<id>/leads/
/lead/customer/<id>/followup-history/
/lead/lead/
/lead/lead-followups/
/lead/lead-followups/timeline/<lead_id>/
/lead/lead-followups/recent/
```

---

## 🎨 FRONTEND INTEGRATION

### API Base URL
```javascript
const API_BASE_URL = 'http://127.0.0.1:8000';
```

### Authentication Header
```javascript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

### Example: Fetch Customer with Follow-up History
```javascript
// Fetch customer detail
const response = await fetch(
  `${API_BASE_URL}/lead/customer/1/`,
  { headers }
);
const customer = await response.json();

// Fetch followup history
const historyResponse = await fetch(
  `${API_BASE_URL}/lead/customer/1/followup-history/`,
  { headers }
);
const followupHistory = await historyResponse.json();
```

### Example: Create Follow-up with Suggested Solution
```javascript
const followupData = {
  lead: 1,
  followup_date: '2026-07-20',
  next_followup_date: '2026-07-25',
  status: 'in_process',
  remarks: 'Customer interested',
  discussion_notes: 'Discussed requirements in detail...',
  suggested_solution: [
    {
      product_id: 5,
      product_name: '2DP 101',
      category: 'Stack Parking',
      capacity: 4,
      reason: 'Best fit for basement'
    }
  ]
};

const response = await fetch(
  `${API_BASE_URL}/lead/lead-followups/`,
  {
    method: 'POST',
    headers,
    body: JSON.stringify(followupData)
  }
);
```

---

## 📚 DOCUMENTATION REFERENCES

| Document | Purpose | Who Should Read |
|----------|---------|----------------|
| `MODULES_UPDATE_SUMMARY.md` | Quick overview of changes | Everyone |
| `UPDATED_MODULES_DOCUMENTATION.md` | Complete technical docs | Backend developers |
| `API_TESTING_GUIDE.md` | API testing examples | Backend & Frontend devs |
| `FRONTEND_UI_SPECIFICATION.md` | UI/UX design specs | Frontend developers |
| `QUICK_START_GUIDE.md` | This file | Everyone |

---

## ✅ DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All migrations applied successfully
- [ ] Database backup created
- [ ] API endpoints tested thoroughly
- [ ] Frontend integrated and tested
- [ ] User permissions verified
- [ ] Error handling implemented
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Documentation updated
- [ ] Team trained on new features

---

## 🎓 TRAINING RESOURCES

### For Sales Team:
1. Review UI changes in `FRONTEND_UI_SPECIFICATION.md`
2. Understand new follow-up form fields
3. Practice adding suggested solutions
4. Learn to view customer follow-up history

### For Developers:
1. Read `UPDATED_MODULES_DOCUMENTATION.md`
2. Test all APIs using `API_TESTING_GUIDE.md`
3. Implement frontend following `FRONTEND_UI_SPECIFICATION.md`
4. Write unit tests for new endpoints

### For Managers:
1. Review `MODULES_UPDATE_SUMMARY.md`
2. Understand workflow changes
3. Plan user training sessions
4. Monitor adoption and feedback

---

**Last Updated:** July 15, 2026  
**Quick Start Time:** ~5 minutes  
**Full Setup Time:** ~15 minutes  
**Status:** Ready for Testing
