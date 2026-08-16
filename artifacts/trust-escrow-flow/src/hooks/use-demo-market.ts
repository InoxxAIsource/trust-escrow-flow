import { useQuery } from "@tanstack/react-query";
import {
  demoDb,
  type DemoCounterparty,
  type DemoOffer,
  type PricedOffer,
} from "@/integrations/supabase/demo";
import { classifyProbe, type DemoBackendState } from "@/lib/demo-backend";
import {
  quote,
  DEMO_ASSETS,
  FALLBACK_MARKET_PRICES,
  CURRENCIES,
  type Currency,
  type DemoAsset,
  type MarketRegion,
  type TradeSide,
} from "@/lib/pricing";

/**
 * Probes whether the demo migrations have been applied. Everything else in the
 * demo gates on this, so it is cached hard — a missing schema will not start
 * existing halfway through a session.
 */
/** Unreachable DNS can hang a fetch for ~30s; fail the probe well before that. */
const PROBE_TIMEOUT_MS = 8000;

export function useDemoBackend() {
  return useQuery<DemoBackendState>({
    queryKey: ["demo-backend-status"],
    queryFn: async () => {
      const probe = demoDb
        .from("demo_counterparties")
        .select("id", { head: true, count: "exact" })
        .limit(1)
        .then(({ error }) => classifyProbe(error));

      // Race rather than abort: a hung socket should surface a usable message,
      // not leave the marketplace on a spinner until the browser gives up.
      const timeout = new Promise<DemoBackendState>((resolve) =>
        setTimeout(
          () =>
            resolve({
              status: "error",
              message: "The demo backend did not respond. Check your connection and reload.",
            }),
          PROBE_TIMEOUT_MS,
        ),
      );

      return Promise.race([probe, timeout]);
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}

/**
 * Real-time crypto prices via Binance public REST (no key, no rate-limit for
 * 30 s polls), converted to all market currencies via the Frankfurter FX API
 * (free, no key, updated continuously throughout the trading day).
 *
 * USDT is a stablecoin — its USD price is 1.0 by definition. Local prices are
 * derived by applying the USD→local FX rate, which is the correct approach
 * rather than fetching a USDT/GBP pair from Binance (thin or unavailable).
 *
 * Falls back to static figures rather than throwing, so a rate-limited feed
 * never blanks the marketplace, and the staleness is surfaced so the UI can
 * say so out loud.
 */

/** Binance price endpoint — returns { symbol, price } array. Weight = 2/symbol. */
const BINANCE_PRICE_URL =
  `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(
    JSON.stringify(["BTCUSDT", "ETHUSDT", "SOLUSDT"]),
  )}`;

/** Frankfurter — converts 1 USD into GBP, EUR, HKD. Free, no key, ~daily updates. */
const FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=USD&to=GBP,EUR,HKD";

export interface MarketPrices {
  /** Live mid price per asset, per quote currency. */
  prices: Record<Currency, Record<DemoAsset, number>>;
  /** True when the live feed failed and fallback figures are on screen. */
  isStale: boolean;
}

export function useMarketPrices() {
  return useQuery<MarketPrices>({
    queryKey: ["demo-market-prices"],
    queryFn: async () => {
      try {
        const [binanceRes, fxRes] = await Promise.all([
          fetch(BINANCE_PRICE_URL),
          fetch(FRANKFURTER_URL),
        ]);

        if (!binanceRes.ok) throw new Error(`Binance responded ${binanceRes.status}`);
        if (!fxRes.ok) throw new Error(`FX feed responded ${fxRes.status}`);

        const binanceRows = (await binanceRes.json()) as Array<{
          symbol: string;
          price: string;
        }>;
        const fxJson = (await fxRes.json()) as {
          rates: { GBP: number; EUR: number; HKD: number };
        };

        // USD mid prices from Binance.
        const usd: Record<DemoAsset, number> = {
          BTC: 0,
          ETH: 0,
          SOL: 0,
          USDT: 1.0, // stablecoin — always 1 USD by design
        };

        for (const row of binanceRows) {
          const price = parseFloat(row.price);
          if (!Number.isFinite(price) || price <= 0) continue;
          if (row.symbol === "BTCUSDT") usd.BTC = price;
          else if (row.symbol === "ETHUSDT") usd.ETH = price;
          else if (row.symbol === "SOLUSDT") usd.SOL = price;
        }

        if (!usd.BTC || !usd.ETH || !usd.SOL) {
          throw new Error("Binance returned incomplete prices");
        }

        // FX rates: 1 USD expressed in each quote currency.
        const fxRate: Record<Currency, number> = {
          USD: 1,
          GBP: fxJson.rates.GBP,
          EUR: fxJson.rates.EUR,
          HKD: fxJson.rates.HKD,
        };

        const prices = {} as Record<Currency, Record<DemoAsset, number>>;
        for (const currency of CURRENCIES) {
          prices[currency] = {} as Record<DemoAsset, number>;
          const rate = fxRate[currency];
          for (const asset of DEMO_ASSETS) {
            prices[currency][asset] = usd[asset] * rate;
          }
        }

        return { prices, isStale: false };
      } catch {
        return { prices: structuredClone(FALLBACK_MARKET_PRICES), isStale: true };
      }
    },
    refetchInterval: 20_000,
    staleTime: 10_000,
    retry: 2,
  });
}

export function useDemoCounterparties(kind?: "SELLER" | "BUYER") {
  return useQuery<DemoCounterparty[]>({
    queryKey: ["demo-counterparties", kind ?? "all"],
    queryFn: async () => {
      let q = demoDb.from("demo_counterparties").select("*").eq("is_active", true);
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q.order("sort_order");
      if (error) throw error;
      return (data ?? []) as DemoCounterparty[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useDemoCounterparty(id: string | undefined) {
  return useQuery<DemoCounterparty | null>({
    queryKey: ["demo-counterparty", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await demoDb
        .from("demo_counterparties")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as DemoCounterparty | null;
    },
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

/**
 * Offers for one side/asset, joined to their counterparty and priced from the
 * live feed using that counterparty's own stored spread.
 *
 * Pricing happens here rather than in the card so every consumer of an offer
 * sees the same number, and the result is sorted by price — best deal first,
 * which is what makes the spread between competing sellers legible.
 */
export function usePricedOffers(side: TradeSide, asset: DemoAsset, region?: MarketRegion | "ALL") {
  const { data: market } = useMarketPrices();

  const offersQuery = useQuery<Array<DemoOffer & { counterparty: DemoCounterparty }>>({
    queryKey: ["demo-offers", side, asset],
    queryFn: async () => {
      const { data, error } = await demoDb
        .from("demo_offers")
        .select("*, counterparty:demo_counterparties(*)")
        .eq("side", side)
        .eq("asset", asset)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Array<DemoOffer & { counterparty: DemoCounterparty }>;
    },
    staleTime: 60_000,
  });

  // Headline reference price for the strip. Individual offers are priced in
  // their own counterparty's currency below.
  const marketPrice =
    market?.prices.USD[asset] ?? FALLBACK_MARKET_PRICES.USD[asset];

  const priced: PricedOffer[] = (offersQuery.data ?? [])
    // A counterparty row can be absent if it was deactivated mid-flight.
    .filter((o) => !!o.counterparty)
    .filter((o) => !region || region === "ALL" || o.counterparty.region === region)
    .map((offer) => {
      const currency = (offer.currency ?? offer.counterparty.currency ?? "USD") as Currency;
      const localMid =
        market?.prices[currency]?.[asset] ?? FALLBACK_MARKET_PRICES[currency][asset];
      const q = quote(side, localMid, offer.counterparty.spread_bps);
      return {
        ...offer,
        currency,
        marketPrice: q.marketPrice,
        p2pPrice: q.p2pPrice,
        spreadLabel: q.spreadLabel,
      };
    })
    // Buying: cheapest first. Selling: highest payout first. Either way the
    // best price for the visitor leads, with online sellers breaking ties.
    .sort((a, b) => {
      const byPrice = side === "BUY" ? a.p2pPrice - b.p2pPrice : b.p2pPrice - a.p2pPrice;
      if (byPrice !== 0) return byPrice;
      return Number(b.counterparty.online_status) - Number(a.counterparty.online_status);
    });

  return {
    offers: priced,
    marketPrice,
    isStale: market?.isStale ?? false,
    isLoading: offersQuery.isLoading,
    error: offersQuery.error,
  };
}
