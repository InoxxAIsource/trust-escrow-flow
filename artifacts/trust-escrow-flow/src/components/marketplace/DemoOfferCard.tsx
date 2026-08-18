import { Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatAssetAmount, formatMoney, type TradeSide } from "@/lib/pricing";
import type { PricedOffer } from "@/integrations/supabase/demo";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DemoOfferCard({
  offer,
  side,
  onSelect,
}: {
  offer: PricedOffer;
  side: TradeSide;
  onSelect: (offer: PricedOffer) => void;
}) {
  const cp = offer.counterparty;
  const isBuy = side === "BUY";

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-4 p-5">
        {/* Counterparty */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials(cp.display_name)}
              </AvatarFallback>
            </Avatar>
            <span
              aria-hidden
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                cp.online_status ? "bg-emerald-500" : "bg-muted-foreground/40"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate font-medium text-foreground">{cp.display_name}</span>
              <Badge
                variant="outline"
                className="border-primary/25 bg-primary/5 text-[10px] font-medium uppercase tracking-wide text-primary"
              >
                {offer.isUserOffer ? "Community" : "Verified"}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {cp.rating.toFixed(1)}
              </span>
              <span>{cp.completion_rate.toFixed(1)}% completion</span>
              <span>{cp.trade_count.toLocaleString()} trades</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {cp.online_status ? "Online" : "Offline"} · {cp.response_time_label}
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Market price</p>
            <p className="font-mono text-sm text-muted-foreground">
              {formatMoney(offer.marketPrice, offer.currency)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              P2P {isBuy ? "buy" : "sell"} price
            </p>
            <p className="flex items-baseline gap-1.5">
              <span className="font-mono text-sm font-semibold text-foreground">
                {formatMoney(offer.p2pPrice, offer.currency)}
              </span>
              <span
                className={`text-xs font-medium ${
                  isBuy ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {offer.spreadLabel}
              </span>
            </p>
          </div>
        </div>

        {/* Volume + limits */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="text-foreground">Available:</span>{" "}
            {formatAssetAmount(offer.available_amount, offer.asset)} {offer.asset}
          </p>
          <p>
            <span className="text-foreground">Limits:</span>{" "}
            {formatMoney(offer.min_limit, offer.currency)} to{" "}
            {formatMoney(offer.max_limit, offer.currency)}
          </p>
        </div>

        {/* Payment methods */}
        <div className="flex flex-wrap gap-1.5">
          {offer.payment_methods.map((m) => (
            <Badge key={m} variant="secondary" className="text-[11px] font-normal">
              {m}
            </Badge>
          ))}
        </div>

        <Button className="w-full" onClick={() => onSelect(offer)}>
          <Zap className="mr-1.5 h-4 w-4" />
          {isBuy ? "Buy" : "Sell"} {offer.asset}
        </Button>
      </CardContent>
    </Card>
  );
}
