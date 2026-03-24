# Memory: index.md
Updated: now

TrustP2P - P2P crypto escrow platform. Light theme + blue accents (Stripe-inspired). Mobile-first.

## Design
- Brand: TrustP2P
- Style: Light + Blue accents, clean SaaS (Stripe + Binance hybrid)
- Coins: USDT, BTC, ETH, SOL
- Trust indicators everywhere

## Pricing Rules
- All listing prices (both buy and sell) are ABOVE market price
- Sell listings: +2-12% margin
- Buy listings: +1-5% margin
- Flat 1.2% trading fee on all trades
- Never show negative/below-market prices

## Multi-Country Support
- 6 countries: India (INR), USA (USD), UAE (AED), UK (GBP), Nigeria (NGN), Philippines (PHP)
- Country-specific payment methods and usernames
- Dynamic currency symbols throughout UI (₹, $, £, ₦, ₱, د.إ)
- Country filter defaults to India, resets payment filter on change

## Seed Engine
- Generates offers per country (India most, others fewer)
- Uses seeded random for rotation on refresh
- is_seeded=true flag NEVER exposed to UI
- SeededOffer now includes: country, currency, currencySymbol

## SEO
- 180 programmatic SEO pages (coin, country, payment, combo)
- 8 blog posts with internal linking
- Breadcrumbs + JSON-LD on all pages

## Tech
- React + Tailwind + shadcn/ui
- react-helmet-async for SEO
- framer-motion for animations
- CoinGecko API for live prices
- Supabase for auth + DB
