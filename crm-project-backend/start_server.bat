@echo off
echo Starting Django Backend Server...
cd /d "%~dp0"
python manage.py runserver 0.0.0.0:8000
pause
