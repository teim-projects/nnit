@echo off
echo ========================================
echo  CLEARING PYTHON CACHE FILES
echo ========================================
echo.

REM Delete all __pycache__ directories
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"

REM Delete all .pyc files
del /s /q *.pyc 2>nul

echo.
echo Cache cleared!
echo.
echo NOW:
echo 1. STOP the Django server (Ctrl+C)
echo 2. Run: python manage.py runserver
echo 3. Test again
echo.
echo ========================================
pause
