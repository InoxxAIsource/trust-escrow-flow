import { useState } from "react";
import { Loader2, TrendingDown, TrendingUp, X } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const AMOUNT_PRESETS = [500, 1_000, 5_000, 10_000, 25_000, 48_000] as const;

export default function DemoMarketplace() {
  const [side, setSide] = useState<TradeSide>("BUY");
  const [asset, setAsset] = useState<DemoAsset>("BTC");
  const [region, setRegion] = useState<MarketRegion | "ALL">("ALL");
  const [amountInput, setAmountInput] = useState("");
  const [selected, setSelected] = useState<PricedOffer | null>(null);

  const { data: backend, isLoading: backendLoading, refetch: retryBackend } = useDemoBackend();
  const { offers, marketPrice, isStale, isLoading } = usePricedOffers(side, asset, region);

  // Parse text input; blank = no filter
  const amountUSD = amountInput === "" ? null : Number(amountInput.replace(/[^0-9.]/g, ""));

  const filteredOffers =
    amountUSD && amountUSD > 0
      ? offers.filter((o) => o.minLimitUSD <= amountUSD && amountUSD <= o.maxLimitUSD)
      : offers;

  const isBuy = side === "BUY";
  const bandLabel = isBuy
    ? formatBpsRange(BUY_PREMIUM_BPS_MIN, BUY_PREMIUM_BPS_MAX)
    : formatBpsRange(SELL_DISCOUNT_BPS_MIN, SELL_DISCOUNT_BPS_MAX);
  const bestOffer = filteredOffers[0] ?? null;

  function handlePreset(amt: number) {
    setAmountInput(String(amt));
  }

  function clearAmount() {
    setAmountInput("");
  }

  return (
    <div className="container py-8 md:py-12">
      <SEOHead
        title="P2P Marketplace - P2PxBT"
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
        <LoadingBlock label="Connecting to the marketplace..." />
      ) : backend && backend.status !== "ready" ? (
        <DemoBackendNotice state={backend} onRetry={() => retryBackend()} />
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
                value={bestOffer ? formatMoney(bestOffer.p2pPrice, bestOffer.currency) : "-"}
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
              Live price feed unavailable - showing reference figures.
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
          <div className="mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by region">
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

          {/* Amount filter */}
          <div className="mb-6 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Amount (USD)</span>

              {/* Preset buttons */}
              <Button
                size="sm"
                variant={amountInput === "" ? "secondary" : "ghost"}
                onClick={clearAmount}
                className="h-7 px-3 text-xs"
              >
                Any
              </Button>
              {AMOUNT_PRESETS.map((amt) => (
                <Button
                  key={amt}
                  size="sm"
                  variant={amountInput === String(amt) ? "secondary" : "ghost"}
                  onClick={() => handlePreset(amt)}
                  className="h-7 px-3 text-xs"
                >
                  ${amt >= 1000 ? `${amt / 1000}k` : amt}
                </Button>
              ))}

              {/* Custom input */}
              <div className="relative ml-auto">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min={100}
                  max={48000}
                  placeholder="Enter amount"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="h-7 w-36 pl-5 text-xs"
                />
                {amountInput && (
                  <button
                    onClick={clearAmount}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear amount"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {amountUSD && amountUSD > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Showing offers that accept ${amountUSD.toLocaleString()} USD
                {filteredOffers.length === 0 && offers.length > 0
                  ? " - no offers match this amount"
                  : ` (${filteredOffers.length} of ${offers.length})`}
              </p>
            )}
          </div>

          {/* Offers */}
          {isLoading ? (
            <LoadingBlock label="Loading offers..." />
          ) : filteredOffers.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                {amountUSD && amountUSD > 0
                  ? `No ${side === "BUY" ? "sellers" : "buyers"} accept $${amountUSD.toLocaleString()} for ${asset}. Try a different amount.`
                  : `No ${side === "BUY" ? "sellers" : "buyers"} are listed for ${asset} right now.`}
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                {filteredOffers.length} {side === "BUY" ? "seller" : "buyer"}
                {filteredOffers.length === 1 ? "" : "s"} for {asset}
                {amountUSD && amountUSD > 0 ? ` accepting $${amountUSD.toLocaleString()}` : ""}
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredOffers.map((offer) => (
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
