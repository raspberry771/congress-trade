@echo off
setlocal
REM Incremental update (append newest publish day(s) if any)
call .venv\Scripts\python -Xutf8 scraper.py

echo.
echo Finished. Check data\trades_master.xlsx and data\trades_new_since_last_run.xlsx
pause
