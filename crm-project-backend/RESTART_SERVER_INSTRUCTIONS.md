# Django Server Restart Instructions

## Problem
The parking products URLs are not loading because Django server needs a COMPLETE restart.

## Solution

### Step 1: STOP the server completely

**Option A: Using Ctrl+C**
1. Go to the terminal where Django is running
2. Press `Ctrl + C` (hold Control key and press C)
3. Wait until you see the command prompt return

**Option B: Kill the process**
If Ctrl+C doesn't work:
```bash
# On Windows
taskkill /F /IM python.exe
```

**Option C: Close terminal**
- Close the entire terminal window
- Open a new one

### Step 2: Navigate to backend directory
```bash
cd C:\Users\OWNER\Desktop\nnit\Reuse-crm\crm-project-backend
```

### Step 3: Clear Python cache (important!)
```bash
# Delete all __pycache__ directories
for /d /r . %d in (__pycache__) do @if exist "%d" rd /s /q "%d"

# Or manually delete these folders:
# - parking_products/__pycache__
# - krishna_air/__pycache__
```

### Step 4: Restart Django
```bash
python manage.py runserver
```

### Step 5: Verify URLs are loaded

After server starts, you should see:
```
Starting development server at http://127.0.0.1:8000/
```

Now test in browser:
```
http://localhost:8000/parking/categories/
```

You should see a Django REST Framework page (NOT 404).

## If Still Getting 404

Run this command to check URL configuration:
```bash
python manage.py show_urls | findstr parking
```

If no "parking" URLs appear, there's an import error. Check:
1. Is `parking_products` in INSTALLED_APPS? (krishna_air/settings/base.py)
2. Is the path line correct in urls.py?
3. Are there any Python errors in parking_products module?

## Expected URL Pattern

After restart, the 404 debug page should show:
```
1. admin/
2. swagger...
...
14. amc/
15. parking/              <-- THIS SHOULD BE HERE
16. ^media/...
17. ^static/...
```

## Frontend Configuration

Frontend is already updated to use:
- `${BASE_API}/parking/categories/`
- `${BASE_API}/parking/products/`

Where BASE_API = `http://127.0.0.1:8000`

So full URLs are:
- http://127.0.0.1:8000/parking/categories/
- http://127.0.0.1:8000/parking/products/
