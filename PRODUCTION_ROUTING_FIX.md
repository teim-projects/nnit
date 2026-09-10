# 🚨 PRODUCTION SERVER ROUTING CONFLICT - SOLUTION

## **Problem**

Jab aap `chronolms.com/amc/` pe jaate ho, toh **Django REST API Root page** dikh raha hai instead of your React frontend AMC page!

### **Why?**

Your backend mein duplicate URL paths the:
```python
path('api/amc/', include('amc.urls')),  # ✅ Correct
path('amc/', include('amc.urls')),      # ❌ DUPLICATE! Conflicting with frontend route
```

Dono same server pe host hain aur `/amc/` URL par conflict ho raha hai.

## **Immediate Fix Applied** ✅

### **1. Removed Duplicate Backend URL**

**File:** `krishna_air/urls.py`

**BEFORE:**
```python
path('api/amc/', include('amc.urls')),
path('amc/', include('amc.urls')),      # ❌ DUPLICATE
```

**AFTER:**
```python
path('api/amc/', include('amc.urls')),  # ✅ ONLY THIS
```

Ab backend sirf `/api/amc/` pe respond karega, not `/amc/`

---

## **Production Server Configuration Required**

### **Current Problem:**
- Frontend React app: `chronolms.com/*`
- Backend Django API: `chronolms.com/api/*`, `chronolms.com/admin/`, etc.

Dono same server pe hai, toh proper routing chahiye!

### **Solution Options:**

---

## **Option 1: Nginx Configuration (RECOMMENDED)** ⭐

Agar aap Nginx use kar rahe ho (most common for production):

### **Create/Edit:** `/etc/nginx/sites-available/chronolms.com`

```nginx
server {
    listen 80;
    server_name chronolms.com www.chronolms.com;

    # Frontend - React Static Files
    root /var/www/chronolms/frontend/build;
    index index.html;

    # Frontend routes - all React app routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API routes - proxy to Django
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
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django Auth endpoints
    location /auth/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django Token endpoints
    location /token/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django Static/Media files
    location /static/ {
        alias /var/www/chronolms/backend/static/;
    }

    location /media/ {
        alias /var/www/chronolms/backend/media/;
    }

    # Django Lead management
    location /lead/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Other Django endpoints
    location ~ ^/(product|parking|services|swagger|redoc)/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```

### **Apply Configuration:**
```bash
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx      # Reload if test passes
```

---

## **Option 2: Apache Configuration**

Agar Apache use kar rahe ho:

### **Create/Edit:** `/etc/apache2/sites-available/chronolms.com.conf`

```apache
<VirtualHost *:80>
    ServerName chronolms.com
    ServerAlias www.chronolms.com

    # Frontend - React Static Files
    DocumentRoot /var/www/chronolms/frontend/build

    <Directory /var/www/chronolms/frontend/build>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Frontend routing - serve index.html for all routes
        FallbackResource /index.html
    </Directory>

    # Backend API - Proxy to Django
    ProxyPreserveHost On
    
    ProxyPass /api/ http://127.0.0.1:8000/api/
    ProxyPassReverse /api/ http://127.0.0.1:8000/api/

    ProxyPass /admin/ http://127.0.0.1:8000/admin/
    ProxyPassReverse /admin/ http://127.0.0.1:8000/admin/

    ProxyPass /auth/ http://127.0.0.1:8000/auth/
    ProxyPassReverse /auth/ http://127.0.0.1:8000/auth/

    ProxyPass /token/ http://127.0.0.1:8000/token/
    ProxyPassReverse /token/ http://127.0.0.1:8000/token/

    # Static/Media files
    Alias /static/ /var/www/chronolms/backend/static/
    Alias /media/ /var/www/chronolms/backend/media/

    <Directory /var/www/chronolms/backend/static>
        Require all granted
    </Directory>

    <Directory /var/www/chronolms/backend/media>
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/chronolms-error.log
    CustomLog ${APACHE_LOG_DIR}/chronolms-access.log combined
</VirtualHost>
```

### **Apply Configuration:**
```bash
sudo a2enmod proxy proxy_http rewrite
sudo apache2ctl configtest
sudo systemctl reload apache2
```

---

## **Option 3: Separate Backend Subdomain (EASIEST)** 🎯

Backend ko alag subdomain pe run karo:

### **DNS Configuration:**
```
chronolms.com       → Frontend (React)
api.chronolms.com   → Backend (Django)
```

### **Update Frontend .env.production:**
```env
VITE_BASE_API_URL=https://api.chronolms.com
```

### **Django Settings:**
```python
# settings.py
ALLOWED_HOSTS = ['api.chronolms.com', 'chronolms.com']

CORS_ALLOWED_ORIGINS = [
    'https://chronolms.com',
    'https://www.chronolms.com',
]
```

### **Nginx for api.chronolms.com:**
```nginx
server {
    listen 80;
    server_name api.chronolms.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /var/www/chronolms/backend/static/;
    }

    location /media/ {
        alias /var/www/chronolms/backend/media/;
    }
}
```

---

## **Quick Test After Configuration**

### **1. Test Backend API Directly:**
```bash
curl https://chronolms.com/api/amc/contracts/
# Should return: "Authentication credentials were not provided"
# (This is CORRECT - means API is working)
```

### **2. Test Frontend:**
```bash
curl https://chronolms.com/amc/
# Should return: HTML with React app
# NOT Django REST framework page
```

### **3. Test in Browser:**
1. Open: `https://chronolms.com/amc/`
2. Should see: Your React AMC page
3. NOT: Django REST API Root

---

## **Current Status:**

✅ **Backend code fixed** - Duplicate route removed  
⚠️ **Server configuration needed** - Choose one option above

## **Recommended Approach:**

**For Quick Fix:** Use Option 3 (Separate Subdomain)  
**For Production:** Use Option 1 (Nginx Configuration)

---

## **Files Modified:**

1. ✅ `crm-project-backend/krishna_air/urls.py` - Removed duplicate `amc/` route

---

## **Next Steps:**

1. **Deploy backend changes** to production server
2. **Choose configuration option** (1, 2, or 3)
3. **Apply server configuration**
4. **Test the changes**
5. **Rebuild & redeploy frontend** if using Option 3

---

**Once server configuration is done, your `/amc/` URL will properly show React frontend, not Django API!** 🎉
