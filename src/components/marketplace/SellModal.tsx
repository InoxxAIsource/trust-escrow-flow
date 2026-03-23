import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, CheckCircle, Wallet, ArrowRight, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";

const assetOptions = [
  { name: "USDT", symbol: "USDT" },
  { name: "Bitcoin", symbol: "BTC" },
  { name: "Ethereum", symbol: "ETH" },
  { name: "Solana", symbol: "SOL" },
];

const paymentOptions = ["UPI", "Bank Transfer", "PayPal", "Zelle", "Venmo", "IMPS", "SEPA"];

const mockDepositAddresses: Record<string, string> = {
  USDT: "TXqH7dPn4rmG8u9KjcVpF2wBL3eMsZN5Y7",
  BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  ETH: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  SOL: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
};

interface SellModalProps {
  open: boolean;
  onClose: () => void;
  onDeposit: (asset: string, amount: number) => void;
  onCreateOffer: (offer: {
    asset: string;
    assetSymbol: string;
    amount: number;
    price: number;
    currency: string;
    paymentMethods: string[];
  }) => void;
  getBalance: (asset: string) => { balance: number; lockedBalance: number };
  suggestedPrice?: number;
}

export default function SellModal({ open, onClose, onDeposit, onCreateOffer, getBalance, suggestedPrice }: SellModalProps) {
  const [step, setStep] = useState<"asset" | "deposit" | "offer" | "live">("asset");
  const [asset, setAsset] = useState("USDT");
  const [depositAmount, setDepositAmount] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setStep("asset");
      setAsset("USDT");
      setDepositAmount("");
      setOfferAmount("");
      setOfferPrice(suggestedPrice?.toString() ?? "");
      setSelectedPayments([]);
    }
  }, [open, suggestedPrice]);

  const assetInfo = assetOptions.find((a) => a.symbol === asset)!;
  const balance = getBalance(asset);
  const depositAddr = mockDepositAddresses[asset] ?? "—";

  const handleDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    onDeposit(asset, amt);
    toast.success(`${amt} ${asset} credited to demo wallet`);
    setStep("offer");
  };

  const handleCreateOffer = () => {
    const amt = parseFloat(offerAmount);
    const price = parseFloat(offerPrice);
    if (!amt || !price || selectedPayments.length === 0) return;
    if (amt > balance.balance) {
      toast.error("Insufficient balance. Deposit more first.");
      return;
    }
    onCreateOffer({
      asset: assetInfo.name,
      assetSymbol: asset,
      amount: amt,
      price,
      currency: "INR",
      paymentMethods: selectedPayments,
    });
    setStep("live");
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddr);
    toast.success("Address copied!");
  };

  const togglePayment = (p: string) => {
    setSelectedPayments((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        {step === "asset" && (
          <>
            <DialogHeader>
              <DialogTitle>Sell Crypto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Select Asset</label>
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {assetOptions.map((a) => (
                      <SelectItem key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current balance</span>
                  <span className="font-bold text-foreground">{balance.balance.toFixed(4)} {asset}</span>
                </div>
                {balance.lockedBalance > 0 && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Locked</span>
                    <span className="text-warning font-medium">{balance.lockedBalance.toFixed(4)} {asset}</span>
                  </div>
                )}
              </div>

              <Button onClick={() => setStep("deposit")} className="w-full">
                <Wallet className="h-4 w-4 mr-1" /> Deposit {asset} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>

              {balance.balance > 0 && (
                <Button variant="outline" onClick={() => setStep("offer")} className="w-full">
                  Skip — Create Offer with Existing Balance
                </Button>
              )}
            </div>
          </>
        )}

        {step === "deposit" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Deposit {asset}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Deposit Address ({asset})</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted rounded px-2 py-1 flex-1 break-all text-foreground">{depositAddr}</code>
                  <Button size="sm" variant="ghost" onClick={copyAddress}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-warning/10 rounded-lg p-3 border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <span>This is a <strong>demo wallet</strong>. No real funds are required. Enter any amount to simulate a deposit.</span>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Amount to Deposit ({asset})</label>
                <Input
                  type="number"
                  placeholder={`e.g. ${asset === "BTC" ? "0.01" : asset === "ETH" ? "0.5" : "100"}`}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <Button onClick={handleDeposit} disabled={!depositAmount || parseFloat(depositAmount) <= 0} className="w-full">
                I Have Deposited — Credit Balance
              </Button>
              <Button variant="ghost" onClick={() => setStep("asset")} className="w-full text-muted-foreground">Back</Button>
            </div>
          </>
        )}

        {step === "offer" && (
          <>
            <DialogHeader>
              <DialogTitle>Create Sell Offer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-bold text-foreground">{balance.balance.toFixed(4)} {asset}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Amount to sell ({asset})</label>
                <Input
                  type="number"
                  placeholder={`Max ${balance.balance.toFixed(4)}`}
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  max={balance.balance}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Your price (INR per {asset})</label>
                <Input
                  type="number"
                  placeholder="e.g. 93.5"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                />
                {suggestedPrice && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Suggested: <button className="text-primary underline" onClick={() => setOfferPrice(suggestedPrice.toString())}>{suggestedPrice.toLocaleString()} INR</button>
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Payment Methods</label>
                <div className="flex flex-wrap gap-2">
                  {paymentOptions.map((p) => (
                    <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={selectedPayments.includes(p)}
                        onCheckedChange={() => togglePayment(p)}
                      />
                      <span className="text-sm text-foreground">{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreateOffer}
                disabled={!offerAmount || !offerPrice || selectedPayments.length === 0 || parseFloat(offerAmount) > balance.balance}
                className="w-full"
              >
                Create Sell Offer
              </Button>
              <Button variant="ghost" onClick={() => setStep("deposit")} className="w-full text-muted-foreground">Back to Deposit</Button>
            </div>
          </>
        )}

        {step === "live" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                Your Offer is Live!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selling</span>
                  <span className="font-bold text-foreground">{offerAmount} {asset}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">At price</span>
                  <span className="font-bold text-foreground">{parseFloat(offerPrice).toLocaleString()} INR/{asset}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payments</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {selectedPayments.map((p) => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-2">
                <Shield className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>Your offer is now visible in the marketplace. Escrow protection will be available soon.</span>
              </div>

              <Button onClick={onClose} className="w-full">Go to Marketplace</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
