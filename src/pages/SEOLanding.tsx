import { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowRight, Shield, Users, Star, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";
import { getSEOPage } from "@/data/seo-pages";
import { generateAllOffers, filterOffers, type SeededOffer } from "@/data/seed-engine";
import { useCryptoPrices, type CryptoPrices } from "@/hooks/use-crypto-prices";

function toLivePrices(prices?: CryptoPrices) {
  if (!prices) return undefined;
  return { USDT: prices.tether.usd, BTC: prices.bitcoin.usd, ETH: prices.ethereum.usd, SOL: prices.solana.usd };
}

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

  return (
    <>
      <SEOHead
        title={page.metaTitle}
        description={page.metaDescription}
        canonical={`https://buysusdtp2p.com/${page.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: page.title,
          description: page.metaDescription,
          url: `https://buysusdtp2p.com/${page.slug}`,
        }}
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

        {/* Trust indicators */}
        <div className="flex flex-wrap gap-6 mb-10">
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
