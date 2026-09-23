# Quorum (web)

Next.js App Router UI for the Congress stock trade hub.

## Run locally

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production:

```bash
npm run build
npm start
```

## Data

- Trades: `web/data/trades_master.csv` (copy of repo `data/trades_master.csv`)
- Roster: `src/data/roster.json`
- Activity seed (Bill / Committee / Press): `src/data/activity-seed.json`
