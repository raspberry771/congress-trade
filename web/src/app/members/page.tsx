import Link from "next/link";
import { getAllMembers, getMemberByName } from "@/lib/members";
import { loadTrades } from "@/lib/trades";
import { chamberLabel, partyClass } from "@/lib/format";
import { SearchBar } from "@/components/SearchBar";

export const metadata = {
  title: "Members",
};

export default function MembersPage() {
  const counts = new Map<string, number>();
  for (const t of loadTrades()) {
    counts.set(t.politician, (counts.get(t.politician) || 0) + 1);
  }

  const members = getAllMembers()
    .map((m) => ({
      member: m,
      tradeCount: counts.get(m.name) || 0,
    }))
    .sort((a, b) => b.tradeCount - a.tradeCount);

  // Include any politician in trades missing from roster
  for (const name of counts.keys()) {
    if (!getMemberByName(name)) {
      // skip — roster covers all 74
    }
  }

  return (
    <div className="container" style={{ paddingTop: "2rem" }}>
      <p className="eyebrow">Roster</p>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          letterSpacing: "-0.04em",
          margin: "0 0 0.5rem",
        }}
      >
        Members
      </h1>
      <p className="muted" style={{ maxWidth: "36rem", marginBottom: "1.25rem" }}>
        Trade-set coverage — profiles for filers in our disclosure data, with
        party, chamber, and state enrichment.
      </p>
      <SearchBar placeholder="Jump via trade search…" />
      <div className="memberGrid" style={{ marginTop: "1.5rem" }}>
        {members.map(({ member, tradeCount }, i) => (
          <Link
            key={member.slug}
            href={`/members/${member.slug}`}
            className="memberTile"
            style={{ animationDelay: `${Math.min(i, 20) * 25}ms` }}
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
              {tradeCount} disclosures
              {member.status === "former" ? " · former" : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
