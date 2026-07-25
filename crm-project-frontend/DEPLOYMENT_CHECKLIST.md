# 🚀 Production Deployment Checklist

## Pre-Build Verification

### ✅ Environment File Check
- [ ] File exists: `crm-project-frontend/.env.production`
- [ ] Contains: `VITE_BASE_API_URL=https://api.dsaqua.online`
- [ ] No typos in the URL
- [ ] File is in the root of `crm-project-frontend/` folder

### ✅ Code Changes Verified
- [ ] All 18 files updated (check API_URL_FIX_SUMMARY.md)
- [ ] No hardcoded `127.0.0.1:8000` or `localhost:8000` URLs
- [ ] Debug logging added to all components

## Build Process

### Step 1: Clean Previous Build
```bash
cd crm-project-frontend
rm -rf dist/
# or on Windows:
# rmdir /s /q dist
```

### Step 2: Install Dependencies (if needed)
```bash
npm install
```

### Step 3: Build for Production
```bash
npm run build
```

**Expected output:**
- ✅ Build completes without errors
- ✅ `dist/` folder created
- ✅ Files inside dist folder

### Step 4: Verify Build
```bash
# Check that dist folder exists and contains files
ls dist/
# or on Windows:
# dir dist
```

## Deployment

### Step 1: Backup Current Production
- [ ] Backup current `dist` folder on server
- [ ] Note the backup location

### Step 2: Upload New Build
- [ ] Upload entire `dist/` folder to production server
- [ ] Verify all files uploaded successfully
- [ ] Check file permissions (if on Linux/Unix)

### Step 3: Clear Server Cache (if applicable)
- [ ] Clear Nginx/Apache cache
- [ ] Restart web server (if needed)

## Post-Deployment Testing

### Step 1: Browser Console Check
1. [ ] Open production URL in browser
2. [ ] Open DevTools (F12)
3. [ ] Go to Console tab
4. [ ] Look for debug logs:

**Should see:**
```
Login BASE_API = https://api.dsaqua.online
Dashboard BASE_API = https://api.dsaqua.online
Navbar BASE_API = https://api.dsaqua.online
TermsManagement API_BASE_URL = https://api.dsaqua.online/api/quotation
```

**Should NOT see:**
```
❌ Login BASE_API = undefined
❌ Login BASE_API = http://127.0.0.1:8000
❌ Login BASE_API = http://localhost:8000
```

### Step 2: Network Tab Check
1. [ ] Open Network tab in DevTools
2. [ ] Refresh page (Ctrl + F5 for hard refresh)
3. [ ] Check API calls

**Should see:**
```
✅ GET https://api.dsaqua.online/auth/dj-rest-auth/user/ - 200
✅ GET https://api.dsaqua.online/lead/lead/ - 200
✅ GET https://api.dsaqua.online/parking/products/ - 200
```

**Should NOT see:**
```
❌ GET http://127.0.0.1:8000/auth/me/ - Failed
❌ GET http://localhost:8000/api/quotation/terms/ - Failed
```

### Step 3: Functional Testing
- [ ] Login works
- [ ] Dashboard loads
- [ ] Leads page loads
- [ ] Customers page loads
- [ ] Quotations page loads
- [ ] Products page loads
- [ ] Terms & Conditions page loads
- [ ] No console errors (except expected ones)

## Troubleshooting

### If you see `undefined` in console logs:

**Problem:** Environment variable not loading

**Solutions:**
1. Verify `.env.production` file exists in `crm-project-frontend/` root
2. Verify file contains `VITE_BASE_API_URL=https://api.dsaqua.online`
3. Delete `dist/` folder
4. Run `npm run build` again
5. Upload new `dist/` folder

### If you see `127.0.0.1:8000` in Network tab:

**Problem:** Old build deployed or browser cache

**Solutions:**
1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Try in Incognito/Private window
4. Verify new `dist/` folder uploaded
5. Check server timestamp of files

### If you see CORS errors:

**Problem:** Backend CORS settings

**Solutions:**
1. Check backend CORS configuration
2. Verify `https://your-frontend-domain.com` is in allowed origins
3. Check backend logs

## Rollback Plan

If issues persist:
1. [ ] Restore backup of old `dist/` folder
2. [ ] Restart web server
3. [ ] Verify old version works
4. [ ] Review error logs
5. [ ] Contact support if needed

## Success Criteria ✅

**Deployment is successful when:**
- ✅ No console errors showing `undefined` for BASE_API
- ✅ No Network requests to `127.0.0.1:8000` or `localhost:8000`
- ✅ All API requests hit `https://api.dsaqua.online`
- ✅ All pages load correctly
- ✅ Login/authentication works
- ✅ Data displays correctly

## Completion

- [ ] All checklist items completed
- [ ] Production verified working
- [ ] Team notified of deployment
- [ ] Deployment notes recorded

**Deployed by:** ________________  
**Date:** ________________  
**Time:** ________________  
**Build version/commit:** ________________

---

## Quick Reference

**Frontend URL:** https://your-frontend-domain.com  
**Backend API URL:** https://api.dsaqua.online  
**Environment file:** `crm-project-frontend/.env.production`  
**Build command:** `npm run build`  
**Build output:** `crm-project-frontend/dist/`

---

**Need help?** Check `API_URL_FIX_SUMMARY.md` for detailed information about the fixes applied.
