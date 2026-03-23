import { useParams, Link } from "react-router-dom";
import { Shield, Star, CheckCircle, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOHead from "@/components/SEOHead";
import { mockListings } from "@/data/mock-listings";

const UserProfile = () => {
  const { username } = useParams();
  const userListings = mockListings.filter((l) => l.username === username);
  const user = userListings[0];

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">User Not Found</h1>
        <Button asChild><Link to="/marketplace">Back to Marketplace</Link></Button>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${username} — Trader Profile | TrustP2P`}
        description={`View ${username}'s trader profile on TrustP2P. ${user.completedTrades} completed trades, ${user.rating}/5 rating.`}
      />

      <div className="container py-12">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Marketplace", href: "/marketplace" }, { label: username || "", href: `/user/${username}` }]} />

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl">
          {/* Profile */}
          <div>
            <Card>
              <CardContent className="pt-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-2xl mx-auto mb-4">
                  {username?.[0]}
                </div>
                <h1 className="font-display text-xl font-bold text-foreground flex items-center justify-center gap-2">
                  {username}
                  {user.isVerified && <Shield className="h-4 w-4 text-primary" />}
                </h1>
                <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {user.country}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                  <div>
                    <div className="font-display text-lg font-bold text-foreground">{user.completedTrades}</div>
                    <div className="text-xs text-muted-foreground">Trades</div>
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold text-foreground flex items-center justify-center gap-0.5">
                      <Star className="h-4 w-4 fill-warning text-warning" /> {user.rating}
                    </div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold text-foreground">~2m</div>
                    <div className="text-xs text-muted-foreground">Response</div>
                  </div>
                </div>

                <div className="mt-6 space-y-2 text-sm">
                  {user.isVerified && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" /> Email Verified
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" /> Joined Dec 2023
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Active Offers</CardTitle>
              </CardHeader>
              <CardContent>
                {userListings.length > 0 ? (
                  <div className="space-y-3">
                    {userListings.map((listing) => (
                      <div key={listing.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {listing.type === "sell" ? "Selling" : "Buying"} {listing.coin}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {listing.price.toLocaleString()} {listing.currency} • {listing.paymentMethods.join(", ")}
                          </div>
                        </div>
                        <Button size="sm" asChild>
                          <Link to={`/offer/${listing.id}`}>View Offer</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active offers.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
