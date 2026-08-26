# AMC Calendar Empty Hai - Complete Fix

## ❌ Problem
Calendar mein events nahi dikh rahe kyunki **AMC contracts ke liye service visits generate nahi hui hain**.

## 🎯 Root Cause
- AMC contracts database mein hain (6 contracts)
- Lekin `service_management_servicerequest` table mein koi entry nahi hai jo AMC se linked ho
- Calendar API `ServiceRequest` table se events leta hai
- Isliye calendar empty show ho raha hai

## ✅ Solution (3 Tarike)

---

### METHOD 1: HTML Tool Se (SABSE AASAAN ⭐)

1. **File kholo browser mein:**
   ```
   generate_amc_events.html
   ```
   (Double-click karo)

2. **Login token lo:**
   - Frontend mein login karo
   - Browser console kholo (F12)
   - Type karo: `localStorage.getItem("token")`
   - Token copy karo

3. **HTML page mein:**
   - Token paste karo
   - "Generate Services for All AMCs" button dabao
   - Wait karo...
   - Success message milega!

4. **Frontend hard refresh karo:**
   - Ctrl + Shift + R
   - Calendar tab kholo
   - Ab events dikhenge! 🎉

---

### METHOD 2: Postman/Thunder Client Se

#### Step 1: Login
```http
POST http://localhost:8000/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}
```
Token copy karo response se.

#### Step 2: Generate Services (Har AMC ke liye)
```http
POST http://localhost:8000/amc/contracts/1/generate-schedule/
Authorization: Bearer YOUR_TOKEN_HERE
```

Repeat for AMC 2, 3, 4, 5, 6:
```http
POST http://localhost:8000/amc/contracts/2/generate-schedule/
POST http://localhost:8000/amc/contracts/3/generate-schedule/
POST http://localhost:8000/amc/contracts/4/generate-schedule/
POST http://localhost:8000/amc/contracts/5/generate-schedule/
POST http://localhost:8000/amc/contracts/6/generate-schedule/
```

#### Step 3: Verify
```http
GET http://localhost:8000/amc/calendar-events/
Authorization: Bearer YOUR_TOKEN_HERE
```

Events dikhengi JSON response mein!

---

### METHOD 3: Django Shell Se (Advanced)

```bash
cd crm-project-backend
python manage.py shell
```

```python
from amc.models import AMCContract

# Sabhi contracts
amcs = AMCContract.objects.all()
print(f"Total AMCs: {amcs.count()}")

# Generate services
total = 0
for amc in amcs:
    services = amc.generate_schedule()
    print(f"{amc.contract_id}: {len(services)} services generated")
    total += len(services)

print(f"\nTotal services generated: {total}")
exit()
```

---

## 📊 Expected Results

Har AMC contract ke liye services generate hongi based on payment frequency:

| Contract | Customer | Frequency | Services |
|----------|----------|-----------|----------|
| AMC-005 | SANTOSHI PAWAR | Monthly | 12 visits |
| AMC-002 | Mr Vivek Page | Quarterly | 4 visits |
| AMC-001 | Mr Vivek Page | Quarterly | 4 visits |
| AMC-003 | ABHIJIT PATIL | Annual | 1 visit |
| AMC-004 | SAGAR SHINDE | Monthly | 12 visits |
| AMC-006 | PRASHANT AMBARAGE | Quarterly | 4 visits |

**Total expected:** ~37 service visits

---

## 🎨 Calendar Events

Generation ke baad calendar mein yeh dikhega:

### 🔵 Blue - Scheduled Service
Service jo schedule hai lekin technician ko assign nahi hui

### 🟢 Green - Service Visit  
Service jo technician ko allocate ho gayi hai

### 🔴 Red - Contract Expiry
AMC contract ki end date

### 🟠 Amber - Renewal Due
Contract expiry se 30 days pehle renewal reminder

---

## 🐛 Troubleshooting

### HTML tool se error aa rahi hai?

**Token invalid:**
- Logout karke fir se login karo
- Nayi token lo
- Paste karke retry karo

**Network error:**
- Backend server chal rahi hai? Check karo
- URL sahi hai? `http://localhost:8000`

**404 errors:**
- Kuch AMC contracts exist nahi karti (normal hai)
- Jo exist karti hain unke liye services generate ho jayengi

### Calendar abhi bhi empty hai?

1. **Hard refresh karo:** Ctrl + Shift + R
2. **Cache clear karo:** Browser settings se
3. **Backend restart karo:** Server ko stop karke fir se start karo
4. **Console check karo:** Browser console (F12) mein errors check karo

### API endpoint 404 de rahi hai?

```bash
# URL pattern check karo
cd crm-project-backend
python manage.py show_urls | grep calendar
```

Yeh dikhna chahiye:
```
/amc/calendar-events/  [name='amc-calendar-events']
```

---

## ✅ Final Checklist

- [ ] `generate_amc_events.html` file kholi
- [ ] Login token paste kiya
- [ ] "Generate Services" button dabaya
- [ ] Success message dikha
- [ ] Frontend hard refresh kiya (Ctrl+Shift+R)
- [ ] Calendar tab khola
- [ ] Events dikh rahe hain! 🎉

---

## 📁 Files Created

1. ✅ `generate_amc_events.html` - Browser-based tool
2. ✅ `GENERATE_AMC_CALENDAR_EVENTS.md` - Detailed instructions
3. ✅ `AMC_CALENDAR_EMPTY_FIX.md` - This file

---

**Sabse aasaan tarika:** HTML file kholo aur button dabao! 🚀

**Date:** August 24, 2026  
**Issue:** Calendar empty (no service visits generated)  
**Fix:** Generate service visits using HTML tool or API calls

