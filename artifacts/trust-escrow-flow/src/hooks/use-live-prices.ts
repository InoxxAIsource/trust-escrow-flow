import { useQuery } from "@tanstack/react-query";

/**
 * Live reference prices for the home page ticker.
 *
 * Source: Binance public REST API - no key required, real-time, generous rate
 * limits for a 60 s poll. The 24h ticker endpoint returns `lastPrice` and
 * `priceChangePercent` directly, so no secondary calculation is needed.
 *
 * USDT is a stablecoin pegged to USD; Binance has no USDT/USDT pair, so its
 * price is hardcoded to 1.0 and change to ~0.
 */

export interface TickerAsset {
  id: string;
  symbol: string;
  name: string;
  /** Whether this asset can actually be traded on the platform. */
  tradeable: boolean;
}

/** Display order for the ticker strip. */
export const TICKER_ASSETS: TickerAsset[] = [
  { id: "bitcoin",      symbol: "BTC",  name: "Bitcoin",  tradeable: true  },
  { id: "ethereum",     symbol: "ETH",  name: "Ethereum", tradeable: true  },
  { id: "solana",       symbol: "SOL",  name: "Solana",   tradeable: true  },
  { id: "binancecoin",  symbol: "BNB",  name: "BNB",      tradeable: false },
  { id: "tether",       symbol: "USDT", name: "Tether",   tradeable: true  },
];

export interface LivePrice {
  symbol: string;
  name: string;
  tradeable: boolean;
  usd: number;
  /** 24h percentage change. Null when the feed omits it. */
  change24h: number | null;
}

/** Binance pair → TickerAsset metadata. USDT is handled separately. */
const BINANCE_PAIR_META: Record<string, Pick<TickerAsset, "symbol" | "name" | "tradeable">> = {
  BTCUSDT: { symbol: "BTC",  name: "Bitcoin",  tradeable: true  },
  ETHUSDT: { symbol: "ETH",  name: "Ethereum", tradeable: true  },
  SOLUSDT: { symbol: "SOL",  name: "Solana",   tradeable: true  },
  BNBUSDT: { symbol: "BNB",  name: "BNB",      tradeable: false },
};

const BINANCE_SYMBOLS = Object.keys(BINANCE_PAIR_META);

/**
 * Binance 24hr ticker. Returns lastPrice + priceChangePercent for each pair.
 * Weight = 2 per symbol (up to 40 total) - well within the 1 200 w/min limit.
 */
const BINANCE_TICKER_URL =
  `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(BINANCE_SYMBOLS))}`;

/** Display order matches TICKER_ASSETS. */
const SYMBOL_ORDER = TICKER_ASSETS.map((a) => a.symbol);

/**
 * Fallbacks are deliberately NOT provided here. A ticker exists to show the
 * live market, so inventing a number when the feed is down would be worse
 * than admitting it is unavailable. The component renders an explicit
 * unavailable state instead.
 */
export function useLivePrices() {
  return useQuery<LivePrice[]>({
    queryKey: ["live-ticker-prices"],
    queryFn: async () => {
      const res = await fetch(BINANCE_TICKER_URL);
      if (!res.ok) throw new Error(`Binance ticker responded ${res.status}`);

      const rows = (await res.json()) as Array<{
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
      }>;

      const prices: LivePrice[] = rows
        .filter((r) => BINANCE_PAIR_META[r.symbol])
        .map((r) => {
          const meta = BINANCE_PAIR_META[r.symbol];
          const usd = parseFloat(r.lastPrice);
          const change = parseFloat(r.priceChangePercent);
          if (!Number.isFinite(usd) || usd <= 0) {
            throw new Error(`Binance returned no usable price for ${r.symbol}`);
          }
          return {
            ...meta,
            usd,
            change24h: Number.isFinite(change) ? change : null,
          };
        });

      // USDT is a USD stablecoin - Binance has no self-referential pair.
      prices.push({
        symbol: "USDT",
        name: "Tether",
        tradeable: true,
        usd: 1.0,
        change24h: 0.01,
      });

      // Return in the canonical display order.
      return prices.sort(
        (a, b) => SYMBOL_ORDER.indexOf(a.symbol) - SYMBOL_ORDER.indexOf(b.symbol),
      );
    },
    refetchInterval: 20_000,
    staleTime: 10_000,
    retry: 2,
  });
}

/** Crypto needs variable precision: BTC to the dollar, USDT to four places. */
export function formatTickerPrice(usd: number): string {
  const maximumFractionDigits = usd >= 1000 ? 0 : usd >= 1 ? 2 : 4;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: usd >= 1000 ? 0 : 2,
    maximumFractionDigits,
  }).format(usd);
}

export function formatChange(change: number | null): string {
  if (change === null) return "";
  const sign = change > 0 ? "+" : change < 0 ? "−" : "";
  return `${sign}${Math.abs(change).toFixed(2)}%`;
}
