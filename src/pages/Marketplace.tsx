import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Shield, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";
import { mockListings, coinOptions, paymentMethodOptions, countryOptions, type Listing } from "@/data/mock-listings";

const ListingCard = ({ listing }: { listing: Listing }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-sm">
            {listing.username[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link to={`/user/${listing.username}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                {listing.username}
              </Link>
              {listing.isVerified && <Shield className="h-3.5 w-3.5 text-primary" />}
              <Circle className={`h-2 w-2 fill-current ${listing.isOnline ? "text-emerald-500" : "text-muted-foreground/30"}`} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{listing.completedTrades} trades</span>
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-warning text-warning" /> {listing.rating}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8">
          <div>
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="font-display font-bold text-foreground">
              {listing.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{listing.currency}</span>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs text-muted-foreground">Limits</div>
            <div className="text-sm text-foreground">
              {listing.minAmount.toLocaleString()} – {listing.maxAmount.toLocaleString()} {listing.currency}
            </div>
          </div>
          <div className="hidden sm:flex gap-1 flex-wrap">
            {listing.paymentMethods.map((pm) => (
              <Badge key={pm} variant="secondary" className="text-xs">{pm}</Badge>
            ))}
          </div>
          <Button size="sm" variant={listing.type === "sell" ? "default" : "outline"} asChild>
            <Link to={`/offer/${listing.id}`}>
              {listing.type === "sell" ? "Buy" : "Sell"} {listing.coinSymbol}
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile payment methods */}
      <div className="flex gap-1 flex-wrap mt-3 sm:hidden">
        {listing.paymentMethods.map((pm) => (
          <Badge key={pm} variant="secondary" className="text-xs">{pm}</Badge>
        ))}
      </div>
    </CardContent>
  </Card>
);

const Marketplace = () => {
  const [coin, setCoin] = useState("all");
  const [payment, setPayment] = useState("all");
  const [country, setCountry] = useState("all");
  const [tradeType, setTradeType] = useState<"all" | "buy" | "sell">("all");

  const filtered = mockListings.filter((l) => {
    if (coin !== "all" && l.coin !== coin) return false;
    if (payment !== "all" && !l.paymentMethods.includes(payment)) return false;
    if (country !== "all" && l.country !== country) return false;
    if (tradeType !== "all" && l.type !== tradeType) return false;
    return true;
  });

  return (
    <>
      <SEOHead title="P2P Crypto Marketplace — Buy & Sell USDT, BTC, ETH, SOL | TrustP2P" description="Browse escrow-protected P2P crypto listings. Buy and sell USDT, Bitcoin, Ethereum, and Solana with verified traders." />

      <div className="container py-12">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Marketplace", href: "/marketplace" }]} />

        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">P2P Marketplace</h1>
        <p className="text-muted-foreground mb-8">Find verified traders and trade crypto with escrow protection.</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex rounded-lg border overflow-hidden">
            {(["all", "buy", "sell"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTradeType(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${tradeType === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                {t === "all" ? "All" : t === "buy" ? "Buy" : "Sell"}
              </button>
            ))}
          </div>

          <Select value={coin} onValueChange={setCoin}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Coin" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Coins</SelectItem>
              {coinOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={payment} onValueChange={setPayment}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Payment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {paymentMethodOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Listings */}
        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((listing) => <ListingCard key={listing.id} listing={listing} />)
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No listings match your filters. Try adjusting your search.</CardContent></Card>
          )}
        </div>
      </div>
    </>
  );
};

export default Marketplace;
