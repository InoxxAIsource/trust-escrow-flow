import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lock, Clock, CheckCircle, Shield, AlertTriangle } from "lucide-react";
import { type SeededOffer } from "@/data/seed-engine";
import { useUserTrades } from "@/hooks/use-trades";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface BuyModalProps {
  offer: SeededOffer | null;
  open: boolean;
  onClose: () => void;
}

function CountdownTimer({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span className="font-mono text-sm font-bold text-primary">{remaining}</span>
  );
}

export default function BuyModal({ offer, open, onClose }: BuyModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createTrade } = useUserTrades();
  const [step, setStep] = useState<"form" | "confirm" | "locked">("form");
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState("");
  const [lockedTradeId, setLockedTradeId] = useState<string | null>(null);
  const [lockedExpiresAt, setLockedExpiresAt] = useState(0);

  useEffect(() => {
    if (open && offer) {
      setStep("form");
      setAmount("");
      setPayment(offer.paymentMethods[0] ?? "UPI");
      setLockedTradeId(null);
    }
  }, [open, offer]);

  if (!offer) return null;

  const numAmount = parseFloat(amount) || 0;
  const cryptoAmount = numAmount > 0 ? (numAmount / offer.price).toFixed(6) : "0";

  const handleConfirm = () => {
    if (numAmount <= 0 || !payment) return;
    setStep("confirm");
  };

  const handleLock = async () => {
    if (!user) return;
    try {
      const trade = await createTrade.mutateAsync({
        offer_id: offer.id,
        seller_id: user.id, // placeholder for seeded offers
        asset: offer.assetSymbol,
        amount: numAmount / offer.price,
        price: offer.price,
        total: numAmount,
        currency: "INR",
        payment_method: payment,
      });
      setLockedTradeId(trade.id);
      setLockedExpiresAt(new Date(trade.expires_at!).getTime());
      setStep("locked");
      toast.success("Deal locked! Price secured for 3 hours.");
    } catch {
      toast.error("Failed to lock deal. Please try again.");
    }
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Buy {offer.assetSymbol}
                <Badge variant="secondary" className="text-xs">from {offer.username}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per {offer.assetSymbol}</span>
                  <span className="font-bold text-foreground">₹{offer.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Margin</span>
                  <span className="text-success font-medium">{offer.margin} above market</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Amount (INR)</label>
              <Input
                  type="number"
                  placeholder={`Min ₹${offer.minLimit.toLocaleString()} — Max ₹${offer.maxLimit.toLocaleString()}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={offer.minLimit}
                  max={offer.maxLimit}
                />
                {numAmount > 0 && numAmount < offer.minLimit && (
                  <p className="text-xs text-destructive mt-1">
                    Minimum amount is ₹{offer.minLimit.toLocaleString()}
                  </p>
                )}
                {numAmount > offer.maxLimit && (
                  <p className="text-xs text-destructive mt-1">
                    Maximum amount is ₹{offer.maxLimit.toLocaleString()}
                  </p>
                )}
                {numAmount >= offer.minLimit && numAmount <= offer.maxLimit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll receive ≈ <span className="font-bold text-foreground">{cryptoAmount} {offer.assetSymbol}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Payment Method</label>
                <Select value={payment} onValueChange={setPayment}>
                  <SelectTrigger><SelectValue placeholder="Select payment" /></SelectTrigger>
                  <SelectContent>
                    {offer.paymentMethods.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
                <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
                Price will be locked for 3 hours after confirmation
              </div>

              <Button
                onClick={handleConfirm}
                disabled={numAmount < offer.minLimit || numAmount > offer.maxLimit || !payment}
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
                Confirm Deal Lock
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You pay</span>
                  <span className="font-bold text-foreground">₹{numAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You receive</span>
                  <span className="font-bold text-foreground">{cryptoAmount} {offer.assetSymbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Locked price</span>
                  <span className="font-medium text-foreground">₹{offer.price.toLocaleString()}/{offer.assetSymbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment via</span>
                  <Badge variant="secondary">{payment}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seller</span>
                  <span className="text-foreground">{offer.username}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-warning/10 rounded-lg p-3 border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <span>Escrow settlement will be enabled soon. This is a <strong>reserved deal</strong> — your price is locked for 3 hours.</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Back</Button>
                <Button onClick={handleLock} disabled={createTrade.isPending} className="flex-1">
                  <Lock className="h-4 w-4 mr-1" /> {createTrade.isPending ? "Locking…" : "Lock Deal"}
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
                Deal Locked Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-foreground">₹{numAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Locked price</span>
                  <span className="font-bold text-foreground">₹{offer.price.toLocaleString()}/{offer.assetSymbol}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Time remaining</span>
                  <CountdownTimer expiresAt={lockedExpiresAt} />
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium text-foreground mb-2">Next Steps</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>1. Go to the trade page to chat with the seller</p>
                  <p>2. Send <strong>₹{numAmount.toLocaleString()}</strong> via <strong>{payment}</strong></p>
                  <p>3. Mark payment as complete once sent</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
                <Shield className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>This is a reserved deal. Full escrow protection will be available soon.</span>
              </div>

              <Button onClick={handleGoToTrade} className="w-full">
                Go to Trade Page
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { CountdownTimer };
