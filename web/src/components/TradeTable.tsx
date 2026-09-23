import Link from "next/link";
import type { Trade } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { slugifyName } from "@/lib/slug";

export function TradeTable({
  trades,
  showMember = true,
}: {
  trades: Trade[];
  showMember?: boolean;
}) {
  if (!trades.length) {
    return <p className="muted">No trades match these filters.</p>;
  }

  return (
    <div className="tableWrap">
      <table className="trades">
        <thead>
          <tr>
            {showMember ? <th>Member</th> : null}
            <th>Side</th>
            <th>Ticker</th>
            <th>Size</th>
            <th>Price</th>
            <th>Traded</th>
            <th>Published</th>
            <th>Lag</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            return (
              <tr key={t.tradeId}>
                {showMember ? (
                  <td>
                    <Link href={`/members/${slugifyName(t.politician)}`}>
                      {t.politician}
                    </Link>
                  </td>
                ) : null}
                <td>
                  <span className={t.type === "SELL" ? "sideSell" : "sideBuy"}>
                    {t.type || "—"}
                  </span>
                </td>
                <td>
                  <strong>{t.symbol}</strong>
                  {t.ticker && t.symbol !== t.ticker ? (
                    <span className="muted"> · {t.ticker}</span>
                  ) : null}
                </td>
                <td>{t.size || "—"}</td>
                <td>{t.price || "—"}</td>
                <td>{formatDate(t.traded)}</td>
                <td>{formatDate(t.published)}</td>
                <td>{t.filedAfterDays}d</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
