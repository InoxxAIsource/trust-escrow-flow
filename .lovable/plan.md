

## Complete Seed Engine Rewrite

The current engine generates 50-200 random offers per asset with random countries. The new spec requires a precise, controlled system: fixed offer counts per asset, India-only, INR limits ₹50K-₹5L, smart payment method assignment, and inverse price-liquidity correlation.

### Changes

**File 1: `src/data/seed-engine.ts`** — Full rewrite of generation logic

1. **Update `SeededOffer` interface**: Add `availableAmount: number`, change `paymentMethod: string` → `paymentMethods: string[]` to support multiple payment methods per offer.

2. **New USDT generator** (replaces random generation):
   - 12 SELL offers: prices evenly spread ₹93→₹97, ±0.3 randomness
   - 9 BUY offers: prices evenly spread ₹98→₹104, ±0.3 randomness
   - Inverse liquidity: lower price = higher available amount (₹3L-₹5L), higher price = lower (₹50K-₹1.5L)

3. **New BTC/ETH/SOL generator**:
   - 5 SELL offers each: market price + 2% (±0.5% variation)
   - 5 BUY offers each: market price + 10% (±0.5% variation)
   - Market prices from live CoinGecko or fallbacks (BTC $87K, ETH $2.1K, SOL $140)
   - All prices converted to INR

4. **Limits & payment rules** (all offers):
   - All limits in INR: min ₹50,000, max ₹5,00,000
   - `maxLimit > ₹5,00,000` → only "Bank Transfer"
   - `maxLimit ≤ ₹1,00,000` → prefer "UPI"
   - `₹1L-₹5L` → mix of "UPI" + "Bank Transfer"

5. **All offers**: country = "India", currency = "INR", realistic trader profiles (unique usernames, 100-5000 trades, 4.2-5.0 rating, 94-100% completion)

6. **Total output**: 21 USDT + 10 BTC + 10 ETH + 10 SOL = **51 offers** (down from 800+)

7. **Keep** `generateAllOffers()`, `filterOffers()`, and all exports compatible

**File 2: `src/pages/Marketplace.tsx`**

1. Remove the `slice(0, 30)` cap since we now have exactly 51 offers
2. Add "Recommended" badge to the best-priced offer per asset
3. Add "High completion trader" badge for completionRate ≥ 99%
4. Update OfferRow to show multiple payment methods (comma-separated badges)

**File 3: `src/components/marketplace/BuyModal.tsx`**

1. Update to handle `paymentMethods: string[]` array instead of single `paymentMethod`

**File 4: `src/components/marketplace/SellModal.tsx`**

1. No structural changes needed — already uses INR and payment arrays

**File 5: `src/pages/OfferDetail.tsx`**

1. Update to handle `paymentMethods` array display

### Technical Notes

- The `SeededOffer` interface change (`paymentMethod` → `paymentMethods`) is a breaking change that needs updating in all consumers
- The `filterOffers` function will need to check if any element in the `paymentMethods` array matches
- Seed rotation still works via `Date.now()` but with ±0.3 price jitter instead of full randomization
- For non-India SEO pages that reference other countries, the engine will still generate India-only offers (simplification per spec)

