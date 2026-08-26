# AMC Calendar Events Generate Karne Ka Tarika

## ❌ Problem
Calendar empty hai kyunki AMC contracts ke liye **service visits generate nahi hui hain**.

## ✅ Solution - 2 Methods

### METHOD 1: API Se (Recommended - Sabse Aasaan)

#### Step 1: Login karke Token lo
Frontend mein login karo, ya Postman se:
```
POST http://localhost:8000/auth/login/
Body: {
  "username": "your_username",
  "password": "your_password"
}

Response mein token milega
```

#### Step 2: Har AMC contract ke liye services generate karo

**AMC-001 ke liye:**
```bash
POST http://localhost:8000/amc/contracts/1/generate-schedule/
Headers:
  Authorization: Bearer YOUR_TOKEN
```

**AMC-002 ke liye:**
```bash
POST http://localhost:8000/amc/contracts/2/generate-schedule/
```

**AMC-003 ke liye:**
```bash
POST http://localhost:8000/amc/contracts/3/generate-schedule/
```

... aur baaki contracts ke liye bhi

#### Step 3: Frontend refresh karo
```
Ctrl + Shift + R (hard refresh)
```

Ab calendar mein events dikhenge!

---

### METHOD 2: Django Admin Se

#### Step 1: Admin panel mein jao
```
http://localhost:8000/admin/
```

#### Step 2: Service Management → Service Requests

#### Step 3: Manually service requests add karo with:
- AMC Contract: Select contract
- Scheduled Date: Date enter karo
- Customer: Select customer  
- Product Name: Enter product
- Service Type: Select "AMC"

---

### METHOD 3: Django Shell Se (Advanced)

```bash
cd crm-project-backend
python manage.py shell
```

```python
from amc.models import AMCContract

# Sabhi contracts ko load karo
amcs = AMCContract.objects.all()

# Har contract ke liye services generate karo
for amc in amcs:
    services = amc.generate_schedule()
    print(f"{amc.contract_id}: Generated {len(services)} services")
```

```python
exit()
```

---

## 🎯 Quick Solution - Postman/Thunder Client

Agar Postman ya VS Code mein Thunder Client hai:

### 1. Login Request:
```
POST http://localhost:8000/auth/login/
Body (JSON):
{
  "username": "admin",
  "password": "your_password"
}
```

Copy the `access` token from response.

### 2. Generate Services for Each AMC:

```
POST http://localhost:8000/amc/contracts/1/generate-schedule/
Header: Authorization: Bearer <paste_token_here>

POST http://localhost:8000/amc/contracts/2/generate-schedule/
Header: Authorization: Bearer <paste_token_here>

POST http://localhost:8000/amc/contracts/3/generate-schedule/
Header: Authorization: Bearer <paste_token_here>

POST http://localhost:8000/amc/contracts/4/generate-schedule/
Header: Authorization: Bearer <paste_token_here>

POST http://localhost:8000/amc/contracts/5/generate-schedule/
Header: Authorization: Bearer <paste_token_here>

POST http://localhost:8000/amc/contracts/6/generate-schedule/
Header: Authorization: Bearer <paste_token_here>
```

### 3. Verify:
```
GET http://localhost:8000/amc/calendar-events/
Header: Authorization: Bearer <paste_token_here>
```

Isse tumhe JSON response milega with all calendar events!

---

## ✅ Expected Result

Har AMC contract ke liye services generate hone ke baad:

**Monthly frequency** → 12 visits  
**Quarterly frequency** → 4 visits  
**Half-yearly frequency** → 2 visits  
**Annual frequency** → 1 visit

Calendar mein yeh events dikhenge:
- 🔵 **Blue** - Scheduled Service  
- 🟢 **Green** - Service Visit (allocated)  
- 🔴 **Red** - Contract Expiry  
- 🟠 **Amber** - Renewal Due

---

## 🐛 Troubleshooting

### Calendar abhi bhi empty hai?

1. **Check backend console** - koi error to nahi?
2. **Check browser console (F12)** - API call 200 status de rahi hai?
3. **Verify token** - Login token valid hai?
4. **Hard refresh** - Ctrl+Shift+R karo

### API se error aa rahi hai?

Check:
- Server chal rahi hai? (`python manage.py runserver`)
- URL sahi hai? (`/amc/contracts/{id}/generate-schedule/`)
- Token header mein hai? (`Authorization: Bearer TOKEN`)

---

**Sabse aasaan tarika:** Frontend se AMC contract detail mein jao aur "Generate Schedule" button dabao (agar hai to)!

