import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Clock, CheckCircle, Shield, AlertTriangle, Wallet } from "lucide-react";
import { type SeededOffer } from "@/data/seed-engine";
import { useUserTrades } from "@/hooks/use-trades";
import { useAuth, computeKycLevel, getTradeLimits } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { toast } from "sonner";
import { CountdownTimer } from "./BuyModal";
import VerificationGateDialog from "@/components/VerificationGateDialog";
import type { KycLevel } from "@/hooks/use-auth";

interface SellToOfferModalProps {
  offer: SeededOffer | null;
  open: boolean;
  onClose: () => void;
}

export default function SellToOfferModal({ offer, open, onClose }: SellToOfferModalProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { createTrade } = useUserTrades();
  const { getBalance, deposit, lockBalance, unlockBalance } = useWallets();
  const [step, setStep] = useState<"form" | "confirm" | "locked">("form");
  const [amount, setAmount] = useState("");
  const [lockedTradeId, setLockedTradeId] = useState<string | null>(null);
  const [lockedExpiresAt, setLockedExpiresAt] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateLevel, setGateLevel] = useState<KycLevel>("basic");
  const [gateAction, setGateAction] = useState("");

  useEffect(() => {
    if (open && offer) {
      setStep("form");
      setAmount("");
      setLockedTradeId(null);
    }
  }, [open, offer]);

  if (!offer) return null;

  const sym = offer.currencySymbol ?? "₹";
  const cur = offer.currency ?? "INR";
  const numAmount = parseFloat(amount) || 0;
  const cryptoAmount = numAmount > 0 ? (numAmount / offer.price).toFixed(6) : "0";
  const cryptoNum = parseFloat(cryptoAmount);
  const balance = getBalance(offer.assetSymbol);
  const available = balance.balance - balance.lockedBalance;
  const hasEnoughBalance = available >= cryptoNum && cryptoNum > 0;
  const isInRange = numAmount >= offer.minLimit && numAmount <= offer.maxLimit;
  const payment = offer.paymentMethods[0] ?? "UPI";

  const kycLevel = profile ? computeKycLevel(profile) : "guest";

  const handleConfirm = () => {
    if (!isInRange || !hasEnoughBalance) return;
    if (kycLevel === "guest") {
      setGateLevel("basic");
      setGateAction("You need to verify your email and phone to trade.");
      setGateOpen(true);
      return;
    }
    const limits = getTradeLimits(kycLevel);
    if (numAmount > limits.max) {
      const nextLevel = kycLevel === "basic" ? "verified" : "trusted";
      setGateLevel(nextLevel as KycLevel);
      setGateAction(`This trade (₹${numAmount.toLocaleString()}) exceeds your current limit of ${limits.label}.`);
      setGateOpen(true);
      return;
    }
    setStep("confirm");
  };

  const handleLock = async () => {
    if (!user) return;

    let didLockFunds = false;
    try {
      await lockBalance.mutateAsync({ asset: offer.assetSymbol, amount: cryptoNum });
      didLockFunds = true;

      const trade = await createTrade.mutateAsync({
        offer_id: offer.id,
        seller_id: user.id,
        asset: offer.assetSymbol,
        amount: cryptoNum,
        price: offer.price,
        total: numAmount,
        currency: cur,
        payment_method: payment,
      });

      setLockedTradeId(trade.id);
      setLockedExpiresAt(new Date(trade.expires_at!).getTime());
      setStep("locked");
      toast.success("Deal locked! Your crypto is secured in escrow.");
    } catch {
      if (didLockFunds) {
        try {
          await unlockBalance.mutateAsync({ asset: offer.assetSymbol, amount: cryptoNum });
        } catch {
          // silent rollback failure
        }
      }
      toast.error("Failed to lock deal. Please try again.");
    }
  };

  const handleDeposit = () => {
    deposit.mutate({ asset: offer.assetSymbol, amount: 1000 });
    toast.success(`Deposited 1,000 ${offer.assetSymbol} (simulated)`);
  };

  const handleGoToTrade = () => {
    onClose();
    if (lockedTradeId) {
      navigate(`/trade/${lockedTradeId}`);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Sell {offer.assetSymbol}
                <Badge variant="secondary" className="text-xs">to {offer.username}</Badge>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Review amount and lock your crypto in escrow to sell against this buyer offer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Buyer's price per {offer.assetSymbol}</span>
                  <span className="font-bold text-foreground">{sym}{offer.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Margin</span>
                  <span className="text-success font-medium">{offer.margin} above market</span>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Available {offer.assetSymbol}</span>
                  </div>
                  <span className="font-bold text-foreground">{available.toFixed(4)}</span>
                </div>
                {available <= 0 && (
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleDeposit}>
                    Simulate Deposit (1,000 {offer.assetSymbol})
                  </Button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Amount ({cur})</label>
                <Input
                  type="number"
                  placeholder={`Min ${sym}${offer.minLimit.toLocaleString()} — Max ${sym}${offer.maxLimit.toLocaleString()}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {numAmount > 0 && numAmount < offer.minLimit && (
                  <p className="text-xs text-destructive mt-1">
                    Minimum amount is {sym}{offer.minLimit.toLocaleString()}
                  </p>
                )}
                {numAmount > offer.maxLimit && (
                  <p className="text-xs text-destructive mt-1">
                    Maximum amount is {sym}{offer.maxLimit.toLocaleString()}
                  </p>
                )}
                {isInRange && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll sell ≈ <span className="font-bold text-foreground">{cryptoAmount} {offer.assetSymbol}</span>
                  </p>
                )}
                {isInRange && !hasEnoughBalance && cryptoNum > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    Insufficient balance. You need {cryptoAmount} {offer.assetSymbol} but have {available.toFixed(4)}.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
                <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
                Your {offer.assetSymbol} will be locked in escrow until the buyer pays
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!isInRange || !hasEnoughBalance}
                className="w-full"
              >
                Continue to Lock Deal
              </Button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Confirm Sell & Escrow Lock
              </DialogTitle>
              <DialogDescription className="sr-only">
                Confirm this sell trade and lock funds in escrow.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You sell</span>
                  <span className="font-bold text-foreground">{cryptoAmount} {offer.assetSymbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You receive</span>
                  <span className="font-bold text-foreground">{sym}{numAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Locked price</span>
                  <span className="font-medium text-foreground">{sym}{offer.price.toLocaleString()}/{offer.assetSymbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment via</span>
                  <Badge variant="secondary">{payment}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Buyer</span>
                  <span className="text-foreground">{offer.username}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-warning/10 rounded-lg p-3 border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <span>Your <strong>{cryptoAmount} {offer.assetSymbol}</strong> will be locked in escrow. It will be released to the buyer once you confirm payment receipt, or returned to you if the trade expires.</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Back</Button>
                <Button onClick={handleLock} disabled={createTrade.isPending || lockBalance.isPending} className="flex-1">
                  <Lock className="h-4 w-4 mr-1" /> {createTrade.isPending || lockBalance.isPending ? "Locking…" : "Lock & Sell"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "locked" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                Crypto Locked in Escrow!
              </DialogTitle>
              <DialogDescription className="sr-only">
                Deal has been locked successfully. You can now continue on the trade page.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selling</span>
                  <span className="font-bold text-foreground">{cryptoAmount} {offer.assetSymbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You'll receive</span>
                  <span className="font-bold text-foreground">{sym}{numAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Time remaining</span>
                  <CountdownTimer expiresAt={lockedExpiresAt} />
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium text-foreground mb-2">Next Steps</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>1. Wait for the buyer to send {sym}{numAmount.toLocaleString()} via {payment}</p>
                  <p>2. Verify payment in your bank/payment app</p>
                  <p>3. Confirm receipt to release {offer.assetSymbol} to the buyer</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
                <Shield className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>Your crypto is secured in escrow. If the buyer doesn't pay within 3 hours, it will be returned to your wallet.</span>
              </div>

              <Button onClick={handleGoToTrade} className="w-full">
                Go to Trade Page
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    <VerificationGateDialog open={gateOpen} onClose={() => setGateOpen(false)} requiredLevel={gateLevel} action={gateAction} />
    </>
  );
}
