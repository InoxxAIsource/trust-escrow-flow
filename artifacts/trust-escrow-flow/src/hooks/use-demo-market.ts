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

// ── Price feed ───────────────────────────────────────────────────────────────

/**
 * Crypto USD prices — Binance public REST, no key, real-time.
 * USDT is a USD-pegged stablecoin; its price is always 1.0.
 */
const BINANCE_PRICE_URL =
  `https://api.binance.com/api/v3/ticker/price?symbols=${
    encodeURIComponent(JSON.stringify(["BTCUSDT", "ETHUSDT", "SOLUSDT"]))
  }`;

/**
 * FX rates: 1 USD expressed in GBP, EUR, HKD.
 *
 * Primary: open.er-api.com — free, no key, generous rate limit, CORS-friendly.
 * Fallback: approximate rates baked in so a failed FX fetch does not blank
 *           the marketplace; the live crypto prices are still used and only the
 *           currency conversion degrades.
 */
const FX_URL = "https://open.er-api.com/v6/latest/USD";

/** Approximate fallback rates. Updated when they drift materially. */
const APPROX_FX: Record<Currency, number> = {
  USD: 1,
  GBP: 0.785,
  EUR: 0.920,
  HKD: 7.82,
};

export interface MarketPrices {
  prices: Record<Currency, Record<DemoAsset, number>>;
  isStale: boolean;
}

/**
 * Fetches real-time mid prices in all four market currencies.
 *
 * Strategy:
 *   1. Fetch crypto/USD from Binance + FX rates from open.er-api.com in
 *      parallel.
 *   2. If FX fetch fails, use APPROX_FX (still shows live crypto prices).
 *   3. If Binance fails, fall back entirely to FALLBACK_MARKET_PRICES.
 */
export function useMarketPrices() {
  return useQuery<MarketPrices>({
    queryKey: ["demo-market-prices"],
    queryFn: async () => {
      // --- Step 1: Binance (must succeed) -----------------------------------
      let usdPrices: Record<DemoAsset, number>;
      try {
        const res = await fetch(BINANCE_PRICE_URL);
        if (!res.ok) throw new Error(`Binance ${res.status}`);
        const rows = (await res.json()) as Array<{ symbol: string; price: string }>;

        const raw: Partial<Record<DemoAsset, number>> = { USDT: 1.0 };
        for (const row of rows) {
          const p = parseFloat(row.price);
          if (!Number.isFinite(p) || p <= 0) continue;
          if (row.symbol === "BTCUSDT") raw.BTC = p;
          else if (row.symbol === "ETHUSDT") raw.ETH = p;
          else if (row.symbol === "SOLUSDT") raw.SOL = p;
        }
        if (!raw.BTC || !raw.ETH || !raw.SOL) throw new Error("Binance: incomplete");

        usdPrices = raw as Record<DemoAsset, number>;
      } catch {
        // Binance unavailable → full static fallback.
        return { prices: structuredClone(FALLBACK_MARKET_PRICES), isStale: true };
      }

      // --- Step 2: FX rates (optional — degrade gracefully) -----------------
      let fxRate: Record<Currency, number> = APPROX_FX;
      let fxStale = false;
      try {
        const res = await fetch(FX_URL);
        if (!res.ok) throw new Error(`FX ${res.status}`);
        const json = (await res.json()) as { result?: string; rates?: Record<string, number> };
        if (json.result !== "success" || !json.rates) throw new Error("FX: bad response shape");
        fxRate = {
          USD: 1,
          GBP: json.rates.GBP ?? APPROX_FX.GBP,
          EUR: json.rates.EUR ?? APPROX_FX.EUR,
          HKD: json.rates.HKD ?? APPROX_FX.HKD,
        };
      } catch {
        fxStale = true; // FX degraded — crypto prices are still live.
      }

      // --- Step 3: Build matrix ---------------------------------------------
      const prices = {} as Record<Currency, Record<DemoAsset, number>>;
      for (const currency of CURRENCIES) {
        prices[currency] = {} as Record<DemoAsset, number>;
        const rate = fxRate[currency];
        for (const asset of DEMO_ASSETS) {
          prices[currency][asset] = usdPrices[asset] * rate;
        }
      }

      return { prices, isStale: fxStale };
    },
    refetchInterval: 20_000,
    staleTime: 10_000,
    retry: 2,
  });
}

// ── Counterparties ────────────────────────────────────────────────────────────

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

// ── Priced offers ─────────────────────────────────────────────────────────────

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

  const marketPrice =
    market?.prices.USD[asset] ?? FALLBACK_MARKET_PRICES.USD[asset];

  const priced: PricedOffer[] = (offersQuery.data ?? [])
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
