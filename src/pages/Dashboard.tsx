import { Link, useNavigate } from "react-router-dom";
import { Clock, Lock, Wallet, TrendingUp, AlertCircle, CheckCircle, Package, Eye, MousePointer, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CountdownTimer } from "@/components/marketplace/BuyModal";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useUserTrades, type TradeRow } from "@/hooks/use-trades";
import { useUserOffers, type OfferRow } from "@/hooks/use-offers";

const tradeStatusColors: Record<string, string> = {
  locked: "bg-primary/10 text-primary border-primary/20",
  paid: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  pending: "bg-muted text-muted-foreground border-border",
  disputed: "bg-destructive/10 text-destructive border-destructive/20",
};

const tradeStatusIcons: Record<string, React.ElementType> = {
  locked: Lock,
  paid: CreditCard,
  completed: CheckCircle,
  expired: AlertCircle,
  cancelled: AlertCircle,
  pending: Clock,
  disputed: AlertCircle,
};

const offerStatusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
  completed: "bg-success/10 text-success border-success/20",
};

const TradeCard = ({ trade }: { trade: TradeRow }) => {
  const StatusIcon = tradeStatusIcons[trade.status] || Clock;
  const isActive = trade.status === "locked" || trade.status === "paid";

  return (
    <Link to={`/trade/${trade.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className={`${tradeStatusColors[trade.status]} border text-xs`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground">Buy {trade.asset}</span>
            </div>
            {isActive && trade.expires_at && (
              <CountdownTimer expiresAt={new Date(trade.expires_at).getTime()} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Amount</span>
              <p className="font-bold text-foreground">₹{Number(trade.total).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Price</span>
              <p className="font-bold text-foreground">₹{Number(trade.price).toLocaleString()}/{trade.asset}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Payment</span>
              <p className="text-foreground">{trade.payment_method}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Crypto</span>
              <p className="text-foreground">{Number(trade.amount).toFixed(6)} {trade.asset}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Created {new Date(trade.created_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

const OfferCard = ({ offer }: { offer: OfferRow }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${offerStatusColors[offer.status]} border text-xs`}>
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
  const { trades, activeTrades } = useUserTrades();
  const { wallets } = useWallets();
  const { offers } = useUserOffers();

  if (!user) {
    return (
      <div className="container py-12">
        <SEOHead title="Dashboard — TrustP2P" description="View your trades, wallet, and active offers." />
        <div className="max-w-md mx-auto text-center py-20">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Sign in to view your dashboard</h1>
          <p className="text-muted-foreground mb-6">Track your trades, wallet balances, and sell offers.</p>
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
      <SEOHead title="Dashboard — TrustP2P" description="View your trades, wallet, and active offers." />
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

      <Tabs defaultValue="trades">
        <TabsList>
          <TabsTrigger value="trades" className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" /> Trades
            {activeTrades.length > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs h-5 px-1.5 ml-1">{activeTrades.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" /> My Offers
            {activeOffers.length > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs h-5 px-1.5 ml-1">{activeOffers.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trades" className="mt-4">
          {trades.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No trades yet</p>
                <p className="text-sm mt-1">Go to the <Link to="/marketplace" className="text-primary hover:underline">marketplace</Link> to lock your first deal.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {trades.map((trade) => <TradeCard key={trade.id} trade={trade} />)}
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
