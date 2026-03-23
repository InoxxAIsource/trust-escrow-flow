

## Problem Analysis

After scanning Binance P2P live data, here's what the real market shows:

**Binance P2P USDT/INR prices (live):** ₹97.49 – ₹98.94 per USDT

**Our current system has 3 issues:**

1. **Outdated fallback prices** — BTC hardcoded at $68,500 (real: ~$85,000+), SOL at $86 (real: ~$130+). When CoinGecko API fails, prices are wildly wrong.

2. **INR rate too low** — We use the forex USD/INR rate (~83.5) as the base, then add 10-12% margin = ~₹91-93 USDT. But Binance P2P shows ₹97-99 USDT. Our prices look unrealistically cheap.

3. **PriceTicker shows USD only** — For Indian users, the ticker should also show INR prices so they can compare with Binance.

---

## Plan

### 1. Update fallback prices to current market values
**File:** `src/data/seed-engine.ts`

Update the `assets` array and `defaultUsdRates`:
- BTC: 68,500 → 87,000
- SOL: 86 → 140
- ETH: 2,050 → 2,100
- INR fallback: 83.5 → 85.5

### 2. Widen the INR rate safety check
**File:** `src/hooks/use-crypto-prices.ts`

The `getSafeInrRate` function caps at 90. If CoinGecko returns a rate above 90 (possible with current INR weakness), it falls back to 83.5 — making prices wrong. Fix: raise `INR_RATE_MAX` to 100.

### 3. Add P2P premium to USDT/INR pricing
**File:** `src/data/seed-engine.ts`

The core mismatch: forex USD/INR ≈ 85 but P2P USDT/INR ≈ 97-99. This is because P2P markets inherently carry a premium over forex. Add a P2P premium multiplier (~14-16%) specifically for INR-USDT offers, so our USDT prices for India show ₹97-99 (matching Binance), and BTC/ETH/SOL prices scale accordingly.

### 4. Show INR prices in the PriceTicker
**File:** `src/pages/Marketplace.tsx`

Update `PriceTicker` to show both USD and INR values for each coin, so users can immediately see real INR rates and compare with Binance.

### 5. Update BuyModal quote display
**File:** `src/components/marketplace/BuyModal.tsx`

Ensure the crypto amount calculation uses the offer's actual price (which now includes P2P premium), so entering ₹1000 gives the correct USDT/BTC/ETH/SOL amount matching the displayed rate.

---

## Technical Details

**P2P Premium logic (seed-engine.ts):**
```text
For INR offers:
  base = livePriceUSD × forex_rate × P2P_PREMIUM (1.14-1.16)
  final = base × margin (sell: +10-12%, buy: +2-5%)

This produces:
  USDT: 1 × 85.5 × 1.15 = ₹98.3 base → ₹98.3 to ₹110 with margin
  (Binance shows ₹97-99, so sell margin for USDT should be smaller)
```

Actually, looking at Binance more carefully — their ₹97-99 prices ARE the sell offers (traders selling USDT to buyers). So the correct approach:

- **Market price for USDT in INR** = forex rate × P2P premium ≈ ₹85.5 × 1.14 = ₹97.5
- **Sell offers** (our +10-12% margin) would then be ₹107-109 — too high vs Binance
- **Solution**: For USDT specifically, reduce margins to match Binance reality: sell margin +0.5-2%, buy margin +0-1%

This means the margin logic needs asset-awareness — USDT margins are much tighter than BTC/ETH/SOL margins in P2P markets.

**Files changed:** 4 files
- `src/data/seed-engine.ts` — fallback prices, P2P premium, asset-aware margins
- `src/hooks/use-crypto-prices.ts` — widen INR rate cap
- `src/pages/Marketplace.tsx` — INR in PriceTicker
- `src/components/marketplace/BuyModal.tsx` — verify quote math

