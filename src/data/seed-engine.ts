// ============================================================
// SEED ENGINE — Multi-Country P2P Offer Generator
// Generates offers across multiple countries with proper
// currency symbols, payment methods, and pricing.
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
  currency: string;
  currencySymbol: string;
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

// ── Country Configuration ──
export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  fxRate: number; // fallback USD→local rate
  paymentMethods: string[];
  usernames: string[];
  offerCount: { usdt: [number, number]; crypto: [number, number] }; // [sell, buy] counts
}

export const countryConfigs: CountryConfig[] = [
  {
    code: "IN",
    name: "India",
    currency: "INR",
    currencySymbol: "₹",
    fxRate: 85.5,
    paymentMethods: ["UPI", "Bank Transfer", "IMPS"],
    usernames: [
      "crypto_raj", "delhi_trader", "usdt_pro_india", "mumbai_btc",
      "bangalore_crypto", "upi_king", "fast_rupee", "indian_whale",
      "trade_master_in", "coin_raja", "digital_rupee", "desi_trader",
      "p2p_guru_india", "safe_trade_in", "instant_pay_in",
      "quick_crypto_in", "trust_trader_in", "escrow_pro_in",
      "secure_coin_in", "rapid_trade_in", "prime_crypto_in",
    ],
    offerCount: { usdt: [12, 9], crypto: [5, 5] },
  },
  {
    code: "US",
    name: "USA",
    currency: "USD",
    currencySymbol: "$",
    fxRate: 1,
    paymentMethods: ["PayPal", "Bank Transfer", "Zelle", "Venmo", "CashApp"],
    usernames: [
      "us_crypto_pro", "ny_trader", "silicon_btc", "dollar_king",
      "paypal_trader", "zelle_fast", "venmo_crypto", "cashapp_deal",
      "usa_escrow", "liberty_coin", "eagle_trade", "star_crypto",
    ],
    offerCount: { usdt: [8, 6], crypto: [4, 4] },
  },
  {
    code: "AE",
    name: "UAE",
    currency: "AED",
    currencySymbol: "د.إ",
    fxRate: 3.67,
    paymentMethods: ["Bank Transfer", "Cash Deposit"],
    usernames: [
      "dubai_crypto", "uae_trader", "gulf_btc", "dirham_king",
      "abu_dhabi_trade", "emirates_coin", "palm_crypto", "desert_trade",
    ],
    offerCount: { usdt: [6, 4], crypto: [3, 3] },
  },
  {
    code: "GB",
    name: "UK",
    currency: "GBP",
    currencySymbol: "£",
    fxRate: 0.79,
    paymentMethods: ["Bank Transfer", "Faster Payments", "Revolut"],
    usernames: [
      "london_trader", "uk_crypto_pro", "sterling_btc", "pound_king",
      "brit_escrow", "thames_coin", "royal_trade", "oxford_crypto",
    ],
    offerCount: { usdt: [6, 4], crypto: [3, 3] },
  },
  {
    code: "NG",
    name: "Nigeria",
    currency: "NGN",
    currencySymbol: "₦",
    fxRate: 1550,
    paymentMethods: ["Bank Transfer", "OPay", "Kuda"],
    usernames: [
      "lagos_crypto", "naija_trader", "naira_king", "abuja_btc",
      "opay_fast", "kuda_trade", "9ja_escrow", "afro_coin",
    ],
    offerCount: { usdt: [6, 4], crypto: [3, 3] },
  },
  {
    code: "PH",
    name: "Philippines",
    currency: "PHP",
    currencySymbol: "₱",
    fxRate: 56.5,
    paymentMethods: ["GCash", "Bank Transfer", "Maya"],
    usernames: [
      "manila_crypto", "ph_trader", "peso_king", "gcash_fast",
      "maya_trade", "cebu_coin", "pinoy_escrow", "island_btc",
    ],
    offerCount: { usdt: [6, 4], crypto: [3, 3] },
  },
];

// ── Constants ──
export const FALLBACK_USD_INR_RATE = 85.5;

const assets = [
  { name: "USDT", symbol: "USDT", baseUSD: 1 },
  { name: "Bitcoin", symbol: "BTC", baseUSD: 87000 },
  { name: "Ethereum", symbol: "ETH", baseUSD: 2100 },
  { name: "Solana", symbol: "SOL", baseUSD: 140 },
];

// Legacy exports for SEO pages compatibility
const countries = countryConfigs.map((c) => c.name);

const paymentsByCountry: Record<string, string[]> = {};
const currencyByCountry: Record<string, string> = {};
countryConfigs.forEach((c) => {
  paymentsByCountry[c.name] = c.paymentMethods;
  currencyByCountry[c.name] = c.currency;
});

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
function assignPaymentMethods(country: CountryConfig, maxLimit: number): string[] {
  const methods = country.paymentMethods;
  if (methods.length === 1) return [...methods];
  if (maxLimit > 500000 * country.fxRate / 85.5) return [methods.find((m) => m === "Bank Transfer") ?? methods[0]];
  if (maxLimit <= 100000 * country.fxRate / 85.5) {
    return seededRandom() > 0.3 ? [methods[0]] : [methods[0], methods[1] ?? methods[0]];
  }
  return seededRandom() > 0.5 ? [methods[0], methods[1] ?? methods[0]] : [methods[1] ?? methods[0], methods[0]];
}

// ── Inverse liquidity: lower price → higher amount ──
function computeAvailableAmount(priceRatio: number, fxRate: number): number {
  const inverted = 1 - priceRatio;
  const baseAmount = 50000 + inverted * 450000;
  return Math.round(baseAmount * fxRate / 85.5); // scale to local currency
}

function computeLimits(availableAmount: number, fxRate: number): { minLimit: number; maxLimit: number } {
  const minLimit = Math.round(1000 * fxRate / 85.5);
  const maxLimit = Math.min(availableAmount, Math.round(500000 * fxRate / 85.5));
  return { minLimit, maxLimit: Math.max(maxLimit, minLimit + Math.round(10000 * fxRate / 85.5)) };
}

// ── Pick unique username ──
let _usedUsernames: Set<string> = new Set();
function pickUsername(pool: string[]): string {
  for (let attempt = 0; attempt < 100; attempt++) {
    const idx = Math.floor(seededRandom() * pool.length);
    const name = pool[idx];
    if (!_usedUsernames.has(name)) {
      _usedUsernames.add(name);
      return name;
    }
  }
  const base = pool[Math.floor(seededRandom() * pool.length)];
  const suffix = Math.floor(seededRandom() * 99) + 1;
  const fallback = `${base}_${suffix}`;
  _usedUsernames.add(fallback);
  return fallback;
}

// ── Trader profile ──
function generateTrader(country: CountryConfig) {
  return {
    username: pickUsername(country.usernames),
    rating: +randBetween(4.2, 5.0).toFixed(1),
    trades: Math.floor(randBetween(100, 5000)),
    completionRate: +randBetween(94, 100).toFixed(1),
    isOnline: seededRandom() > 0.25,
    isVerified: seededRandom() > 0.15,
    lastSeen: seededRandom() > 0.5 ? "Online" : `${Math.floor(randBetween(1, 20))}m ago`,
  };
}

// ── USDT Offer Generator (per country) ──
// STRICT RULE: USDT sell-type offers (shown on Buy tab) MUST be ₹97–₹110.
// USDT buy-type offers (shown on Sell tab) MUST be ₹92–₹96.
// For non-INR countries, scale these INR bands by fxRate / INR-rate.
function generateUSDTOffers(country: CountryConfig, usdtPriceLocal: number): SeededOffer[] {
  const offers: SeededOffer[] = [];
  const marketPrice = usdtPriceLocal;
  const [sellCount, buyCount] = country.offerCount.usdt;

  // INR reference bands
  const INR_SELL_MIN = 97;
  const INR_SELL_MAX = 110;
  const INR_BUY_MIN = 92;
  const INR_BUY_MAX = 96;
  // Convert INR band → local currency band using fxRate (local per USD) vs 85.5 (INR per USD baseline)
  const localScale = country.fxRate / 85.5;
  const sellMin = INR_SELL_MIN * localScale;
  const sellMax = INR_SELL_MAX * localScale;
  const buyMin = INR_BUY_MIN * localScale;
  const buyMax = INR_BUY_MAX * localScale;

  // SELL offers (shown on Buy tab): strict band sellMin..sellMax
  for (let i = 0; i < sellCount; i++) {
    const ratio = sellCount > 1 ? i / (sellCount - 1) : 0;
    const rawPrice = sellMin + ratio * (sellMax - sellMin) + randBetween(-0.4, 0.4) * localScale;
    const price = +Math.min(sellMax, Math.max(sellMin, rawPrice)).toFixed(2);
    const marginPct = +((price / marketPrice - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio, country.fxRate);
    const { minLimit, maxLimit } = computeLimits(availableAmount, country.fxRate);

    offers.push({
      id: generateId(),
      type: "sell",
      asset: "USDT",
      assetSymbol: "USDT",
      price,
      marketPrice: +marketPrice.toFixed(2),
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods: assignPaymentMethods(country, maxLimit),
      country: country.name,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      ...generateTrader(country),
      is_seeded: true,
    });
  }

  // BUY offers: slightly above market
  for (let i = 0; i < buyCount; i++) {
    const ratio = buyCount > 1 ? i / (buyCount - 1) : 0;
    const multiplier = 1.01 + ratio * 0.04; // +1% to +5%
    const price = +(marketPrice * multiplier + randBetween(-0.3, 0.3) * country.fxRate).toFixed(2);
    const marginPct = +((price / marketPrice - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio, country.fxRate);
    const { minLimit, maxLimit } = computeLimits(availableAmount, country.fxRate);

    offers.push({
      id: generateId(),
      type: "buy",
      asset: "USDT",
      assetSymbol: "USDT",
      price,
      marketPrice: +marketPrice.toFixed(2),
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods: assignPaymentMethods(country, maxLimit),
      country: country.name,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      ...generateTrader(country),
      is_seeded: true,
    });
  }

  return offers;
}

// ── BTC/ETH/SOL Generator (per country) ──
function generateCryptoOffers(
  assetName: string,
  assetSymbol: string,
  livePriceUSD: number,
  country: CountryConfig
): SeededOffer[] {
  const offers: SeededOffer[] = [];
  const marketPriceLocal = +(livePriceUSD * country.fxRate).toFixed(2);
  const [sellCount, buyCount] = country.offerCount.crypto;

  // SELL offers: +10% above market
  for (let i = 0; i < sellCount; i++) {
    const ratio = sellCount > 1 ? i / (sellCount - 1) : 0;
    const variation = 1.10 + randBetween(-0.005, 0.005);
    const price = +(marketPriceLocal * variation).toFixed(2);
    const marginPct = +((price / marketPriceLocal - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio, country.fxRate);
    const { minLimit, maxLimit } = computeLimits(availableAmount, country.fxRate);

    offers.push({
      id: generateId(),
      type: "sell",
      asset: assetName,
      assetSymbol,
      price,
      marketPrice: marketPriceLocal,
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods: assignPaymentMethods(country, maxLimit),
      country: country.name,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      ...generateTrader(country),
      is_seeded: true,
    });
  }

  // BUY offers: +2% above market
  for (let i = 0; i < buyCount; i++) {
    const ratio = buyCount > 1 ? i / (buyCount - 1) : 0;
    const variation = 1.02 + randBetween(-0.005, 0.005);
    const price = +(marketPriceLocal * variation).toFixed(2);
    const marginPct = +((price / marketPriceLocal - 1) * 100).toFixed(1);
    const availableAmount = computeAvailableAmount(ratio, country.fxRate);
    const { minLimit, maxLimit } = computeLimits(availableAmount, country.fxRate);

    offers.push({
      id: generateId(),
      type: "buy",
      asset: assetName,
      assetSymbol,
      price,
      marketPrice: marketPriceLocal,
      margin: `+${Math.max(marginPct, 0.1).toFixed(1)}%`,
      minLimit,
      maxLimit,
      availableAmount,
      paymentMethods: assignPaymentMethods(country, maxLimit),
      country: country.name,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      ...generateTrader(country),
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

  const allOffers: SeededOffer[] = [];

  for (const country of countryConfigs) {
    // Compute local FX rate: use live INR rate to scale other currencies
    const localFxRate = country.code === "IN" ? inrRate : country.fxRate;

    allOffers.push(...generateUSDTOffers(country, usdtPrice * localFxRate));
    allOffers.push(...generateCryptoOffers("Bitcoin", "BTC", btcPrice, { ...country, fxRate: localFxRate }));
    allOffers.push(...generateCryptoOffers("Ethereum", "ETH", ethPrice, { ...country, fxRate: localFxRate }));
    allOffers.push(...generateCryptoOffers("Solana", "SOL", solPrice, { ...country, fxRate: localFxRate }));
  }

  return allOffers;
}

// ── Filter offers ──
export function filterOffers(
  offers: SeededOffer[],
  filters: {
    asset?: string;
    country?: string;
    currency?: string;
    paymentMethod?: string;
    type?: "buy" | "sell";
  }
): SeededOffer[] {
  return offers.filter((o) => {
    if (filters.asset && o.asset !== filters.asset && o.assetSymbol !== filters.asset) return false;
    if (filters.country && o.country !== filters.country) return false;
    if (filters.currency && o.currency !== filters.currency) return false;
    if (filters.paymentMethod && !o.paymentMethods.includes(filters.paymentMethod)) return false;
    if (filters.type && o.type !== filters.type) return false;
    return true;
  });
}

// ── Helper exports ──
export function getCountryPaymentMethods(countryName: string): string[] {
  return countryConfigs.find((c) => c.name === countryName)?.paymentMethods ?? [];
}

export function getCountryCurrency(countryName: string): { code: string; symbol: string } {
  const c = countryConfigs.find((c) => c.name === countryName);
  return { code: c?.currency ?? "INR", symbol: c?.currencySymbol ?? "₹" };
}

export function getAllCountries(): string[] {
  return countryConfigs.map((c) => c.name);
}

export function getAllCurrencies(): { code: string; symbol: string; country: string }[] {
  return countryConfigs.map((c) => ({ code: c.currency, symbol: c.currencySymbol, country: c.name }));
}

export { countries, paymentsByCountry, currencyByCountry, assets };
