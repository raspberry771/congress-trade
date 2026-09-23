import rosterJson from "@/data/roster.json";
import activityJson from "@/data/activity-seed.json";
import { loadTrades, displayTicker } from "./trades";
import { slugifyName } from "./slug";
import type { ActivityItem, Member, MemberStats, Trade } from "./types";

export { slugifyName };

const roster = rosterJson as Member[];
const activityBySlug = activityJson as Record<string, ActivityItem[]>;

export function getAllMembers(): Member[] {
  return roster;
}

export function getMemberBySlug(slug: string): Member | undefined {
  return roster.find((m) => m.slug === slug);
}

export function getMemberByName(name: string): Member | undefined {
  const normalized = name.replace(/\s+/g, " ").trim();
  return (
    roster.find((m) => m.name === normalized) ||
    roster.find((m) => slugifyName(m.name) === slugifyName(normalized))
  );
}

export function getMemberTrades(slug: string): Trade[] {
  const member = getMemberBySlug(slug);
  if (!member) return [];
  return loadTrades()
    .filter((t) => t.politician === member.name)
    .sort((a, b) => (a.published < b.published ? 1 : -1));
}

export function computeMemberStats(
  trades: Trade[],
  opts?: { stockOnly?: boolean },
): MemberStats {
  const filtered = opts?.stockOnly ? trades.filter((t) => t.isEquity) : trades;
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
  const topIssuers = [...issuerMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

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
  const activityByMonth = [...monthMap.values()].sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  const tradedDates = filtered.map((t) => t.traded).filter(Boolean).sort();
  const publishedDates = filtered
    .map((t) => t.published)
    .filter(Boolean)
    .sort();

  return {
    tradeCount: filtered.length,
    buyCount: buys.length,
    sellCount: sells.length,
    uniqueIssuers: issuers.size,
    lastTraded: tradedDates.length ? tradedDates[tradedDates.length - 1] : null,
    lastPublished: publishedDates.length
      ? publishedDates[publishedDates.length - 1]
      : null,
    sizeBands,
    topIssuers,
    activityByMonth,
  };
}

export function getMemberActivity(slug: string): ActivityItem[] {
  return (activityBySlug[slug] || []).slice().sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
}

/** Soft join: activity within ±N days of traded or published. */
export function relatedActivityNearTrades(
  trades: Trade[],
  activity: ActivityItem[],
  windowDays = 21,
): { trade: Trade; items: ActivityItem[] }[] {
  const results: { trade: Trade; items: ActivityItem[] }[] = [];
  const recent = [...trades]
    .sort((a, b) => (a.published < b.published ? 1 : -1))
    .slice(0, 12);

  for (const trade of recent) {
    const anchors = [trade.traded, trade.published].filter(Boolean);
    const items = activity.filter((a) => {
      return anchors.some((anchor) => {
        const diff =
          Math.abs(Date.parse(a.date) - Date.parse(anchor)) /
          (1000 * 60 * 60 * 24);
        return Number.isFinite(diff) && diff <= windowDays;
      });
    });
    if (items.length) results.push({ trade, items });
  }
  return results.slice(0, 6);
}

export function searchSite(query: string): {
  members: Member[];
  trades: Trade[];
} {
  const q = query.trim().toLowerCase();
  if (!q) return { members: [], trades: [] };

  const members = roster
    .filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.state.toLowerCase().includes(q) ||
        m.slug.includes(q) ||
        m.districtLabel.toLowerCase().includes(q),
    )
    .slice(0, 12);

  const trades = loadTrades()
    .filter((t) => {
      const hay = `${t.politician} ${t.ticker} ${t.symbol} ${t.tradeId}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => (a.published < b.published ? 1 : -1))
    .slice(0, 40);

  return { members, trades };
}

export function getActiveMembers(limit = 12): {
  member: Member;
  tradeCount: number;
  lastPublished: string;
}[] {
  const counts = new Map<string, { count: number; last: string }>();
  for (const t of loadTrades()) {
    const cur = counts.get(t.politician) || { count: 0, last: "" };
    cur.count += 1;
    if (t.published > cur.last) cur.last = t.published;
    counts.set(t.politician, cur);
  }
  return [...counts.entries()]
    .map(([name, v]) => {
      const member = getMemberByName(name);
      if (!member) return null;
      return { member, tradeCount: v.count, lastPublished: v.last };
    })
    .filter(Boolean)
    .sort((a, b) => b!.tradeCount - a!.tradeCount)
    .slice(0, limit) as {
    member: Member;
    tradeCount: number;
    lastPublished: string;
  }[];
}

export { displayTicker };
