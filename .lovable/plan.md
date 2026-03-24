

## Upgrade Sell Flow — Binance-Style Deposit, Balance Checks, and Offer Management

### What exists today
- `SellModal` has a basic deposit + offer creation flow
- `useWallets` has balance, lock, unlock, deductLocked mutations
- `useUserOffers` creates offers but has no cancel/update
- Dashboard shows wallet cards and offers but no cancel button or deposit history

### Changes

**1. Upgrade `SellModal.tsx` — Binance-style deposit UX**
- Add network labels per asset (TRC20, ERC20, Bitcoin Network, Solana)
- Show minimum deposit amounts per asset
- Add trust copy: "Send only {ASSET} to this address. Funds will be credited after confirmation."
- Show available balance as `balance - lockedBalance` everywhere (not raw balance)
- Strict blocking UI: if available < sell amount, show "Insufficient balance" with "Deposit Crypto to Continue" CTA
- After deposit: show "Funds secured for trading" confirmation
- While creating offer: show "Amount reserved for active offers"

**2. Add offer cancellation to `use-offers.ts`**
- Add `cancelOffer` mutation: updates offer status to `inactive`, then restores `locked_balance` back to `balance` using `unlockBalance`
- Validates only the offer owner can cancel

**3. Upgrade `Dashboard.tsx`**
- Add "Cancel Offer" button on active offer cards that calls `cancelOffer` and restores funds
- Add "Deposit History" section or tab showing transactions from the `transactions` table
- Show available vs locked balance clearly on wallet cards
- Add "Deposit" button on wallet cards linking to sell modal

**4. Create `use-transactions.ts` hook**
- Query `transactions` table for current user, ordered by `created_at` desc
- Used in Dashboard deposit history

**5. Minor: update `Marketplace.tsx` `handleCreateOffer`**
- Use available balance (`balance - lockedBalance`) for validation instead of raw `balance`

### Files

| Action | File |
|--------|------|
| Edit | `src/components/marketplace/SellModal.tsx` — Binance-style deposit, trust copy, available balance |
| Edit | `src/hooks/use-offers.ts` — add cancelOffer mutation |
| Edit | `src/hooks/use-wallets.ts` — no changes needed, already has unlockBalance |
| Edit | `src/pages/Dashboard.tsx` — cancel button, deposit history, deposit CTA |
| Edit | `src/pages/Marketplace.tsx` — use available balance for validation |
| Create | `src/hooks/use-transactions.ts` — query deposit history |

### Safety
- Available balance = `balance - lockedBalance` used consistently
- Cancel restores exact `remaining_amount` (not original amount) to prevent over-restore on partial fills
- Double-lock prevention: balance check uses available, not raw balance

