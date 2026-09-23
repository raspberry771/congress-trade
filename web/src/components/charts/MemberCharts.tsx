import type { MemberStats } from "@/lib/types";
import { formatMonth } from "@/lib/format";

export function ActivityChart({ stats }: { stats: MemberStats }) {
  const rows = stats.activityByMonth.slice(-18);
  const max = Math.max(1, ...rows.map((r) => r.buys + r.sells));

  if (!rows.length) {
    return <p className="muted">Not enough dated trades for a timeline.</p>;
  }

  return (
    <div>
      <div className="bars" aria-label="Buy and sell activity over time">
        {rows.map((r) => {
          const buyH = (r.buys / max) * 100;
          const sellH = (r.sells / max) * 100;
          return (
            <div className="barCol" key={r.month} title={`${r.month}: ${r.buys} buy / ${r.sells} sell`}>
              <div className="barStack">
                <div className="barSell" style={{ height: `${sellH}%` }} />
                <div className="barBuy" style={{ height: `${buyH}%` }} />
              </div>
              <span className="barLabel">{formatMonth(r.month)}</span>
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ marginTop: "0.65rem", fontSize: "0.82rem" }}>
        <span className="sideBuy">Buy</span> · <span className="sideSell">Sell</span> by trade month
      </p>
    </div>
  );
}

export function TopIssuers({ stats }: { stats: MemberStats }) {
  const max = Math.max(1, ...stats.topIssuers.map((i) => i.count));
  if (!stats.topIssuers.length) {
    return <p className="muted">No issuers to rank yet.</p>;
  }
  return (
    <div className="issuerList">
      {stats.topIssuers.map((i) => (
        <div className="issuerRow" key={i.ticker}>
          <strong>{i.ticker}</strong>
          <div className="issuerTrack" aria-hidden>
            <div
              className="issuerFill"
              style={{ width: `${(i.count / max) * 100}%` }}
            />
          </div>
          <span className="muted">{i.count}</span>
        </div>
      ))}
    </div>
  );
}

export function SizeBandBars({ stats }: { stats: MemberStats }) {
  const entries = Object.entries(stats.sizeBands).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  if (!entries.length) return null;
  return (
    <div className="sizeBars">
      {entries.slice(0, 6).map(([band, n]) => (
        <div className="sizeRow" key={band}>
          <span>{band}</span>
          <div className="issuerTrack">
            <div className="issuerFill" style={{ width: `${(n / max) * 100}%` }} />
          </div>
          <span>{n}</span>
        </div>
      ))}
    </div>
  );
}
