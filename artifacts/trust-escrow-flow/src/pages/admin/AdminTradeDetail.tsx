import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, CheckCircle2, Loader2, Pencil, Send, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
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
import { TradeTimeline } from "@/components/trade/TradeTimeline";
import { DemoTradeChat } from "@/components/trade/DemoTradeChat";
import { SellerMirrorDialog } from "./AdminConsole";
import { PaymentInstructionsEditor } from "@/components/admin/PaymentInstructionsEditor";
import {
  useConfirmPayment,
  useIsAdmin,
  useMarkTradeOpened,
  usePaymentInstructions,
  useSendPaymentDetails,
} from "@/hooks/use-admin";
import {
  useDemoTrade,
  useTradeEvents,
  useTradeMessages,
  describeTradeError,
} from "@/hooks/use-demo-trade";
import { formatAssetAmount, formatMoney , type Currency } from "@/lib/pricing";
import { canTransition } from "@/lib/trade-state-machine";
import { PAYMENT_FIELD_LABELS, PAYMENT_FIELD_ORDER } from "@/integrations/supabase/demo";

export default function AdminTradeDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const { data: trade, isLoading } = useDemoTrade(id);
  const { data: events = [] } = useTradeEvents(id);
  const { data: messages = [], isLoading: messagesLoading } = useTradeMessages(id);
  const { data: instructions = [] } = usePaymentInstructions(trade?.demo_counterparty_id ?? undefined);

  const markOpened = useMarkTradeOpened();
  const sendDetails = useSendPaymentDetails();
  const confirmPayment = useConfirmPayment();

  const [showMirror, setShowMirror] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);

  // Record that an operator viewed this trade — appears on the buyer's
  // timeline as "Operator opened the trade", which is part of the demo story.
  const tradeId = trade?.id;
  const canRecordOpen = isAdmin && !!tradeId;
  useEffect(() => {
    if (!canRecordOpen || !tradeId) return;
    markOpened.mutate(tradeId);
    // markOpened is a stable mutation handle; re-running on identity changes
    // would fire the RPC repeatedly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRecordOpen, tradeId]);

  if (adminLoading || isLoading) {
    return (
      <div className="container flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container flex flex-col items-center gap-3 py-24 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <h1 className="font-display text-xl font-bold text-foreground">Operator access required</h1>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="container flex flex-col items-center gap-3 py-24 text-center">
        <h1 className="font-display text-xl font-bold text-foreground">Trade not found</h1>
        <Button asChild variant="outline">
          <Link to="/admin">Back to console</Link>
        </Button>
      </div>
    );
  }

  const state = trade.demo_state;
  const matchingInstruction = instructions.find((i) => i.method === trade.payment_method);
  const canSendDetails = canTransition(state, "PAYMENT_DETAILS_SENT");
  const canComplete = canTransition(state, "COMPLETED");

  // Build a counterparty slice that only exposes the current trade's payment
  // method, so the editor shows a single focused tab rather than all rails.
  const editorCounterparty = trade.counterparty
    ? { ...trade.counterparty, payment_methods: [trade.payment_method] }
    : null;

  const handleSend = async () => {
    try {
      await sendDetails.mutateAsync(trade.id);
      toast.success("Payment details sent to the trade chat.");
    } catch (error) {
      toast.error(describeTradeError(error));
    } finally {
      setConfirmSend(false);
    }
  };

  const handleComplete = async () => {
    try {
      await confirmPayment.mutateAsync(trade.id);
      toast.success("Payment confirmed — trade completed.");
    } catch (error) {
      toast.error(describeTradeError(error));
    } finally {
      setConfirmComplete(false);
    }
  };

  return (
    <div className="container py-8">
      <SEOHead title={`Operator — ${trade.trade_ref}`} description="Operator trade mirror." noindex />

      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/admin">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Operator console
        </Link>
      </Button>

      <header className="mb-6 flex flex-wrap items-center gap-2.5">
        <h1 className="font-display text-2xl font-bold text-foreground">{trade.trade_ref}</h1>
        <TradeStateBadge state={state} />
        
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Operator actions */}
          <Card className={canSendDetails ? "border-amber-500/40" : undefined}>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Operator actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canSendDetails ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    The buyer selected{" "}
                    <span className="font-medium text-foreground">{trade.payment_method}</span> and
                    is waiting. Review the mirror's stored details, then send them into the chat.
                  </p>
                  {matchingInstruction ? (
                    <>
                      {/* Read-only preview */}
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.05] p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-medium text-foreground">
                              {matchingInstruction.method}
                            </span>
                          </div>
                          {editorCounterparty && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setEditingDetails((v) => !v)}
                            >
                              {editingDetails ? (
                                <>
                                  <X className="mr-1 h-3 w-3" />
                                  Close editor
                                </>
                              ) : (
                                <>
                                  <Pencil className="mr-1 h-3 w-3" />
                                  Edit details
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <dl className="space-y-0.5 font-mono text-xs text-muted-foreground">
                          {PAYMENT_FIELD_ORDER.filter((k) => matchingInstruction.fields[k]).map((k) => (
                            <div key={k} className="flex gap-2">
                              <dt className="text-foreground/60">{PAYMENT_FIELD_LABELS[k]}:</dt>
                              <dd>{matchingInstruction.fields[k]}</dd>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <dt className="text-foreground/60">Payment Reference:</dt>
                            <dd>{trade.trade_ref}</dd>
                          </div>
                        </dl>
                      </div>

                      {/* Inline editor — shown when operator clicks Edit */}
                      {editingDetails && editorCounterparty && (
                        <div className="rounded-lg border border-border bg-muted/20 p-4">
                          <p className="mb-3 text-xs font-medium text-foreground">
                            Edit {trade.payment_method} details
                          </p>
                          <PaymentInstructionsEditor
                            counterparty={editorCounterparty}
                            instructions={instructions}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        No stored instructions for {trade.payment_method} on this counterparty.
                        Add them below before sending.
                      </p>

                      {/* Editor for adding missing instructions */}
                      {editorCounterparty && (
                        <div className="rounded-lg border border-border bg-muted/20 p-4">
                          <p className="mb-3 text-xs font-medium text-foreground">
                            Add {trade.payment_method} details
                          </p>
                          <PaymentInstructionsEditor
                            counterparty={editorCounterparty}
                            instructions={instructions}
                          />
                        </div>
                      )}
                    </>
                  )}
                  <Button
                    onClick={() => setConfirmSend(true)}
                    disabled={!matchingInstruction || sendDetails.isPending}
                  >
                    <Send className="mr-1.5 h-4 w-4" />
                    Send payment details
                  </Button>
                </>
              ) : canComplete ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    The buyer has marked the payment as sent. Confirm to complete the
                    trade.
                  </p>
                  <Button onClick={() => setConfirmComplete(true)} disabled={confirmPayment.isPending}>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Confirm payment
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No operator action is required at this stage.
                </p>
              )}
            </CardContent>
          </Card>

          <DemoTradeChat
            tradeId={trade.id}
            messages={messages}
            isLoading={messagesLoading}
            readOnly={state === "COMPLETED" || state === "CANCELLED"}
            viewerRole="admin"
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Trade</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Reference" value={trade.trade_ref} mono />
                <Row label="Side" value={trade.side} />
                <Row label="Asset" value={trade.asset} />
                <Row label="Amount" value={formatAssetAmount(trade.amount, trade.asset)} />
                <Row label="P2P price" value={formatMoney(trade.price, trade.currency as Currency)} />
                <Row label="Total" value={formatMoney(trade.total, trade.currency as Currency)} />
                <Row label="Payment method" value={trade.payment_method} />
                <Row label="Counterparty" value={trade.counterparty?.display_name ?? "—"} />
              </dl>
              {trade.counterparty && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => setShowMirror(true)}
                >
                  Open seller mirror
                </Button>
              )}
            </CardContent>
          </Card>

          <TradeTimeline events={events} />
        </div>
      </div>

      <SellerMirrorDialog
        counterparty={showMirror ? (trade.counterparty ?? null) : null}
        onClose={() => setShowMirror(false)}
      />

      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send payment details in chat?</AlertDialogTitle>
            <AlertDialogDescription>
              {trade.counterparty?.display_name}'s {trade.payment_method} details will be
              posted to {trade.trade_ref}'s chat, visible to the buyer, and the trade will move to
              "Payment details sent".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>Send in chat</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm the payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This completes {trade.trade_ref}. This records the trade as
              settled and is not reversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>Confirm payment</AlertDialogAction>
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
