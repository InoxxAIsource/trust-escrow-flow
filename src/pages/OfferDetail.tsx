import { useParams, Link } from "react-router-dom";
import { Shield, Star, Circle, Clock, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";
import { mockListings } from "@/data/mock-listings";
import { useCryptoPrices, getLivePrice } from "@/hooks/use-crypto-prices";

const OfferDetail = () => {
  const { id } = useParams();
  const { data: prices } = useCryptoPrices();
  const listing = mockListings.find((l) => l.id === id);

  if (!listing) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Offer Not Found</h1>
        <Button asChild><Link to="/marketplace">Back to Marketplace</Link></Button>
      </div>
    );
  }

  const livePrice = getLivePrice(prices, listing.coin, listing.currency);
  const margin = listing.marginPct / 100;
  const displayPrice = livePrice
    ? listing.type === "sell"
      ? +(livePrice * (1 + margin)).toFixed(2)
      : +(livePrice * (1 - margin)).toFixed(2)
    : 0;

  return (
    <>
      <SEOHead
        title={`${listing.type === "sell" ? "Buy" : "Sell"} ${listing.coin} from ${listing.username} | TrustP2P`}
        description={`${listing.type === "sell" ? "Buy" : "Sell"} ${listing.coin} at ${displayPrice} ${listing.currency} from ${listing.username}. Escrow-protected P2P trade on TrustP2P.`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Offer",
          name: `${listing.type === "sell" ? "Buy" : "Sell"} ${listing.coin}`,
          price: displayPrice,
          priceCurrency: listing.currency,
          seller: { "@type": "Person", name: listing.username },
        }}
      />

      <div className="container py-12">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: `${listing.type === "sell" ? "Buy" : "Sell"} ${listing.coin}`, href: `/offer/${listing.id}` },
        ]} />

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge variant={listing.type === "sell" ? "default" : "secondary"} className="mb-3">
                {listing.type === "sell" ? `Buy ${listing.coinSymbol}` : `Sell ${listing.coinSymbol}`}
              </Badge>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {listing.type === "sell" ? "Buy" : "Sell"} {listing.coin} from {listing.username}
              </h1>
            </div>

            <Card>
              <CardContent className="py-6 grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Price</div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    {displayPrice > 0
                      ? displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : "Loading…"}{" "}
                    {listing.currency}
                  </div>
                  {livePrice && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Market: {livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {listing.currency}
                      </span>
                      <span className={`text-xs font-medium flex items-center gap-0.5 ${listing.type === "sell" ? "text-destructive" : "text-emerald-600"}`}>
                        {listing.type === "sell" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {listing.type === "sell" ? "+" : "-"}{listing.marginPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Trade Limits</div>
                  <div className="font-semibold text-foreground">{listing.minAmount.toLocaleString()} – {listing.maxAmount.toLocaleString()} {listing.currency}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Payment Methods</div>
                  <div className="flex gap-1 flex-wrap">
                    {listing.paymentMethods.map((pm) => <Badge key={pm} variant="secondary">{pm}</Badge>)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Country</div>
                  <div className="font-semibold text-foreground">{listing.country}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Escrow Protected Trade</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This trade is protected by TrustP2P's escrow system. The seller's {listing.coin} will be locked in escrow until you confirm receipt of payment. You can raise a dispute at any time if issues arise.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button size="lg" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                {listing.type === "sell" ? `Buy ${listing.coinSymbol}` : `Sell ${listing.coinSymbol}`}
              </Button>
            </div>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Trader Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold">
                    {listing.username[0]}
                  </div>
                  <div>
                    <Link to={`/user/${listing.username}`} className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                      {listing.username}
                      {listing.isVerified && <Shield className="h-3.5 w-3.5 text-primary" />}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Circle className={`h-2 w-2 fill-current ${listing.isOnline ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                      {listing.isOnline ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Completed Trades</span><span className="font-medium text-foreground">{listing.completedTrades}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-medium text-foreground flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" /> {listing.rating}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Verified</span><span className="font-medium text-foreground">{listing.isVerified ? "Yes" : "No"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Avg. Response</span><span className="font-medium text-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~2 min</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default OfferDetail;
