import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { formatAssetAmount, formatMoney, orderTotal, type TradeSide } from "@/lib/pricing";
import type { PricedOffer } from "@/integrations/supabase/demo";
import { useOpenDemoTrade, describeTradeError } from "@/hooks/use-demo-trade";
import { useKycGate } from "@/hooks/use-kyc";
import { useAuth } from "@/hooks/use-auth";

export function OrderTicketDialog({
  offer,
  side,
  open,
  onOpenChange,
}: {
  offer: PricedOffer | null;
  side: TradeSide;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isApproved, isPending, isRejected } = useKycGate();
  const openTrade = useOpenDemoTrade();

  const [amountText, setAmountText] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Reset the ticket whenever a different offer is opened, so a stale amount
  // from a previous listing can never be submitted against this one.
  const offerId = offer?.id ?? null;
  const defaultMethod = offer?.payment_methods[0] ?? "";
  useEffect(() => {
    setAmountText("");
    setPaymentMethod(defaultMethod);
  }, [offerId, defaultMethod]);

  if (!offer) return null;

  const amount = Number(amountText);
  const amountIsValid = Number.isFinite(amount) && amount > 0;
  const total = amountIsValid ? orderTotal(amount, offer.p2pPrice) : 0;

  const exceedsVolume = amountIsValid && amount > offer.available_amount;
  const belowMin = amountIsValid && total < offer.min_limit;
  const aboveMax = amountIsValid && total > offer.max_limit;

  const validationMessage = exceedsVolume
    ? `Only ${formatAssetAmount(offer.available_amount, offer.asset)} ${offer.asset} is available on this listing.`
    : belowMin
      ? `Minimum order is ${formatMoney(offer.min_limit, offer.currency)}.`
      : aboveMax
        ? `Maximum order is ${formatMoney(offer.max_limit, offer.currency)}.`
        : null;

  const canSubmit =
    !!user && isApproved && amountIsValid && !validationMessage && !!paymentMethod && !openTrade.isPending;

  const handleSubmit = async () => {
    try {
      const trade = await openTrade.mutateAsync({
        offerId: offer.id,
        amount,
        unitPrice: offer.p2pPrice,
        paymentMethod,
      });
      toast.success(`Trade ${trade.trade_ref} opened`);
      onOpenChange(false);
      navigate(`/trade/${trade.id}`);
    } catch (error) {
      toast.error(describeTradeError(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {side === "BUY" ? "Buy" : "Sell"} {offer.asset}
          </DialogTitle>
          <DialogDescription>
            Review the order, choose how you want to {side === "BUY" ? "pay" : "be paid"}, then open
            the trade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <dl className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Counterparty</dt>
              <dd className="font-medium text-foreground">{offer.counterparty.display_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Asset</dt>
              <dd className="font-medium text-foreground">{offer.asset}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Market price</dt>
              <dd className="font-mono text-muted-foreground">{formatMoney(offer.marketPrice, offer.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">P2P price</dt>
              <dd className="font-mono font-medium text-foreground">
                {formatMoney(offer.p2pPrice, offer.currency)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {offer.spreadLabel}
                </span>
              </dd>
            </div>
          </dl>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="order-amount">Amount ({offer.asset})</Label>
            <Input
              id="order-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/[^0-9.]/g, ""))}
              aria-invalid={!!validationMessage}
              aria-describedby={validationMessage ? "order-amount-error" : undefined}
            />
            {validationMessage && (
              <p id="order-amount-error" className="text-xs text-destructive">
                {validationMessage}
              </p>
            )}
          </div>

          {/* Payment method - chosen BEFORE the trade opens, per the workflow. */}
          <div className="space-y-2">
            <Label>Payment method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
              {offer.payment_methods.map((m) => (
                <div
                  key={m}
                  className="flex items-center space-x-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
                >
                  <RadioGroupItem value={m} id={`pm-${m}`} />
                  <Label htmlFor={`pm-${m}`} className="flex-1 cursor-pointer font-normal">
                    {m}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Payment details are issued by a P2PxBT operator in the trade chat after the trade
              opens - they are never shown up front.
            </p>
          </div>

          {/* 4-hour payment window notice */}
          <div className="flex gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5">
            <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <span className="font-semibold">4-hour payment window.</span> Once the trade opens,
              you have 4 hours to complete your payment and upload your receipt. The trade
              expires automatically if payment is not confirmed in time.
            </p>
          </div>

          <Separator />

          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">
              Total {side === "BUY" ? "to pay" : "to receive"}
            </span>
            <span className="font-mono text-lg font-semibold text-foreground">
              {formatMoney(total, offer.currency)}
            </span>
          </div>

          {/* Gates */}
          {!user && (
            <GateNotice
              text="Sign in to open a trade."
              actionLabel="Sign in"
              onAction={() => navigate("/auth")}
            />
          )}
          {user && isPending && (
            <GateNotice text="Your identity verification is under review. You'll be able to trade once an operator approves it." />
          )}
          {user && isRejected && (
            <GateNotice
              text="Your last verification attempt was rejected. Submit a new document to continue."
              actionLabel="Resubmit"
              onAction={() => navigate("/verify")}
            />
          )}
          {user && !isApproved && !isPending && !isRejected && (
            <GateNotice
              text="Identity verification is required before your first trade."
              actionLabel="Start verification"
              onAction={() => navigate("/verify")}
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {openTrade.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Open trade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GateNotice({
  text,
  actionLabel,
  onAction,
}: {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3">
      <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1 space-y-2">
        <p className="text-sm text-foreground">{text}</p>
        {actionLabel && onAction && (
          <Button size="sm" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
