import { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowRight, Shield, Users, Star, TrendingUp, CheckCircle, Clock, Activity, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";
import { getSEOPage, getCityLiveData } from "@/data/seo-pages";
import { generateAllOffers, filterOffers, type SeededOffer } from "@/data/seed-engine";
import { useCryptoPrices, type CryptoPrices } from "@/hooks/use-crypto-prices";

function toLivePrices(prices?: CryptoPrices) {
  if (!prices) return undefined;
  return { USDT: prices.tether.usd, BTC: prices.bitcoin.usd, ETH: prices.ethereum.usd, SOL: prices.solana.usd };
}

// Extract city slug from page slug (e.g. "buy-usdt-delhi" → "delhi", "buy-usdt-delhi-upi" → "delhi")
const CITY_SLUGS = ["delhi","mumbai","bangalore","chennai","kolkata","hyderabad","pune","gurgaon","noida","lucknow","jaipur","ahmedabad","kochi","dehradun"];
function extractCitySlug(slug: string): string | null {
  for (const city of CITY_SLUGS) {
    if (slug.includes(city)) return city;
  }
  return null;
}

const LAST_UPDATED = "2026-04-02T10:00:00Z";

const OfferMiniCard = ({ offer }: { offer: SeededOffer }) => (
  <div className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
        {offer.username[0].toUpperCase()}
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-foreground">{offer.username}</span>
          {offer.isVerified && <Shield className="h-3 w-3 text-primary" />}
        </div>
        <div className="text-xs text-muted-foreground">{offer.trades.toLocaleString()} trades • {offer.rating}★ • {offer.completionRate}%</div>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="font-display font-bold text-foreground text-sm">{offer.currencySymbol ?? "₹"}{offer.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        <div className="flex items-center gap-1">
          {offer.paymentMethods.map((pm) => (
            <Badge key={pm} variant="secondary" className="text-xs">{pm}</Badge>
          ))}
          <span className="text-xs text-success font-medium">{offer.margin}</span>
        </div>
      </div>
      <Button size="sm" asChild>
        <Link to="/marketplace">{offer.type === "sell" ? "Buy" : "Sell"}</Link>
      </Button>
    </div>
  </div>
);

const SEOLanding = () => {
  const location = useLocation();
  const slug = location.pathname.replace("/", "");
  const page = getSEOPage(slug);
  const { data: prices } = useCryptoPrices();

  const citySlug = extractCitySlug(slug);
  const cityData = citySlug ? getCityLiveData(citySlug) : undefined;

  const relevantOffers = useMemo(() => {
    if (!page) return [];
    const allOffers = generateAllOffers(toLivePrices(prices));
    return filterOffers(allOffers, page.filterConfig).slice(0, 10);
  }, [page, prices]);

  if (!page) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Page Not Found</h1>
        <Button asChild><Link to="/">Go Home</Link></Button>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.metaDescription,
    url: `https://buysusdtp2p.com/${page.slug}`,
    dateModified: LAST_UPDATED,
    publisher: {
      "@type": "Organization",
      name: "TrustP2P",
      url: "https://buysusdtp2p.com",
    },
    mainEntity: {
      "@type": "FAQPage",
      mainEntity: page.faq.map(f => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  };

  const now = new Date();

  return (
    <>
      <SEOHead
        title={page.metaTitle}
        description={page.metaDescription}
        canonical={`https://buysusdtp2p.com/${page.slug}`}
        jsonLd={jsonLd}
      />

      <div className="container py-12">
        <Breadcrumbs items={page.breadcrumbs} />

        {/* Hero */}
        <div className="max-w-3xl mb-10">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">{page.h1}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{page.intro}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/marketplace">
                {page.action === "buy" ? "Buy" : "Sell"} {page.coin} Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/how-it-works">How Escrow Works</Link>
            </Button>
          </div>
        </div>

        {/* City-specific live data stats */}
        {cityData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="py-4 text-center">
                <div className="font-display text-2xl font-bold text-foreground">{cityData.sellers}</div>
                <div className="text-xs text-muted-foreground">Active Sellers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="font-display text-2xl font-bold text-foreground">{cityData.buyers}</div>
                <div className="text-xs text-muted-foreground">Active Buyers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="font-display text-2xl font-bold text-primary">{cityData.avgPrice}</div>
                <div className="text-xs text-muted-foreground">Avg USDT Price</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="font-display text-2xl font-bold text-foreground">{cityData.lastTradeAgo}</div>
                <div className="text-xs text-muted-foreground">Last Trade</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Location signal */}
        {cityData && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-primary/5 border border-primary/10 mb-8">
            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">{cityData.localSignal}</p>
          </div>
        )}

        {/* Trust indicators + Last Updated */}
        <div className="flex flex-wrap gap-6 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 text-primary" /> Escrow Protected
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-5 w-5 text-primary" /> 3,200+ Traders
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-5 w-5 text-primary" /> 4.9/5 Rating
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-5 w-5 text-primary" /> 12,400+ Trades
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-10">
          <Clock className="h-3.5 w-3.5" />
          <span>Last updated: {now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} • Prices refresh every 30s</span>
        </div>

        {/* Live Price Block */}
        {prices && (
          <Card className="mb-10">
            <CardContent className="py-5">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">
                Live {page.coin} Price{page.location ? ` in ${page.location}` : ""}
              </h2>
              <div className="flex flex-wrap gap-6">
                <div>
                  <span className="text-sm text-muted-foreground">USD</span>
                  <div className="font-display text-2xl font-bold text-foreground">
                    ${page.coinSymbol === "USDT" ? "1.00" :
                      page.coinSymbol === "BTC" ? prices.bitcoin.usd.toLocaleString() :
                      page.coinSymbol === "ETH" ? prices.ethereum.usd.toLocaleString() :
                      prices.solana.usd.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">INR</span>
                  <div className="font-display text-2xl font-bold text-foreground">
                    ₹{page.coinSymbol === "USDT" ? prices.tether.inr.toFixed(2) :
                      page.coinSymbol === "BTC" ? prices.bitcoin.inr.toLocaleString() :
                      page.coinSymbol === "ETH" ? prices.ethereum.inr.toLocaleString() :
                      prices.solana.inr.toLocaleString()}
                  </div>
                </div>
                {cityData && (
                  <div>
                    <span className="text-sm text-muted-foreground">P2P Avg</span>
                    <div className="font-display text-2xl font-bold text-primary">{cityData.avgPrice}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Feed — City-specific or generic */}
        <Card className="mb-10">
          <CardContent className="py-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">
                Recent Trades{page.location ? ` in ${page.location}` : ""}
              </h2>
            </div>
            <div className="space-y-2">
              {cityData ? (
                cityData.recentTrades.map((trade, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <span className="text-foreground">
                      {trade.amount} USDT {trade.type === "buy" ? "bought" : "sold"} via {trade.method}
                    </span>
                    <span className="text-muted-foreground text-xs">{Math.floor(Math.random() * 20) + 1} min ago</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm py-1.5 border-b">
                    <span className="text-foreground">{page.coin} trade completed</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">{(Math.random() * 500 + 50).toFixed(0)} {page.coinSymbol}</span>
                      <span className="text-muted-foreground text-xs">{Math.floor(Math.random() * 5) + 1} min ago</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1.5 border-b">
                    <span className="text-foreground">New {page.action} offer posted</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">{(Math.random() * 1000 + 100).toFixed(0)} {page.coinSymbol}</span>
                      <span className="text-muted-foreground text-xs">{Math.floor(Math.random() * 10) + 5} min ago</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1.5">
                    <span className="text-foreground">Escrow released</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">{(Math.random() * 300 + 25).toFixed(0)} {page.coinSymbol}</span>
                      <span className="text-muted-foreground text-xs">{Math.floor(Math.random() * 15) + 10} min ago</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Offers */}
        {relevantOffers.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-1">
              Top {page.coin} {page.action === "buy" ? "Sellers" : "Buyers"}
              {page.location ? ` in ${page.location}` : ""}
              {page.paymentMethod ? ` accepting ${page.paymentMethod}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Live offers updated every 30 seconds • All trades escrow-protected
            </p>
            <div className="space-y-2">
              {relevantOffers.map((offer) => (
                <OfferMiniCard key={offer.id} offer={offer} />
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link to="/marketplace">View All {page.coin} Offers <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        )}

        {/* Content Sections */}
        <div className="max-w-3xl space-y-8 mb-12">
          {page.contentSections.map((section, i) => (
            <div key={i}>
              <h2 className="font-display text-xl font-bold text-foreground mb-3">{section.heading}</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                {section.text.split("\n").map((line, j) => {
                  if (line.trim() === "") return null;
                  if (line.match(/^\d+\.\s\*\*/)) {
                    const match = line.match(/^\d+\.\s\*\*(.+?)\*\*\s*[—–-]\s*(.*)/);
                    if (match) return <div key={j} className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><span><strong className="text-foreground">{match[1]}</strong> — {match[2]}</span></div>;
                  }
                  if (line.startsWith("- **")) {
                    const match = line.match(/- \*\*(.+?)\*\*\s*[—–-]\s*(.*)/);
                    if (match) return <div key={j} className="flex items-start gap-2 ml-2"><span className="text-primary">•</span><span><strong className="text-foreground">{match[1]}</strong> — {match[2]}</span></div>;
                  }
                  if (line.startsWith("- ")) return <div key={j} className="flex items-start gap-2 ml-2"><span className="text-primary">•</span><span>{line.replace("- ", "")}</span></div>;
                  return <p key={j}>{line}</p>;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        {page.faq.length > 0 && (
          <div className="max-w-3xl mb-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {page.faq.map((item, i) => (
                <details key={i} className="group border rounded-lg">
                  <summary className="flex items-center justify-between cursor-pointer p-4 font-semibold text-foreground">
                    {item.q}
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-4 pb-4 text-muted-foreground leading-relaxed">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Parent Links */}
        {page.parentLinks.length > 0 && (
          <div className="mb-6">
            <h3 className="font-display font-semibold text-foreground text-sm mb-2">Browse Up</h3>
            <div className="flex flex-wrap gap-2">
              {page.parentLinks.map((link) => (
                <Button key={link.href} variant="ghost" size="sm" asChild>
                  <Link to={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Related Links — Internal Linking */}
        <Card>
          <CardContent className="py-6">
            <h2 className="font-display font-semibold text-foreground mb-4">Related Pages</h2>
            <div className="flex flex-wrap gap-2">
              {page.relatedLinks.map((link) => (
                <Button key={link.href} variant="outline" size="sm" asChild>
                  <Link to={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SEOLanding;
