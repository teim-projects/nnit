# 🚀 FRESH AMC SYSTEM - COMPLETE SETUP GUIDE

## **Current Problem:**
- Page not found (404) error aa raha hai
- URL routing properly kaam nahi kar raha
- Backend aur frontend conflict ho raha hai

## **Solution:**
Ek completely fresh, clean AMC system banate hain with proper configuration!

---

## 📋 **STEP-BY-STEP IMPLEMENTATION**

### **PHASE 1: Backend URLs Fix (CRITICAL)**

#### **Step 1.1: Main URLs File**

**File:** `crm-project-backend/krishna_air/urls.py`

**Current issue:** Duplicate routes causing conflict

**✅ CORRECT Configuration:**

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)

urlpatterns = [
    # Admin & Auth
    path('admin/', admin.site.urls),
    path('auth/', include('api.urls')),
    
    # JWT Token endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # API Endpoints (all with /api/ prefix)
    path('api/lead/', include('lead_management.urls')),
    path('api/product/', include('product_management.urls')),
    path('api/quotation/', include('quotation.urls')),
    path('api/amc/', include('amc.urls')),  # ✅ AMC with /api/ prefix
    path('api/services/', include('service_management.urls')),
    path('api/parking/', include('parking_products.urls')),
    
    # Legacy endpoints (for backward compatibility)
    path('lead/', include('lead_management.urls')),
    path('product/', include('product_management.urls')),
    path('services/', include('service_management.urls')),
    path('parking/', include('parking_products.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

**Key Changes:**
- ✅ NO `/amc/` route (removed duplicate)
- ✅ ONLY `/api/amc/` route
- ✅ All API routes have `/api/` prefix
- ✅ Clean, organized structure

---

### **PHASE 2: Django Settings Fix**

#### **Step 2.1: CORS & Security Settings**

**File:** `crm-project-backend/krishna_air/settings.py`

Add/Update these settings:

```python
# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev
    "http://localhost:3000",  # React dev
    "https://chronolms.com",  # Production
    "https://www.chronolms.com",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Allowed Hosts
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'chronolms.com',
    'www.chronolms.com',
    'api.chronolms.com',  # If using subdomain
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
}
```

---

### **PHASE 3: Production Server Configuration**

#### **Option A: Nginx Configuration (Recommended)**

**File:** `/etc/nginx/sites-available/chronolms.com`

```nginx
server {
    listen 80;
    server_name chronolms.com www.chronolms.com;

    # Frontend - React App
    root /var/www/chronolms/frontend/build;
    index index.html;

    # Serve frontend for all routes except API
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API - Proxy to Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Auth endpoints
    location /auth/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Token endpoints
    location /token/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Static & Media files
    location /static/ {
        alias /var/www/chronolms/backend/static/;
        expires 30d;
    }

    location /media/ {
        alias /var/www/chronolms/backend/media/;
        expires 30d;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Apply Config:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### **Option B: Subdomain Setup (Easier)**

**DNS Records:**
```
chronolms.com       A    your-server-ip    # Frontend
api.chronolms.com   A    your-server-ip    # Backend
```

**Frontend .env.production:**
```env
VITE_BASE_API_URL=https://api.chronolms.com
```

**Nginx for api.chronolms.com:**
```nginx
server {
    listen 80;
    server_name api.chronolms.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # CORS
        add_header 'Access-Control-Allow-Origin' 'https://chronolms.com' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
}
```

---

### **PHASE 4: Frontend Configuration**

#### **Step 4.1: Environment Files**

**File:** `crm-project-frontend/.env.development`
```env
VITE_BASE_API_URL=http://localhost:8000
```

**File:** `crm-project-frontend/.env.production`
```env
# Choose ONE based on your setup:

# Option A: Same domain with /api/ prefix
VITE_BASE_API_URL=https://chronolms.com

# Option B: Subdomain
# VITE_BASE_API_URL=https://api.chronolms.com
```

#### **Step 4.2: Frontend Build**

```bash
cd crm-project-frontend
npm install
npm run build
```

Upload `dist/` folder to `/var/www/chronolms/frontend/build/`

---

### **PHASE 5: Backend Deployment**

#### **Step 5.1: Deploy Code**

```bash
# On production server
cd /var/www/chronolms/backend
git pull origin main  # or your branch

# Or upload files manually:
# - krishna_air/urls.py (updated)
# - krishna_air/settings.py (updated)
# - amc/ (entire directory)
```

#### **Step 5.2: Django Setup**

```bash
# Activate virtual environment
source venv/bin/activate  # or your venv path

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart Django
sudo systemctl restart gunicorn  # or your service name
# OR
pkill gunicorn && gunicorn krishna_air.wsgi:application --bind 127.0.0.1:8000 --daemon
```

---

### **PHASE 6: Testing**

#### **Test 1: Backend API**

```bash
# Test authentication
curl -X POST https://chronolms.com/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_user","password":"your_pass"}'

# Should return: {"access":"...", "refresh":"..."}

# Test AMC endpoint (with token)
curl https://chronolms.com/api/amc/contracts/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should return: JSON data or authentication error
```

#### **Test 2: Frontend Routes**

Open browser:
1. `https://chronolms.com/` → Should show your app
2. `https://chronolms.com/amc/` → Should show AMC page (NOT Django API Root)
3. `https://chronolms.com/api/amc/contracts/` → Should show JSON (API endpoint)

#### **Test 3: Browser Console**

Press F12, go to Network tab:
- Should see requests to `/api/amc/contracts/`
- Should have `Authorization: Bearer ...` header
- Should return 200 OK (if logged in) or 401 (if not logged in)

---

## 🎯 **QUICK FIX CHECKLIST**

### **Backend:**
- [ ] Update `krishna_air/urls.py` (remove duplicate `/amc/` route)
- [ ] Update `krishna_air/settings.py` (CORS & ALLOWED_HOSTS)
- [ ] Deploy to production server
- [ ] Run migrations
- [ ] Restart Django service

### **Server:**
- [ ] Choose: Nginx config OR subdomain setup
- [ ] Apply configuration
- [ ] Test with curl

### **Frontend:**
- [ ] Update `.env.production`
- [ ] Build: `npm run build`
- [ ] Deploy build files
- [ ] Clear browser cache
- [ ] Test in browser

---

## 🚨 **Common Issues & Solutions**

### **Issue: Still seeing Django API Root**
**Solution:** 
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check Nginx config is correct
4. Restart Nginx

### **Issue: 404 Page Not Found**
**Solution:**
1. Check URL patterns in `urls.py`
2. Verify Django service is running: `ps aux | grep gunicorn`
3. Check Nginx error log: `sudo tail -f /var/log/nginx/error.log`

### **Issue: CORS Error**
**Solution:**
1. Check `settings.py` CORS configuration
2. Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL
3. Check Nginx CORS headers

### **Issue: Authentication Not Working**
**Solution:**
1. Login again to get fresh token
2. Check token is saved: `localStorage.getItem('access')`
3. Verify token in API request headers (Network tab)

---

## 📂 **Final Directory Structure**

```
Production Server:
/var/www/chronolms/
├── frontend/
│   └── build/          # React build files
│       ├── index.html
│       ├── assets/
│       └── ...
├── backend/
│   ├── krishna_air/    # Django project
│   ├── amc/            # AMC app
│   ├── manage.py
│   ├── static/         # Collected static files
│   └── media/          # Uploaded files
└── venv/               # Python virtual environment
```

---

## ✅ **Success Criteria**

After following this guide:

✅ `chronolms.com/amc/` shows React AMC page  
✅ `chronolms.com/api/amc/contracts/` shows JSON API  
✅ No 404 errors  
✅ No Django API Root on frontend routes  
✅ Authentication works  
✅ Can create/view AMC contracts  
✅ Page refresh works properly  

---

**Follow this guide step by step aur sab kaam karega!** 🚀

Need help with any specific step? Let me know!
