# Live Server Update Checklist

## ✅ Code Push Complete
- Branch: `bharat-new2`
- Latest commit: `d723815`
- Changes: Terms & Conditions styling updated

## 🔄 Now Update Live Server

### Step 1: SSH to Live Server
```bash
ssh your-username@your-server-ip
# OR use your hosting panel's SSH terminal
```

### Step 2: Navigate to Project
```bash
cd /home/your-username/nnit
# OR wherever your project is deployed
```

### Step 3: Pull Latest Code
```bash
git fetch origin
git checkout bharat-new2
git pull origin bharat-new2
```

### Step 4: Check if Templates Updated
```bash
# Verify the changes are there
cat crm-project-backend/templates/pdf/quotation.html | grep "font-size: 15px"
# Should show multiple matches
```

### Step 5: Clear All Caches
```bash
cd crm-project-backend

# Clear Python bytecode
find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null
find . -name "*.pyc" -delete

# Clear Django cache (if using file cache)
python manage.py shell -c "from django.core.cache import cache; cache.clear(); print('Cache cleared')"
```

### Step 6: Restart Application Server

**For Gunicorn:**
```bash
sudo systemctl restart gunicorn
sudo systemctl status gunicorn
```

**For uWSGI:**
```bash
sudo systemctl restart uwsgi
sudo systemctl status uwsgi
```

**For Apache with mod_wsgi:**
```bash
sudo systemctl restart apache2
sudo systemctl status apache2
```

**For PM2 (if using):**
```bash
pm2 restart all
pm2 status
```

**For Manual Django runserver:**
```bash
pkill -f "python manage.py runserver"
nohup python manage.py runserver 0.0.0.0:8000 &
```

### Step 7: Verify Changes Live
1. Go to your live website
2. Generate a new quotation PDF
3. Check Terms & Conditions font size (should be 15px, not 12px)
4. Check spacing between terms (should be 15px margins)

## 🐛 If Still Not Working

### Option A: Force Template Reload
```bash
cd crm-project-backend
python force_template_reload.py
sudo systemctl restart gunicorn  # or your server
```

### Option B: Check Django Settings
```bash
python manage.py shell
```
```python
from django.conf import settings
print(settings.DEBUG)  # Should be False for production
print(settings.TEMPLATES[0]['OPTIONS'].get('loaders'))
# If cached loader is there, restart is needed
```

### Option C: Hard Restart Everything
```bash
# Kill all Python processes
pkill -9 python

# Restart server
sudo systemctl restart gunicorn
sudo systemctl restart nginx  # if using nginx
```

## 📝 Common Issues

1. **Git pull fails**: Check if you have uncommitted changes on server
   ```bash
   git stash
   git pull origin bharat-new2
   git stash pop
   ```

2. **Permission denied**: Use sudo or check file ownership
   ```bash
   sudo chown -R your-user:your-user /path/to/project
   ```

3. **Wrong branch on server**: 
   ```bash
   git branch  # Check current branch
   git checkout bharat-new2
   ```

4. **Changes not reflecting**: Check if correct settings file
   ```bash
   echo $DJANGO_SETTINGS_MODULE
   # Should show: krishna_air.settings.prod (or your production settings)
   ```

## 🎯 Quick Commands (Copy-Paste)

```bash
# One-liner to update everything
cd /path/to/nnit && git pull origin bharat-new2 && find . -name "*.pyc" -delete && python crm-project-backend/manage.py shell -c "from django.core.cache import cache; cache.clear()" && sudo systemctl restart gunicorn && echo "✅ Update complete!"
```

## Contact for Deployment Help
- If hosted on **Heroku**: `git push heroku bharat-new2:main`
- If hosted on **Vercel/Netlify**: Push will auto-deploy
- If hosted on **AWS/DigitalOcean**: Follow SSH steps above
