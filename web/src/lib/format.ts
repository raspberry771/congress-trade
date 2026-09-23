export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00Z" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export function partyClass(party: string): string {
  if (party === "D") return "partyD";
  if (party === "R") return "partyR";
  return "partyI";
}

export function chamberLabel(chamber: string): string {
  return chamber === "senate" ? "Senate" : "House";
}

export const SIZE_ORDER = [
  "1K-15K",
  "15K-50K",
  "50K-100K",
  "100K-250K",
  "250K-500K",
  "500K-1M",
  "1M-5M",
  "1-3",
  "3-7",
  "7-10",
  "10-20",
];
