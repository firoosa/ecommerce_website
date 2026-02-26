@echo off
REM Run Django server with unbuffered output so you see logs immediately
set PYTHONUNBUFFERED=1
python manage.py runserver 8000
