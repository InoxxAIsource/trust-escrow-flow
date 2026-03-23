import { useParams, Link } from "react-router-dom";
import { Shield, Star, Circle, Clock, MessageSquare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";
import { useMemo } from "react";
import { generateAllOffers, type SeededOffer } from "@/data/seed-engine";
import { useCryptoPrices, type CryptoPrices } from "@/hooks/use-crypto-prices";

function toLivePrices(prices?: CryptoPrices) {
  if (!prices) return undefined;
  return { USDT: prices.tether.usd, BTC: prices.bitcoin.usd, ETH: prices.ethereum.usd, SOL: prices.solana.usd };
}

const OfferDetail = () => {
  const { id } = useParams();
  const { data: prices } = useCryptoPrices();

  const offer = useMemo(() => {
    const all = generateAllOffers(toLivePrices(prices));
    return all.find((o) => o.id === id);
  }, [id, prices]);

  if (!offer) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Offer Not Found</h1>
        <p className="text-muted-foreground mb-6">This offer may have expired or been taken.</p>
        <Button asChild><Link to="/marketplace">Browse Marketplace</Link></Button>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${offer.type === "sell" ? "Buy" : "Sell"} ${offer.asset} from ${offer.username} | TrustP2P`}
        description={`${offer.type === "sell" ? "Buy" : "Sell"} ${offer.asset} at ${offer.price} from ${offer.username}. Escrow-protected P2P trade on TrustP2P.`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Offer",
          name: `${offer.type === "sell" ? "Buy" : "Sell"} ${offer.asset}`,
          price: offer.price,
          seller: { "@type": "Person", name: offer.username },
        }}
      />

      <div className="container py-12">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: `${offer.type === "sell" ? "Buy" : "Sell"} ${offer.asset}`, href: `/offer/${offer.id}` },
        ]} />

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge variant={offer.type === "sell" ? "default" : "secondary"} className="mb-3">
                {offer.type === "sell" ? `Buy ${offer.assetSymbol}` : `Sell ${offer.assetSymbol}`}
              </Badge>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {offer.type === "sell" ? "Buy" : "Sell"} {offer.asset} from {offer.username}
              </h1>
            </div>

            <Card>
              <CardContent className="py-6 grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Price</div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    {offer.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Market: {offer.marketPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-medium flex items-center gap-0.5 text-success">
                      <TrendingUp className="h-3 w-3" />
                      {offer.margin} above market
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Trade Limits</div>
                  <div className="font-semibold text-foreground">
                    {offer.minLimit.toLocaleString()} – {offer.maxLimit.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Payment Method</div>
                  <Badge variant="secondary">{offer.paymentMethod}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Country</div>
                  <div className="font-semibold text-foreground">{offer.country}</div>
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
                  This trade is protected by TrustP2P's escrow system. The seller's {offer.asset} will be locked in escrow until you confirm receipt of payment. You can raise a dispute at any time if issues arise.
                </p>
              </CardContent>
            </Card>

            <Button size="lg" className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              {offer.type === "sell" ? `Buy ${offer.assetSymbol}` : `Sell ${offer.assetSymbol}`}
            </Button>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Trader Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold">
                    {offer.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      {offer.username}
                      {offer.isVerified && <Shield className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Circle className={`h-2 w-2 fill-current ${offer.isOnline ? "text-success" : "text-muted-foreground/30"}`} />
                      {offer.lastSeen}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Completed Trades</span><span className="font-medium text-foreground">{offer.trades.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Completion Rate</span><span className="font-medium text-foreground">{offer.completionRate}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-medium text-foreground flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" /> {offer.rating}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Verified</span><span className="font-medium text-foreground">{offer.isVerified ? "Yes" : "No"}</span></div>
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
