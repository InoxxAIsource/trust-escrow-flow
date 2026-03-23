import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Lock, Wallet, TrendingUp, AlertCircle, CheckCircle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CountdownTimer } from "@/components/marketplace/BuyModal";
import { useLockedDeals, type LockedDeal, type UserOffer } from "@/hooks/use-locked-deals";
import { useDemoWallet } from "@/hooks/use-demo-wallet";
import { useDemoUser } from "@/hooks/use-demo-user";

const statusColors: Record<string, string> = {
  locked: "bg-primary/10 text-primary border-primary/20",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-success/10 text-success border-success/20",
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
};

const DealCard = ({ deal }: { deal: LockedDeal }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${statusColors[deal.status]} border text-xs`}>
            {deal.status === "locked" ? <Lock className="h-3 w-3 mr-1" /> : deal.status === "expired" ? <AlertCircle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
          </Badge>
          <span className="text-xs text-muted-foreground">Buy {deal.assetSymbol}</span>
        </div>
        {deal.status === "locked" && <CountdownTimer expiresAt={deal.expiresAt} />}
      </div>
      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Amount</span>
          <p className="font-bold text-foreground">{deal.amount.toLocaleString()} {deal.currency}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Locked Price</span>
          <p className="font-bold text-foreground">{deal.price.toLocaleString()} {deal.currency}/{deal.assetSymbol}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Payment</span>
          <p className="text-foreground">{deal.paymentMethod}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Seller</span>
          <Link to={`/user/${deal.sellerUsername}`} className="text-primary hover:underline block">{deal.sellerUsername}</Link>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Created {new Date(deal.createdAt).toLocaleString()}
      </p>
    </CardContent>
  </Card>
);

const OfferCard = ({ offer }: { offer: UserOffer }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${statusColors[offer.status]} border text-xs`}>
            {offer.status === "active" ? <TrendingUp className="h-3 w-3 mr-1" /> : <Package className="h-3 w-3 mr-1" />}
            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
          </Badge>
          <span className="text-xs text-muted-foreground">Sell {offer.assetSymbol}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Amount</span>
          <p className="font-bold text-foreground">{offer.remainingAmount} / {offer.amount} {offer.assetSymbol}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Price</span>
          <p className="font-bold text-foreground">{offer.price.toLocaleString()} {offer.currency}/{offer.assetSymbol}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Payments</span>
          <div className="flex gap-1 flex-wrap">
            {offer.paymentMethods.map((p) => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Created {new Date(offer.createdAt).toLocaleString()}
      </p>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, loginAsDemo } = useDemoUser();
  const { deals, activeDeals, expiredDeals, userOffers } = useLockedDeals();
  const { wallets } = useDemoWallet();

  if (!user) {
    return (
      <div className="container py-12">
        <SEOHead title="Dashboard — TrustP2P" description="View your locked deals, wallet, and active offers." />
        <div className="max-w-md mx-auto text-center py-20">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Sign in to view your dashboard</h1>
          <p className="text-muted-foreground mb-6">Track your locked deals, wallet balances, and sell offers.</p>
          <Button onClick={loginAsDemo} size="lg">
            Continue as Demo Trader
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <SEOHead title="Dashboard — TrustP2P" description="View your locked deals, wallet, and active offers." />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/dashboard" }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome, <span className="font-medium text-foreground">{user.username}</span></p>
        </div>
        <Badge variant="secondary" className="text-xs">Demo Mode</Badge>
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
              <p className="font-display font-bold text-lg text-foreground">{w.balance.toFixed(4)}</p>
              {w.lockedBalance > 0 && (
                <p className="text-xs text-warning flex items-center gap-1">
                  <Lock className="h-3 w-3" /> {w.lockedBalance.toFixed(4)} locked
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
            {userOffers.filter((o) => o.status === "active").length > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs h-5 px-1.5 ml-1">{userOffers.filter((o) => o.status === "active").length}</Badge>
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
          {userOffers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No sell offers yet</p>
                <p className="text-sm mt-1">Go to the <Link to="/marketplace" className="text-primary hover:underline">marketplace</Link> to create a sell offer.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {userOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
