

## Fix Buy/Sell Price Ranges

The prices are currently inverted. Swapping them to match the spec.

### Current (Wrong)
- USDT SELL: ₹98–₹104, BUY: ₹93–₹97
- BTC/ETH/SOL SELL: +10%, BUY: +2%

### Target (Correct)
- USDT SELL: ₹93–₹97, BUY: ₹98–₹104
- BTC/ETH/SOL SELL: +2%, BUY: +10%

### Changes — `src/data/seed-engine.ts`

1. **USDT SELL** (line 175-202): Change price range from ₹98→₹104 to ₹93→₹97
2. **USDT BUY** (line 204-231): Change price range from ₹93→₹97 to ₹98→₹104
3. **Crypto SELL** (line 246-272): Change multiplier from 1.10 to 1.02
4. **Crypto BUY** (line 274-300): Change multiplier from 1.02 to 1.10

No other files need changes.

