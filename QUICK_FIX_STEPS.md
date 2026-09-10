# ⚡ QUICK FIX - 5 MINUTES

## **Current Problem:**
Page not found (404) when accessing `/amc/` route

## **Root Cause:**
Backend URL `/amc/` conflicting with frontend route `/amc/`

---

## 🎯 **IMMEDIATE FIX (Do This Right Now)**

### **Step 1: Update Backend URLs (1 min)**

**File:** `crm-project-backend/krishna_air/urls.py`

**Find this line:**
```python
path('amc/', include('amc.urls')),  # ❌ REMOVE THIS
```

**Delete it completely!** Keep only:
```python
path('api/amc/', include('amc.urls')),  # ✅ KEEP THIS
```

### **Step 2: Production Server - Choose ONE Option**

#### **Option A: Nginx Fix (2 min)** ⭐ RECOMMENDED

```bash
# SSH into your server
ssh user@chronolms.com

# Edit Nginx config
sudo nano /etc/nginx/sites-available/chronolms.com
```

**Add this location block:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
    root /var/www/chronolms/frontend/build;
}

location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
}
```

**Apply:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### **Option B: Use Subdomain (5 min)**

1. Point `api.chronolms.com` to your server IP in DNS
2. Update frontend `.env.production`:
   ```
   VITE_BASE_API_URL=https://api.chronolms.com
   ```
3. Rebuild frontend: `npm run build`
4. Deploy

### **Step 3: Restart Backend (30 sec)**

```bash
# On production server
sudo systemctl restart gunicorn
# OR
pkill gunicorn && gunicorn krishna_air.wsgi:application --bind 127.0.0.1:8000 --daemon
```

### **Step 4: Clear Cache & Test (30 sec)**

1. Clear browser cache
2. Hard refresh (Ctrl + Shift + R)
3. Go to: `https://chronolms.com/amc/`
4. Should work now! ✅

---

## 🧪 **Quick Test Commands**

```bash
# Test if backend is running
curl http://127.0.0.1:8000/api/amc/contracts/

# Test frontend route
curl https://chronolms.com/amc/
# Should return HTML, not JSON
```

---

## 📋 **Files to Modify**

### **Backend:**
1. ✅ `krishna_air/urls.py` - Remove duplicate route

### **Server (Choose ONE):**
2a. ✅ `/etc/nginx/sites-available/chronolms.com` - Add location blocks  
**OR**  
2b. ✅ Frontend `.env.production` - Use subdomain

---

## ✅ **Success Check**

After fix:
- [ ] `chronolms.com/amc/` shows React app (NOT Django page)
- [ ] `chronolms.com/api/amc/contracts/` shows JSON
- [ ] No 404 errors
- [ ] Can login and see data

---

**Total Time: 5 minutes max!** 🚀

If still having issues, see `FRESH_AMC_SYSTEM_GUIDE.md` for detailed explanation.
