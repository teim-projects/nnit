@echo off
echo Deleting old migration files...

del /Q quotation\migrations\0002_*.py 2>nul
del /Q invoice\migrations\0002_*.py 2>nul
del /Q amc\migrations\0003_*.py 2>nul

echo Done!
echo.
echo Now creating fresh migrations...
env\Scripts\python.exe manage.py makemigrations
echo.
echo Marking existing tables as migrated...
env\Scripts\python.exe manage.py migrate --fake
