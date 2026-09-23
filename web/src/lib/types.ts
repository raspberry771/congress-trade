export type Trade = {
  tradeId: string;
  politician: string;
  ticker: string;
  symbol: string;
  published: string;
  traded: string;
  filedAfterDays: number;
  type: "BUY" | "SELL" | "";
  size: string;
  price: string;
  isEquity: boolean;
};

export type Member = {
  name: string;
  slug: string;
  party: "R" | "D" | "I";
  partyLabel: string;
  chamber: "house" | "senate";
  state: string;
  district: string | null;
  districtLabel: string;
  matchConfidence: "verified" | "unverified";
  bioguideHint: string;
  officialUrl: string;
  congressGovUrl: string;
  committees: string[];
  sectorHints: string[];
  status: "sitting" | "former";
};

export type ActivityItem = {
  type: "Bill" | "Committee" | "Press";
  title: string;
  date: string;
  outlet: string;
  url: string;
  sector?: string;
  body?: string;
  memberSlug: string;
  scaffold?: boolean;
};

export type MemberStats = {
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  uniqueIssuers: number;
  medianLag: number | null;
  lastTraded: string | null;
  lastPublished: string | null;
  sizeBands: Record<string, number>;
  topIssuers: { ticker: string; count: number; buys: number; sells: number }[];
  activityByMonth: { month: string; buys: number; sells: number }[];
};
