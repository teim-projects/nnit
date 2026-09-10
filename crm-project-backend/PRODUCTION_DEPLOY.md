# 🚀 PRODUCTION DEPLOYMENT - FINAL CHECKLIST

## ✅ **All Backend Fixes Applied:**

### **1. URLs Configuration** ✅
- File: `krishna_air/urls.py`
- Duplicate `/amc/` route removed
- Only `/api/amc/` route exists
- Status: **READY TO DEPLOY**

### **2. AMC Views** ✅
- File: `amc/views.py`
- Performance optimizations added
- Error handling improved
- Sync made optional
- Status: **READY TO DEPLOY**

### **3. AMC Serializers** ✅
- File: `amc/serializers.py`
- Error handling added
- Null-safe serialization
- Status: **READY TO DEPLOY**

### **4. Frontend Components** ✅
- File: `crm-project-frontend/src/components/amc/AmcList.jsx`
- Enhanced token retrieval
- Better error messages
- Session expiry handling
- Status: **READY TO DEPLOY**

### **5. Frontend Form** ✅
- File: `crm-project-frontend/src/components/amc/AddAmcForm.jsx`
- Debug logging added
- Better error handling
- Status: **READY TO DEPLOY**

---

## 📦 **DEPLOYMENT STEPS**

### **BACKEND DEPLOYMENT**

#### **Step 1: Upload Files to Production**

Upload these modified files to your production server:

```bash
# Files to upload:
crm-project-backend/krishna_air/urls.py
crm-project-backend/amc/views.py
crm-project-backend/amc/serializers.py
crm-project-backend/amc/management/commands/check_amc_health.py
```

Or via Git:
```bash
cd /path/to/backend
git add .
git commit -m "Fix AMC routing and error handling"
git push origin main
```

On server:
```bash
cd /var/www/chronolms/backend
git pull origin main
```

#### **Step 2: Restart Backend Service**

```bash
# If using systemd service:
sudo systemctl restart gunicorn

# Or if using gunicorn directly:
pkill gunicorn
gunicorn krishna_air.wsgi:application --bind 127.0.0.1:8000 --daemon --workers 3

# Or if using supervisor:
sudo supervisorctl restart chronolms
```

#### **Step 3: Verify Backend**

```bash
# Test backend is running:
curl http://127.0.0.1:8000/api/amc/contracts/
# Should return: "Authentication credentials were not provided."
# This is CORRECT - means API is working!
```

---

### **FRONTEND DEPLOYMENT**

#### **Step 1: Build Frontend**

On your local machine:
```bash
cd crm-project-frontend
npm install
npm run build
```

This creates `dist/` folder with production-ready files.

#### **Step 2: Upload Build Files**

Upload `dist/` folder contents to server:
```bash
# Using SCP:
scp -r dist/* user@chronolms.com:/var/www/chronolms/frontend/build/

# Or using SFTP/FTP client
```

#### **Step 3: Set Proper Permissions**

On server:
```bash
cd /var/www/chronolms/frontend/build
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
```

---

### **NGINX CONFIGURATION**

#### **Option A: Same Domain Setup** (Recommended)

**File:** `/etc/nginx/sites-available/chronolms.com`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name chronolms.com www.chronolms.com;

    # Redirect HTTP to HTTPS (if you have SSL)
    # return 301 https://$server_name$request_uri;

    # Frontend - React Static Files
    root /var/www/chronolms/frontend/build;
    index index.html index.htm;

    # Frontend Routes - React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API - Proxy to Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Auth Endpoints
    location /auth/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Token Endpoints
    location /token/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django Static Files
    location /static/ {
        alias /var/www/chronolms/backend/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Django Media Files
    location /media/ {
        alias /var/www/chronolms/backend/media/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Log Files
    access_log /var/log/nginx/chronolms-access.log;
    error_log /var/log/nginx/chronolms-error.log;
}

# HTTPS Configuration (if you have SSL certificate)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name chronolms.com www.chronolms.com;
#
#     ssl_certificate /etc/letsencrypt/live/chronolms.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/chronolms.com/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#
#     # ... rest of configuration same as above ...
# }
```

**Apply Configuration:**
```bash
# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

---

### **VERIFICATION TESTS**

#### **Test 1: Backend API**
```bash
# Test from server
curl http://127.0.0.1:8000/api/amc/contracts/
# Expected: {"detail":"Authentication credentials were not provided."}

# Test from outside
curl https://chronolms.com/api/amc/contracts/
# Expected: Same as above
```

#### **Test 2: Frontend Routes**
```bash
# Test main page
curl https://chronolms.com/
# Expected: HTML with React app

# Test AMC page
curl https://chronolms.com/amc/
# Expected: HTML with React app (NOT Django API Root!)
```

#### **Test 3: Static Files**
```bash
# Test static files
curl https://chronolms.com/static/admin/css/base.css
# Expected: CSS content

# Test media files (if any)
curl https://chronolms.com/media/
# Expected: Directory listing or files
```

#### **Test 4: Browser Test**

Open browser and test:
1. ✅ `https://chronolms.com/` - Shows your app
2. ✅ `https://chronolms.com/amc/` - Shows AMC page (React)
3. ✅ `https://chronolms.com/admin/` - Shows Django admin
4. ✅ `https://chronolms.com/api/amc/contracts/` - Shows JSON

Press F12 (Console) and check:
- ✅ No CORS errors
- ✅ No 404 errors
- ✅ API calls return 200 or 401 (not 404/500)

---

## 🔧 **TROUBLESHOOTING**

### **Issue 1: Still seeing Django API Root on /amc/**

**Solution:**
```bash
# Clear Nginx cache
sudo rm -rf /var/cache/nginx/*

# Restart Nginx
sudo systemctl restart nginx

# Clear browser cache
# Ctrl + Shift + Delete (in browser)
```

### **Issue 2: 502 Bad Gateway**

**Solution:**
```bash
# Check if Django is running
ps aux | grep gunicorn

# If not running, start it
cd /var/www/chronolms/backend
source venv/bin/activate
gunicorn krishna_air.wsgi:application --bind 127.0.0.1:8000 --daemon --workers 3

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### **Issue 3: 404 on API endpoints**

**Solution:**
```bash
# Verify Django URL patterns
python manage.py show_urls | grep amc
# Should show: /api/amc/contracts/

# Check Django logs
tail -f /var/log/gunicorn/error.log
```

### **Issue 4: CORS Errors**

**Solution:**
Update `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://chronolms.com",
    "https://www.chronolms.com",
]

CORS_ALLOW_CREDENTIALS = True
```

Restart Django.

---

## 📊 **MONITORING**

### **Check Nginx Logs**
```bash
# Access log (successful requests)
sudo tail -f /var/log/nginx/chronolms-access.log

# Error log (failed requests)
sudo tail -f /var/log/nginx/chronolms-error.log
```

### **Check Django Logs**
```bash
# Application logs
tail -f /var/log/gunicorn/error.log

# Or if using systemd:
sudo journalctl -u gunicorn -f
```

### **Check System Resources**
```bash
# Check disk space
df -h

# Check memory
free -h

# Check running processes
ps aux | grep -E 'gunicorn|nginx'
```

---

## ✅ **POST-DEPLOYMENT CHECKLIST**

After deployment, verify:

- [ ] Backend URL fix applied (`urls.py` updated)
- [ ] Backend service restarted
- [ ] Backend API responding (test with curl)
- [ ] Frontend build uploaded
- [ ] Nginx configured
- [ ] Nginx restarted
- [ ] Browser cache cleared
- [ ] Can access `https://chronolms.com/`
- [ ] Can access `https://chronolms.com/amc/` (shows React, not Django)
- [ ] Can access `https://chronolms.com/api/amc/contracts/` (shows JSON)
- [ ] Can login successfully
- [ ] Can create AMC contract
- [ ] No console errors
- [ ] No CORS errors
- [ ] Page refresh works

---

## 🎉 **SUCCESS!**

If all checks pass, your AMC system is now properly deployed and working!

### **Final URLs:**
- **Frontend:** `https://chronolms.com/amc/`
- **Backend API:** `https://chronolms.com/api/amc/contracts/`
- **Admin:** `https://chronolms.com/admin/`

---

## 📞 **Need Help?**

If still facing issues:

1. Check logs (Nginx + Django)
2. Verify all files uploaded
3. Confirm services are running
4. Test with curl commands above
5. Check browser console (F12)

---

**Your complete production deployment guide is ready!** 🚀
