
# TrustP2P — P2P Crypto Escrow Platform (Phase 1: Landing + SEO Pages)

## Brand & Design
- **Name**: TrustP2P
- **Style**: Light theme with blue accents (Stripe-inspired), clean typography, trust indicators
- **Mobile-first** responsive design throughout

## Pages to Build

### 1. Home / Landing Page
- Hero: "Trade Crypto Safely with Escrow Protection"
- Trust stats (trades completed, funds secured)
- How it works (3-step visual: Create Deal → Lock Funds → Release)
- Supported coins (USDT, BTC, ETH, SOL)
- CTA buttons to marketplace and signup
- Testimonials section

### 2. How It Works Page
- Step-by-step escrow flow with visuals
- Trust & safety messaging
- FAQ section

### 3. Fees Page
- Clear fee table per coin
- Comparison with competitors

### 4. Marketplace Page (Static/Mock)
- Buy/Sell listings with mock data
- Filter UI: coin, payment method, country
- Each listing shows trader rating, price, limits

### 5. SEO Landing Pages (Template-based)
- **Coin pages**: `/buy-usdt`, `/sell-usdt`, `/buy-bitcoin`, `/sell-bitcoin`, `/buy-ethereum`, `/buy-solana`
- **Location pages**: `/buy-usdt-india`, `/buy-usdt-usa`, `/buy-bitcoin-india`
- **Payment method pages**: `/buy-usdt-upi`, `/buy-usdt-bank-transfer`, `/buy-bitcoin-paypal`
- Each page: unique H1, intro text, CTA, related links, breadcrumbs

### 6. Blog Index + Sample Posts
- `/blog` — list of articles
- 3 sample posts: "How to Buy USDT in India", "Is P2P Crypto Safe?", "Best Escrow for Crypto"
- SEO-optimized with meta tags, internal links

### 7. Dynamic Page Templates
- `/offer/:id` — deal detail page (mock)
- `/user/:username` — trader profile page (mock)

## Navigation
- **Header**: Home, Marketplace, How It Works, Fees, Blog, Dashboard (auth), Login/Signup
- **Footer**: SEO link grid (Buy Crypto, Sell Crypto, Countries, Payment Methods), legal links

## SEO Infrastructure
- Breadcrumbs on all pages
- Internal linking: related coins, locations, blog posts on every SEO page
- Meta titles & descriptions per page
- Structured data (JSON-LD) for offers

## Supabase Setup (Prep for Phase 2)
- Connect Supabase for auth (email signup/login)
- Profiles table for user data
- Blog posts can be stored in DB for future CMS

## Not in Phase 1 (Phase 2)
- Functional escrow engine & wallet system
- Real-time deal chat
- Dispute system & admin panel
- On-chain integrations
