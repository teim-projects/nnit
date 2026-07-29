# Dropdown Issue - Quick Fix 🔧

## Problem:
1. **"10 terms"** showing instead of 18
2. **Dropdown arrow exists** but click karne pe expand nahi ho raha

## Root Cause:

### Issue 1: Only 10 terms showing
**Reason**: Backend pagination - default page size is 10

**Solution**: Update the API call to get all terms

### Issue 2: Dropdown not opening  
**Reason**: Click event conflict or state issue

---

## Fix #1: Get All Terms (No Pagination)

Update `QuotationTermsSelector.jsx` line 36-40:

### Before:
```javascript
const response = await axios.get(`${API_BASE_URL}/terms/?is_active=true`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### After:
```javascript
const response = await axios.get(`${API_BASE_URL}/terms/?is_active=true&page_size=100`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## Fix #2: Ensure Dropdown Opens

The code looks correct. Issue might be:
1. Click event bubbling
2. Button state conflict

### Test:
1. Open browser console (F12)
2. Click dropdown arrow
3. Check console for errors
4. Check if `expanded` state changes

---

## Quick Test Commands:

### Check how many terms in database:
```bash
cd c:\Users\OWNER\Desktop\nnit\nnit\crm-project-backend
python manage.py shell -c "from quotation.terms_models import TermsMaster; print(f'Total terms: {TermsMaster.objects.filter(is_default=True, is_active=True).count()}')"
```

### Expected: `Total terms: 18`

---

## Files to Update:

### Frontend:
**File**: `crm-project-frontend/src/components/QuotationTermsSelector.jsx`

**Line 36** - Add `&page_size=100`:
```javascript
const response = await axios.get(
  `${API_BASE_URL}/terms/?is_active=true&page_size=100`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## Testing Steps:

1. **Update frontend file** (add `page_size=100`)
2. **Restart frontend** if needed
3. **Open quotation form**
4. **Check**: Should now show "18 terms" instead of "10 terms"
5. **Click dropdown arrow**: Should expand/collapse

---

## Status:
- ❓ Need to update frontend file
- ❓ Need to test dropdown opening
- ✅ Backend has all 18 terms
- ✅ PDF formatting is complete

**Next**: Update the frontend file and test!
