

## P2P Trading Flow — Parts 2-7

This plan builds the complete buy flow, trade lifecycle, chat, expiry system, and enhanced dashboard on top of the existing database tables.

### Database Changes

**Migration 1 — Extend schema for trade lifecycle + chat**

1. Add `expires_at` column to `trades` table
2. Add `locked` and `expired` values to `trade_status` enum
3. Create `trade_messages` table with RLS (both trade participants can read/write)
4. Enable realtime on `trade_messages` and `trades`

```text
trades (updated)
├── + expires_at (timestamptz, nullable)
└── status enum += 'locked', 'expired'

trade_messages (new)
├── id (uuid PK)
├── trade_id (uuid FK → trades)
├── sender_id (uuid, not null)
├── message (text)
├── created_at (timestamptz)
└── RLS: participants only
```

### Part 2 — Buy Flow (BuyModal refactor)

Refactor `BuyModal` to create a real `trades` row instead of a `locked_deals` row:

- Step 1: User enters amount + payment method (existing UI)
- Step 2: Confirm screen (existing UI)
- Step 3: On "Lock Deal":
  - Insert into `trades` with `status = 'locked'`, `expires_at = now + 3h`
  - For seeded offers: use a placeholder `seller_id` (the buyer's own ID as placeholder since no real seller)
  - Navigate to new `/trade/:id` page after lock

Update `Marketplace.tsx` `handleLockDeal` to call a new `useTrades` hook instead of `useDeals`.

### Part 3 — Trade Lifecycle Page (`/trade/:id`)

New page `src/pages/TradePage.tsx` showing:

```text
┌─────────────────────────────────────┐
│  Trade #abc123        Status: LOCKED│
│  ─────────────────────────────────  │
│  Asset: USDT    Amount: ₹50,000     │
│  Price: ₹97.50  Timer: 2h 45m 12s   │
│  ─────────────────────────────────  │
│  [Payment Instructions]             │
│  ─────────────────────────────────  │
│  [  Trade Chat  ]                   │
│  ─────────────────────────────────  │
│  [ I Have Paid ]  [ Cancel Trade ]  │
└─────────────────────────────────────┘
```

State transitions:
- `locked` → Buyer sees "I Have Paid" button → updates to `paid`
- `paid` → Shows "Waiting for seller confirmation" → Seller sees "Confirm & Release" → `completed`
- `locked` + expired timer → `expired`
- Any state → "Cancel" → `cancelled`

### Part 4 — Expiry System (Edge Function + pg_cron)

Edge function `expire-trades` that:
- Finds trades where `status = 'locked'` and `expires_at < now()`
- Updates status to `expired`
- (Future: restore seller locked_balance)

Scheduled via `pg_cron` every 5 minutes.

### Part 5 — Trade Chat

Component `TradeChat.tsx` embedded in TradePage:
- Realtime subscription on `trade_messages` filtered by `trade_id`
- Input box to send messages
- Shows sender name, timestamp, message bubble UI

### Part 6 — Enhanced Dashboard

Add "Trades" tab to Dashboard showing:
- Active trades (locked/paid) with status badges and countdown
- Completed trades history
- Click any trade → navigate to `/trade/:id`

### Part 7 — Hooks

**`src/hooks/use-trades.ts`** — new hook:
- `createTrade()` mutation (insert into trades)
- `updateTradeStatus()` mutation
- `useTradeById(id)` query
- `useUserTrades()` query (buyer_id or seller_id = current user)

**`src/hooks/use-trade-messages.ts`** — new hook:
- `useMessages(tradeId)` with realtime subscription
- `sendMessage()` mutation

### Files to Create/Edit

| Action | File |
|--------|------|
| Create | `src/hooks/use-trades.ts` |
| Create | `src/hooks/use-trade-messages.ts` |
| Create | `src/pages/TradePage.tsx` |
| Create | `src/components/trade/TradeChat.tsx` |
| Create | `supabase/functions/expire-trades/index.ts` |
| Edit   | `src/components/marketplace/BuyModal.tsx` — create trade instead of locked_deal |
| Edit   | `src/pages/Marketplace.tsx` — use new trade hook, navigate to trade page |
| Edit   | `src/pages/Dashboard.tsx` — add Trades tab |
| Edit   | `src/App.tsx` — add `/trade/:id` route |
| Migration | Add expires_at to trades, extend enum, create trade_messages table |

### Safety Rules Addressed

- **No double locking**: Check offer `remaining_amount > 0` before creating trade
- **Balance sync**: Wallet `locked_balance` updates atomically with trade creation
- **Expiry handling**: Edge function + client-side timer both handle expiry
- **Partial fills**: Reduce `remaining_amount` on offer; deactivate when 0

