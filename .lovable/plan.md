

## Fix: Sell Flow from Marketplace

### Problem
When viewing buy offers on the Sell tab, clicking "Sell USDT" navigates to `/offer/{id}` which just shows a static detail page with no actionable sell flow. The user sees "Offer Not Found" because seeded offer IDs don't always match across re-renders.

### Solution
Instead of linking to the OfferDetail page, clicking "Sell" on a buy offer should open a **SellToOfferModal** — a modal similar to BuyModal but for selling into an existing buyer's offer.

### Changes

**1. Create `src/components/marketplace/SellToOfferModal.tsx`**
- A new modal that accepts a buy offer (SeededOffer with type="buy")
- Step 1 (Form): Enter amount of crypto to sell, confirm payment method from the offer
- Step 2 (Confirm): Show summary — asset, amount, price, total INR
- Step 3 (Locked): Create a trade (seller = current user, buyer = offer creator), show countdown timer, link to trade page
- Validates: amount within offer limits, sufficient wallet balance
- If insufficient balance, prompt to deposit first

**2. Update `src/pages/Marketplace.tsx`**
- Add `sellToOffer` state (`SeededOffer | null`) for the selected buy offer
- Change OfferRow: instead of `<Link to={/offer/${id}}>`, call `onSellClick(offer)` which sets `sellToOffer`
- Pass wallet hooks (getBalance, deposit) to the new modal
- Render `SellToOfferModal` at the bottom alongside BuyModal and SellModal

**3. Update OfferRow component**
- Add `onSellClick` prop alongside `onBuyClick`
- For buy offers (type="buy"), use a Button with onClick instead of a Link

**4. Update `src/pages/OfferDetail.tsx`**
- Add a functional CTA button that opens BuyModal or SellToOfferModal depending on offer type
- This fixes the dead-end for users who land on this page directly

### Flow Summary
```text
Sell Tab → Click "Sell USDT" → SellToOfferModal opens
  → Enter amount + confirm payment
  → Validate balance (prompt deposit if needed)  
  → Create trade (status: locked, 3h expiry)
  → Navigate to /trade/:id
```

