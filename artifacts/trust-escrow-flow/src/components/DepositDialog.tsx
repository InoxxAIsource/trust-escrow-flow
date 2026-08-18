import { useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Operator deposit addresses ────────────────────────────────────────────────
// Update these when wallet addresses change. USDT is ERC-20 (Ethereum network).
const DEPOSIT_ADDRESSES: Record<string, { address: string; network: string; memo?: string }> = {
  BTC: {
    address: "bc1q37prp5gxfsd8yp6quakk9j9sr6cdlt73nthl9r",
    network: "Bitcoin (Native SegWit)",
  },
  ETH: {
    address: "0xb943a3aecc79103feafc0573ea978916cfd5d547",
    network: "Ethereum (ERC-20)",
  },
  USDT: {
    address: "0xb943a3aecc79103feafc0573ea978916cfd5d547",
    network: "Ethereum (ERC-20)",
    memo: "Send USDT only on the Ethereum network. Do not send Tron (TRC-20) USDT.",
  },
};

function qrUrl(address: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(address)}&size=180x180&margin=8&color=0-0-0&bgcolor=255-255-255`;
}

interface DepositDialogProps {
  asset: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositDialog({ asset, open, onOpenChange }: DepositDialogProps) {
  const [copied, setCopied] = useState(false);
  const info = DEPOSIT_ADDRESSES[asset];

  const handleCopy = async () => {
    if (!info) return;
    await navigator.clipboard.writeText(info.address);
    setCopied(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Deposit {asset}</DialogTitle>
          <DialogDescription>
            Send {asset} to the address below. Your balance will be credited after network confirmation.
          </DialogDescription>
        </DialogHeader>

        {!info ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Deposits for {asset} are not yet available. Contact support for assistance.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Network badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Network</span>
              <Badge variant="secondary" className="text-xs">{info.network}</Badge>
            </div>

            {/* QR code */}
            <div className="flex justify-center rounded-lg border border-border bg-white p-3">
              <img
                src={qrUrl(info.address)}
                alt={`${asset} deposit QR code`}
                width={180}
                height={180}
                className="block"
              />
            </div>

            {/* Address + copy */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Wallet address</p>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <span className="flex-1 break-all font-mono text-xs text-foreground select-all">
                  {info.address}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Network warning */}
            {info.memo && (
              <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5 text-xs text-warning">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {info.memo}
              </div>
            )}

            <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
              Deposits are credited manually after confirmation. Contact support if your balance hasn't updated within 30 minutes.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
