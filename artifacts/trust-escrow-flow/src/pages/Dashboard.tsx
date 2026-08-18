import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft, Clock, Lock, Wallet, TrendingUp, AlertCircle, CheckCircle, Package, Eye, MousePointer, CreditCard, XCircle, ArrowDownCircle, Plus, Shield, Mail, User, CalendarDays } from "lucide-react";
import { DepositDialog } from "@/components/DepositDialog";
import { CreateOfferDialog } from "@/components/CreateOfferDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CountdownTimer } from "@/components/CountdownTimer";
import { formatUsd, FALLBACK_MARKET_PRICES, type DemoAsset } from "@/lib/pricing";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useUserTrades, type TradeRow } from "@/hooks/use-trades";
import { useUserOffers, type OfferRow } from "@/hooks/use-offers";
import { useTransactions, type TransactionRow } from "@/hooks/use-transactions";
import { useMyDemoTrades } from "@/hooks/use-demo-trade";
import { useMarketPrices } from "@/hooks/use-demo-market";
import { toast } from "sonner";
import { KycLevelBadge, VerificationStepBadges } from "@/components/VerificationBadge";
import { computeKycLevel, getTradeLimits } from "@/hooks/use-auth";
import TrustScoreBadge from "@/components/TrustScoreBadge";
import { useMyRisk } from "@/hooks/use-risk";
import VerificationProgressCard from "@/components/VerificationProgressCard";

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
              <p className="font-bold text-foreground">{formatUsd(Number(trade.total))}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Price</span>
              <p className="font-bold text-foreground">
                {formatUsd(Number(trade.price))}/{trade.asset}
              </p>
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

const OfferCard = ({ offer, onCancel, isCancelling }: { offer: OfferRow; onCancel: (id: string) => void; isCancelling: boolean }) => (
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
        {offer.status === "active" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
            onClick={() => onCancel(offer.id)}
            disabled={isCancelling}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        )}
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
      {offer.status === "active" && Number(offer.remaining_amount) > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-warning bg-warning/5 rounded px-2 py-1.5 mt-2 border border-warning/10">
          <Lock className="h-3 w-3" />
          {Number(offer.remaining_amount)} {offer.asset} reserved for this offer
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Created {new Date(offer.created_at).toLocaleString()}
      </p>
    </CardContent>
  </Card>
);

const TransactionCard = ({ tx }: { tx: TransactionRow }) => (
  <div className="flex items-center justify-between py-3 border-b last:border-0">
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
        <ArrowDownCircle className="h-4 w-4 text-success" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground capitalize">{tx.type}</p>
        <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold text-foreground">+{Number(tx.amount).toFixed(4)} {tx.asset}</p>
      <Badge variant="secondary" className="text-xs capitalize">{tx.status}</Badge>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { trades, activeTrades } = useUserTrades();
  const { wallets } = useWallets();
  const { offers, cancelOffer } = useUserOffers();
  const { transactions } = useTransactions();
  const { trustScore, level: riskLevel, restrictions } = useMyRisk();
  const { data: demoTrades = [] } = useMyDemoTrades();
  const { data: market } = useMarketPrices();
  const [depositAsset, setDepositAsset] = useState<string | null>(null);
  const [withdrawAsset, setWithdrawAsset] = useState<string | null>(null);
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [withdrawAddr, setWithdrawAddr] = useState("");
  const [withdrawBusy, setWithdrawBusy] = useState(false);

  // Minimum withdrawal = 1 BTC worth of the asset, using per-asset fallback prices.
  const btcPriceUsd = market?.prices.USD.BTC ?? FALLBACK_MARKET_PRICES.USD.BTC;
  const getAssetPriceUsd = (asset: string) =>
    market?.prices.USD[asset as DemoAsset] ?? FALLBACK_MARKET_PRICES.USD[asset as DemoAsset] ?? btcPriceUsd;
  const isBelowMinWithdraw = (asset: string, amount: number) =>
    amount * getAssetPriceUsd(asset) < btcPriceUsd;

  // Aggregate completed demo trades into per-asset holdings.
  const demoHoldings = demoTrades
    .filter((t) => t.demo_state === "COMPLETED" && t.side === "BUY")
    .reduce<Record<string, { amount: number; totalPaid: number; currency: string; trades: number }>>(
      (acc, t) => {
        const key = t.asset;
        const prev = acc[key] ?? { amount: 0, totalPaid: 0, currency: t.currency, trades: 0 };
        return {
          ...acc,
          [key]: {
            amount: prev.amount + Number(t.amount),
            totalPaid: prev.totalPaid + Number(t.total),
            currency: t.currency,
            trades: prev.trades + 1,
          },
        };
      },
      {},
    );
  const demoAssets = Object.keys(demoHoldings);

  const handleDemoWithdraw = async () => {
    if (!withdrawAddr.trim() || !withdrawAsset) return;
    // Safety net — block if below 1 BTC minimum even if dialog was opened.
    const amount = demoHoldings[withdrawAsset]?.amount ?? 0;
    if (isBelowMinWithdraw(withdrawAsset, amount)) {
      toast.error("Withdrawal blocked: balance is below the 1 BTC minimum threshold.");
      setWithdrawAsset(null);
      setWithdrawAddr("");
      return;
    }
    setWithdrawBusy(true);
    await new Promise((r) => setTimeout(r, 1200));
    setWithdrawBusy(false);
    toast.success(
      `Withdrawal of ${amount.toFixed(6)} ${withdrawAsset} initiated. ` +
        "In a live environment, this would be sent to the on-chain address provided.",
    );
    setWithdrawAsset(null);
    setWithdrawAddr("");
  };

  if (!user) {
    return (
      <div className="container py-12">
        <SEOHead title="Dashboard - P2PxBT" description="View your trades, wallet, and active offers." canonical="https://p2pxbt.com/dashboard" noindex />
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

  const handleCancelOffer = async (offerId: string) => {
    try {
      await cancelOffer.mutateAsync(offerId);
      toast.success("Offer cancelled - funds restored to your wallet");
    } catch {
      toast.error("Failed to cancel offer");
    }
  };

  return (
    <div className="container py-12">
      <SEOHead title="Dashboard - P2PxBT" description="View your trades, wallet, and active offers." canonical="https://p2pxbt.com/dashboard" noindex />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/dashboard" }]} />

      {profile?.kyc_status !== "verified" && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-warning/30 bg-warning/5">
          <Shield className="h-5 w-5 text-warning flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Identity verification required</p>
            <p className="text-xs text-muted-foreground">
              Verify your identity to open your first trade.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/verify")}>Verify Account</Button>
        </div>
      )}

      <VerificationProgressCard />

      {/* Profile card */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0 h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="font-display text-xl font-bold text-primary select-none">
                {(profile?.username ?? user.email ?? "?")[0].toUpperCase()}
              </span>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-display text-xl font-bold text-foreground truncate">
                  {profile?.username ?? "Trader"}
                </h1>
                {profile && <KycLevelBadge level={computeKycLevel(profile)} />}
                {profile && <TrustScoreBadge trustScore={trustScore} riskLevel={riskLevel} size="sm" showLabel />}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  @{profile?.username ?? "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                  Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            <Button size="sm" onClick={() => setCreateOfferOpen(true)} className="sm:self-start">
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Offer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Overview */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-foreground">Wallets</h2>
        <span className="text-xs text-muted-foreground">Tap a wallet to deposit</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {wallets.map((w) => {
          const available = Number(w.balance) - Number(w.locked_balance);
          return (
            <Card key={w.asset} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{w.asset}</span>
                  </div>
                </div>
                <p className="font-display font-bold text-lg text-foreground">{available.toFixed(4)}</p>
                <p className="text-xs text-muted-foreground">available</p>
                {Number(w.locked_balance) > 0 && (
                  <p className="text-xs text-warning flex items-center gap-1 mt-0.5">
                    <Lock className="h-3 w-3" /> {Number(w.locked_balance).toFixed(4)} locked
                  </p>
                )}
                {Number(w.balance) > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Total: {Number(w.balance).toFixed(4)}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full h-7 text-xs"
                  onClick={() => setDepositAsset(w.asset)}
                >
                  <ArrowDownLeft className="mr-1 h-3.5 w-3.5" />
                  Deposit
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Demo P2P Holdings - aggregated from completed demo trades */}
      {demoAssets.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-foreground">
              P2P Holdings
            </h2>
            <span className="text-xs text-muted-foreground">
              From completed peer-to-peer trades
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {demoAssets.map((asset) => {
              const h = demoHoldings[asset]!;
              return (
                <Card key={asset} className="border-primary/20 bg-primary/[0.02]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{asset}</span>
                    </div>
                    <p className="font-display font-bold text-lg text-foreground">
                      {h.amount.toFixed(6)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      from {h.trades} trade{h.trades !== 1 ? "s" : ""}
                    </p>
                    {isBelowMinWithdraw(asset, h.amount) ? (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-[10px] leading-snug text-destructive">
                          Min. withdrawal: 1 BTC equivalent (~${Math.round(btcPriceUsd / getAssetPriceUsd(asset) * 100) / 100} {asset})
                        </p>
                        <Button size="sm" variant="outline" className="w-full h-7 text-xs" disabled>
                          <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                          Withdraw
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full h-7 text-xs"
                        onClick={() => setWithdrawAsset(asset)}
                      >
                        <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                        Withdraw
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

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
          <TabsTrigger value="history" className="flex items-center gap-1">
            <ArrowDownCircle className="h-3.5 w-3.5" /> Deposits
            {transactions.length > 0 && (
              <Badge className="bg-muted text-muted-foreground text-xs h-5 px-1.5 ml-1">{transactions.length}</Badge>
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
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onCancel={handleCancelOffer}
                  isCancelling={cancelOffer.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ArrowDownCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No deposits yet</p>
                <p className="text-sm mt-1">Deposit crypto to start trading on the <Link to="/marketplace" className="text-primary hover:underline">marketplace</Link>.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                {transactions.map((tx) => <TransactionCard key={tx.id} tx={tx} />)}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Offer dialog */}
      <CreateOfferDialog open={createOfferOpen} onOpenChange={setCreateOfferOpen} />

      {/* Deposit dialog */}
      <DepositDialog
        asset={depositAsset ?? ""}
        open={!!depositAsset}
        onOpenChange={(open) => { if (!open) setDepositAsset(null); }}
      />

      {/* Demo withdraw dialog */}
      <Dialog open={!!withdrawAsset} onOpenChange={(open) => { if (!open) { setWithdrawAsset(null); setWithdrawAddr(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Withdraw {withdrawAsset}
            </DialogTitle>
            <DialogDescription>
              Enter the on-chain address for your {withdrawAsset} withdrawal.
            </DialogDescription>
          </DialogHeader>

          {withdrawAsset && demoHoldings[withdrawAsset] && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="font-mono text-sm font-semibold text-foreground">
                  {demoHoldings[withdrawAsset]!.amount.toFixed(6)} {withdrawAsset}
                </p>
                <p className="text-xs text-muted-foreground">
                  from {demoHoldings[withdrawAsset]!.trades} completed trade
                  {demoHoldings[withdrawAsset]!.trades !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dash-withdraw-addr" className="text-sm">
                  {withdrawAsset} wallet address
                </Label>
                <Input
                  id="dash-withdraw-addr"
                  value={withdrawAddr}
                  onChange={(e) => setWithdrawAddr(e.target.value)}
                  placeholder={
                    withdrawAsset === "BTC" ? "bc1q… or 1… or 3…" :
                    withdrawAsset === "ETH" ? "0x…" :
                    withdrawAsset === "SOL" ? "…pubkey (base58)" :
                    "Wallet address"
                  }
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setWithdrawAsset(null); setWithdrawAddr(""); }}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleDemoWithdraw}
                  disabled={!withdrawAddr.trim() || withdrawBusy}
                >
                  {withdrawBusy ? (
                    <><span className="mr-1.5 h-4 w-4 animate-spin">⟳</span>Initiating…</>
                  ) : (
                    <><ArrowUpRight className="mr-1.5 h-4 w-4" />Withdraw</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
