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
  formatSpread,
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
 * demo gates on this, so it is cached hard - a missing schema will not start
 * existing halfway through a session.
 */
const PROBE_TIMEOUT_MS = 5000;

export function useDemoBackend() {
  return useQuery<DemoBackendState>({
    queryKey: ["demo-backend-status"],
    queryFn: async () => {
      const probe = demoDb
        .from("demo_counterparties")
        .select("id", { head: true, count: "exact" })
        .limit(1)
        .then(({ error }) => classifyProbe(error));

      const timeout = new Promise<DemoBackendState>((_, reject) =>
        setTimeout(
          () => reject(new Error("The marketplace did not respond. Check your connection and try again.")),
          PROBE_TIMEOUT_MS,
        ),
      );

      return Promise.race([probe, timeout]);
    },
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}

// ── Price feed ───────────────────────────────────────────────────────────────

/**
 * Crypto USD prices - Binance public REST, no key, real-time.
 * USDT is a USD-pegged stablecoin; its price is always 1.0.
 */
const BINANCE_PRICE_URL =
  `https://api.binance.com/api/v3/ticker/price?symbols=${
    encodeURIComponent(JSON.stringify(["BTCUSDT", "ETHUSDT", "SOLUSDT"]))
  }`;

/**
 * FX rates: 1 USD expressed in GBP, EUR, HKD.
 *
 * Primary: open.er-api.com - free, no key, generous rate limit, CORS-friendly.
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

      // --- Step 2: FX rates (optional - degrade gracefully) -----------------
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
        fxStale = true; // FX degraded - crypto prices are still live.
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

// ── User-created sell offers ─────────────────────────────────────────────────

const REGION_BY_CURRENCY: Record<Currency, MarketRegion> = {
  USD: "US",
  GBP: "UK",
  EUR: "EU",
  HKD: "HK",
};

interface UserOfferRow {
  id: string;
  user_id: string;
  asset: string;
  remaining_amount: number;
  price: number;
  currency: string;
  payment_methods: string[];
  min_limit: number;
  max_limit: number;
  profile: {
    username: string;
    rating: number;
    trades_count: number;
    completion_rate: number;
  } | null;
}

/**
 * Active sell offers created by real users via the Create Offer dialog.
 * `offers` has no FK to `profiles`, so the seller profiles are fetched in a
 * second query and stitched in.
 */
function useUserSellOffers(asset: DemoAsset, enabled: boolean) {
  return useQuery<UserOfferRow[]>({
    queryKey: ["user-sell-offers", asset],
    queryFn: async () => {
      const { data, error } = await demoDb
        .from("offers")
        .select("id, user_id, asset, remaining_amount, price, currency, payment_methods, min_limit, max_limit")
        .eq("type", "sell")
        .eq("asset", asset)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Omit<UserOfferRow, "profile">[];
      if (rows.length === 0) return [];

      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const { data: profiles, error: profileError } = await demoDb
        .from("profiles")
        .select("user_id, username, rating, trades_count, completion_rate")
        .in("user_id", userIds);
      if (profileError) throw profileError;

      const byUser = new Map(
        (profiles ?? []).map((p: { user_id: string } & UserOfferRow["profile"]) => [p.user_id, p]),
      );
      return rows.map((r) => ({ ...r, profile: byUser.get(r.user_id) ?? null }));
    },
    enabled,
    staleTime: 30_000,
  });
}

/** Adapts a real user's `offers` row into the PricedOffer shape the marketplace renders. */
function priceUserOffer(
  row: UserOfferRow,
  asset: DemoAsset,
  localMid: number,
  usdMid: number,
): PricedOffer {
  const currency = row.currency as Currency;
  const cpRegion = REGION_BY_CURRENCY[currency];
  const price = Number(row.price);
  const localPerUsd = usdMid > 0 ? localMid / usdMid : 1;

  const counterparty: DemoCounterparty = {
    id: `user-${row.user_id}`,
    kind: "SELLER",
    display_name: row.profile?.username ?? "Community seller",
    avatar_url: null,
    verification_status: "verified",
    rating: Number(row.profile?.rating ?? 5),
    completion_rate: Number(row.profile?.completion_rate ?? 100),
    trade_count: Number(row.profile?.trades_count ?? 0),
    online_status: true,
    response_time_label: "Community listing",
    supported_assets: [row.asset],
    payment_methods: row.payment_methods,
    country_code: cpRegion,
    region: cpRegion,
    currency,
    spread_bps: 0,
    admin_mirror_id: "",
    admin_mirror_label: "",
    sort_order: 0,
    is_active: true,
  };

  return {
    id: row.id,
    counterparty_id: counterparty.id,
    side: "BUY",
    asset,
    available_amount: Number(row.remaining_amount),
    currency,
    min_limit: Number(row.min_limit),
    max_limit: Number(row.max_limit),
    min_limit_usd: Math.round(Number(row.min_limit) / localPerUsd),
    max_limit_usd: Math.round(Number(row.max_limit) / localPerUsd),
    payment_methods: row.payment_methods,
    sort_order: 0,
    is_active: true,
    counterparty,
    marketPrice: localMid,
    p2pPrice: price,
    spreadLabel: localMid > 0 ? formatSpread((price - localMid) / localMid) : "—",
    minLimitUSD: Math.round(Number(row.min_limit) / localPerUsd),
    maxLimitUSD: Math.round(Number(row.max_limit) / localPerUsd),
    isUserOffer: true,
    sellerUserId: row.user_id,
  };
}

// ── Priced offers ─────────────────────────────────────────────────────────────

export function usePricedOffers(side: TradeSide, asset: DemoAsset, region?: MarketRegion | "ALL") {
  const { data: market } = useMarketPrices();

  // User-created offers are all SELL listings, so buyers (side BUY) see them.
  const userOffersQuery = useUserSellOffers(asset, side === "BUY");

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

  const usdMid = market?.prices.USD[asset] ?? FALLBACK_MARKET_PRICES.USD[asset];

  const userPriced: PricedOffer[] =
    side === "BUY"
      ? (userOffersQuery.data ?? [])
          .filter(
            (r) =>
              (CURRENCIES as readonly string[]).includes(r.currency) &&
              Number(r.remaining_amount) > 0,
          )
          .map((r) => {
            const currency = r.currency as Currency;
            const localMid =
              market?.prices[currency]?.[asset] ?? FALLBACK_MARKET_PRICES[currency][asset];
            return priceUserOffer(r, asset, localMid, usdMid);
          })
          .filter((o) => !region || region === "ALL" || o.counterparty.region === region)
      : [];

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
        // Use the stored USD columns directly — more accurate than back-converting local currency.
        minLimitUSD: offer.min_limit_usd ?? Math.round(offer.min_limit / (usdMid > 0 ? localMid / usdMid : APPROX_FX[currency] ?? 1)),
        maxLimitUSD: offer.max_limit_usd ?? Math.round(offer.max_limit / (usdMid > 0 ? localMid / usdMid : APPROX_FX[currency] ?? 1)),
      };
    });

  const merged = [...priced, ...userPriced].sort((a, b) => {
    const byPrice = side === "BUY" ? a.p2pPrice - b.p2pPrice : b.p2pPrice - a.p2pPrice;
    if (byPrice !== 0) return byPrice;
    return Number(b.counterparty.online_status) - Number(a.counterparty.online_status);
  });

  return {
    offers: merged,
    marketPrice,
    isStale: market?.isStale ?? false,
    isLoading: offersQuery.isLoading || (side === "BUY" && userOffersQuery.isLoading),
    error: offersQuery.error,
  };
}
