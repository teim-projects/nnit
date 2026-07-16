# Parking Products Backend Setup Guide

## Status: Frontend Integration Complete ✅

The Parking Products module has been fully integrated into the frontend. Now you need to complete the backend setup.

---

## ✅ Completed

### Frontend Integration
- ✅ Added "Parking Products" menu item to Sidebar with parking icon (P letter icon)
- ✅ Added `/parking-products` route to App.jsx
- ✅ Imported ParkingProducts page component
- ✅ Created ParkingProducts page with category cards and product catalog
- ✅ Created AddCategoryModal component
- ✅ Created AddProductForm component (full-page form)
- ✅ Fixed all Tailwind CSS deprecation warnings (`flex-shrink-0` → `shrink-0`)

### Backend Structure
- ✅ Django app `parking_products/` created with:
  - Models: ProductCategory, ParkingProduct, ProductConfiguration
  - Serializers with recommendation logic
  - ViewSets with smart recommendation endpoint
  - Admin interface
  - URL routing

---

## 🔧 Manual Backend Setup Required

### Step 1: Register the App in Django Settings

Edit: `crm-project-backend/krishna_air/settings.py`

Find the `INSTALLED_APPS` list and add:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # ... your existing apps ...
    'api',
    'lead_management',
    'amc',
    # ... other apps ...
    
    # Add this line:
    'parking_products',
]
```

### Step 2: Add URL Routing

Edit: `crm-project-backend/krishna_air/urls.py`

Add the parking products URL pattern:

```python
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('api.urls')),
    path('api/leads/', include('lead_management.urls')),
    path('api/amc/', include('amc.urls')),
    # ... other URL patterns ...
    
    # Add this line:
    path('api/parking/', include('parking_products.urls')),
]
```

### Step 3: Run Database Migrations

Open terminal in `crm-project-backend/` and run:

```bash
# Create migrations for the new app
python manage.py makemigrations parking_products

# Apply migrations
python manage.py migrate parking_products

# Apply all pending migrations
python manage.py migrate
```

### Step 4: Create Initial Categories (Optional)

You can create initial categories through:

**Option A: Django Admin**
1. Start server: `python manage.py runserver`
2. Go to: http://127.0.0.1:8000/admin/
3. Navigate to "Parking Products" → "Product Categories"
4. Add categories: Stack Parking, Puzzle Parking, Tower Parking, Pit Parking, Cantilever

**Option B: API (Frontend)**
1. Start Django server: `python manage.py runserver`
2. Start React server: `npm run dev` (in crm-project-frontend/)
3. Login and navigate to: http://localhost:5173/parking-products
4. Click "Add Category" button to create categories

### Step 5: Verify Installation

Test the API endpoints:

```bash
# Get categories
curl http://127.0.0.1:8000/api/parking/categories/

# Get products
curl http://127.0.0.1:8000/api/parking/products/
```

---

## 📋 API Endpoints

Once setup is complete, these endpoints will be available:

### Categories
- `GET /api/parking/categories/` - List all categories
- `POST /api/parking/categories/` - Create category
- `GET /api/parking/categories/{id}/` - Get category details
- `PUT /api/parking/categories/{id}/` - Update category
- `DELETE /api/parking/categories/{id}/` - Delete category

### Products
- `GET /api/parking/products/` - List all products
- `POST /api/parking/products/` - Create product
- `GET /api/parking/products/{id}/` - Get product details
- `PUT /api/parking/products/{id}/` - Update product
- `DELETE /api/parking/products/{id}/` - Delete product
- `POST /api/parking/products/recommend/` - Smart product recommendation

### Recommendation Endpoint
```json
POST /api/parking/products/recommend/
{
  "car_capacity": 20,
  "site_length": 10.0,
  "site_width": 5.0,
  "site_height": 8.0,
  "budget": 5000000,
  "pit_possible": true
}
```

---

## 🎨 Frontend Features

### Pages Integrated
1. **Parking Products Main Page** (`/parking-products`)
   - Category overview cards with product counts
   - Product catalog table with all specifications
   - Add Category and Add Product buttons

2. **Add Category Modal**
   - Select from predefined categories (Stack, Puzzle, Tower, Pit, Cantilever)
   - Category icons and descriptions
   - Validates required fields

3. **Add/Edit Product Form** (Full-page)
   - Product name and category
   - Levels, capacity, and load specifications
   - Operation type (Hydraulic/Mechanical)
   - Automation type (Fully Automatic/Semi/Manual)
   - Pit requirement
   - Minimum site dimensions (Length × Width × Height)
   - Base price
   - Edit existing products

---

## 🔮 Next Phase: Recommendation Screen

After backend setup is complete, the next feature to build is:

### Recommendation Screen
- Smart product recommendation based on site requirements
- Input: Number of cars, site dimensions, budget, pit availability
- Output: Ranked product suggestions with match scores
- Product comparison cards
- "Select" button for each recommendation

This will use the `/api/parking/products/recommend/` endpoint that's already built in the backend.

---

## 📂 File Structure

### Frontend Files
```
crm-project-frontend/
├── src/
│   ├── App.jsx                                    # ✅ Updated (route added)
│   ├── components/
│   │   ├── Sidebar.jsx                            # ✅ Updated (menu item added)
│   │   └── parking-products/
│   │       ├── AddCategoryModal.jsx               # ✅ Created
│   │       └── AddProductForm.jsx                 # ✅ Created
│   └── pages/
│       └── ParkingProducts.jsx                    # ✅ Created
```

### Backend Files
```
crm-project-backend/
└── parking_products/                              # ✅ Created
    ├── __init__.py
    ├── admin.py                                   # ✅ Admin interface configured
    ├── apps.py
    ├── models.py                                  # ✅ Models defined
    ├── serializers.py                             # ✅ Serializers with logic
    ├── urls.py                                    # ✅ URL routing
    ├── views.py                                   # ✅ ViewSets & recommendation
    └── migrations/                                # ⏳ Needs to be generated
```

---

## ⚠️ Important Notes

1. **Token Authentication**: The frontend is configured to use Bearer token authentication from localStorage
2. **CORS**: Ensure CORS is properly configured in Django settings for frontend communication
3. **Permissions**: Add appropriate DRF permissions to views if needed
4. **Data Validation**: Backend models have comprehensive validation built-in

---

## 🚀 Quick Start Commands

```bash
# In crm-project-backend/ directory
python manage.py makemigrations parking_products
python manage.py migrate
python manage.py runserver

# In crm-project-frontend/ directory
npm run dev

# Access the application
# Login → Navigate to "Parking Products" in sidebar
```

---

## Summary

✅ **Frontend is 100% ready** - All UI components are built and integrated
⏳ **Backend needs 3 manual steps**:
   1. Add to INSTALLED_APPS
   2. Add URL routing
   3. Run migrations

Once these 3 steps are done, the full Parking Products module will be operational!
