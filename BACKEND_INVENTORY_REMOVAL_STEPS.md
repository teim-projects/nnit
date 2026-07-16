# 🗑️ BACKEND INVENTORY REMOVAL - Complete Steps

## ✅ FRONTEND CLEANUP DONE:
1. ✅ Removed from Sidebar
2. ✅ Removed import from App.jsx
3. ✅ Removed route from App.jsx
4. ✅ Deleted `src/pages/Inventory.jsx`
5. ✅ Deleted `src/components/inventory/` folder

---

## 🔧 BACKEND REMOVAL STEPS

### Step 1: Remove from Django Settings

**File:** `crm-project-backend/krishna_air/settings.py`

Find and **REMOVE or COMMENT OUT**:
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    # ... other apps ...
    'inventory',  # ❌ REMOVE THIS LINE
    # ... other apps ...
]
```

### Step 2: Remove from URLs

**File:** `crm-project-backend/krishna_air/urls.py`

Find and **REMOVE or COMMENT OUT**:
```python
urlpatterns = [
    # ... other patterns ...
    path('inventory/', include('inventory.urls')),  # ❌ REMOVE THIS LINE
    # ... other patterns ...
]
```

### Step 3: Remove Database Tables (IMPORTANT!)

Run these commands in order:

```bash
cd c:\Users\OWNER\Desktop\nnit\Reuse-crm\crm-project-backend

# Rollback all inventory migrations
python manage.py migrate inventory zero

# If above fails, try:
python manage.py migrate inventory 0001 --fake
python manage.py migrate inventory zero
```

### Step 4: Delete Inventory App Folder

**Option A: Via Command Line**
```bash
cd c:\Users\OWNER\Desktop\nnit\Reuse-crm\crm-project-backend
rmdir /s /q inventory
```

**Option B: Manually**
- Go to: `c:\Users\OWNER\Desktop\nnit\Reuse-crm\crm-project-backend\`
- Delete the `inventory` folder

### Step 5: Clean Up AMC Spare Parts (REQUIRED!)

The AMC module has references to inventory. We need to fix it.

**File to Update:** `crm-project-backend/amc/models.py`

Find the `AMCSparePart` model and **REMOVE** the inventory_item field:

```python
class AMCSparePart(models.Model):
    contract = models.ForeignKey(AMCContract, on_delete=models.CASCADE, related_name='spare_parts')
    # inventory_item = models.ForeignKey(...)  # ❌ REMOVE THIS
    
    # Keep these fields:
    part_name = models.CharField(max_length=200)
    quantity_used = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    # ... rest of fields
```

### Step 6: Create Migration for AMC Changes

```bash
cd c:\Users\OWNER\Desktop\nnit\Reuse-crm\crm-project-backend
python manage.py makemigrations amc
python manage.py migrate amc
```

### Step 7: Restart Django Server

```bash
# Stop the current server (Ctrl+C)
python manage.py runserver
```

---

## ⚠️ POTENTIAL ISSUES & FIXES

### Issue 1: Migration Errors

**Error:** "Table inventory_xxx doesn't exist"

**Fix:**
```bash
# Fake the migration rollback
python manage.py migrate inventory zero --fake

# Then manually drop tables in database (if needed)
```

### Issue 2: AMC Spare Parts Broken

**Error:** References to inventory_item

**Fix:**
1. Update AMC models (Step 5 above)
2. Create new migration
3. Update AMC serializers and views to remove inventory references

### Issue 3: Foreign Key Constraints

**Error:** Cannot drop table due to foreign keys

**Fix:**
```bash
# Drop foreign key constraints first
python manage.py dbshell

# In SQL console:
ALTER TABLE amc_sparepart DROP FOREIGN KEY <constraint_name>;
DROP TABLE inventory_inventory;
# ... drop other inventory tables
```

---

## 📋 VERIFICATION CHECKLIST

After removal, verify:

```bash
# 1. Check settings.py
# Should NOT contain 'inventory' in INSTALLED_APPS

# 2. Check URLs
# Should NOT have inventory/ path

# 3. Try to access inventory API (should fail)
curl http://127.0.0.1:8000/inventory/inventory/
# Expected: 404 Not Found

# 4. Check AMC still works
curl http://127.0.0.1:8000/amc/contracts/
# Expected: 200 OK

# 5. Check database
python manage.py dbshell
SHOW TABLES LIKE 'inventory%';
# Expected: Empty set (no inventory tables)
```

---

## 🔄 ALTERNATIVE: Simple Disable (If You Want to Keep Data)

Instead of complete removal, you can just disable:

**1. Comment out in settings.py:**
```python
# 'inventory',  # Disabled - not in use
```

**2. Comment out in urls.py:**
```python
# path('inventory/', include('inventory.urls')),  # Disabled
```

**3. Don't delete files/tables** - Just keep them inactive

**Benefit:** Easy to restore if needed later

---

## 🚀 QUICK COMMANDS (Copy-Paste)

```bash
# Navigate to backend
cd c:\Users\OWNER\Desktop\nnit\Reuse-crm\crm-project-backend

# Rollback migrations
python manage.py migrate inventory zero

# Delete folder
rmdir /s /q inventory

# Restart server
python manage.py runserver
```

---

## ✅ COMPLETED STEPS:

- [x] Frontend: Removed from Sidebar
- [x] Frontend: Removed from App.jsx routes
- [x] Frontend: Deleted Inventory.jsx
- [x] Frontend: Deleted inventory components folder
- [ ] Backend: Remove from settings.py
- [ ] Backend: Remove from urls.py
- [ ] Backend: Rollback migrations
- [ ] Backend: Delete inventory folder
- [ ] Backend: Fix AMC spare parts
- [ ] Backend: Test and verify

---

**IMPORTANT:** After backend changes, test thoroughly to ensure AMC module still works!
