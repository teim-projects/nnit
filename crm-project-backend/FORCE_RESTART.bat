@echo off
echo ============================================================
echo FORCE RESTARTING DJANGO SERVER
echo ============================================================

echo.
echo Step 1: Killing all Python processes...
taskkill /F /IM python.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Deleting Python cache files...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d" 2>nul
del /s /q *.pyc 2>nul

echo Step 3: Clearing Django cache...
if exist .django_cache rmdir /s /q .django_cache

echo.
echo ============================================================
echo CACHE CLEARED - Now restart Django manually:
echo.
echo    python manage.py runserver
echo.
echo ============================================================
pause
