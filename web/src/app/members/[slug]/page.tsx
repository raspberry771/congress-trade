import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityStrip } from "@/components/ActivityStrip";
import { MemberChartsPanel } from "@/components/MemberChartsPanel";
import { TradeFilters } from "@/components/TradeFilters";
import {
  computeMemberStats,
  getAllMembers,
  getMemberActivity,
  getMemberBySlug,
  getMemberTrades,
  relatedActivityNearTrades,
} from "@/lib/members";
import { chamberLabel, formatDate, partyClass } from "@/lib/format";

export function generateStaticParams() {
  return getAllMembers().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = getMemberBySlug(slug);
  return { title: member ? member.name : "Member" };
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = getMemberBySlug(slug);
  if (!member) notFound();

  const trades = getMemberTrades(slug);
  const stats = computeMemberStats(trades);
  const activity = getMemberActivity(slug);
  const related = relatedActivityNearTrades(trades, activity, 21);
  const initials = member.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const buyPct =
    stats.tradeCount > 0 ? (stats.buyCount / stats.tradeCount) * 100 : 0;
  const sellPct =
    stats.tradeCount > 0 ? (stats.sellCount / stats.tradeCount) * 100 : 0;

  return (
    <div className="container stack" style={{ paddingBottom: "2rem" }}>
      <section className="identity">
        <div className="identityTop">
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <div className="avatar" aria-hidden>
              {initials}
            </div>
            <div>
              <p className="eyebrow">Member hub</p>
              <h1 className="identityName">{member.name}</h1>
              <div className="metaRow">
                <span className={`chip ${partyClass(member.party)}`}>
                  {member.partyLabel}
                </span>
                <span className="chip">{chamberLabel(member.chamber)}</span>
                <span className="chip">{member.districtLabel}</span>
                {member.status === "former" ? (
                  <span className="chip">Former</span>
                ) : null}
              </div>
              {member.matchConfidence === "unverified" ? (
                <p className="flag" style={{ marginTop: "0.75rem" }}>
                  Unverified match — identity joined by display name only
                </p>
              ) : (
                <p className="muted" style={{ marginTop: "0.65rem", fontSize: "0.88rem" }}>
                  Roster match: {member.bioguideHint}
                </p>
              )}
            </div>
          </div>
          <div className="identityActions">
            <a
              className="btn btnGhost"
              href={member.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Official site
            </a>
            <a
              className="btn btnGhost"
              href={member.congressGovUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Congress.gov
            </a>
            <Link className="btn btnPrimary" href="#trades">
              Jump to trades
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="sectionHead">
          <div>
            <h2>Trading snapshot</h2>
            <p>Intensity and direction from disclosed activity.</p>
          </div>
        </div>
        <div className="statGrid">
          <div className="stat">
            <b>{stats.tradeCount}</b>
            <span>Trades</span>
          </div>
          <div className="stat">
            <b>
              {stats.buyCount}/{stats.sellCount}
            </b>
            <span>Buy / sell</span>
          </div>
          <div className="stat">
            <b>{stats.uniqueIssuers}</b>
            <span>Unique issuers</span>
          </div>
          <div className="stat">
            <b>{formatDate(stats.lastTraded)}</b>
            <span>Last traded</span>
          </div>
          <div className="stat">
            <b>{formatDate(stats.lastPublished)}</b>
            <span>Last published</span>
          </div>
        </div>
        <div className="mixBar" aria-hidden>
          <div className="mixBuy" style={{ width: `${buyPct}%` }} />
          <div className="mixSell" style={{ width: `${sellPct}%` }} />
        </div>
        <p className="muted" style={{ marginTop: "0.45rem", fontSize: "0.85rem" }}>
          Ownership (self / spouse / joint) is not in our trade data yet.
        </p>
      </section>

      <MemberChartsPanel trades={trades} />

      <section>
        <div className="sectionHead">
          <div>
            <h2>Committees & sector hints</h2>
            <p>Role context that frames nearby tickers.</p>
          </div>
        </div>
        {member.committees.length ? (
          <div className="committeeStrip">
            {member.committees.map((c) => (
              <span className="chip" key={c}>
                {c}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted">Committee seats not enriched for this profile yet.</p>
        )}
        {member.sectorHints.length ? (
          <div className="committeeStrip" style={{ marginTop: "0.65rem" }}>
            {member.sectorHints.map((s) => (
              <span className="chip typeCommittee" key={s}>
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section>
        <div className="sectionHead">
          <div>
            <h2>Activity snapshot</h2>
            <p>
              Recent Bill / Committee / Press — scaffold until live congress.gov
              ingest.
            </p>
          </div>
        </div>
        <div className="panel">
          <ActivityStrip items={activity.slice(0, 5)} />
          <p className="scaffoldNote">
            News pillar items are seeded demo data with official view-source links.
          </p>
        </div>
      </section>

      <section>
        <div className="sectionHead">
          <div>
            <h2>Related near trades</h2>
            <p>Nearby context within ±21 days — not causality.</p>
          </div>
        </div>
        <div className="panel related">
          {related.length ? (
            related.map(({ trade, items }) => (
              <div className="relatedBlock" key={trade.tradeId}>
                <div className="metaRow" style={{ marginBottom: "0.45rem" }}>
                  <span className={trade.type === "SELL" ? "sideSell" : "sideBuy"}>
                    {trade.type || "—"}
                  </span>
                  <strong>{trade.symbol}</strong>
                  <span className="muted">
                    traded {formatDate(trade.traded)} · filed{" "}
                    {formatDate(trade.published)}
                  </span>
                </div>
                <ActivityStrip items={items.slice(0, 2)} />
              </div>
            ))
          ) : (
            <p className="muted">
              No seeded activity falls near this member’s recent disclosures.
            </p>
          )}
        </div>
      </section>

      <section id="trades">
        <div className="sectionHead">
          <div>
            <h2>Trade table</h2>
            <p>Full disclosures with filters. Lag is per row.</p>
          </div>
        </div>
        <TradeFilters trades={trades} showMember={false} />
      </section>
    </div>
  );
}
