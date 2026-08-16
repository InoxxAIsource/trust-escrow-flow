import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Receipt,
  TriangleAlert,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TradeStateBadge } from "@/components/demo/DemoIndicators";
import { TradeTimeline, TradeProgressRail } from "@/components/trade/TradeTimeline";
import { DemoTradeChat } from "@/components/trade/DemoTradeChat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCancelDemoTrade,
  useDemoTrade,
  useMarkPaymentSent,
  useRaiseDispute,
  useSendTradeMessage,
  useTradeEvents,
  useTradeMessages,
  describeTradeError,
} from "@/hooks/use-demo-trade";
import { useAuth } from "@/hooks/use-auth";
import {
  ACCEPTED_ATTACHMENT_MIME,
  MAX_ATTACHMENT_BYTES,
} from "@/integrations/supabase/demo";
import { formatAssetAmount, formatMoney, type Currency } from "@/lib/pricing";
import { canTransition } from "@/lib/trade-state-machine";
import { CountdownTimer } from "@/components/CountdownTimer";

export default function DemoTradePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { data: trade, isLoading } = useDemoTrade(id);
  const { data: events = [] } = useTradeEvents(id);
  const { data: messages = [], isLoading: messagesLoading } = useTradeMessages(id);

  const markPaid = useMarkPaymentSent();
  const cancelTrade = useCancelDemoTrade();
  const dispute = useRaiseDispute();
  const sendMessage = useSendTradeMessage(id);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [paidOpen, setPaidOpen] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawPending, setWithdrawPending] = useState(false);
  const receiptRef = useRef<HTMLInputElement>(null);

  if (authLoading || isLoading) {
    return <CentredNotice icon={<Loader2 className="h-8 w-8 animate-spin" />} title="Loading trade…" />;
  }

  if (!user) {
    return (
      <CentredNotice
        title="Sign in to view this trade"
        action={<Button onClick={() => navigate("/auth")}>Sign in</Button>}
      />
    );
  }

  if (!trade) {
    return (
      <CentredNotice
        title="Trade not found"
        body="This trade doesn't exist, or it isn't yours to view."
        action={<Button onClick={() => navigate("/marketplace")}>Back to marketplace</Button>}
      />
    );
  }

  const state = trade.demo_state;
  const isComplete = state === "COMPLETED";
  const isCancelled = state === "CANCELLED";
  const isExpired = state === "EXPIRED";
  const isTerminated = isComplete || isCancelled || isExpired;
  const canMarkPaid = canTransition(state, "PAYMENT_MARKED");
  const canCancel = canTransition(state, "CANCELLED");
  const canDispute = canTransition(state, "DISPUTED");
  const awaitingOperator = state === "AWAITING_PAYMENT_DETAILS";
  // After payment details have been sent, user can upload a receipt in the docs tab
  const canUploadReceipt = state === "PAYMENT_DETAILS_SENT" || canMarkPaid;

  // Countdown: show while trade is live and has an expiry
  const expiresAtMs = trade.expires_at ? new Date(trade.expires_at).getTime() : null;

  /**
   * Posts the receipt before the transition, so the operator sees the evidence
   * and the "payment sent" flag arrive together.
   */
  const handleMarkPaid = async () => {
    try {
      if (receipt) {
        await sendMessage.mutateAsync({ message: "Payment receipt", file: receipt, isReceipt: true });
      }
      await markPaid.mutateAsync(trade.id);
      toast.success(receipt ? "Receipt uploaded and payment marked as sent." : "Payment marked as sent - awaiting operator confirmation.");
      setPaidOpen(false);
      setReceipt(null);
    } catch (error) {
      toast.error(describeTradeError(error));
    }
  };

  const handleDispute = async () => {
    try {
      await dispute.mutateAsync({ tradeId: trade.id, reason: disputeReason.trim() });
      toast.success("Dispute raised - an operator will review this trade.");
      setDisputeOpen(false);
      setDisputeReason("");
    } catch (error) {
      toast.error(describeTradeError(error));
    }
  };

  const handleCancel = async () => {
    try {
      await cancelTrade.mutateAsync({ tradeId: trade.id, reason: "Cancelled by user" });
      toast.success("Trade cancelled.");
    } catch (error) {
      toast.error(describeTradeError(error));
    } finally {
      setConfirmCancel(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress.trim()) return;
    setWithdrawPending(true);
    // Demo: simulate a brief delay then confirm.
    await new Promise((r) => setTimeout(r, 1200));
    setWithdrawPending(false);
    setWithdrawOpen(false);
    setWithdrawAddress("");
    toast.success(
      `Withdrawal of ${formatAssetAmount(trade.amount, trade.asset)} ${trade.asset} initiated. ` +
        "In a live environment, this would be sent to the on-chain address provided.",
    );
  };

  return (
    <div className="container py-8">
      <SEOHead title={`Trade ${trade.trade_ref} - P2PxBT`} description="Peer-to-peer trade." noindex />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: trade.trade_ref, href: `/trade/${trade.id}` },
        ]}
      />

      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {trade.side === "BUY" ? "Buying" : "Selling"}{" "}
            {formatAssetAmount(trade.amount, trade.asset)} {trade.asset}
          </h1>
          <TradeStateBadge state={state} />
        </div>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{trade.trade_ref}</p>
      </header>

      {!isCancelled && !isExpired && (
        <div className="mb-6">
          <TradeProgressRail state={state} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: chat + actions */}
        <div className="space-y-6 lg:col-span-2">
          {isExpired && (
            <Card className="border-destructive/30 bg-destructive/[0.05]">
              <CardContent className="flex gap-3 p-4">
                <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Payment window expired</p>
                  <p className="text-muted-foreground">
                    The 4-hour payment window for this trade has elapsed and it has been
                    automatically cancelled. Please open a new trade if you wish to continue.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {awaitingOperator && (
            <Card className="border-amber-500/30 bg-amber-500/[0.05]">
              <CardContent className="flex gap-3 p-4">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Waiting for payment details</p>
                  <p className="text-muted-foreground">
                    A P2PxBT operator has been notified and will send {trade.payment_method} details
                    to this chat. They are never released automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {isComplete && (
            <>
              {/* Completion banner */}
              <Card className="border-emerald-500/30 bg-emerald-500/[0.05]">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="font-display text-lg font-semibold text-foreground">Trade completed</h2>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <Row label="Asset" value={trade.asset} />
                    <Row label="Amount" value={formatAssetAmount(trade.amount, trade.asset)} />
                    <Row label="P2P price" value={formatMoney(trade.price, trade.currency as Currency)} />
                    <Row label="Total" value={formatMoney(trade.total, trade.currency as Currency)} />
                    <Row label="Payment method" value={trade.payment_method} />
                    <Row label="Counterparty" value={trade.counterparty?.display_name ?? "-"} />
                    <Row label="Trade ID" value={trade.trade_ref} mono />
                  </dl>
                </CardContent>
              </Card>

              {/* Demo wallet credited card */}
              <Card className="border-primary/20 bg-primary/[0.03]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-display text-base">
                    <Wallet className="h-4 w-4 text-primary" />
                    Your wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Credited from {trade.trade_ref}
                      </p>
                      <p className="font-display text-2xl font-bold text-foreground">
                        {formatAssetAmount(trade.amount, trade.asset)}{" "}
                        <span className="text-lg text-muted-foreground">{trade.asset}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Paid {formatMoney(trade.total, trade.currency as Currency)}
                        {" "}at {formatMoney(trade.price, trade.currency as Currency)}/{trade.asset}
                      </p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-lg font-bold text-primary">{trade.asset.slice(0, 1)}</span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => setWithdrawOpen(true)}>
                    <ArrowUpRight className="mr-1.5 h-4 w-4" />
                    Withdraw {trade.asset}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          <DemoTradeChat
            tradeId={trade.id}
            messages={messages}
            isLoading={messagesLoading}
            readOnly={isTerminated}
            viewerRole="buyer"
            canUploadReceipt={canUploadReceipt}
            tradeContext={{
              tradeRef: trade.trade_ref,
              asset: trade.asset,
              amount: formatAssetAmount(trade.amount, trade.asset),
            }}
          />

          {(canMarkPaid || canCancel || canDispute) && (
            <div className="flex flex-wrap gap-2">
              {canMarkPaid && (
                <Button onClick={() => setPaidOpen(true)} disabled={markPaid.isPending}>
                  {markPaid.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Mark payment sent
                </Button>
              )}
              {canCancel && (
                <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                  Cancel trade
                </Button>
              )}
              {canDispute && (
                <Button variant="ghost" onClick={() => setDisputeOpen(true)}>
                  <TriangleAlert className="mr-1.5 h-4 w-4" />
                  Raise dispute
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right: summary + timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Side" value={trade.side} />
                <Row label="Asset" value={trade.asset} />
                <Row label="Amount" value={formatAssetAmount(trade.amount, trade.asset)} />
                <Row label="P2P price" value={formatMoney(trade.price, trade.currency as Currency)} />
                <Row label="Total" value={formatMoney(trade.total, trade.currency as Currency)} />
                <Row label="Payment method" value={trade.payment_method} />
                <Row label="Counterparty" value={trade.counterparty?.display_name ?? "-"} />
              </dl>

              {expiresAtMs && !isTerminated && (
                <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5">
                  <p className="text-xs text-muted-foreground mb-0.5">Payment window</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <CountdownTimer expiresAt={expiresAtMs} />
                    <span className="text-xs text-muted-foreground">remaining</span>
                  </div>
                </div>
              )}

              {isExpired && (
                <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/[0.06] px-3 py-2.5">
                  <p className="text-xs font-medium text-destructive">Payment window elapsed</p>
                </div>
              )}
            </CardContent>
          </Card>
          <TradeTimeline events={events} />
        </div>
      </div>

      {/* Mark paid dialog */}
      <Dialog open={paidOpen} onOpenChange={setPaidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark payment as sent</DialogTitle>
            <DialogDescription>
              Attach your bank receipt or confirmation screenshot. The operator checks it against{" "}
              {trade.trade_ref} before confirming.
            </DialogDescription>
          </DialogHeader>

          <input
            ref={receiptRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_ATTACHMENT_MIME.join(",")}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (file.size > MAX_ATTACHMENT_BYTES) { toast.error("File is larger than 5 MB."); return; }
              if (!ACCEPTED_ATTACHMENT_MIME.includes(file.type)) { toast.error("Attach a PNG, JPEG, WebP, HEIC or PDF."); return; }
              setReceipt(file);
            }}
          />

          {receipt ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2.5">
              <Receipt className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{receipt.name}</span>
              <button type="button" onClick={() => setReceipt(null)} className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => receiptRef.current?.click()}
              className="flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-6 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Upload className="h-5 w-5" />
              <span className="text-sm font-medium">Choose a receipt</span>
              <span className="text-xs">PNG, JPEG, WebP, HEIC or PDF · up to 5 MB</span>
            </button>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleMarkPaid}
              disabled={markPaid.isPending || sendMessage.isPending}
              className="flex-1"
            >
              {(markPaid.isPending || sendMessage.isPending) && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              {receipt ? "Upload and mark as sent" : "Mark as sent without a receipt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute dialog */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a dispute</DialogTitle>
            <DialogDescription>
              This flags {trade.trade_ref} for operator review and posts a note into the trade chat.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="e.g. The payment details in chat don't match the counterparty's account name"
            maxLength={500}
            rows={4}
          />
          <Button onClick={handleDispute} disabled={!disputeReason.trim() || dispute.isPending}>
            {dispute.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Submit dispute
          </Button>
        </DialogContent>
      </Dialog>

      {/* Demo withdraw dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Withdraw {trade.asset}
            </DialogTitle>
            <DialogDescription>
              Enter the on-chain address to receive your{" "}
              {formatAssetAmount(trade.amount, trade.asset)} {trade.asset}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="font-mono text-sm font-semibold text-foreground">
                {formatAssetAmount(trade.amount, trade.asset)} {trade.asset}
              </p>
              <p className="text-xs text-muted-foreground">
                ≈ {formatMoney(trade.total, trade.currency as Currency)} at trade price
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="withdraw-addr" className="text-sm">
                {trade.asset} wallet address
              </Label>
              <Input
                id="withdraw-addr"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder={
                  trade.asset === "BTC" ? "bc1q… or 1… or 3…" :
                  trade.asset === "ETH" ? "0x…" :
                  trade.asset === "SOL" ? "…pubkey (base58)" :
                  "Wallet address"
                }
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Double-check - withdrawals in a live environment cannot be reversed.
              </p>
            </div>

          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleWithdraw}
              disabled={!withdrawAddress.trim() || withdrawPending}
            >
              {withdrawPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpRight className="mr-1.5 h-4 w-4" />
              )}
              {withdrawPending ? "Initiating…" : "Withdraw"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this trade?</AlertDialogTitle>
            <AlertDialogDescription>
              {trade.trade_ref} will be closed and cannot be reopened. You can always start a new
              trade from the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep trade</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Cancel trade</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right font-medium text-foreground ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function CentredNotice({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="container flex flex-col items-center justify-center gap-3 py-24 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
      {body && <p className="max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}
