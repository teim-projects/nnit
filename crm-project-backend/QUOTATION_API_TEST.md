# 🧪 Quotation API Testing Guide

## ✅ Fixed Issues

1. **Customer Endpoint:** Now returns ALL customers (not just those with quotations)
2. **Product Endpoint:** NEW endpoint added for parking products
3. **Proper Imports:** Fixed class-level imports that were causing issues

---

## 📍 Available Endpoints

### 1. **Get All Customers**
```
GET /quotation/customer/
```

**Response Example:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "contact_number": "9876543210",
    "email": "john@example.com",
    "address": "Mumbai",
    "total_leads": 5,
    "active_leads": 2
  }
]
```

**Search Customers:**
```
GET /quotation/customer/?search=john
```

---

### 2. **Get All Products**
```
GET /quotation/products/
```

**Response Example:**
```json
[
  {
    "id": 1,
    "product_name": "4 Post Parking System",
    "product_code": "PP-4POST",
    "category": 1,
    "category_name": "Multi Level",
    "car_capacity": 8,
    "base_price": "500000.00",
    "is_active": true
  }
]
```

**Search Products:**
```
GET /quotation/products/?search=4post
```

**Filter by Category:**
```
GET /quotation/products/?category=1
```

---

### 3. **Create Simple Quotation**
```
POST /quotation/simple-quotation/
```

**Request Body:**
```json
{
  "customer": 1,
  "parking_product_id": 1,
  "quantity": 2,
  "unit_price": "500000.00",
  "gst_percent": 18
}
```

**Response:**
```json
{
  "id": 123,
  "quotation_no": "KA/4PO/26/07123"
}
```

---

## 🔑 Authentication

All endpoints require JWT authentication:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🧪 Testing Steps

### Step 1: Get JWT Token
```bash
POST http://127.0.0.1:8000/auth/login/
Content-Type: application/json

{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

### Step 2: Test Customer Endpoint
```bash
GET http://127.0.0.1:8000/quotation/customer/
Authorization: Bearer YOUR_JWT_TOKEN
```

### Step 3: Test Products Endpoint
```bash
GET http://127.0.0.1:8000/quotation/products/
Authorization: Bearer YOUR_JWT_TOKEN
```

### Step 4: Create Quotation
```bash
POST http://127.0.0.1:8000/quotation/simple-quotation/
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "customer": 1,
  "parking_product_id": 1,
  "quantity": 1,
  "unit_price": "999999999.99",
  "gst_percent": 18
}
```

---

## ✅ Expected Results

1. ✅ `/quotation/customer/` - Should return list of ALL customers
2. ✅ `/quotation/products/` - Should return list of active parking products
3. ✅ Both endpoints support search
4. ✅ Products can be filtered by category
5. ✅ Large unit_price values (up to 999,999,999.99) are now supported

---

## 🐛 Troubleshooting

### Issue: Empty Customer List
**Solution:** Check if customers exist in database
```bash
python manage.py shell
>>> from lead_management.models import Customer
>>> Customer.objects.count()
```

### Issue: Empty Product List
**Solution:** Check if active products exist
```bash
python manage.py shell
>>> from parking_products.models import ParkingProduct
>>> ParkingProduct.objects.filter(is_active=True).count()
```

### Issue: Authentication Error
**Solution:** Get fresh JWT token using login endpoint

---

## 📊 Database Check Commands

```python
# Check Customers
from lead_management.models import Customer
print(f"Total Customers: {Customer.objects.count()}")
for c in Customer.objects.all()[:5]:
    print(f"  - {c.id}: {c.name} ({c.contact_number})")

# Check Products
from parking_products.models import ParkingProduct
print(f"Total Products: {ParkingProduct.objects.count()}")
print(f"Active Products: {ParkingProduct.objects.filter(is_active=True).count()}")
for p in ParkingProduct.objects.filter(is_active=True)[:5]:
    print(f"  - {p.id}: {p.product_name}")
```

---

## 🎯 Summary

**Before Fix:**
- ❌ Only customers with existing quotations were shown
- ❌ No product endpoint available
- ❌ unit_price limited to 99,999,999.99

**After Fix:**
- ✅ ALL customers are shown
- ✅ New `/quotation/products/` endpoint available
- ✅ unit_price supports up to 999,999,999,999.99
- ✅ Search and filter capabilities added
- ✅ Proper imports and clean code structure
