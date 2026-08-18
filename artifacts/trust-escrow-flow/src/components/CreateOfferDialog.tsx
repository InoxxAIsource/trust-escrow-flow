import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  AlertCircle,
  Wallet,
  ArrowDownLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useWallets } from "@/hooks/use-wallets";
import { useUserOffers } from "@/hooks/use-offers";
import { DEMO_ASSETS, CURRENCIES, formatAssetAmount } from "@/lib/pricing";
import { PAYMENT_METHODS } from "@/integrations/supabase/demo";

// ── Deposit addresses (operator-defined) ─────────────────────────────────────
const DEPOSIT_INFO: Record<string, { address: string; network: string; warning?: string } | null> = {
  BTC: { address: "bc1q37prp5gxfsd8yp6quakk9j9sr6cdlt73nthl9r", network: "Bitcoin (Native SegWit)" },
  ETH: { address: "0xb943a3aecc79103feafc0573ea978916cfd5d547", network: "Ethereum (ERC-20)" },
  USDT: {
    address: "0xb943a3aecc79103feafc0573ea978916cfd5d547",
    network: "Ethereum (ERC-20)",
    warning: "Send USDT only on the Ethereum network. Do not send TRC-20 USDT.",
  },
  SOL: null, // coming soon
};

function qrUrl(address: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(address)}&size=160x160&margin=6`;
}

// ── Step indicator ────────────────────────────────────────────────────────────
const STEPS = ["Select Asset", "Deposit", "Offer Details", "Review"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1 flex-1 last:flex-none">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${i <= current ? "bg-primary" : "bg-muted"}`} />
          {i === STEPS.length - 1 && null}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOfferDialog({ open, onOpenChange }: CreateOfferDialogProps) {
  const { wallets, getBalance } = useWallets();
  const { createOffer } = useUserOffers();

  // Step state
  const [step, setStep] = useState(0);

  // Form state
  const [asset, setAsset] = useState<string>("BTC");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [minLimit, setMinLimit] = useState("");
  const [maxLimit, setMaxLimit] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const depositInfo = DEPOSIT_INFO[asset] ?? null;
  const { balance: available } = getBalance(asset);
  const hasBalance = available > 0;
  const parsedAmount = parseFloat(amount) || 0;
  const parsedPrice = parseFloat(price) || 0;
  const parsedMin = parseFloat(minLimit) || 0;
  const parsedMax = parseFloat(maxLimit) || 0;

  const handleCopy = async () => {
    if (!depositInfo) return;
    await navigator.clipboard.writeText(depositInfo.address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMethod = (m: string) =>
    setSelectedMethods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );

  const resetAndClose = () => {
    setStep(0);
    setAsset("BTC");
    setAmount("");
    setPrice("");
    setCurrency("USD");
    setMinLimit("");
    setMaxLimit("");
    setSelectedMethods([]);
    onOpenChange(false);
  };

  const handleCreate = async () => {
    try {
      await createOffer.mutateAsync({
        type: "sell",
        asset,
        amount: parsedAmount,
        price: parsedPrice,
        currency,
        payment_methods: selectedMethods,
        min_limit: parsedMin,
        max_limit: parsedMax,
      });
      toast.success("Offer created — buyers can now see your listing");
      resetAndClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create offer");
    }
  };

  // Validation per step
  const step1Valid = !!asset;
  const step2Valid = hasBalance; // must have balance to proceed
  const step3Valid =
    parsedAmount > 0 &&
    parsedAmount <= available &&
    parsedPrice > 0 &&
    parsedMin > 0 &&
    parsedMax >= parsedMin &&
    selectedMethods.length > 0;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{STEPS[step]}</DialogTitle>
        </DialogHeader>

        <StepBar current={step} />

        {/* ── Step 0: Select asset ────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose which cryptocurrency you want to sell.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_ASSETS.map((a) => {
                const { balance: bal } = getBalance(a);
                return (
                  <button
                    key={a}
                    onClick={() => setAsset(a)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      asset === a
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">{a}</span>
                      {asset === a && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Balance: <span className="text-foreground font-mono">{formatAssetAmount(bal, a as never)}</span>
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(1)} disabled={!step1Valid}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 1: Deposit ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Balance summary */}
            <Card className={hasBalance ? "border-green-500/30 bg-green-500/5" : "border-warning/30 bg-warning/5"}>
              <CardContent className="p-3 flex items-center gap-3">
                <Wallet className={`h-5 w-5 flex-shrink-0 ${hasBalance ? "text-green-600" : "text-warning"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {asset} balance: <span className="font-mono">{formatAssetAmount(available, asset as never)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasBalance ? "You have funds available to create an offer." : "You need to deposit before creating an offer."}
                  </p>
                </div>
                {hasBalance && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
              </CardContent>
            </Card>

            {/* Deposit address section */}
            {!depositInfo ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {asset} deposits are not yet available. Contact support.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Deposit {asset}</p>
                  <Badge variant="secondary" className="text-xs ml-auto">{depositInfo.network}</Badge>
                </div>

                <div className="flex justify-center rounded-lg border border-border bg-white p-3">
                  <img src={qrUrl(depositInfo.address)} alt="Deposit QR" width={160} height={160} />
                </div>

                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                  <span className="flex-1 break-all font-mono text-xs text-foreground select-all">
                    {depositInfo.address}
                  </span>
                  <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>

                {depositInfo.warning && (
                  <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    {depositInfo.warning}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  After your deposit confirms on-chain, refresh this page — your balance will be updated and you can proceed.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(2)} disabled={!step2Valid}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Offer details ────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set how much you're selling, at what price, and the payment limits.
            </p>

            {/* Amount to sell */}
            <div className="space-y-1.5">
              <Label htmlFor="co-amount">
                Amount to sell{" "}
                <span className="text-muted-foreground font-normal">
                  (max: <span className="font-mono">{formatAssetAmount(available, asset as never)}</span>)
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="co-amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  {asset}
                </span>
              </div>
              {parsedAmount > available && available > 0 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Exceeds available balance
                </p>
              )}
            </div>

            {/* Price + Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="co-price">Price per {asset}</Label>
                <Input
                  id="co-price"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Min / Max limits */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="co-min">Min order ({currency})</Label>
                <Input
                  id="co-min"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 50"
                  value={minLimit}
                  onChange={(e) => setMinLimit(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-max">Max order ({currency})</Label>
                <Input
                  id="co-max"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 5000"
                  value={maxLimit}
                  onChange={(e) => setMaxLimit(e.target.value)}
                />
              </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-1.5">
              <Label>Accepted payment methods</Label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => toggleMethod(m)}
                    className={`rounded-md border px-2.5 py-1 text-xs transition-all ${
                      selectedMethods.includes(m)
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {selectedMethods.includes(m) && <Check className="inline h-3 w-3 mr-1" />}
                    {m}
                  </button>
                ))}
              </div>
              {selectedMethods.length === 0 && (
                <p className="text-xs text-muted-foreground">Select at least one payment method.</p>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!step3Valid}>
                Review <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Review & create ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review your offer before publishing it to buyers.
            </p>

            <div className="rounded-lg border border-border divide-y divide-border">
              {[
                { label: "Asset", value: asset },
                { label: "Amount to sell", value: `${formatAssetAmount(parsedAmount, asset as never)} ${asset}` },
                { label: "Price per unit", value: `${parsedPrice.toLocaleString()} ${currency}` },
                { label: "Order limits", value: `${parsedMin.toLocaleString()} – ${parsedMax.toLocaleString()} ${currency}` },
                { label: "Payment methods", value: selectedMethods.join(", ") },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground text-right">{value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
              Publishing this offer will reserve{" "}
              <span className="font-mono font-medium text-foreground">
                {formatAssetAmount(parsedAmount, asset as never)} {asset}
              </span>{" "}
              from your wallet. Funds are returned if the offer is cancelled.
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleCreate} disabled={createOffer.isPending}>
                {createOffer.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Publish Offer</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
