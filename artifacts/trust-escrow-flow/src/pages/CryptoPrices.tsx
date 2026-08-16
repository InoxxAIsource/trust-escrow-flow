import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";

interface CoinRow {
  name: string;
  symbol: string;
  key: "bitcoin" | "ethereum" | "solana" | "tether";
  buyHref: string;
  sellHref: string;
  description: string;
  color: string;
}

const COINS: CoinRow[] = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    key: "bitcoin",
    buyHref: "/buy-bitcoin",
    sellHref: "/sell-bitcoin",
    description: "The original cryptocurrency. Fixed 21M supply, borderless value transfer.",
    color: "text-orange-500",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    key: "ethereum",
    buyHref: "/buy-ethereum",
    sellHref: "/sell-ethereum",
    description: "The leading smart contract platform powering DeFi, NFTs and tokenisation.",
    color: "text-violet-500",
  },
  {
    name: "Solana",
    symbol: "SOL",
    key: "solana",
    buyHref: "/buy-solana",
    sellHref: "/sell-solana",
    description: "High-throughput blockchain with sub-second finality and ultra-low fees.",
    color: "text-green-500",
  },
  {
    name: "Tether",
    symbol: "USDT",
    key: "tether",
    buyHref: "/buy-usdt",
    sellHref: "/sell-usdt",
    description: "The most traded stablecoin, pegged 1:1 to the US Dollar.",
    color: "text-emerald-500",
  },
];

function PriceChange({ change }: { change?: number }) {
  if (change == null) return <span className="text-muted-foreground text-sm">-</span>;
  const positive = change >= 0;
  const neutral = Math.abs(change) < 0.01;
  return (
    <span className={`flex items-center gap-0.5 text-sm font-medium ${neutral ? "text-muted-foreground" : positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
      {neutral ? <Minus className="h-3.5 w-3.5" /> : positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {neutral ? "0.00" : `${positive ? "+" : ""}${change.toFixed(2)}`}%
    </span>
  );
}

export default function CryptoPrices() {
  const { data: prices, isLoading, dataUpdatedAt } = useCryptoPrices();

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="container py-12 lg:py-16">
      <SEOHead
        title="Live Crypto Prices - BTC, ETH, SOL, USDT - P2PxBT"
        description="Live cryptocurrency prices on P2PxBT. See real-time BTC, ETH, SOL and USDT rates refreshed every 30 seconds, plus P2P buy and sell offers in your region."
        canonical="https://p2pxbt.com/crypto-prices"
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Live Crypto Prices", href: "/crypto-prices" },
        ]}
      />

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Live Crypto Prices
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Prices refresh every 30 seconds</span>
            {lastUpdated && <span>· Last updated {lastUpdated}</span>}
          </div>
          <p className="mt-4 leading-relaxed text-muted-foreground max-w-2xl">
            Reference prices for all assets traded on P2PxBT. The P2P rate shown on marketplace
            offers may differ - counterparties apply a small premium or discount based on local
            supply, demand and payment method.
          </p>
        </header>

        {/* Price cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {COINS.map((coin) => {
            const data = prices?.[coin.key];
            const price = data?.usd;
            const change24h = data?.usd_24h_change;

            return (
              <Card key={coin.symbol} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 font-display text-base">
                      <span className={`font-bold ${coin.color}`}>{coin.symbol}</span>
                      <span className="font-normal text-muted-foreground">{coin.name}</span>
                    </CardTitle>
                    <PriceChange change={change24h} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    {isLoading || !price ? (
                      <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                    ) : (
                      <p className="font-display text-3xl font-bold text-foreground">
                        {coin.symbol === "USDT"
                          ? "$1.00"
                          : `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">USD · 24h change</p>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground leading-relaxed">
                    {coin.description}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <Link to={coin.buyHref}>Buy {coin.symbol}</Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={coin.sellHref}>Sell {coin.symbol}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* About P2P pricing */}
        <section className="mb-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Market price vs P2P price - what's the difference?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The prices above are reference rates pulled from aggregate market data and refreshed
            every 30 seconds. They represent the global spot price - what you would pay on a
            centralised exchange before fees.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            On P2PxBT, each counterparty sets their own rate. The difference between the P2P rate
            and the market rate is shown as a percentage premium (e.g. +4.1%) on each offer card.
            This premium compensates the seller for the convenience of local payment rails and
            the cost of arranging peer-to-peer settlement.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Premiums are typically lower for high-volume, well-rated counterparties and for
            payment methods with lower fraud risk (such as bank wire). Browsing multiple offers
            in the{" "}
            <Link to="/marketplace" className="text-primary underline underline-offset-2">
              marketplace
            </Link>{" "}
            is the best way to find a competitive rate.
          </p>
        </section>

        {/* Factors that affect price */}
        <section className="mb-10">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
            What affects the P2P premium?
          </h2>
          <div className="space-y-3">
            {[
              { title: "Payment method", body: "Bank wire typically carries the lowest premium because it is traceable and non-reversible. Methods with higher chargeback risk carry higher premiums." },
              { title: "Market volatility", body: "During fast-moving markets, sellers price in extra margin to protect against price moves between when the trade opens and when payment arrives." },
              { title: "Counterparty reputation", body: "High-volume sellers with strong completion rates can offer tighter premiums because they trade efficiently at scale." },
              { title: "Local supply and demand", body: "In markets where crypto demand outstrips supply, or where local banking access is limited, premiums tend to be higher." },
              { title: "Trade size", body: "Some counterparties offer better rates for larger trades. Always check the minimum and maximum limits on each offer card." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 rounded-lg border border-border p-4">
                <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground mb-0.5">{item.title}</p>
                  <p className="text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-10 rounded-lg border border-primary/20 bg-primary/[0.03] p-6">
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            Ready to trade at today's prices?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Browse live offers from 126 counterparties across USA, UK, Europe and Hong Kong.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/marketplace">Open Marketplace <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/how-it-works">How It Works</Link>
            </Button>
          </div>
        </section>

        {/* Related */}
        <section className="rounded-lg border border-border bg-muted/40 p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Related guides</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: "What is Bitcoin?", href: "/what-is-bitcoin" },
              { label: "What is USDT?", href: "/what-is-usdt" },
              { label: "Wire transfer guide", href: "/wire-transfer-guide" },
              { label: "Buy Bitcoin in USA", href: "/buy-bitcoin-usa" },
              { label: "Buy Bitcoin in UK", href: "/buy-bitcoin-uk" },
              { label: "Buy USDT in USA", href: "/buy-usdt-usa" },
              { label: "Fees", href: "/fees" },
              { label: "FAQ", href: "/faq" },
            ].map((l) => (
              <li key={l.href}>
                <Link to={l.href} className="text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
