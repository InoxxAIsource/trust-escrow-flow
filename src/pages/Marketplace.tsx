import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Shield, Circle, TrendingUp, RefreshCw, Search, Zap, Lock, Flame, Plus, Award, ThumbsUp, Globe } from "lucide-react";
import { VerificationIcon } from "@/components/VerificationBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";
import BuyModal from "@/components/marketplace/BuyModal";
import SellModal from "@/components/marketplace/SellModal";
import SellToOfferModal from "@/components/marketplace/SellToOfferModal";
import { getSafeInrRate, useCryptoPrices, type CryptoPrices } from "@/hooks/use-crypto-prices";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useUserTrades } from "@/hooks/use-trades";
import { useUserOffers } from "@/hooks/use-offers";
import {
  generateAllOffers, filterOffers, FALLBACK_USD_INR_RATE,
  getAllCountries, getCountryPaymentMethods, getCountryCurrency,
  type SeededOffer,
} from "@/data/seed-engine";
import { toast } from "sonner";

const coinOptions = ["USDT", "Bitcoin", "Ethereum", "Solana"];

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

function getBestSellPriceIds(offers: SeededOffer[]): Set<string> {
  const bestByAsset: Record<string, SeededOffer> = {};
  for (const o of offers) {
    if (o.type !== "sell") continue;
    if (!bestByAsset[o.asset] || o.price < bestByAsset[o.asset].price) {
      bestByAsset[o.asset] = o;
    }
  }
  return new Set(Object.values(bestByAsset).map((o) => o.id));
}

interface OfferRowProps {
  offer: SeededOffer;
  onBuyClick: (offer: SeededOffer) => void;
  onSellClick: (offer: SeededOffer) => void;
  isRecommended: boolean;
}

const OfferRow = ({ offer, onBuyClick, onSellClick, isRecommended }: OfferRowProps) => {
  const hash = offer.id.charCodeAt(5) ?? 0;
  const showInstant = hash % 3 === 0;
  const showLock = hash % 4 === 0;
  const fakeLocks = 5 + (hash % 18);
  const isHighCompletion = offer.completionRate >= 99;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {isRecommended && (
            <Badge className="bg-success/10 text-success border-success/20 border text-xs">
              <Award className="h-3 w-3 mr-0.5" /> Recommended
            </Badge>
          )}
          {isHighCompletion && (
            <Badge className="bg-accent text-accent-foreground border text-xs">
              <ThumbsUp className="h-3 w-3 mr-0.5" /> High Completion Trader
            </Badge>
          )}
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
                {offer.isVerified && <VerificationIcon isVerified className="h-3.5 w-3.5" />}
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
                {offer.currencySymbol}{offer.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-medium flex items-center gap-0.5 text-success">
                <TrendingUp className="h-3 w-3" />
                {offer.margin} above market
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs text-muted-foreground">Limits</div>
              <div className="text-sm text-foreground">
                {offer.currencySymbol}{offer.minLimit.toLocaleString()} – {offer.currencySymbol}{offer.maxLimit.toLocaleString()}
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="flex gap-1">
                {offer.paymentMethods.map((pm) => (
                  <Badge key={pm} variant="secondary" className="text-xs">{pm}</Badge>
                ))}
              </div>
            </div>
            {offer.type === "sell" ? (
              <Button size="sm" onClick={() => onBuyClick(offer)}>
                Buy {offer.assetSymbol}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => onSellClick(offer)}>
                Sell {offer.assetSymbol}
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1 sm:hidden">
            {offer.paymentMethods.map((pm) => (
              <Badge key={pm} variant="secondary" className="text-xs">{pm}</Badge>
            ))}
            {offer.currencySymbol}{offer.minLimit.toLocaleString()} – {offer.currencySymbol}{offer.maxLimit.toLocaleString()}
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
  const { user } = useAuth();
  const { deposit, getBalance, lockBalance } = useWallets();
  const { activeTrades } = useUserTrades();
  const { createOffer } = useUserOffers();

  const allCountries = getAllCountries();

  const [coin, setCoin] = useState("all");
  const [country, setCountry] = useState("India");
  const [payment, setPayment] = useState("all");
  const [tradeType, setTradeType] = useState<"all" | "buy" | "sell">("all");

  // Derive currency and payment methods from country
  const { code: currencyCode, symbol: currencySymbol } = getCountryCurrency(country);
  const countryPaymentMethods = getCountryPaymentMethods(country);

  // Reset payment filter when country changes
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setPayment("all"); // reset payment since methods differ by country
  };

  const [buyOffer, setBuyOffer] = useState<SeededOffer | null>(null);
  const [sellToOffer, setSellToOffer] = useState<SeededOffer | null>(null);
  const [showSell, setShowSell] = useState(false);

  const liveInrRate = getSafeInrRate(prices) ?? FALLBACK_USD_INR_RATE;

  const allOffers = useMemo(
    () => generateAllOffers(toLivePrices(prices), liveInrRate),
    [prices, liveInrRate]
  );

  const filtered = useMemo(() => {
    const mappedType = tradeType === "buy" ? "sell" : tradeType === "sell" ? "buy" : undefined;
    return filterOffers(allOffers, {
      asset: coin !== "all" ? coin : undefined,
      country,
      paymentMethod: payment !== "all" ? payment : undefined,
      type: mappedType,
    });
  }, [allOffers, coin, country, payment, tradeType]);

  const recommendedIds = useMemo(() => getBestSellPriceIds(filtered), [filtered]);
  const totalOffers = allOffers.length;
  const countryOfferCount = useMemo(() => allOffers.filter((o) => o.country === country).length, [allOffers, country]);

  const requireAuth = (action: () => void) => {
    if (!user) {
      navigate("/auth");
      toast.info("Please sign in to continue");
      return;
    }
    action();
  };

  const handleBuyClick = (offer: SeededOffer) => {
    requireAuth(() => setBuyOffer(offer));
  };

  const handleSellToOfferClick = (offer: SeededOffer) => {
    requireAuth(() => setSellToOffer(offer));
  };

  const handleSellClick = () => {
    requireAuth(() => setShowSell(true));
  };

  const handleCreateOffer = async (data: {
    asset: string;
    assetSymbol: string;
    amount: number;
    price: number;
    currency: string;
    paymentMethods: string[];
  }) => {
    const bal = getBalance(data.assetSymbol);
    const available = bal.balance - bal.lockedBalance;
    if (available < data.amount) {
      toast.error("Insufficient balance. Deposit more first.");
      return;
    }

    try {
      await lockBalance.mutateAsync({ asset: data.assetSymbol, amount: data.amount });
      createOffer.mutate({
        type: "sell",
        asset: data.assetSymbol,
        amount: data.amount,
        price: data.price,
        currency: data.currency,
        payment_methods: data.paymentMethods,
        min_limit: 1000,
        max_limit: 500000,
      });
      toast.success("Your sell offer is now live! Funds locked in escrow.");
    } catch {
      toast.error("Failed to create offer. Please try again.");
    }
  };

  const handleDeposit = (asset: string, amount: number) => {
    deposit.mutate({ asset, amount });
  };

  const suggestedPrice = prices ? Math.round(prices.tether.usd * liveInrRate * 1.1 * 100) / 100 : undefined;

  return (
    <>
      <SEOHead
        title="P2P Crypto Marketplace — Buy & Sell USDT, BTC, ETH, SOL | TrustP2P"
        description="Browse escrow-protected P2P crypto listings. Buy and sell USDT, Bitcoin, Ethereum, and Solana with verified traders worldwide."
      />

      <div className="container py-12">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Marketplace", href: "/marketplace" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">P2P Marketplace</h1>
            <p className="text-muted-foreground mt-1">
              {totalOffers} active offers from verified traders worldwide • {countryOfferCount} in {country}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTrades.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                <Lock className="h-3.5 w-3.5 mr-1" /> {activeTrades.length} Active Trade{activeTrades.length > 1 ? "s" : ""}
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

        <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="h-4 w-4 text-primary" /> All trades escrow-protected</span>
          <span>• {totalOffers} offers</span>
          <span>• 98% avg completion rate</span>
          <span>• 12,400+ trades completed</span>
        </div>

        {/* ── Filter Bar ── */}
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

          <Select value={country} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-[160px]">
              <Globe className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {allCountries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{currencySymbol}</span>
            <span>{currencyCode}</span>
          </div>

          <Select value={payment} onValueChange={setPayment}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Payment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {countryPaymentMethods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {country !== "all" || coin !== "all" || payment !== "all"
              ? `Top offers in ${country}${coin !== "all" ? ` for ${coin}` : ""}${payment !== "all" ? ` via ${payment}` : ""}`
              : "Best offers today"}
          </span>
          <span className="text-xs text-muted-foreground">({filtered.length} shown)</span>
        </div>

        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((offer) => (
              <OfferRow
                key={offer.id}
                offer={offer}
                onBuyClick={handleBuyClick}
                onSellClick={handleSellToOfferClick}
                isRecommended={recommendedIds.has(offer.id)}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No offers match your filters. Try adjusting your search criteria.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BuyModal
        offer={buyOffer}
        open={!!buyOffer}
        onClose={() => setBuyOffer(null)}
      />

      <SellModal
        open={showSell}
        onClose={() => setShowSell(false)}
        onDeposit={handleDeposit}
        onCreateOffer={handleCreateOffer}
        getBalance={getBalance}
        suggestedPrice={suggestedPrice}
      />

      <SellToOfferModal
        offer={sellToOffer}
        open={!!sellToOffer}
        onClose={() => setSellToOffer(null)}
      />
    </>
  );
};

export default Marketplace;
