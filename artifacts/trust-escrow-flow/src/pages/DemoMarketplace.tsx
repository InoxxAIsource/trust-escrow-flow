import { useState } from "react";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DemoBackendNotice } from "@/components/demo/DemoIndicators";
import { DemoOfferCard } from "@/components/marketplace/DemoOfferCard";
import { OrderTicketDialog } from "@/components/marketplace/OrderTicketDialog";
import { useDemoBackend, usePricedOffers } from "@/hooks/use-demo-market";
import {
  formatUsd,
  formatMoney,
  formatBpsRange,
  DEMO_ASSETS,
  MARKET_REGIONS,
  BUY_PREMIUM_BPS_MIN,
  BUY_PREMIUM_BPS_MAX,
  SELL_DISCOUNT_BPS_MIN,
  SELL_DISCOUNT_BPS_MAX,
  type DemoAsset,
  type MarketRegion,
  type TradeSide,
} from "@/lib/pricing";
import type { PricedOffer } from "@/integrations/supabase/demo";

export default function DemoMarketplace() {
  const [side, setSide] = useState<TradeSide>("BUY");
  const [asset, setAsset] = useState<DemoAsset>("BTC");
  const [region, setRegion] = useState<MarketRegion | "ALL">("ALL");
  const [selected, setSelected] = useState<PricedOffer | null>(null);

  const { data: backend, isLoading: backendLoading } = useDemoBackend();
  const { offers, marketPrice, isStale, isLoading } = usePricedOffers(side, asset, region);

  const isBuy = side === "BUY";
  // The reference strip describes the band counterparties quote within, not a
  // single price — each one has its own spread, shown on its card.
  const bandLabel = isBuy
    ? formatBpsRange(BUY_PREMIUM_BPS_MIN, BUY_PREMIUM_BPS_MAX)
    : formatBpsRange(SELL_DISCOUNT_BPS_MIN, SELL_DISCOUNT_BPS_MAX);
  const bestOffer = offers[0] ?? null;

  return (
    <div className="container py-8 md:py-12">
      <SEOHead
        title="P2P Marketplace — P2PxBT"
        description="Buy and sell BTC, ETH, SOL and USDT peer-to-peer across the US, UK, Europe and Hong Kong."
        canonical="https://p2pxbt.com/marketplace"
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
        ]}
      />

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Marketplace
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Buy and sell BTC, ETH, SOL and USDT across four markets.
          </p>
        </div>
      </header>

      {backendLoading ? (
        <LoadingBlock label="Connecting to the marketplace…" />
      ) : backend && backend.status !== "ready" ? (
        <DemoBackendNotice state={backend} />
      ) : (
        <>

          {/* Reference pricing strip */}
          <Card className="mb-6">
            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              <PriceStat label="Market price (USD)" value={formatUsd(marketPrice)} />
              <PriceStat
                label={
                  bestOffer
                    ? `${isBuy ? "Best buy price" : "Best sell price"} (${bestOffer.currency})`
                    : isBuy
                      ? "Best buy price"
                      : "Best sell price"
                }
                /* The leading offer may be from any market, so it must be
                   formatted in its own currency. Rendering a GBP figure with a
                   dollar sign is worse than showing no figure at all. */
                value={bestOffer ? formatMoney(bestOffer.p2pPrice, bestOffer.currency) : "—"}
                delta={bestOffer?.spreadLabel}
                tone={isBuy ? "premium" : "discount"}
                icon={
                  isBuy ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />
                }
              />
              <PriceStat
                label={isBuy ? "Seller premium range" : "Buyer discount range"}
                value={bandLabel}
              />
            </CardContent>
          </Card>

          {isStale && (
            <p className="mb-4 text-xs text-muted-foreground">
              Live price feed unavailable — showing reference figures.
            </p>
          )}

          {/* Side + asset controls */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={side} onValueChange={(v) => setSide(v as TradeSide)}>
              <TabsList>
                <TabsTrigger value="BUY" className="px-6">
                  Buy
                </TabsTrigger>
                <TabsTrigger value="SELL" className="px-6">
                  Sell
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select asset">
              {DEMO_ASSETS.map((a) => (
                <Button
                  key={a}
                  size="sm"
                  variant={a === asset ? "default" : "outline"}
                  onClick={() => setAsset(a)}
                  aria-pressed={a === asset}
                >
                  {a}
                </Button>
              ))}
            </div>
          </div>

          {/* Region */}
          <div className="mb-6 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by region">
            <span className="mr-1 text-xs text-muted-foreground">Region</span>
            <Button
              size="sm"
              variant={region === "ALL" ? "secondary" : "ghost"}
              onClick={() => setRegion("ALL")}
              aria-pressed={region === "ALL"}
            >
              All
            </Button>
            {MARKET_REGIONS.map((r) => (
              <Button
                key={r.code}
                size="sm"
                variant={region === r.code ? "secondary" : "ghost"}
                onClick={() => setRegion(r.code)}
                aria-pressed={region === r.code}
              >
                {r.label}
              </Button>
            ))}
          </div>

          {/* Offers */}
          {isLoading ? (
            <LoadingBlock label="Loading offers…" />
          ) : offers.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No {side === "BUY" ? "sellers" : "buyers"} are listed for {asset} right now.
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                {offers.length} {side === "BUY" ? "seller" : "buyer"}
                {offers.length === 1 ? "" : "s"} for {asset}
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {offers.map((offer) => (
                  <DemoOfferCard
                    key={offer.id}
                    offer={offer}
                    side={side}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <OrderTicketDialog
        offer={selected}
        side={side}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function PriceStat({
  label,
  value,
  delta,
  tone,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "premium" | "discount";
  icon?: React.ReactNode;
}) {
  const toneClass =
    tone === "premium"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "discount"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-muted-foreground";

  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="font-mono text-lg font-semibold text-foreground">{value}</span>
        {delta && (
          <span className={`flex items-center gap-1 text-xs font-medium ${toneClass}`}>
            {icon}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </CardContent>
    </Card>
  );
}
