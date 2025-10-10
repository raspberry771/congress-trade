# scraper.py
# Scrape last N (default 14) published days from CapitolTrades, with robust
# "Today / Yesterday" handling and safe paging (no early stop if a row
# couldn't be parsed yet). Appends new rows to data/trades_master.csv and
# writes a fresh window to data/trades_last_{N}_days.(csv|xlsx)

import os
import re
import csv
import time
from datetime import date, timedelta
from typing import Optional, Tuple, List, Dict

import requests
from bs4 import BeautifulSoup, Tag
from dateutil import parser as dtparse
import pandas as pd

BASE = "https://www.capitoltrades.com"
LIST_URL = f"{BASE}/trades?page={{page}}"

# ---------------- Config ----------------
WINDOW_DAYS = int(os.getenv("WINDOW_DAYS", "14"))          # pull today .. today-(N-1)
PAGES_TO_SCAN_MAX = int(os.getenv("PAGES_TO_SCAN_MAX", "80"))
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "15"))
REQUEST_DELAY_S = float(os.getenv("REQUEST_DELAY_S", "0.7"))
DATA_DIR = os.getenv("DATA_DIR", "data")

MASTER_CSV = os.path.join(DATA_DIR, "trades_master.csv")
OUT_CSV = os.path.join(DATA_DIR, f"trades_last_{WINDOW_DAYS}_days.csv")
OUT_XLSX = os.path.join(DATA_DIR, f"trades_last_{WINDOW_DAYS}_days.xlsx")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    )
}

# Month names used on the site
MONTHS = r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|" \
         r"January|February|March|April|June|July|August|September|October|November|December)"

# Date tokens we accept after we normalize Today/Yesterday
DATE_PAT = re.compile(
    rf"\b(?:\d{{4}}-\d{{2}}-\d{{2}}|"                   # ISO 2025-08-11
    rf"\d{{1,2}}\s+{MONTHS}\s+\d{{4}}|"                 # 11 Aug 2025  /  7 August 2025
    rf"{MONTHS}\s+\d{{1,2}},?\s+\d{{4}})\b",            # August 7, 2025
    re.I,
)

TICKER_RE = re.compile(r"\b[A-Z0-9.\-]{1,12}:[A-Z]{2,4}\b")
DETAIL_RE = re.compile(r"^/trades/(\d+)$", re.I)

def ensure_dirs():
    os.makedirs(DATA_DIR, exist_ok=True)

def fetch_soup(url: str) -> BeautifulSoup:
    r = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    r.raise_for_status()
    return BeautifulSoup(r.text, "lxml")

def textbits(tag: Tag) -> List[str]:
    return [t.strip() for t in tag.stripped_strings if t and t.strip()]

def find_row_containers(soup: BeautifulSoup) -> List[Tuple[Tag, str]]:
    """
    Find clickable trade rows and their trade IDs.
    """
    rows = []
    for a in soup.find_all("a", href=True):
        m = DETAIL_RE.match(a["href"])
        if not m:
            continue
        # climb to a row-like container
        c = a
        for _ in range(6):
            if not c or not isinstance(c, Tag):
                break
            if c.name in ("tr", "li", "article"):
                break
            if c.has_attr("role") and "row" in (c.get("role") or ""):
                break
            c = c.parent
        if c and isinstance(c, Tag):
            rows.append((c, m.group(1)))

    # de-dupe by trade id
    seen, out = set(), []
    for c, tid in rows:
        if tid not in seen:
            seen.add(tid)
            out.append((c, tid))
    return out

# ---------- Robust date parsing ----------

def normalize_relative_dates(s: str, today: date) -> str:
    """
    Replace 'Today' / 'Yesterday' (any case, any position) with concrete yyyy-mm-dd.
    Works whether it's '06:05 Today' or just 'Today'.
    """
    today_str = today.isoformat()
    yday_str = (today - timedelta(days=1)).isoformat()
    s = re.sub(r"\bToday\b", today_str, s, flags=re.I)
    s = re.sub(r"\bYesterday\b", yday_str, s, flags=re.I)
    return s

def pick_two_dates_in_order(s: str) -> Tuple[Optional[date], Optional[date]]:
    """
    From a normalized row string, pick the first two date-like tokens.
    Interpret 1st as PUBLISHED, 2nd as TRADED (matches table order).
    """
    matches = list(DATE_PAT.finditer(s))
    d1 = dtparse.parse(matches[0].group(0), dayfirst=False).date() if len(matches) >= 1 else None
    d2 = dtparse.parse(matches[1].group(0), dayfirst=False).date() if len(matches) >= 2 else None
    return d1, d2

def compute_lag(published: Optional[date], traded: Optional[date]) -> Optional[int]:
    if published and traded:
        lag = (published - traded).days
        return max(lag, 0)
    return None

# ---------- Field extraction ----------

def pick_politician(container: Tag) -> str:
    for a in container.find_all("a", href=True):
        h = a["href"]
        if h.startswith("/politician") or h.startswith("/politicians"):
            nm = a.get_text(strip=True)
            if nm and nm.lower() not in ("politician", "politicians"):
                return nm
    # fallback: choose the longest text fragment
    bits = textbits(container)
    return max(bits, key=len, default="")

def pick_ticker(container: Tag) -> str:
    for s in textbits(container):
        m = TICKER_RE.search(s)
        if m:
            return m.group(0)
    return ""

def parse_type_size_price(container: Tag) -> Tuple[str, str, str]:
    txt = " ".join(textbits(container))
    ttype = "SELL" if "SELL" in txt.upper() else ("BUY" if "BUY" in txt.upper() else "")
    # size like 1K-15K, 15K-50K etc (with dashes that can be en/em)
    m_size = re.search(r"\b\d+\s*[KMB]?\s*[-–—]\s*\d+\s*[KMB]?\b", txt, re.I)
    size = m_size.group(0).replace("–", "-").replace("—", "-").replace(" ", "") if m_size else ""
    # price like $123.45 or N/A
    m_price = re.search(r"\$(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?|\bN/?A\b", txt, re.I)
    price = (m_price.group(0).upper().replace("N/A", "N/A") if m_price else "")
    return ttype, size, price

def extract_row(container: Tag, tid: str, today: date) -> Optional[Dict]:
    """
    Try to extract a single trade row.
    If we cannot get a publish date after normalization, return None (row unusable).
    """
    pol = pick_politician(container)
    ticker = pick_ticker(container)
    typ, size, price = parse_type_size_price(container)

    raw = " ".join(textbits(container))
    norm = normalize_relative_dates(raw, today)
    published, traded = pick_two_dates_in_order(norm)

    if not published:
        # Without a publish date we cannot window the row reliably.
        return None

    lag = compute_lag(published, traded)

    return {
        "trade_id": f"ct_{tid}",
        "politician": pol,
        "ticker": ticker,
        "published": published.isoformat(),
        "traded": traded.isoformat() if traded else "",
        "filed_after_days": lag if lag is not None else "",
        "type": typ,
        "size": size,
        "price": price,
    }

# ---------- Master + window writers ----------

COLS = ["trade_id","politician","ticker","published","traded","filed_after_days","type","size","price"]

def load_master_ids(path: str) -> set:
    ids = set()
    if os.path.exists(path):
        try:
            df = pd.read_csv(path, dtype=str)
            ids.update(df["trade_id"].dropna().tolist())
        except Exception:
            pass
    return ids

def append_master(path: str, rows: List[Dict]):
    new_file = not os.path.exists(path)
    with open(path, "a", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=COLS)
        if new_file:
            w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in COLS})

def write_window(rows: List[Dict], path_csv: str, path_xlsx: str):
    if not rows:
        print("[OK] No rows in window.")
        return
    df = pd.DataFrame(rows, columns=COLS)
    df["filed_after_days"] = pd.to_numeric(df["filed_after_days"], errors="coerce").astype("Int64")
    # sort newest published first (stable)
    df["published"] = pd.to_datetime(df["published"], errors="coerce")
    df.sort_values(["published", "trade_id"], ascending=[False, False], inplace=True)
    df.to_csv(path_csv, index=False, encoding="utf-8-sig")
    df.to_excel(path_xlsx, index=False)
    print(f"[OK] Window wrote {len(df)} rows -> {path_csv} + {path_xlsx}")

# ---------- Main scraper ----------

def main():
    ensure_dirs()

    today = date.today()
    cutoff = today - timedelta(days=WINDOW_DAYS - 1)   # inclusive window

    print(f"[INFO] Target window: {cutoff} .. {today}")

    all_rows: List[Dict] = []

    for p in range(1, PAGES_TO_SCAN_MAX + 1):
        url = LIST_URL.format(page=p)
        try:
            soup = fetch_soup(url)
        except Exception as e:
            print(f"[WARN] fetch page {p} failed: {e}")
            break

        rows = find_row_containers(soup)
        if not rows:
            print(f"[WARN] page {p} had no rows; stopping.")
            break

        page_kept = []
        all_definitely_older = True   # only true if EVERY row has publish and is < cutoff
        for container, tid in rows:
            rec = extract_row(container, tid, today)
            if rec is None:
                # Unknown publish date — we cannot conclude "all older", so keep scanning
                all_definitely_older = False
                continue

            pub_d = dtparse.parse(rec["published"]).date()

            # If any row is within the window, page is NOT all older
            if pub_d >= cutoff:
                all_definitely_older = False
                page_kept.append(rec)

        all_rows.extend(page_kept)

        # If every parsed row on this page was older than cutoff, and there were no unknowns,
        # we can safely stop (later pages will be even older).
        if all_definitely_older:
            print(f"[INFO] page {p}: all rows older than {cutoff}. stopping.")
            break

        time.sleep(REQUEST_DELAY_S)

    if not all_rows:
        print("[OK] No rows gathered in window.")
        return

    # Remove dups within this run
    seen, deduped = set(), []
    for r in all_rows:
        if r["trade_id"] in seen:
            continue
        seen.add(r["trade_id"])
        deduped.append(r)

    # Append to master only NEW ids
    existing = load_master_ids(MASTER_CSV)
    new_for_master = [r for r in deduped if r["trade_id"] not in existing]
    if new_for_master:
        append_master(MASTER_CSV, new_for_master)
        print(f"[OK] Appended {len(new_for_master)} new rows -> {MASTER_CSV}")
    else:
        print("[OK] Master up-to-date; no new rows.")

    # Always write a fresh window file (csv + xlsx)
    write_window(deduped, OUT_CSV, OUT_XLSX)

if __name__ == "__main__":
    main()
