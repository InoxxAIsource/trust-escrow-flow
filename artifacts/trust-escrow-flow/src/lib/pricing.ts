/**
 * Centralised P2P pricing.
 *
 * Every price shown anywhere in the demo marketplace derives from this module.
 * Nothing downstream is allowed to hardcode a final figure — offer cards, the
 * order ticket, the trade page and the receipt all call `quote()` so a single
 * reference price can never disagree with itself across two screens.
 *
 * Each counterparty quotes its own spread, stored as basis points on
 * `demo_counterparties.spread_bps`:
 *
 *   SELLER — a 4.00%-6.00% premium over mid (the visitor is buying).
 *   BUYER  — a 2.00%-4.00% discount under mid (the visitor is selling).
 *
 * The spread is stored, not generated at read time. Re-rolling it per render
 * would make the order ticket disagree with the card the user clicked and
 * would change the agreed price of an already-open trade.
 */

export type TradeSide = "BUY" | "SELL";
export type DemoAsset = "BTC" | "ETH" | "SOL" | "USDT";
export type MarketRegion = "US" | "UK" | "EU" | "HK";

export const DEMO_ASSETS: readonly DemoAsset[] = ["BTC", "ETH", "SOL", "USDT"] as const;

export const MARKET_REGIONS: ReadonlyArray<{ code: MarketRegion; label: string }> = [
  { code: "US", label: "United States" },
  { code: "UK", label: "United Kingdom" },
  { code: "EU", label: "Europe" },
  { code: "HK", label: "Hong Kong" },
] as const;

/** Seller premiums live in this band. Mirrors the CHECK on demo_counterparties. */
export const BUY_PREMIUM_BPS_MIN = 400;
export const BUY_PREMIUM_BPS_MAX = 600;

/** Buyer discounts live in this band. */
export const SELL_DISCOUNT_BPS_MIN = 200;
export const SELL_DISCOUNT_BPS_MAX = 400;

/** Used only for the marketplace reference strip, never for a real order. */
export const REFERENCE_BUY_PREMIUM_BPS = 500;
export const REFERENCE_SELL_DISCOUNT_BPS = 300;

const BPS_PER_UNIT = 10_000;

export interface Quote {
  side: TradeSide;
  /** Reference mid price from the live feed. */
  marketPrice: number;
  /** The price the visitor actually transacts at. */
  p2pPrice: number;
  /** Signed fraction vs mid: positive for BUY, negative for SELL. */
  spread: number;
  /** Presentation string, e.g. "+4.12%" / "−2.15%". */
  spreadLabel: string;
}

/**
 * Derives the P2P price for a side from a reference market price and the
 * counterparty's own spread.
 *
 * @param spreadBps premium (BUY) or discount (SELL) in basis points.
 * @throws if either input is unusable — a silent 0 here would render a free
 *         trade, so this fails loudly instead.
 */
export function quote(side: TradeSide, marketPrice: number, spreadBps: number): Quote {
  if (!Number.isFinite(marketPrice) || marketPrice <= 0) {
    throw new Error(`quote(): marketPrice must be a positive number, received ${marketPrice}`);
  }
  if (!Number.isFinite(spreadBps) || spreadBps < 0) {
    throw new Error(`quote(): spreadBps must be a non-negative number, received ${spreadBps}`);
  }

  const magnitude = spreadBps / BPS_PER_UNIT;
  const spread = side === "BUY" ? magnitude : -magnitude;

  return {
    side,
    marketPrice,
    p2pPrice: marketPrice * (1 + spread),
    spread,
    spreadLabel: formatSpread(spread),
  };
}

/** "+4.12%" / "−2.15%" — always signed, always two decimals. */
export function formatSpread(spread: number): string {
  const pct = spread * 100;
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${Math.abs(pct).toFixed(2)}%`;
}

/** "4.00% – 6.00%" for the reference strip, which describes a band not a price. */
export function formatBpsRange(minBps: number, maxBps: number): string {
  return `${(minBps / 100).toFixed(2)}% – ${(maxBps / 100).toFixed(2)}%`;
}

/**
 * Order total in quote currency. Rounded to cents at the boundary so the
 * figure the user agrees to is the same one the database validates.
 */
export function orderTotal(amount: number, unitPrice: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`orderTotal(): amount must be positive, received ${amount}`);
  }
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    throw new Error(`orderTotal(): unitPrice must be positive, received ${unitPrice}`);
  }
  return round2(amount * unitPrice);
}

export function round2(value: number): number {
  // Scale-and-round rather than toFixed to avoid the string round-trip.
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Currencies the demo quotes in, one per market. */
export const CURRENCIES = ["USD", "GBP", "EUR", "HKD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_BY_REGION: Record<MarketRegion, Currency> = {
  US: "USD",
  UK: "GBP",
  EU: "EUR",
  HK: "HKD",
};

/** CoinGecko takes lowercase currency codes in `vs_currencies`. */
export const CURRENCY_QUERY = CURRENCIES.map((c) => c.toLowerCase()).join(",");

/**
 * Money formatting in a given currency.
 *
 * Locale is chosen per currency so the symbol and grouping match local
 * convention: GBP renders as £1,234.56 in en-GB, EUR as €1.234,56 in de-DE.
 */
export function formatMoney(value: number, currency: Currency = "USD"): string {
  const locales: Record<Currency, string> = {
    USD: "en-US",
    GBP: "en-GB",
    EUR: "de-DE",
    HKD: "en-HK",
  };
  return new Intl.NumberFormat(locales[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** USD money formatting. Kept for surfaces that are USD by definition. */
export function formatUsd(value: number): string {
  return formatMoney(value, "USD");
}

/**
 * Asset quantities need very different precision — 0.00042 BTC and
 * 250,000 USDT both have to read correctly.
 */
export function formatAssetAmount(amount: number, asset: DemoAsset): string {
  const decimals: Record<DemoAsset, number> = {
    BTC: 6,
    ETH: 5,
    SOL: 3,
    USDT: 2,
  };
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals[asset],
  }).format(amount);
}

/** CoinGecko ids, kept next to the asset list they map. */
export const COINGECKO_IDS: Record<DemoAsset, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  USDT: "tether",
};

/**
 * Fallback mid prices used only when the live feed is unreachable, so the
 * marketplace degrades to something plausible instead of an empty grid.
 * Static by design: a demo that silently invents moving prices is worse than
 * one that admits the ticker is stale.
 */
export const FALLBACK_MARKET_PRICES: Record<Currency, Record<DemoAsset, number>> = {
  USD: { BTC: 100000, ETH: 3500, SOL: 200, USDT: 1 },
  GBP: { BTC: 79000, ETH: 2765, SOL: 158, USDT: 0.79 },
  EUR: { BTC: 92000, ETH: 3220, SOL: 184, USDT: 0.92 },
  HKD: { BTC: 782000, ETH: 27370, SOL: 1564, USDT: 7.82 },
};
