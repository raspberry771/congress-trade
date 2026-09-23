# Quorum — Congress stock trade hub

Member-first web app for browsing congressional stock disclosures with role context (committees, bills/press scaffold).

**Brand:** Quorum (no third-party trade-tracker branding in the UI).

## Web app (Next.js)

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |

Trade data is read from `data/trades_master.csv` (repo root). Member roster enrichment and Bill/Committee/Press activity seeds live under `web/src/data/`.

### Pages

- `/` — Home: search, active filers, recent disclosures
- `/members` — Member roster from the trade set
- `/members/[slug]` — Member hub (identity, snapshot, graphs, committees, activity, trades)
- `/trades` — Cross-member trade explorer with filters

## Scraper (existing)

Python scraper appends to `data/trades_master.csv`. See `README.txt` and `requirements.txt`.
