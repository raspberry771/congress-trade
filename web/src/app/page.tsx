import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { TradeTable } from "@/components/TradeTable";
import { getActiveMembers } from "@/lib/members";
import { getDataAsOf, loadTrades } from "@/lib/trades";
import { chamberLabel, formatDate, partyClass } from "@/lib/format";

export default function HomePage() {
  const trades = loadTrades()
    .slice()
    .sort((a, b) => (a.published < b.published ? 1 : -1))
    .slice(0, 18);
  const active = getActiveMembers(8);
  const asOf = getDataAsOf();

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="eyebrow">Congress · disclosures · context</p>
          <h1 className="heroBrand">Quorum</h1>
          <p className="heroLead">
            A member-first hub for congressional stock disclosures — who traded,
            when it was filed, and what was moving in Congress nearby.
          </p>
          <div className="heroActions">
            <Link className="btn btnPrimary" href="/members">
              Browse members
            </Link>
            <Link className="btn btnGhost" href="/trades">
              All trades
            </Link>
          </div>
          <SearchBar />
          <p className="muted" style={{ marginTop: "0.85rem", fontSize: "0.88rem" }}>
            {loadTrades().length.toLocaleString()} disclosures · data through{" "}
            {formatDate(asOf)}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sectionHead">
            <div>
              <h2>Active filers</h2>
              <p>Members with the densest disclosure history in our set.</p>
            </div>
            <Link className="linkOut" href="/members">
              All members
            </Link>
          </div>
          <div className="memberGrid">
            {active.map(({ member, tradeCount, lastPublished }, i) => (
              <Link
                key={member.slug}
                href={`/members/${member.slug}`}
                className="memberTile"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="metaRow">
                  <span className={`chip ${partyClass(member.party)}`}>
                    {member.party}
                  </span>
                  <span>{chamberLabel(member.chamber)}</span>
                  <span>{member.districtLabel}</span>
                </div>
                <h3>{member.name}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {tradeCount} trades · last filed {formatDate(lastPublished)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sectionHead">
            <div>
              <h2>Recent disclosures</h2>
              <p>Latest published filings across the trade set.</p>
            </div>
            <Link className="linkOut" href="/trades">
              Open trade explorer
            </Link>
          </div>
          <TradeTable trades={trades} />
        </div>
      </section>
    </>
  );
}
