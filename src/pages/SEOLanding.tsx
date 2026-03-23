import { useLocation, Link } from "react-router-dom";
import { ArrowRight, Shield, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";
import { allSEOPages, type SEOPageData } from "@/data/seo-pages";
import { mockListings } from "@/data/mock-listings";

const SEOLanding = () => {
  const location = useLocation();
  const slug = location.pathname.replace("/", "");
  const page = allSEOPages.find((p) => p.slug === slug);

  if (!page) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Page Not Found</h1>
        <Button asChild><Link to="/">Go Home</Link></Button>
      </div>
    );
  }

  const relevantListings = mockListings
    .filter((l) => l.coin === page.coin || l.coinSymbol === page.coinSymbol)
    .slice(0, 3);

  return (
    <>
      <SEOHead
        title={page.metaTitle}
        description={page.metaDescription}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: page.title,
          description: page.metaDescription,
          url: `https://trustp2p.com/${page.slug}`,
        }}
      />

      <div className="container py-12">
        <Breadcrumbs items={page.breadcrumbs} />

        {/* Hero */}
        <div className="max-w-3xl mb-12">
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
        <div className="grid grid-cols-3 gap-4 max-w-lg mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 text-primary" /> Escrow Protected
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-5 w-5 text-primary" /> 3,200+ Traders
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-5 w-5 text-primary" /> 4.9/5 Rating
          </div>
        </div>

        {/* Sample listings */}
        {relevantListings.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              Top {page.coin} {page.action === "buy" ? "Sellers" : "Buyers"}
            </h2>
            <div className="space-y-3">
              {relevantListings.map((listing) => (
                <Card key={listing.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {listing.username[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{listing.username}</div>
                        <div className="text-xs text-muted-foreground">{listing.completedTrades} trades • {listing.rating}★</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-display font-bold text-foreground">{listing.price.toLocaleString()} {listing.currency}</div>
                        <div className="flex gap-1 mt-1">
                          {listing.paymentMethods.slice(0, 2).map((pm) => (
                            <Badge key={pm} variant="secondary" className="text-xs">{pm}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link to={`/offer/${listing.id}`}>{listing.type === "sell" ? "Buy" : "Sell"}</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" asChild>
                <Link to="/marketplace">View All Listings <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        )}

        {/* Related Links */}
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
