# LOPE MCHJ Merchant Dashboard

Standalone Vite + React + TypeScript dashboard for the LOPE MCHJ
direct payment gateway. Deploys to Netlify — separate from the admin
panel (`../lope_frontend`) and the customer marketing sites
(`../lope.uz`, `../lopestyle.uz`).

## What it is

The finance / merchant control panel that pairs with the backend
`src/gateway` module. It shows:

- **Real-time payment feed** — every Payme + Click transaction as it
  lands, streamed from the backend via SSE (or short-poll fallback).
- **Daily / weekly / monthly graphs** — bar + line charts by channel
  (Payme vs Click) with success rate + refund tallies.
- **Reconciliation ("sverka") panel** — side-by-side of what our
  backend DB says vs what the Payme / Click merchant cabinets say.
  Highlights drift so we catch missed webhooks BEFORE the bank
  statement does.
- **OFD chek status** — every completed payment's fiscal receipt
  number and OFD provider ack.
- **CSV / Excel export** — monthly reports for accounting + soliq.uz.

Auth: the merchant user (Shohruh at first) logs in with a JWT issued
by the same backend as the mobile app but with a `merchant` role
gate. NOT the admin JWT — merchant view is scoped tighter (no user
data, no editing customers) so we can safely give access to an
accountant later.

## Why it's separate

- The admin panel (`lope_frontend`) is bloated with mobile-config,
  barbers, shops, bots, blast jobs, and everything else — adding
  finance to that would drag the load time up for the rest of the
  team who don't need finance access.
- Netlify deploys are per-repo. Splitting off means finance releases
  are decoupled from admin releases (no accidental "I fixed a barber
  bug, now the finance CSV export broke" incidents).
- Future: this dashboard could become the customer-facing merchant
  view if we spin up a real LOPE Payhelp-style aggregator later.
  Keeping it separate from admin makes that easier.

## Deploy

Netlify site — one-liner build (see `netlify.toml`):

```
npm run build   # → dist/
```

Env vars (set in Netlify dashboard, NOT committed):

- `VITE_API_URL` — https://api.lopestyle.uz
- (no secrets — all secrets stay on the backend)

## Stack

- Vite 5
- React 18 + TypeScript strict
- TanStack Query (react-query) for API state
- React Router 6
- Recharts for graphs
- Tailwind CSS + shadcn/ui components (matches `lope_frontend` look)
