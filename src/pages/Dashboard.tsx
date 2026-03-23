import { Link, useNavigate } from "react-router-dom";
import { Clock, Lock, Wallet, TrendingUp, AlertCircle, CheckCircle, Package, Eye, MousePointer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CountdownTimer } from "@/components/marketplace/BuyModal";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useDeals, type DealRow } from "@/hooks/use-deals";
import { useUserOffers, type OfferRow } from "@/hooks/use-offers";

const statusColors: Record<string, string> = {
  locked: "bg-primary/10 text-primary border-primary/20",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-success/10 text-success border-success/20",
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
};

const DealCard = ({ deal }: { deal: DealRow }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${statusColors[deal.status]} border text-xs`}>
            {deal.status === "locked" ? <Lock className="h-3 w-3 mr-1" /> : deal.status === "expired" ? <AlertCircle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
          </Badge>
          <span className="text-xs text-muted-foreground">Buy {deal.asset_symbol}</span>
        </div>
        {deal.status === "locked" && <CountdownTimer expiresAt={new Date(deal.expires_at).getTime()} />}
      </div>
      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Amount</span>
          <p className="font-bold text-foreground">{Number(deal.amount).toLocaleString()} {deal.currency}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Locked Price</span>
          <p className="font-bold text-foreground">{Number(deal.price).toLocaleString()} {deal.currency}/{deal.asset_symbol}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Payment</span>
          <p className="text-foreground">{deal.payment_method}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Seller</span>
          <Link to={`/user/${deal.seller_username}`} className="text-primary hover:underline block">{deal.seller_username}</Link>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Created {new Date(deal.created_at).toLocaleString()}
      </p>
    </CardContent>
  </Card>
);

const OfferCard = ({ offer }: { offer: OfferRow }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${statusColors[offer.status]} border text-xs`}>
            {offer.status === "active" ? <TrendingUp className="h-3 w-3 mr-1" /> : <Package className="h-3 w-3 mr-1" />}
            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
          </Badge>
          <span className="text-xs text-muted-foreground">Sell {offer.asset}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Amount</span>
          <p className="font-bold text-foreground">{Number(offer.remaining_amount)} / {Number(offer.amount)} {offer.asset}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Price</span>
          <p className="font-bold text-foreground">{Number(offer.price).toLocaleString()} {offer.currency}/{offer.asset}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Payments</span>
          <div className="flex gap-1 flex-wrap">
            {offer.payment_methods.map((p) => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Stats</span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {offer.views_count}</span>
            <span className="flex items-center gap-0.5"><MousePointer className="h-3 w-3" /> {offer.clicks_count}</span>
            <span className="flex items-center gap-0.5"><Lock className="h-3 w-3" /> {offer.locks_count}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Created {new Date(offer.created_at).toLocaleString()}
      </p>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { deals, activeDeals } = useDeals();
  const { wallets } = useWallets();
  const { offers } = useUserOffers();

  if (!user) {
    return (
      <div className="container py-12">
        <SEOHead title="Dashboard — TrustP2P" description="View your locked deals, wallet, and active offers." />
        <div className="max-w-md mx-auto text-center py-20">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Sign in to view your dashboard</h1>
          <p className="text-muted-foreground mb-6">Track your locked deals, wallet balances, and sell offers.</p>
          <Button onClick={() => navigate("/auth")} size="lg">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const activeOffers = offers.filter((o) => o.status === "active");

  return (
    <div className="container py-12">
      <SEOHead title="Dashboard — TrustP2P" description="View your locked deals, wallet, and active offers." />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/dashboard" }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome, <span className="font-medium text-foreground">{profile?.username ?? "trader"}</span></p>
        </div>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {wallets.map((w) => (
          <Card key={w.asset}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{w.asset}</span>
              </div>
              <p className="font-display font-bold text-lg text-foreground">{Number(w.balance).toFixed(4)}</p>
              {Number(w.locked_balance) > 0 && (
                <p className="text-xs text-warning flex items-center gap-1">
                  <Lock className="h-3 w-3" /> {Number(w.locked_balance).toFixed(4)} locked
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="deals">
        <TabsList>
          <TabsTrigger value="deals" className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" /> Locked Deals
            {activeDeals.length > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs h-5 px-1.5 ml-1">{activeDeals.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" /> My Offers
            {activeOffers.length > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs h-5 px-1.5 ml-1">{activeOffers.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="mt-4">
          {deals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No locked deals yet</p>
                <p className="text-sm mt-1">Go to the <Link to="/marketplace" className="text-primary hover:underline">marketplace</Link> to lock your first deal.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {deals.map((deal) => <DealCard key={deal.id} deal={deal} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="offers" className="mt-4">
          {offers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No sell offers yet</p>
                <p className="text-sm mt-1">Go to the <Link to="/marketplace" className="text-primary hover:underline">marketplace</Link> to create a sell offer.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
