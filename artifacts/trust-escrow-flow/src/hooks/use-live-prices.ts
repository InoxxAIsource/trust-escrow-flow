import { useQuery } from "@tanstack/react-query";

/**
 * Live reference prices for the home page ticker.
 *
 * Separate from `useMarketPrices` in use-demo-market, which fetches the four
 * tradeable assets across four quote currencies for pricing offers. This one
 * fetches a wider display set in USD with 24h change, and is presentation only.
 *
 * Source is CoinGecko's public simple/price endpoint: no key, no auth, and
 * generous enough limits for a 60s poll. It is rate-limited per IP, so the
 * poll interval is deliberately slower than the marketplace's.
 */

export interface TickerAsset {
  id: string;
  symbol: string;
  name: string;
  /** Whether this asset can actually be traded on the platform. */
  tradeable: boolean;
}

export const TICKER_ASSETS: TickerAsset[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", tradeable: true },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", tradeable: true },
  { id: "solana", symbol: "SOL", name: "Solana", tradeable: true },
  { id: "binancecoin", symbol: "BNB", name: "BNB", tradeable: false },
  { id: "tether", symbol: "USDT", name: "Tether", tradeable: true },
];

export interface LivePrice {
  symbol: string;
  name: string;
  tradeable: boolean;
  usd: number;
  /** 24h percentage change. Null when the feed omits it. */
  change24h: number | null;
}

const ENDPOINT =
  `https://api.coingecko.com/api/v3/simple/price?ids=${TICKER_ASSETS.map((a) => a.id).join(",")}` +
  `&vs_currencies=usd&include_24hr_change=true`;

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
      const res = await fetch(ENDPOINT);
      if (!res.ok) throw new Error(`price feed responded ${res.status}`);

      const json = (await res.json()) as Record<
        string,
        { usd?: number; usd_24h_change?: number }
      >;

      return TICKER_ASSETS.map((asset) => {
        const row = json[asset.id];
        const usd = row?.usd;
        if (typeof usd !== "number" || !Number.isFinite(usd) || usd <= 0) {
          throw new Error(`price feed returned no usable price for ${asset.symbol}`);
        }
        const change = row?.usd_24h_change;
        return {
          symbol: asset.symbol,
          name: asset.name,
          tradeable: asset.tradeable,
          usd,
          change24h: typeof change === "number" && Number.isFinite(change) ? change : null,
        };
      });
    },
    // Slower than the marketplace poll: this is decoration, and CoinGecko's
    // free tier is rate-limited per IP.
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
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
