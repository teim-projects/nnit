# 🔄 RESTART SERVERS - URL FIX APPLIED

## ✅ FIX APPLIED

Changed backend URL from:
- ❌ OLD: `path('quotation/', include('quotation.urls'))`
- ✅ NEW: `path('api/quotation/', include('quotation.urls'))`

This matches the frontend expectation of `/api/quotation/terms/`

---

## 🚀 RESTART INSTRUCTIONS

### Step 1: Stop Backend (if running)
Press `Ctrl + C` in the backend terminal

### Step 2: Start Backend Again
```bash
cd crm-project-backend
python manage.py runserver
```

### Step 3: Stop Frontend (if running)
Press `Ctrl + C` in the frontend terminal

### Step 4: Start Frontend Again
```bash
cd crm-project-frontend
npm run dev
```

---

## ✅ TEST THE FIX

1. Open browser: http://localhost:5173
2. Login to your CRM
3. Click "Terms & Conditions" in sidebar
4. **Expected**: You should see 18 terms loaded successfully!

---

## 🔍 VERIFY API ENDPOINT

Test the API directly in browser:
```
http://localhost:8000/api/quotation/terms/
```

**Expected Response**: JSON array with 18 terms

---

## ⚠️ IF STILL NOT WORKING

### Check 1: Backend Running?
```bash
# Should see: Starting development server at http://127.0.0.1:8000/
```

### Check 2: Check Django logs
Look for any error messages in the backend terminal

### Check 3: Test API with curl
```bash
curl http://localhost:8000/api/quotation/terms/
```

### Check 4: Browser Console
- Open DevTools (F12)
- Go to Console tab
- Look for error messages
- Check Network tab for failed requests

---

## 📝 WHAT CHANGED

**File Modified:** `krishna_air/urls.py`

**Change:**
```python
# OLD:
path('quotation/', include('quotation.urls')),

# NEW:
path('api/quotation/', include('quotation.urls')),
```

**Why:** Frontend expects `/api/quotation/terms/` but backend was serving at `/quotation/terms/`

**Impact:** All quotation endpoints now available at `/api/quotation/` prefix

---

## ✅ ENDPOINTS NOW AVAILABLE AT:

- `GET  /api/quotation/terms/` - List all terms
- `POST /api/quotation/terms/` - Create new term  
- `GET  /api/quotation/quotation-terms/` - Get quotation terms
- `POST /api/quotation/quotation-terms/bulk-create/` - Bulk attach
- And all other quotation endpoints...

---

## 🎯 SUCCESS CRITERIA

After restart, you should:
1. ✅ No "Failed to fetch terms" error
2. ✅ See 18 terms in the table
3. ✅ Can click "Add New Term" button
4. ✅ Can edit/delete existing terms
5. ✅ No 404 errors in browser console

---

**Ready to test! Restart both servers and try again!** 🚀
