NEW: Last N Days Window (default 14)

What it does
- Collects all trades with **Published date within the last N days** (default 14).
- Uses the **visible** dates from the list rows.
- Computes **filed_after_days = Published − Traded** (never negative).
- Stops paging when it reaches items older than the cutoff.
- Saves:
  - data\trades_last_14_days.csv  (UTF-8 BOM)
  - data\trades_last_14_days.xlsx
  - data\trades_master.csv (append-only, deduped)

How to change the window
- To use a different window, set an environment variable before running, e.g.:
  WINDOW_DAYS=7

How to run
1) Double-click RUN_ONCE.bat (first time).
2) Next runs: double-click RUN_SCRAPER.bat.
3) Open data\trades_last_14_days.xlsx.
