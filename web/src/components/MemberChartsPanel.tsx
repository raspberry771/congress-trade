"use client";

import { useMemo, useState } from "react";
import type { MemberStats, Trade } from "@/lib/types";
import { ActivityChart, SizeBandBars, TopIssuers } from "./charts/MemberCharts";

function computeClientStats(trades: Trade[], stockOnly: boolean): MemberStats {
  const filtered = stockOnly ? trades.filter((t) => t.isEquity) : trades;
  const buys = filtered.filter((t) => t.type === "BUY");
  const sells = filtered.filter((t) => t.type === "SELL");
  const issuers = new Set(
    filtered.map((t) => t.symbol).filter((s) => s && s !== "Unknown"),
  );

  const sizeBands: Record<string, number> = {};
  for (const t of filtered) {
    const key = t.size || "Unknown";
    sizeBands[key] = (sizeBands[key] || 0) + 1;
  }

  const issuerMap = new Map<
    string,
    { ticker: string; count: number; buys: number; sells: number }
  >();
  for (const t of filtered) {
    const key = t.symbol || "Unknown";
    const cur = issuerMap.get(key) || {
      ticker: key,
      count: 0,
      buys: 0,
      sells: 0,
    };
    cur.count += 1;
    if (t.type === "BUY") cur.buys += 1;
    if (t.type === "SELL") cur.sells += 1;
    issuerMap.set(key, cur);
  }

  const monthMap = new Map<string, { month: string; buys: number; sells: number }>();
  for (const t of filtered) {
    const d = t.traded || t.published;
    if (!d || d.length < 7) continue;
    const month = d.slice(0, 7);
    const cur = monthMap.get(month) || { month, buys: 0, sells: 0 };
    if (t.type === "BUY") cur.buys += 1;
    else if (t.type === "SELL") cur.sells += 1;
    monthMap.set(month, cur);
  }

  const lags = [...filtered.map((t) => t.filedAfterDays)].sort((a, b) => a - b);
  const medianLag = lags.length
    ? lags.length % 2
      ? lags[Math.floor(lags.length / 2)]
      : Math.round((lags[lags.length / 2 - 1] + lags[lags.length / 2]) / 2)
    : null;

  const tradedDates = filtered.map((t) => t.traded).filter(Boolean).sort();
  const publishedDates = filtered.map((t) => t.published).filter(Boolean).sort();

  return {
    tradeCount: filtered.length,
    buyCount: buys.length,
    sellCount: sells.length,
    uniqueIssuers: issuers.size,
    medianLag,
    lastTraded: tradedDates.at(-1) || null,
    lastPublished: publishedDates.at(-1) || null,
    sizeBands,
    topIssuers: [...issuerMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    activityByMonth: [...monthMap.values()].sort((a, b) =>
      a.month.localeCompare(b.month),
    ),
  };
}

export function MemberChartsPanel({ trades }: { trades: Trade[] }) {
  const [stockOnly, setStockOnly] = useState(false);
  const stats = useMemo(
    () => computeClientStats(trades, stockOnly),
    [trades, stockOnly],
  );

  return (
    <div className="stack">
      <div className="chartTitle">
        <h3 style={{ fontFamily: "var(--font-display)", margin: 0 }}>
          Horizon-neutral graphs
        </h3>
        <label className="toggle">
          <input
            type="checkbox"
            checked={stockOnly}
            onChange={(e) => setStockOnly(e.target.checked)}
          />
          Stock-only
        </label>
      </div>
      <div className="charts">
        <div className="panel">
          <div className="chartTitle">
            <h3>Buy / sell over time</h3>
          </div>
          <ActivityChart stats={stats} />
        </div>
        <div className="panel">
          <div className="chartTitle">
            <h3>Top issuers</h3>
          </div>
          <TopIssuers stats={stats} />
        </div>
      </div>
      <div className="panel">
        <div className="chartTitle">
          <h3>Size-band mix</h3>
        </div>
        <SizeBandBars stats={stats} />
      </div>
    </div>
  );
}
