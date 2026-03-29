# P2P Crypto Marketplace

A peer-to-peer cryptocurrency trading platform with real-time risk scoring, progressive KYC verification, and escrow-based trade execution.

## Features

- **Marketplace** — Browse and create buy/sell offers for crypto assets
- **Escrow Trading** — Lock deals with time-based expiry and secure trade flow
- **Real-Time Risk Engine** — Dynamic user scoring (0–100) with automatic restrictions
- **Progressive Verification** — Multi-level KYC (guest → basic → verified → trusted) with tiered trade limits
- **Trust Score Badges** — Visible trust indicators on user profiles and offers
- **Admin Risk Dashboard** — Monitor flagged users, risk events, and enforce actions
- **Live Crypto Prices** — Real-time price feeds for supported assets
- **Trade Chat** — In-trade messaging between buyer and seller

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — database, auth, edge functions, storage
- **State Management**: TanStack React Query
- **Animations**: Framer Motion
- **Routing**: React Router v6

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── layout/       # Header, Footer, Layout
│   ├── marketplace/  # Buy/Sell/SellToOffer modals
│   ├── trade/        # Trade chat
│   └── ui/           # shadcn/ui primitives
├── data/             # Mock data and seed engine
├── hooks/            # Custom React hooks (auth, trades, risk, wallets)
├── pages/            # Route pages
└── integrations/     # Supabase client and types
```

## License

Private — All rights reserved.
