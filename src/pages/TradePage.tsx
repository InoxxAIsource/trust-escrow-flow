import { useParams, Link, useNavigate } from "react-router-dom";
import { Clock, Lock, CheckCircle, AlertCircle, XCircle, Shield, CreditCard, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CountdownTimer } from "@/components/marketplace/BuyModal";
import TradeChat from "@/components/trade/TradeChat";
import { useTradeById } from "@/hooks/use-trades";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  locked: { label: "Locked", color: "bg-primary/10 text-primary border-primary/20", icon: Lock },
  paid: { label: "Paid — Awaiting Confirmation", color: "bg-warning/10 text-warning border-warning/20", icon: CreditCard },
  completed: { label: "Completed", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  expired: { label: "Expired", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground border-border", icon: XCircle },
  pending: { label: "Pending", color: "bg-muted text-muted-foreground border-border", icon: Clock },
  disputed: { label: "Disputed", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
};

const TradePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trade, isLoading, updateStatus } = useTradeById(id);

  if (!user) {
    return (
      <div className="container py-12 text-center">
        <SEOHead title="Trade — P2PxBT" description="View your trade details." noindex />
        <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Sign in to view this trade</h1>
        <Button onClick={() => navigate("/auth")} size="lg">Sign In</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-12 text-center">
        <SEOHead title="Trade — P2PxBT" description="Loading trade..." noindex />
        <p className="text-muted-foreground">Loading trade…</p>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="container py-12 text-center">
        <SEOHead title="Trade Not Found — P2PxBT" description="Trade not found." noindex />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Trade not found</h1>
        <Button onClick={() => navigate("/dashboard")} variant="outline">Go to Dashboard</Button>
      </div>
    );
  }

  const isBuyer = trade.buyer_id === user.id;
  const isSeller = trade.seller_id === user.id;
  const cfg = statusConfig[trade.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  const isActive = trade.status === "locked" || trade.status === "paid";
  const chatDisabled = !isActive;

  const isExpired = trade.status === "locked" && trade.expires_at && new Date(trade.expires_at).getTime() <= Date.now();

  const handleMarkPaid = async () => {
    try {
      await updateStatus.mutateAsync("paid");
      toast.success("Payment marked. Waiting for seller confirmation.");
    } catch {
      toast.error("Failed to update trade status.");
    }
  };

  const handleConfirmRelease = async () => {
    try {
      await updateStatus.mutateAsync("completed");
      toast.success("Trade completed! Crypto released to buyer.");
    } catch {
      toast.error("Failed to complete trade.");
    }
  };

  const handleCancel = async () => {
    try {
      await updateStatus.mutateAsync("cancelled");
      toast.info("Trade cancelled.");
    } catch {
      toast.error("Failed to cancel trade.");
    }
  };

  return (
    <div className="container py-12 max-w-2xl">
      <SEOHead title={`Trade #${trade.id.slice(0, 8)} — TrustP2P`} description="View your trade details." />
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Dashboard", href: "/dashboard" },
        { label: `Trade #${trade.id.slice(0, 8)}`, href: `/trade/${trade.id}` },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Trade #{trade.id.slice(0, 8)}
        </h1>
        <Badge className={`${cfg.color} border text-sm`}>
          <StatusIcon className="h-3.5 w-3.5 mr-1" />
          {cfg.label}
        </Badge>
      </div>

      {/* Trade Details */}
      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Asset</span>
              <p className="font-bold text-foreground">{trade.asset}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Amount</span>
              <p className="font-bold text-foreground">₹{Number(trade.total).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Price</span>
              <p className="font-bold text-foreground">₹{Number(trade.price).toLocaleString()}/{trade.asset}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Crypto Amount</span>
              <p className="font-bold text-foreground">{Number(trade.amount).toFixed(6)} {trade.asset}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Payment Method</span>
              <p className="text-foreground">{trade.payment_method}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Your Role</span>
              <p className="text-foreground font-medium">{isBuyer ? "Buyer" : isSeller ? "Seller" : "Participant"}</p>
            </div>
          </div>

          {trade.status === "locked" && trade.expires_at && !isExpired && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Time remaining:</span>
              <CountdownTimer expiresAt={new Date(trade.expires_at).getTime()} />
            </div>
          )}

          {isExpired && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">This trade has expired.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buyer: Payment Instructions (locked) */}
      {isBuyer && trade.status === "locked" && !isExpired && (
        <Card className="mb-4">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-foreground mb-2">Payment Instructions</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>1. Send <strong>₹{Number(trade.total).toLocaleString()}</strong> via <strong>{trade.payment_method}</strong></p>
              <p>2. Use the reference provided by the seller in chat</p>
              <p>3. Click "I Have Paid" once payment is sent</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seller: Waiting for buyer payment (locked) */}
      {isSeller && trade.status === "locked" && !isExpired && (
        <div className="flex items-start gap-2 text-sm text-foreground bg-primary/5 rounded-lg p-3 border border-primary/20 mb-4">
          <Wallet className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Your crypto is reserved for this buyer</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Number(trade.amount).toFixed(6)} {trade.asset} is locked in escrow. 
              Waiting for buyer to send ₹{Number(trade.total).toLocaleString()} via {trade.payment_method}.
            </p>
          </div>
        </div>
      )}

      {/* Buyer: Waiting for seller confirmation (paid) */}
      {isBuyer && trade.status === "paid" && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-warning/10 rounded-lg p-3 border border-warning/20 mb-4">
          <Clock className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <span>Payment marked. Waiting for seller to confirm and release crypto.</span>
        </div>
      )}

      {/* Seller: Buyer has paid — confirm & release */}
      {isSeller && trade.status === "paid" && (
        <div className="flex items-start gap-2 text-sm text-foreground bg-success/10 rounded-lg p-3 border border-success/20 mb-4">
          <CreditCard className="h-4 w-4 text-success shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Buyer has marked payment as sent</p>
            <p className="text-xs text-muted-foreground mt-1">
              Verify you received ₹{Number(trade.total).toLocaleString()} via {trade.payment_method}, then release the crypto.
            </p>
          </div>
        </div>
      )}

      {/* Completed */}
      {trade.status === "completed" && (
        <div className="flex items-start gap-2 text-sm text-success bg-success/10 rounded-lg p-3 border border-success/20 mb-4">
          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Trade completed successfully. {isSeller ? "Locked balance has been released." : "Crypto has been released."}</span>
        </div>
      )}

      {/* Expired */}
      {(trade.status === "expired" || isExpired) && isSeller && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted rounded-lg p-3 border mb-4">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <span>This trade expired. Your locked funds have been released back to your wallet.</span>
        </div>
      )}

      {/* Chat */}
      <div className="mb-4">
        <TradeChat tradeId={trade.id} disabled={chatDisabled} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isBuyer && trade.status === "locked" && !isExpired && (
          <>
            <Button onClick={handleMarkPaid} className="flex-1">
              <CreditCard className="h-4 w-4 mr-1" /> I Have Paid
            </Button>
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel Trade
            </Button>
          </>
        )}

        {isSeller && trade.status === "locked" && !isExpired && (
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel Trade
          </Button>
        )}

        {isSeller && trade.status === "paid" && (
          <Button onClick={handleConfirmRelease} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-1" /> Confirm Payment & Release Crypto
          </Button>
        )}

        {(trade.status === "completed" || trade.status === "expired" || trade.status === "cancelled") && (
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">
            Back to Dashboard
          </Button>
        )}
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-2 mt-4">
        <Shield className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <span>Funds secured in escrow. Full escrow settlement will be available soon.</span>
      </div>
    </div>
  );
};

export default TradePage;
