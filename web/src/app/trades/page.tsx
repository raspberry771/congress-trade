import { TradeFilters } from "@/components/TradeFilters";
import { SearchBar } from "@/components/SearchBar";
import { loadTrades } from "@/lib/trades";

export const metadata = {
  title: "Trades",
};

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const all = loadTrades()
    .slice()
    .sort((a, b) => (a.published < b.published ? 1 : -1));

  const filtered = q
    ? all.filter((t) => {
        const hay = `${t.politician} ${t.ticker} ${t.symbol} ${t.tradeId}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
    : all;

  return (
    <div className="container" style={{ paddingTop: "2rem" }}>
      <p className="eyebrow">Explorer</p>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          letterSpacing: "-0.04em",
          margin: "0 0 0.5rem",
        }}
      >
        Trades
      </h1>
      <p className="muted" style={{ maxWidth: "38rem", marginBottom: "1.1rem" }}>
        Search and filter disclosures across the trade set. Click a member name
        to open their hub.
      </p>
      <SearchBar initial={q || ""} />
      <div style={{ marginTop: "1.25rem" }}>
        {q ? (
          <p className="muted" style={{ marginBottom: "0.75rem" }}>
            Results for “{q}”
          </p>
        ) : null}
        <TradeFilters trades={filtered} showMember />
      </div>
    </div>
  );
}
