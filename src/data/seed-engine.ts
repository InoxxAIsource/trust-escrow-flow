// ============================================================
// SEED ENGINE — Controlled P2P Offer Generator
// Generates exactly 51 offers: 21 USDT + 10 BTC + 10 ETH + 10 SOL
// All India-only, INR limits ₹50K-₹5L, smart payment methods.
// ============================================================

export interface SeededOffer {
  id: string;
  type: "buy" | "sell";
  asset: string;
  assetSymbol: string;
  price: number;
  marketPrice: number;
  margin: string;
  minLimit: number;
  maxLimit: number;
  availableAmount: number;
  paymentMethods: string[];
  country: string;
  username: string;
  rating: number;
  trades: number;
  completionRate: number;
  isOnline: boolean;
  isVerified: boolean;
  is_seeded: true;
  lastSeen: string;
}

export interface LivePrices {
  USDT: number;
  BTC: number;
  ETH: number;
  SOL: number;
}

// ── Constants ──
export const FALLBACK_USD_INR_RATE = 85.5;

const assets = [
  { name: "USDT", symbol: "USDT", baseUSD: 1 },
  { name: "Bitcoin", symbol: "BTC", baseUSD: 87000 },
  { name: "Ethereum", symbol: "ETH", baseUSD: 2100 },
  { name: "Solana", symbol: "SOL", baseUSD: 140 },
];

// ── Indian trader username pool ──
const indianUsernames = [
  "crypto_raj", "delhi_trader", "usdt_pro_india", "mumbai_btc",
  "bangalore_crypto", "upi_king", "fast_rupee", "indian_whale",
  "trade_master_in", "coin_raja", "digital_rupee", "desi_trader",
  "p2p_guru_india", "safe_trade_in", "instant_pay_in",
  "quick_crypto_in", "trust_trader_in", "escrow_pro_in",
  "secure_coin_in", "rapid_trade_in", "prime_crypto_in",
  "elite_trader_in", "mega_pay_in", "alpha_trade_in",
  "swift_crypto_in", "turbo_trade_in", "rocket_pay_in",
  "thunder_trade_in", "flash_pay_in", "stellar_trade_in",
  "nova_crypto_in", "apex_trade_in", "peak_pay_in",
  "shield_trade_in", "iron_crypto_in", "titan_pay_in",
  "phoenix_trade_in", "dragon_crypto_in", "hawk_pay_in",
  "wolf_trade_in", "bull_run_in", "moon_trade_in",
  "hodl_india", "stake_pro_in", "yield_master_in",
  "swap_guru_in", "dex_trader_in", "web3_india",
  "defi_raja", "chain_master_in", "block_trade_in",
];

// ── Countries & payment maps (kept for SEO pages compatibility) ──
const countries = ["India", "USA", "UK", "Germany", "Canada", "UAE", "Singapore", "Nigeria", "Turkey", "Brazil", "Australia", "Japan", "South Korea", "Philippines", "Indonesia", "Thailand", "Vietnam", "Mexico", "Colombia", "Kenya"];

const paymentsByCountry: Record<string, string[]> = {
  India: ["UPI", "Bank Transfer", "IMPS"],
  USA: ["Zelle", "Venmo", "Bank Transfer", "CashApp", "PayPal"],
  UK: ["Bank Transfer", "Faster Payments", "PayPal", "Revolut"],
  Germany: ["Bank Transfer", "SEPA", "PayPal", "Revolut"],
  Canada: ["Interac e-Transfer", "Bank Transfer", "PayPal"],
  UAE: ["Bank Transfer", "Cash Deposit"],
  Singapore: ["Bank Transfer", "PayNow", "GrabPay"],
  Nigeria: ["Bank Transfer", "OPay", "Kuda"],
  Turkey: ["Bank Transfer", "Papara"],
  Brazil: ["PIX", "Bank Transfer"],
  Australia: ["Bank Transfer", "PayID", "OSKO"],
  Japan: ["Bank Transfer", "PayPay"],
  "South Korea": ["Bank Transfer", "Toss"],
  Philippines: ["GCash", "Bank Transfer", "Maya"],
  Indonesia: ["Bank Transfer", "OVO", "Dana", "GoPay"],
  Thailand: ["PromptPay", "Bank Transfer"],
  Vietnam: ["Bank Transfer", "MoMo"],
  Mexico: ["SPEI", "Bank Transfer"],
  Colombia: ["Bank Transfer", "Nequi"],
  Kenya: ["M-Pesa", "Bank Transfer"],
};

const currencyByCountry: Record<string, string> = {
  India: "INR", USA: "USD", UK: "GBP", Germany: "EUR", Canada: "CAD",
  UAE: "AED", Singapore: "SGD", Nigeria: "NGN", Turkey: "TRY", Brazil: "BRL",
  Australia: "AUD", Japan: "JPY", "South Korea": "KRW", Philippines: "PHP",
  Indonesia: "IDR", Thailand: "THB", Vietnam: "VND", Mexico: "MXN",
  Colombia: "COP", Kenya: "KES",
};

// ── Deterministic seeded random ──
let _seed = Date.now();
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed & 0x7fffffff) / 0x7fffffff;
}

function randBetween(min: number, max: number): number {
  return min + seededRandom() * (max - min);
}

function generateId(): string {
  return `seed-${Math.floor(seededRandom() * 1e12).toString(36)}`;
}

// ── Payment method assignment based on amount ──
function assignPaymentMethods(maxLimit: number): string[] {
  if (maxLimit > 500000) return ["Bank Transfer"];
  if (maxLimit <= 100000) return seededRandom() > 0.3 ? ["UPI"] : ["UPI", "Bank Transfer"];
  // ₹1L-₹5L: mix
  return seededRandom() > 0.5 ? ["UPI", "Bank Transfer"] : ["Bank Transfer", "UPI"];
}

// ── Inverse liquidity: lower price → higher amount ──
function computeAvailableAmount(priceRatio: number): number {
  // priceRatio: 0 = lowest price (best deal), 1 = highest price
  // Lower price → higher liquidity (₹3L-₹5L), higher price → lower (₹50K-₹1.5L)
  const inverted = 1 - priceRatio;
  return Math.round(50000 + inverted * 450000);
}

function computeLimits(availableAmount: number): { minLimit: number; maxLimit: number } {
  const minLimit = 50000;
  const maxLimit = Math.min(availableAmount, 500000);
  return { minLimit, maxLimit: Math.max(maxLimit, minLimit + 10000) };
}

// ── Pick unique username ──
let _usedUsernames: Set<string> = new Set();
function pickUsername(): string {
  for (let attempt = 0; attempt < 100; attempt++) {
    const idx = Math.floor(seededRandom() * indianUsernames.length);
    const name = indianUsernames[idx];
    if (!_usedUsernames.has(name)) {
      _usedUsernames.add(name);
      return name;
    }
  }
  // Fallback with suffix
  const base = indianUsernames[Math.floor(seededRandom() * indianUsernames.length)];
  const suffix = Math.floor(seededRandom() * 99) + 1;
  const fallback = `${base}_${suffix}`;
  _usedUsernames.add(fallback);
  return fallback;
}

// ── Trader profile ──
function generateTrader() {
  return {
    username: pickUsername(),
    rating: +randBetween(4.2, 5.0).toFixed(1),
    trades: Math.floor(randBetween(100, 5000)),
    completionRate: +randBetween(94, 100).toFixed(1),
    isOnline: seededRandom() > 0.25,
    isVerified: seededRandom() > 0.15,
    lastSeen: seededRandom() > 0.5 ? "Online" : `${Math.floor(randBetween(1, 20))}m ago`,
  };
}

// ── USDT Offer Generator ──
function generateUSDTOffers(liveInrRate: number): SeededOffer[] {
  const offers: SeededOffer[] = [];
  const marketPriceINR = liveInrRate; // USDT ≈ $1

  // 12 SELL offers: ₹98 → ₹104 (trader sells to user at higher price)
  const sellCount = 12;
  for (let i = 0; i < sellCount; i++) {
    const ratio = i / (sellCount - 1); // 0 to 1
    const basePrice = 98 + ratio * 6; // ₹98 to ₹104
    const price = +(basePrice + randBetween(-0.3, 0.3)).toFixed(2);
    const marginPct = +((price / marketPriceINR - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio);
    const { minLimit, maxLimit } = computeLimits(availableAmount);
    const paymentMethods = assignPaymentMethods(maxLimit);

    offers.push({
      id: generateId(),
      type: "sell",
      asset: "USDT",
      assetSymbol: "USDT",
      price,
      marketPrice: +marketPriceINR.toFixed(2),
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods,
      country: "India",
      ...generateTrader(),
      is_seeded: true,
    });
  }

  // 9 BUY offers: ₹93 → ₹97 (trader buys from user at lower price)
  const buyCount = 9;
  for (let i = 0; i < buyCount; i++) {
    const ratio = i / (buyCount - 1);
    const basePrice = 93 + ratio * 4; // ₹93 to ₹97
    const price = +(basePrice + randBetween(-0.3, 0.3)).toFixed(2);
    const marginPct = +((price / marketPriceINR - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio);
    const { minLimit, maxLimit } = computeLimits(availableAmount);
    const paymentMethods = assignPaymentMethods(maxLimit);

    offers.push({
      id: generateId(),
      type: "buy",
      asset: "USDT",
      assetSymbol: "USDT",
      price,
      marketPrice: +marketPriceINR.toFixed(2),
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods,
      country: "India",
      ...generateTrader(),
      is_seeded: true,
    });
  }

  return offers;
}

// ── BTC/ETH/SOL Generator ──
function generateCryptoOffers(
  assetName: string,
  assetSymbol: string,
  livePriceUSD: number,
  inrRate: number
): SeededOffer[] {
  const offers: SeededOffer[] = [];
  const marketPriceINR = +(livePriceUSD * inrRate).toFixed(2);

  // 5 SELL offers: market + ~10% (trader sells to user at higher price)
  for (let i = 0; i < 5; i++) {
    const ratio = i / 4;
    const variation = 1.10 + randBetween(-0.005, 0.005);
    const price = +(marketPriceINR * variation).toFixed(2);
    const marginPct = +((price / marketPriceINR - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio);
    const { minLimit, maxLimit } = computeLimits(availableAmount);
    const paymentMethods = assignPaymentMethods(maxLimit);

    offers.push({
      id: generateId(),
      type: "sell",
      asset: assetName,
      assetSymbol,
      price,
      marketPrice: marketPriceINR,
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods,
      country: "India",
      ...generateTrader(),
      is_seeded: true,
    });
  }

  // 5 BUY offers: market + ~10% (±0.5% variation)
  for (let i = 0; i < 5; i++) {
    const ratio = i / 4;
    const variation = 1.10 + randBetween(-0.005, 0.005);
    const price = +(marketPriceINR * variation).toFixed(2);
    const marginPct = +((price / marketPriceINR - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio);
    const { minLimit, maxLimit } = computeLimits(availableAmount);
    const paymentMethods = assignPaymentMethods(maxLimit);

    offers.push({
      id: generateId(),
      type: "buy",
      asset: assetName,
      assetSymbol,
      price,
      marketPrice: marketPriceINR,
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods,
      country: "India",
      ...generateTrader(),
      is_seeded: true,
    });
  }

  return offers;
}

// ── Main entry point ──
export function generateAllOffers(livePricesUSD?: Partial<LivePrices>, liveInrRate?: number): SeededOffer[] {
  _seed = Date.now();
  _usedUsernames = new Set();

  const inrRate = (liveInrRate && liveInrRate > 0) ? liveInrRate : FALLBACK_USD_INR_RATE;

  const usdtPrice = livePricesUSD?.USDT ?? 1;
  const btcPrice = livePricesUSD?.BTC ?? 87000;
  const ethPrice = livePricesUSD?.ETH ?? 2100;
  const solPrice = livePricesUSD?.SOL ?? 140;

  return [
    ...generateUSDTOffers(usdtPrice * inrRate),
    ...generateCryptoOffers("Bitcoin", "BTC", btcPrice, inrRate),
    ...generateCryptoOffers("Ethereum", "ETH", ethPrice, inrRate),
    ...generateCryptoOffers("Solana", "SOL", solPrice, inrRate),
  ];
}

// ── Filter offers (compatible with SEO pages) ──
export function filterOffers(
  offers: SeededOffer[],
  filters: {
    asset?: string;
    country?: string;
    paymentMethod?: string;
    type?: "buy" | "sell";
  }
): SeededOffer[] {
  return offers.filter((o) => {
    if (filters.asset && o.asset !== filters.asset && o.assetSymbol !== filters.asset) return false;
    if (filters.country && o.country !== filters.country) return false;
    if (filters.paymentMethod && !o.paymentMethods.includes(filters.paymentMethod)) return false;
    if (filters.type && o.type !== filters.type) return false;
    return true;
  });
}

export { countries, paymentsByCountry, currencyByCountry, assets };
