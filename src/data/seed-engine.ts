// ============================================================
// SEED ENGINE — Fake Liquidity Generator
// Generates 50-200 realistic offers per asset on every call.
// All offers are marked is_seeded: true (NEVER exposed to UI).
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
  paymentMethod: string;
  country: string;
  username: string;
  rating: number;
  trades: number;
  completionRate: number;
  isOnline: boolean;
  isVerified: boolean;
  is_seeded: true; // INTERNAL ONLY — never expose
  lastSeen: string;
}

// ── Realistic username pools ──
const usernamePool = [
  "crypto_raj", "usdt_king", "fastpay_trader", "btc_whale", "eth_master",
  "sol_knight", "quick_trade", "safe_escrow", "p2p_pro", "coin_guru",
  "digital_cash", "fast_crypto", "trust_trade", "secure_pay", "rapid_btc",
  "smart_usdt", "prime_trader", "elite_crypto", "mega_trade", "alpha_pay",
  "trade_ninja", "crypto_lion", "chain_master", "block_trader", "hash_king",
  "defi_guru", "token_pro", "satoshi_fan", "vitalik_fan", "sol_speed",
  "pay_instant", "money_swift", "cash_flow", "gold_crypto", "diamond_trade",
  "rocket_pay", "thunder_btc", "flash_trade", "turbo_usdt", "eagle_trade",
  "stellar_pay", "nova_crypto", "apex_trader", "peak_trade", "prime_pay",
  "swift_coin", "rapid_eth", "speed_sol", "instant_usdt", "ultra_trade",
  "max_crypto", "pro_escrow", "safe_trade", "vault_pay", "shield_crypto",
  "iron_trader", "steel_pay", "titan_trade", "phoenix_btc", "dragon_eth",
  "hawk_trader", "wolf_crypto", "bear_market", "bull_run", "moon_trade",
  "lambo_pay", "hodl_king", "stake_pro", "yield_master", "swap_guru",
  "dex_trader", "nft_whale", "web3_pro", "defi_king", "chain_link",
  "node_master", "gas_saver", "block_smith", "hash_rate", "mine_crypto",
  "farm_yield", "pool_master", "liquidity_pro", "bridge_trade", "layer2_pay",
  "zk_trader", "rollup_pro", "shard_master", "consensus_pay", "validator_king",
  "relay_trade", "oracle_pro", "index_crypto", "signal_trade", "chart_master",
  "candle_pro", "trend_trader", "wave_crypto", "cycle_pay", "momentum_trade",
];

// ── Countries and payment methods ──
const countries = ["India", "USA", "UK", "Germany", "Canada", "UAE", "Singapore", "Nigeria", "Turkey", "Brazil", "Australia", "Japan", "South Korea", "Philippines", "Indonesia", "Thailand", "Vietnam", "Mexico", "Colombia", "Kenya"];

const paymentsByCountry: Record<string, string[]> = {
  India: ["UPI", "IMPS", "Bank Transfer", "PayTM", "PhonePe", "Google Pay"],
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

// Approximate USD exchange rates for generating realistic prices
export const FALLBACK_USD_INR_RATE = 83.5;

const defaultUsdRates: Record<string, number> = {
  INR: FALLBACK_USD_INR_RATE, USD: 1, GBP: 0.79, EUR: 0.92, CAD: 1.36,
  AED: 3.67, SGD: 1.34, NGN: 1550, TRY: 32.5, BRL: 4.97,
  AUD: 1.53, JPY: 151.5, KRW: 1340, PHP: 56.2,
  IDR: 15700, THB: 35.8, VND: 25000, MXN: 17.2,
  COP: 3950, KES: 153,
};

let usdRates = { ...defaultUsdRates };

const assets = [
  { name: "USDT", symbol: "USDT", baseUSD: 1 },
  { name: "Bitcoin", symbol: "BTC", baseUSD: 68500 },
  { name: "Ethereum", symbol: "ETH", baseUSD: 2050 },
  { name: "Solana", symbol: "SOL", baseUSD: 86 },
];

// ── Deterministic seeded random (consistent per session, rotates on refresh) ──
let _seed = Date.now();
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed & 0x7fffffff) / 0x7fffffff;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

function randBetween(min: number, max: number): number {
  return min + seededRandom() * (max - min);
}

function generateId(): string {
  return `seed-${Math.floor(seededRandom() * 1e12).toString(36)}`;
}

function generateUsername(): string {
  const base = pick(usernamePool);
  const suffix = Math.floor(seededRandom() * 99) + 1;
  return seededRandom() > 0.5 ? `${base}_${suffix}` : base;
}

// ── Main generator ──
function generateOffersForAsset(
  asset: typeof assets[0],
  livePriceUSD?: number,
  count?: number
): SeededOffer[] {
  const offerCount = count ?? Math.floor(randBetween(50, 200));
  const basePriceUSD = livePriceUSD ?? asset.baseUSD;
  const offers: SeededOffer[] = [];

  for (let i = 0; i < offerCount; i++) {
    const type: "buy" | "sell" = seededRandom() > 0.45 ? "sell" : "buy";
    const country = pick(countries);
    const currency = currencyByCountry[country];
    const rate = usdRates[currency] ?? 1;
    const payments = paymentsByCountry[country] ?? ["Bank Transfer"];
    const paymentMethod = pick(payments);

    // Margin: sell = +10-12%, buy = +2-5% (ALWAYS above market)
    const marginPct = type === "sell"
      ? randBetween(10, 12)
      : randBetween(2, 5);

    const marketPriceLocal = +(basePriceUSD * rate).toFixed(2);
    const price = +(marketPriceLocal * (1 + marginPct / 100)).toFixed(2);

    // Realistic limits
    const minBase = type === "sell" ? 50 : 100;
    const maxBase = type === "sell" ? 50000 : 100000;
    const minLimit = Math.round(randBetween(minBase, minBase * 5) * rate);
    const maxLimit = Math.round(randBetween(maxBase * 0.5, maxBase) * rate);

    const trades = Math.floor(randBetween(50, 5000));
    const rating = +(randBetween(4.2, 5.0)).toFixed(1);

    offers.push({
      id: generateId(),
      type,
      asset: asset.name,
      assetSymbol: asset.symbol,
      price,
      marketPrice: marketPriceLocal,
      margin: `+${marginPct.toFixed(1)}%`,
      minLimit: Math.max(minLimit, 1),
      maxLimit: Math.max(maxLimit, minLimit + 1),
      paymentMethod,
      country,
      username: generateUsername(),
      rating: Math.min(rating, 5.0),
      trades,
      completionRate: +(randBetween(94, 100)).toFixed(1),
      isOnline: seededRandom() > 0.3,
      isVerified: seededRandom() > 0.2,
      is_seeded: true,
      lastSeen: seededRandom() > 0.5 ? "Online" : `${Math.floor(randBetween(1, 30))}m ago`,
    });
  }

  return offers;
}

export interface LivePrices {
  USDT: number;
  BTC: number;
  ETH: number;
  SOL: number;
}

// Generate ALL offers across all assets
export function generateAllOffers(livePricesUSD?: Partial<LivePrices>, liveInrRate?: number): SeededOffer[] {
  // Reset seed on each call for rotation on refresh
  _seed = Date.now();

  // Update INR rate if we have a live one
  if (liveInrRate && liveInrRate > 0) {
    usdRates.INR = liveInrRate;
  }

  return assets.flatMap((asset) => {
    const livePrice = livePricesUSD?.[asset.symbol as keyof LivePrices];
    return generateOffersForAsset(asset, livePrice);
  });
}

// Filter offers for SEO pages
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
    if (filters.paymentMethod && o.paymentMethod !== filters.paymentMethod) return false;
    if (filters.type && o.type !== filters.type) return false;
    return true;
  });
}

// Export for use in SEO pages
export { countries, paymentsByCountry, currencyByCountry, assets };
