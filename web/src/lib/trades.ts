import fs from "fs";
import path from "path";
import type { Trade } from "./types";

const CSV_PATH = path.join(process.cwd(), "data", "trades_master.csv");

/** Heuristic: treat blank, bond-like, and non SYMBOL:EX patterns as non-equity. */
export function isLikelyEquity(ticker: string): boolean {
  if (!ticker || !ticker.trim()) return false;
  const t = ticker.trim().toUpperCase();
  if (!t.includes(":")) return false;
  const [sym] = t.split(":");
  if (!sym || sym.length > 5) return false;
  if (/^(T-|UST|BILL|NOTE)/i.test(sym)) return false;
  return /^[A-Z]{1,5}(\.[A-Z])?$/.test(sym);
}

export function displayTicker(ticker: string): string {
  if (!ticker || !ticker.trim()) return "Unknown";
  return ticker.includes(":") ? ticker.split(":")[0] : ticker;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

let cached: Trade[] | null = null;

export function loadTrades(): Trade[] {
  if (cached) return cached;
  const raw = fs.readFileSync(/*turbopackIgnore: true*/ CSV_PATH, "utf8");
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

  const trades: Trade[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < header.length) continue;
    const ticker = (cols[idx.ticker] || "").trim();
    const typeRaw = (cols[idx.type] || "").trim().toUpperCase();
    const type = typeRaw === "BUY" || typeRaw === "SELL" ? typeRaw : "";
    const lag = Number(cols[idx.filed_after_days] || 0);
    trades.push({
      tradeId: cols[idx.trade_id] || "",
      politician: (cols[idx.politician] || "").replace(/\s+/g, " ").trim(),
      ticker,
      symbol: displayTicker(ticker),
      published: cols[idx.published] || "",
      traded: cols[idx.traded] || "",
      filedAfterDays: Number.isFinite(lag) ? lag : 0,
      type,
      size: cols[idx.size] || "",
      price: cols[idx.price] || "",
      isEquity: isLikelyEquity(ticker),
    });
  }

  cached = trades;
  return trades;
}

export function getDataAsOf(): string {
  const trades = loadTrades();
  const pubs = trades.map((t) => t.published).filter(Boolean).sort();
  return pubs.length ? pubs[pubs.length - 1] : "unknown";
}
