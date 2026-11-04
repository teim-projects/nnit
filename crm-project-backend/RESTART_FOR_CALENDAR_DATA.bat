@echo off
echo ================================================================================
echo AMC CALENDAR - RESTARTING SERVER WITH NEW DATA
echo ================================================================================
echo.
echo Stop karo running server (Ctrl+C) aur fir yeh script chalao
echo.
pause
echo.
echo Starting Django server...
echo.
python manage.py runserver
