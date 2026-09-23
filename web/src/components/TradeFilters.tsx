"use client";

import { useMemo, useState } from "react";
import type { Trade } from "@/lib/types";
import { TradeTable } from "./TradeTable";

export function TradeFilters({
  trades,
  showMember = false,
}: {
  trades: Trade[];
  showMember?: boolean;
}) {
  const [side, setSide] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [ticker, setTicker] = useState("");
  const [size, setSize] = useState("ALL");
  const [stockOnly, setStockOnly] = useState(false);
  const [minLag, setMinLag] = useState("");
  const [q, setQ] = useState("");

  const sizes = useMemo(() => {
    return [...new Set(trades.map((t) => t.size).filter(Boolean))].sort();
  }, [trades]);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (side !== "ALL" && t.type !== side) return false;
      if (stockOnly && !t.isEquity) return false;
      if (size !== "ALL" && t.size !== size) return false;
      if (ticker) {
        const needle = ticker.toLowerCase();
        if (
          !t.symbol.toLowerCase().includes(needle) &&
          !t.ticker.toLowerCase().includes(needle)
        ) {
          return false;
        }
      }
      if (minLag && t.filedAfterDays < Number(minLag)) return false;
      if (q) {
        const hay = `${t.politician} ${t.ticker} ${t.tradeId}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [trades, side, stockOnly, size, ticker, minLag, q]);

  return (
    <div>
      <div className="filters">
        <input
          placeholder="Filter text / trade id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Filter trades"
        />
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as "ALL" | "BUY" | "SELL")}
          aria-label="Side"
        >
          <option value="ALL">All sides</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
        <input
          placeholder="Ticker"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          aria-label="Ticker filter"
        />
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          aria-label="Size band"
        >
          <option value="ALL">All sizes</option>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          placeholder="Min lag (days)"
          value={minLag}
          onChange={(e) => setMinLag(e.target.value)}
          aria-label="Minimum lag days"
          style={{ width: "8.5rem" }}
        />
        <label className="toggle">
          <input
            type="checkbox"
            checked={stockOnly}
            onChange={(e) => setStockOnly(e.target.checked)}
          />
          Stock-only
        </label>
      </div>
      <p className="muted" style={{ marginBottom: "0.65rem" }}>
        Showing {filtered.length} of {trades.length}
      </p>
      <TradeTable trades={filtered} showMember={showMember} />
    </div>
  );
}
