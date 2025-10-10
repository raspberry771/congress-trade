@echo off
setlocal
REM Create venv + install deps, then seed the master (script auto-detects seeding)
if not exist .venv (
  py -m venv .venv
)
call .venv\Scripts\pip install --upgrade pip >nul
call .venv\Scripts\pip install -r requirements.txt

echo.
echo [1/1] Seeding master (last 14 days)...
call .venv\Scripts\python -Xutf8 scraper.py

echo.
echo Done. Check the data\ folder for trades_master.xlsx
pause
