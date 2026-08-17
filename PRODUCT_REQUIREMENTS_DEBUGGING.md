# Product Requirements - Debugging Guide 🔍

## Issue: Categories aur Products fetch nahi ho rahe

### Screenshot me dikha:
- ✅ Parking Products page me **Stack Parking** aur **2DP 101** exist karte hain
- ❌ Product Requirements form me dropdown empty hai

---

## 🔍 Debug Steps

### Step 1: Browser Console Check karo
1. Product Requirements Add page kholo
2. Browser console kholo (F12 ya Right Click → Inspect)
3. Console tab me dekho

**Aapko yeh logs dikhne chahiye:**
```
Fetching categories from: http://localhost:8000/parking/categories/?is_active=true
Categories response: { ... }
Categories set: [ { id: 1, name: 'stack_parking', display_name: 'Stack Parking', ... } ]

Fetching products from: http://localhost:8000/parking/products/?is_active=true
Products response: { ... }
Products set: [ { id: 1, product_name: '2DP 101', ... } ]
```

**Agar error hai:**
```
Error fetching categories: ...
Error response: { detail: "..." }
```

---

## 🔧 Common Issues & Fixes

### Issue 1: API URLs galat hain
**Check karo:**
```javascript
// .env file me yeh hona chahiye:
VITE_BASE_API_URL=http://localhost:8000
```

**Fix:**
- Frontend `.env` file check karo
- Server restart karo: `npm run dev`

---

### Issue 2: Backend API endpoints exist nahi karte
**Test karo terminal me:**
```bash
# Test 1: Categories API
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/parking/categories/?is_active=true

# Test 2: Products API
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/parking/products/?is_active=true
```

**Expected Response:**
```json
{
  "results": [
    {
      "id": 1,
      "name": "stack_parking",
      "display_name": "Stack Parking",
      "is_active": true
    }
  ]
}
```

**Agar 404 error:**
- Backend URLs check karo (`krishna_air/urls.py`)
- Parking app URLs correct hain ya nahi

---

### Issue 3: Token galat hai ya expired
**Check karo:**
```javascript
// Console me type karo:
localStorage.getItem('access_token')
```

**Agar null ya undefined:**
- Login phir se karo
- Token refresh karo

---

### Issue 4: CORS error
**Console me dikhe:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix:**
Backend settings me CORS allow karo:
```python
# settings/base.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]
```

---

## ✅ Quick Fix Checklist

### Backend Check:
```bash
# 1. Backend server chal raha hai?
cd crm-project-backend
python manage.py runserver

# 2. Parking app URLs check karo
# File: krishna_air/urls.py
# Should have: path('parking/', include('parking_products.urls'))

# 3. Database me data hai?
python manage.py shell
>>> from parking_products.models import ProductCategory
>>> ProductCategory.objects.all()
>>> # Should show Stack Parking

>>> from parking_products.models import ParkingProduct  
>>> ParkingProduct.objects.all()
>>> # Should show 2DP 101
```

### Frontend Check:
```bash
# 1. Frontend server chal raha hai?
cd crm-project-frontend
npm run dev

# 2. .env file hai?
cat .env
# Should show: VITE_BASE_API_URL=http://localhost:8000

# 3. Token valid hai?
# Browser console:
localStorage.getItem('access_token')
```

---

## 🎯 Most Likely Issues

### 1. Token Issue (90% chance)
**Problem**: Token expire ho gaya ya galat hai

**Solution:**
1. Logout karo
2. Login phir se karo
3. Form reload karo

---

### 2. API URL Issue (5% chance)
**Problem**: `.env` file me URL galat hai

**Solution:**
```bash
# Create/Update .env file
echo "VITE_BASE_API_URL=http://localhost:8000" > .env

# Restart frontend
npm run dev
```

---

### 3. Backend Not Running (3% chance)
**Problem**: Backend server band hai

**Solution:**
```bash
cd crm-project-backend
python manage.py runserver
```

---

### 4. Database Empty (2% chance)
**Problem**: Categories aur products database me nahi hain

**Solution:**
```bash
# Django admin se add karo
http://localhost:8000/admin

# Ya shell se:
python manage.py shell
>>> from parking_products.models import ProductCategory
>>> ProductCategory.objects.create(
...     name='stack_parking',
...     display_name='Stack Parking',
...     is_active=True
... )
```

---

## 📊 Testing Script

Browser console me ye script run karo:

```javascript
// Test API directly
const baseApi = 'http://localhost:8000';
const token = localStorage.getItem('access_token');

// Test 1: Categories
fetch(`${baseApi}/parking/categories/?is_active=true`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Categories:', d))
.catch(e => console.error('Categories Error:', e));

// Test 2: Products
fetch(`${baseApi}/parking/products/?is_active=true`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Products:', d))
.catch(e => console.error('Products Error:', e));
```

---

## 🔍 Debug Output Analysis

### Success Output:
```
Fetching categories from: http://localhost:8000/parking/categories/?is_active=true
Categories response: {results: Array(1), count: 1, ...}
Categories set: [{id: 1, display_name: "Stack Parking", ...}]
```
✅ **Working perfectly!**

---

### Error Output 1 (No Token):
```
Error fetching categories: AxiosError
Error response: {detail: "Authentication credentials were not provided."}
```
🔴 **Solution**: Login phir se karo

---

### Error Output 2 (404):
```
Error fetching categories: AxiosError
Error response: 404 Not Found
```
🔴 **Solution**: Backend URLs check karo

---

### Error Output 3 (CORS):
```
Access to XMLHttpRequest at 'http://localhost:8000/parking/categories/' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```
🔴 **Solution**: Backend CORS settings fix karo

---

### Error Output 4 (Empty Response):
```
Fetching categories from: http://localhost:8000/parking/categories/?is_active=true
Categories response: {results: [], count: 0}
Categories set: []
```
🔴 **Solution**: Database me categories add karo

---

## 🎯 Action Plan

### Step-by-Step Fix:

1. **Open Browser Console** (F12)
2. **Navigate to Product Requirements Add page**
3. **Check console logs** - kya dikhta hai?
4. **If no logs** → Frontend code me issue
5. **If error logs** → Error message padho aur upar solutions dekho
6. **If empty response** → Database me data add karo

---

## 📞 What to Share for Help

Agar abhi bhi kaam nahi kar raha, to yeh share karo:

1. **Browser Console Screenshot** (with errors)
2. **Network Tab** (F12 → Network → check API calls)
3. **Backend Terminal Output** (errors if any)
4. **Test Script Output** (jo script upar diya hai)

---

## ✅ Expected Final Result

Jab sab kuch sahi hoga:

**Category Dropdown:**
```
[Select Category ▼]
  Stack Parking
  Puzzle Parking
  Tower Parking
  ...
```

**Product Dropdown (after selecting Stack Parking):**
```
[Select Product ▼]
  2DP 101
  3DP 202
  ...
```

---

**Date**: August 8, 2026
**Status**: Debugging Mode 🔍
