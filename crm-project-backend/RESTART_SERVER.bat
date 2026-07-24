@echo off
echo Restarting Django Server...
echo.
echo Press Ctrl+C to stop current server, then run this script again
echo.
cd /d "C:\Users\OWNER\Desktop\nnit\nnit\crm-project-backend"
env\Scripts\python.exe manage.py runserver
