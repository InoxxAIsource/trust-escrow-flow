# P2PxBT — Trust Escrow Flow

A peer-to-peer crypto trading platform with trust escrow. Users can buy and sell BTC, ETH, SOL, and USDT peer-to-peer across the US, UK, Europe, and Hong Kong on local payment rails.

## Run & Operate

- `pnpm --filter @workspace/trust-escrow-flow run dev` — run the frontend (port assigned by Replit)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/trust-escrow-flow run seo:sitemap` — regenerate sitemap.xml
- `pnpm --filter @workspace/trust-escrow-flow run seo:llms` — regenerate llms.txt
- `pnpm --filter @workspace/trust-escrow-flow run seo:verify` — verify SEO outputs

## Stack

- React 18 + Vite 7, TypeScript 5.8
- Routing: react-router-dom v6
- Auth & DB: Supabase (auth, realtime, RLS)
- Styling: Tailwind CSS v3 + PostCSS + tailwindcss-animate
- Fonts: Geist Variable + Geist Mono Variable (self-hosted via @fontsource-variable)
- UI: Radix UI primitives + shadcn/ui-style components
- Data fetching: TanStack React Query v5
- Forms: react-hook-form + zod
- Animations: Framer Motion
- SEO: react-helmet-async + custom sitemap/llms.txt generation scripts

## Where things live

- `artifacts/trust-escrow-flow/src/` — all React source code
- `artifacts/trust-escrow-flow/src/pages/` — route-level page components
- `artifacts/trust-escrow-flow/src/components/` — shared UI components
- `artifacts/trust-escrow-flow/src/hooks/` — custom React hooks
- `artifacts/trust-escrow-flow/src/integrations/supabase/` — Supabase client + generated types
- `artifacts/trust-escrow-flow/src/data/` — SEO pages data and seed engine
- `artifacts/trust-escrow-flow/scripts/` — SEO scripts (sitemap, llms.txt, redirects)
- `artifacts/trust-escrow-flow/supabase/` — Supabase migrations and edge functions
- `artifacts/trust-escrow-flow/public/` — static assets (favicon, robots.txt, sitemap.xml, og-image)
- `lib/api-spec/openapi.yaml` — shared API spec (not used by this app directly)

## Architecture decisions

- Frontend-only React SPA; all data/auth flows through Supabase directly (no custom API server)
- Supabase RLS secures every table; anon key is safe to expose in the client bundle
- Tailwind v3 with PostCSS (not Tailwind v4) — project was built before v4 migration
- react-router-dom v6 BrowserRouter at root path "/" (no basename needed)
- Geist font family self-hosted via @fontsource-variable — no render-blocking Google Fonts

## Product

- Marketplace: browse counterparty offers to buy/sell crypto
- Dashboard: user's active and past trades
- Trade flow: full escrow-protected P2P trade lifecycle with operator oversight
- Admin console: operator tools for trade management and risk review
- KYC/Verify: user identity verification flow
- Blog: SEO-optimised content (sitemap, structured data, llms.txt)
- SEO landing pages: dynamically generated pages for city/method/asset combos

## Environment Variables (Secrets)

- `VITE_SUPABASE_URL` — Supabase project URL (e.g. https://xxxx.supabase.co)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ref ID

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Tailwind v3 is used here (not v4); `tailwind.config.ts` must stay, PostCSS config required
- Do NOT add `@tailwindcss/vite` (Tailwind v4 Vite plugin) — it conflicts with PostCSS setup
- React 18 is pinned explicitly in package.json (workspace catalog has React 19)
- Similarly @types/react and @types/react-dom are pinned to v18 in package.json
- tailwind-merge is pinned to ^2.x (catalog has v3 which has breaking API changes)
- The `prebuild` script runs SEO generation before every production build
- `archive/` directory in the original repo is a static HTML snapshot of old site — not copied here

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Supabase schema: `artifacts/trust-escrow-flow/supabase/migrations/`
- Apply migrations: use Supabase CLI (`supabase db push`) or dashboard SQL editor
