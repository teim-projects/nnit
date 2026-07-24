# Dashboard Data Fetch Debug Guide 🔍

## Issue
Dashboard data (leads, customers, quotations) fetch nahi ho raha hai properly.

---

## ✅ Updates Made

### 1. Added Console Logs
Dashboard ab detailed console logs print karega to debug karne mein help mile:

```javascript
console.log('Fetching dashboard data...');
console.log('BASE_API:', BASE_API);
console.log('Token available:', !!token);

// After fetch
console.log('Leads response status:', leadsRes.status);
console.log('Customers response status:', customersRes.status);

// After parsing
console.log('Leads data:', leads);
console.log('Customers data:', customers);

// After array conversion
console.log('Parsed arrays:');
console.log('- Leads:', leadsArray.length);
console.log('- Customers:', customersArray.length);
```

### 2. Improved Error Handling
```javascript
catch (error) {
  console.error("Dashboard data fetch error:", error);
  console.error("Error details:", error.message);
  console.error("Stack trace:", error.stack);
}
```

---

## 🔍 How to Debug

### Step 1: Open Browser Console
1. Open your browser (Chrome/Edge/Firefox)
2. Press `F12` or `Ctrl+Shift+I`
3. Go to **Console** tab
4. Navigate to Dashboard page

### Step 2: Check Console Logs
Aapko yeh logs dikhne chahiye:

```
Fetching dashboard data...
BASE_API: http://127.0.0.1:8000
Token available: true
Leads response status: 200
Customers response status: 200
Quotations response status: 200
Products response status: 200
Leads data: {count: 150, results: Array(150)}
Customers data: {count: 85, results: Array(85)}
Quotations data: {count: 120, results: Array(120)}
Products data: {count: 45, results: Array(45)}
Parsed arrays:
- Leads: 150
- Customers: 85
- Quotations: 120
- Products: 45
```

### Step 3: Check for Errors

#### Error 1: BASE_API is undefined
```
BASE_API: undefined
```

**Fix:**
- Check `.env` file exists
- Check `VITE_BASE_API_URL=http://127.0.0.1:8000` is set
- Restart frontend server

#### Error 2: Token not available
```
Token available: false
```

**Fix:**
- Login again
- Check localStorage has `access` token
- Check authentication is working

#### Error 3: 401 Unauthorized
```
Leads response status: 401
```

**Fix:**
- Token expired - login again
- Backend authentication issue
- Check backend is running

#### Error 4: 404 Not Found
```
Leads response status: 404
```

**Fix:**
- API endpoint wrong
- Backend not running
- Check URL: `http://127.0.0.1:8000/lead/lead/`

#### Error 5: CORS Error
```
Access to fetch at 'http://127.0.0.1:8000/lead/lead/' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Fix:**
- Backend CORS settings
- Check `CORS_ALLOWED_ORIGINS` in Django settings
- Add `http://localhost:5173` to allowed origins

#### Error 6: Empty Results
```
Leads data: {count: 0, results: []}
```

**Fix:**
- No data in database
- Add some leads first
- Check database has data

---

## 🛠️ Common Fixes

### Fix 1: Restart Backend
```bash
cd crm-project-backend
python manage.py runserver
```

### Fix 2: Restart Frontend
```bash
cd crm-project-frontend
npm run dev
```

### Fix 3: Check .env File
```bash
# crm-project-frontend/.env
VITE_BASE_API_URL=http://127.0.0.1:8000
```

### Fix 4: Clear Browser Cache
- Press `Ctrl+Shift+Delete`
- Clear cached images and files
- Reload page

### Fix 5: Check Backend Running
Open browser: `http://127.0.0.1:8000/admin/`
- Should show Django admin
- If not, backend not running

### Fix 6: Test API Manually
Open browser: `http://127.0.0.1:8000/lead/lead/`
- Should show JSON data
- If error, backend issue

---

## 📊 Expected Console Output

### Success Case:
```
Fetching dashboard data...
BASE_API: http://127.0.0.1:8000
Token available: true

Leads response status: 200
Customers response status: 200
Quotations response status: 200
Products response status: 200

Leads data: {count: 150, results: Array(150), next: null, previous: null}
Customers data: {count: 85, results: Array(85), next: null, previous: null}
Quotations data: {count: 120, results: Array(120), next: null, previous: null}
Products data: {count: 45, results: Array(45), next: null, previous: null}

Parsed arrays:
- Leads: 150
- Customers: 85
- Quotations: 120
- Products: 45
```

### Error Case:
```
Fetching dashboard data...
BASE_API: http://127.0.0.1:8000
Token available: false

Dashboard data fetch error: TypeError: Failed to fetch
Error details: Failed to fetch
Stack trace: TypeError: Failed to fetch at...
```

---

## 🔧 API Endpoints Being Called

1. **Leads**: `http://127.0.0.1:8000/lead/lead/?page_size=1000`
2. **Customers**: `http://127.0.0.1:8000/lead/customer/?page_size=1000`
3. **Quotations**: `http://127.0.0.1:8000/api/quotation/quotation/?page_size=1000`
4. **Products**: `http://127.0.0.1:8000/parking-products/products/?page_size=100`

### Test Each Endpoint:
Open in browser (after login):
```
http://127.0.0.1:8000/lead/lead/
http://127.0.0.1:8000/lead/customer/
http://127.0.0.1:8000/api/quotation/quotation/
http://127.0.0.1:8000/parking-products/products/
```

Each should return JSON data.

---

## 📝 Checklist

Before debugging, check:

- [ ] Backend server is running (`python manage.py runserver`)
- [ ] Frontend server is running (`npm run dev`)
- [ ] You are logged in
- [ ] Token exists in localStorage
- [ ] .env file has correct BASE_API_URL
- [ ] Database has some data (leads, customers, etc.)
- [ ] CORS is configured in backend
- [ ] Browser console is open (F12)

---

## 🚀 Quick Test

### 1. Open Browser Console (F12)
### 2. Navigate to Dashboard
### 3. Run This in Console:

```javascript
// Check BASE_API
console.log('BASE_API:', import.meta.env.VITE_BASE_API_URL);

// Check token
console.log('Token:', localStorage.getItem('access'));

// Test API manually
fetch('http://127.0.0.1:8000/lead/lead/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access')}`
  }
})
.then(res => res.json())
.then(data => console.log('Manual fetch result:', data))
.catch(err => console.error('Manual fetch error:', err));
```

**Expected Output:**
```
BASE_API: http://127.0.0.1:8000
Token: eyJ0eXAiOiJKV1QiLCJhbGc...
Manual fetch result: {count: 150, results: Array(150)}
```

---

## 💡 Most Common Issues

### Issue 1: "0" showing everywhere
**Cause:** Data not fetching
**Check:** Console logs for errors
**Fix:** Check backend is running

### Issue 2: Loading forever
**Cause:** API not responding
**Check:** Network tab in DevTools
**Fix:** Restart backend server

### Issue 3: "Unauthorized" error
**Cause:** Token expired or invalid
**Check:** Login status
**Fix:** Login again

### Issue 4: Empty charts
**Cause:** No data in database
**Check:** Add some test data
**Fix:** Create leads/customers manually

---

## 📱 What to Send Me

If still not working, send me:

1. **Console Screenshot** - All logs visible
2. **Network Tab Screenshot** - Show failed requests
3. **Backend Terminal** - Any errors?
4. **Frontend Terminal** - Any errors?

### How to Get Info:

```bash
# In console, run:
console.log({
  baseApi: import.meta.env.VITE_BASE_API_URL,
  hasToken: !!localStorage.getItem('access'),
  tokenLength: localStorage.getItem('access')?.length
});

# Also check Network tab:
# - Click on failed request
# - Show me Response tab
# - Show me Headers tab
```

---

## ✅ After Debug

Once data fetches correctly, you should see:
- ✅ Numbers in all stat cards (not 0)
- ✅ Lines in monthly trends chart
- ✅ Slices in pie chart
- ✅ Bars in conversion chart
- ✅ Recent activity items

---

**Status:** Debug Mode Enabled 🔍  
**Next Step:** Open console and check logs!

---

## 🎯 Quick Fix Commands

```bash
# Terminal 1 - Backend
cd crm-project-backend
python manage.py runserver

# Terminal 2 - Frontend  
cd crm-project-frontend
npm run dev

# Browser - Console
# Press F12 and check logs
```

**Ab dashboard kholo aur console mein dekho kya errors aa rahe hain!**
