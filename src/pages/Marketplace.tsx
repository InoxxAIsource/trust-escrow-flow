import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Shield, Circle, TrendingUp, RefreshCw, Search, Zap, Lock, Flame, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";
import BuyModal from "@/components/marketplace/BuyModal";
import SellModal from "@/components/marketplace/SellModal";
import { getSafeInrRate, useCryptoPrices, type CryptoPrices } from "@/hooks/use-crypto-prices";
import { useDemoUser } from "@/hooks/use-demo-user";
import { useDemoWallet } from "@/hooks/use-demo-wallet";
import { useLockedDeals } from "@/hooks/use-locked-deals";
import { generateAllOffers, filterOffers, countries, currencyByCountry, FALLBACK_USD_INR_RATE, type SeededOffer } from "@/data/seed-engine";
import { toast } from "sonner";

const coinOptions = ["USDT", "Bitcoin", "Ethereum", "Solana"];
const paymentOptions = ["UPI", "Bank Transfer", "PayPal", "Zelle", "Venmo", "IMPS", "SEPA", "PIX", "M-Pesa", "GCash", "CashApp", "Revolut"];

function toLivePrices(prices?: CryptoPrices) {
  if (!prices) return undefined;
  return {
    USDT: prices.tether.usd,
    BTC: prices.bitcoin.usd,
    ETH: prices.ethereum.usd,
    SOL: prices.solana.usd,
  };
}

const PriceTicker = ({ prices }: { prices?: CryptoPrices }) => {
  if (!prices) return null;
  const tickers = [
    { name: "BTC", usd: prices.bitcoin.usd, inr: prices.bitcoin.inr },
    { name: "ETH", usd: prices.ethereum.usd, inr: prices.ethereum.inr },
    { name: "SOL", usd: prices.solana.usd, inr: prices.solana.inr },
    { name: "USDT", usd: prices.tether.usd, inr: prices.tether.inr },
  ];
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {tickers.map((t) => (
        <div key={t.name} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
          <span className="font-display font-bold text-sm text-foreground">{t.name}</span>
          <span className="text-sm text-muted-foreground">
            ${t.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-muted-foreground/70">
            ₹{t.inr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <TrendingUp className="h-3.5 w-3.5 text-success" />
        </div>
      ))}
    </div>
  );
};

interface OfferRowProps {
  offer: SeededOffer;
  onBuyClick: (offer: SeededOffer) => void;
}

const OfferRow = ({ offer, onBuyClick }: OfferRowProps) => {
  // Pseudo-random badge based on offer id
  const hash = offer.id.charCodeAt(5) ?? 0;
  const showInstant = hash % 3 === 0;
  const showLock = hash % 4 === 0;
  const fakeLocks = 5 + (hash % 18);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        {/* Urgency badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {showInstant && (
            <Badge className="bg-warning/10 text-warning border-warning/20 border text-xs">
              <Zap className="h-3 w-3 mr-0.5" /> Instant Trade Available
            </Badge>
          )}
          {showLock && (
            <Badge className="bg-primary/10 text-primary border-primary/20 border text-xs">
              <Lock className="h-3 w-3 mr-0.5" /> Lock price for 3 hours
            </Badge>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-sm">
              {offer.username[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link to={`/user/${offer.username}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                  {offer.username}
                </Link>
                {offer.isVerified && <Shield className="h-3.5 w-3.5 text-primary" />}
                <Circle className={`h-2 w-2 fill-current ${offer.isOnline ? "text-success" : "text-muted-foreground/30"}`} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{offer.trades.toLocaleString()} trades</span>
                <span>•</span>
                <span>{offer.completionRate}%</span>
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-warning text-warning" /> {offer.rating}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <div>
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="font-display font-bold text-foreground">
                {offer.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-muted-foreground ml-1">{currencyByCountry[offer.country] ?? "USD"}</span>
              </div>
              <div className="text-xs font-medium flex items-center gap-0.5 text-success">
                <TrendingUp className="h-3 w-3" />
                {offer.margin} above market
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs text-muted-foreground">Limits</div>
              <div className="text-sm text-foreground">
                {offer.minLimit.toLocaleString()} – {offer.maxLimit.toLocaleString()}
              </div>
            </div>
            <div className="hidden sm:block">
              <Badge variant="secondary" className="text-xs">{offer.paymentMethod}</Badge>
            </div>
            {offer.type === "sell" ? (
              <Button size="sm" onClick={() => onBuyClick(offer)}>
                Buy {offer.assetSymbol}
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link to={`/offer/${offer.id}`}>
                  Sell {offer.assetSymbol}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Scarcity / urgency line */}
        <div className="flex gap-3 flex-wrap mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1 sm:hidden">
            <Badge variant="secondary" className="text-xs">{offer.paymentMethod}</Badge>
            {offer.minLimit.toLocaleString()} – {offer.maxLimit.toLocaleString()}
          </span>
          {fakeLocks > 10 && (
            <span className="text-xs text-destructive flex items-center gap-0.5">
              <Flame className="h-3 w-3" /> {fakeLocks} people locked this price today
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Marketplace = () => {
  const navigate = useNavigate();
  const { data: prices, isLoading, dataUpdatedAt, refetch } = useCryptoPrices();
  const { user, loginAsDemo } = useDemoUser();
  const { deposit, getBalance } = useDemoWallet();
  const { lockDeal, createUserOffer, activeDeals } = useLockedDeals();

  const [coin, setCoin] = useState("all");
  const [payment, setPayment] = useState("all");
  const [country, setCountry] = useState("all");
  const [tradeType, setTradeType] = useState<"all" | "buy" | "sell">("all");

  const [buyOffer, setBuyOffer] = useState<SeededOffer | null>(null);
  const [showSell, setShowSell] = useState(false);

  const liveInrRate = getSafeInrRate(prices) ?? FALLBACK_USD_INR_RATE;

  const allOffers = useMemo(
    () => generateAllOffers(toLivePrices(prices), liveInrRate),
    [prices, liveInrRate]
  );

  const filtered = useMemo(() => {
    const mappedType = tradeType === "buy" ? "sell" : tradeType === "sell" ? "buy" : undefined;
    let result = filterOffers(allOffers, {
      asset: coin !== "all" ? coin : undefined,
      country: country !== "all" ? country : undefined,
      paymentMethod: payment !== "all" ? payment : undefined,
      type: mappedType,
    });
    return result.slice(0, 30);
  }, [allOffers, coin, payment, country, tradeType]);

  const totalOffers = allOffers.length;

  const handleBuyClick = (offer: SeededOffer) => {
    if (!user) {
      loginAsDemo();
      toast.success("Signed in as demo trader!");
    }
    setBuyOffer(offer);
  };

  const handleSellClick = () => {
    if (!user) {
      loginAsDemo();
      toast.success("Signed in as demo trader!");
    }
    setShowSell(true);
  };

  const handleLockDeal = (data: Parameters<typeof lockDeal>[0]) => {
    lockDeal(data);
    toast.success("Deal locked! Price secured for 3 hours.");
  };

  const handleCreateOffer = (data: Parameters<typeof createUserOffer>[0]) => {
    createUserOffer(data);
    toast.success("Your sell offer is now live!");
  };

  const suggestedPrice = prices ? Math.round(prices.tether.usd * liveInrRate * 1.1 * 100) / 100 : undefined;

  return (
    <>
      <SEOHead
        title="P2P Crypto Marketplace — Buy & Sell USDT, BTC, ETH, SOL | TrustP2P"
        description="Browse escrow-protected P2P crypto listings. Buy and sell USDT, Bitcoin, Ethereum, and Solana with verified traders across 20+ countries."
      />

      <div className="container py-12">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Marketplace", href: "/marketplace" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">P2P Marketplace</h1>
            <p className="text-muted-foreground mt-1">
              {totalOffers.toLocaleString()} active offers from verified traders across 20+ countries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeDeals.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                <Lock className="h-3.5 w-3.5 mr-1" /> {activeDeals.length} Active Deal{activeDeals.length > 1 ? "s" : ""}
              </Button>
            )}
            <Button size="sm" onClick={handleSellClick}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Sell Offer
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          {isLoading ? (
            <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Loading prices…</span>
          ) : dataUpdatedAt ? (
            <button onClick={() => refetch()} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <RefreshCw className="h-3 w-3" />
              Live prices • Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
            </button>
          ) : null}
        </div>

        <PriceTicker prices={prices} />

        {/* Stats bar */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="h-4 w-4 text-primary" /> All trades escrow-protected</span>
          <span>• {totalOffers.toLocaleString()} offers</span>
          <span>• 98% avg completion rate</span>
          <span>• 12,400+ trades completed</span>
        </div>

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
              {paymentOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Best offers label */}
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {coin !== "all" || country !== "all" || payment !== "all"
              ? `Top offers${coin !== "all" ? ` for ${coin}` : ""}${country !== "all" ? ` in ${country}` : ""}${payment !== "all" ? ` via ${payment}` : ""}`
              : "Best offers today"}
          </span>
          <span className="text-xs text-muted-foreground">({filtered.length} shown)</span>
        </div>

        {/* Listings */}
        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((offer) => <OfferRow key={offer.id} offer={offer} onBuyClick={handleBuyClick} />)
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No offers match your filters. Try adjusting your search criteria.
              </CardContent>
            </Card>
          )}
        </div>

        {filtered.length >= 30 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Showing top 30 offers. Refine your filters to see more specific results.
          </p>
        )}
      </div>

      {/* Modals */}
      <BuyModal
        offer={buyOffer}
        open={!!buyOffer}
        onClose={() => {
          setBuyOffer(null);
          navigate("/dashboard");
        }}
        onLockDeal={handleLockDeal}
      />

      <SellModal
        open={showSell}
        onClose={() => setShowSell(false)}
        onDeposit={deposit}
        onCreateOffer={handleCreateOffer}
        getBalance={getBalance}
        suggestedPrice={suggestedPrice}
      />
    </>
  );
};

export default Marketplace;
