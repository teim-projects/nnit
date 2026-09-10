# ✅ How to Fix "Failed to Fetch Contracts" Error

## 🎯 Problem
When you reload the AMC page, you see an error: **"Failed to fetch contracts"**

## 🔍 Root Cause
**Your Django backend server is NOT running!**

The frontend is trying to connect to `http://localhost:8000` but there's no server listening on that port.

## ✅ Solution

### **Step 1: Start the Backend Server**

#### **Method 1: Using the Batch File (Easiest)**
1. Navigate to: `c:\Users\OWNER\Desktop\nnit\nnit\crm-project-backend\`
2. Double-click `start_server.bat`
3. A terminal window will open and start the Django server

#### **Method 2: Using Command Line**
1. Open a new terminal/command prompt
2. Run these commands:
```cmd
cd c:\Users\OWNER\Desktop\nnit\nnit\crm-project-backend
python manage.py runserver 0.0.0.0:8000
```

### **Step 2: Verify Server is Running**
You should see output like:
```
Django version 4.2.x, using settings 'krishna_air.settings'
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.
```

### **Step 3: Test the API**
Open your browser and go to:
- http://localhost:8000/api/amc/contracts/

You should see JSON data or a login screen, NOT an API Root page.

### **Step 4: Refresh Your Frontend**
Now refresh your AMC page in the frontend application - it should load properly!

---

## 🚀 **For Development: Keep Both Servers Running**

### **Terminal 1: Backend Server**
```cmd
cd c:\Users\OWNER\Desktop\nnit\nnit\crm-project-backend
python manage.py runserver
```

### **Terminal 2: Frontend Server**  
```cmd
cd c:\Users\OWNER\Desktop\nnit\nnit\crm-project-frontend
npm run dev
```

---

## 📝 Additional Notes

### **Frontend Configuration**
- Development mode uses: `http://localhost:8000`
- Production mode uses: `https://chronolms.com`

Configuration file: `crm-project-frontend/.env.development`

### **If Still Not Working**
1. Check if port 8000 is being used by another process
2. Make sure Python virtual environment is activated (if using venv)
3. Check Django settings for CORS configuration
4. Clear browser cache and cookies
5. Check browser console for detailed error messages

---

## ✅ Quick Checklist
- [ ] Backend server is running on port 8000
- [ ] Frontend can access http://localhost:8000/api/amc/contracts/
- [ ] Browser console shows no CORS errors
- [ ] Token is present in localStorage (check Application tab in DevTools)

---

**That's it!** Your AMC page should now work perfectly after page reload.
