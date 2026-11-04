@echo off
echo ========================================
echo   AMC CALENDAR FIX - RESTART SERVER
echo ========================================
echo.
echo Stopping any running Django servers...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Starting Django development server...
cd crm-project-backend
start cmd /k "python manage.py runserver"
echo.
echo Server restarting...
echo.
echo ========================================
echo   NEXT STEPS:
echo ========================================
echo 1. Wait for server to start (check the new window)
echo 2. Go to your browser
echo 3. Hard refresh (Ctrl+Shift+R)
echo 4. Navigate to AMC -^> Calendar tab
echo 5. You should now see events on the calendar!
echo ========================================
echo.
pause
