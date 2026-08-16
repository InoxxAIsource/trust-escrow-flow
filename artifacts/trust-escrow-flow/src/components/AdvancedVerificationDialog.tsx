import { useState } from "react";
import { CheckCircle2, ShieldAlert, Loader2, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill email from the authenticated user */
  defaultEmail?: string;
  /** Pre-fill phone if already on profile */
  defaultPhone?: string;
  /** Current trade count so the message is accurate */
  tradeCount?: number;
}

const AML_DECLARATIONS = [
  {
    id: "funds",
    label: "I confirm that the source of my funds is legitimate and not derived from illegal activities.",
  },
  {
    id: "pep",
    label: "I am not a Politically Exposed Person (PEP), nor do I act on behalf of one.",
  },
  {
    id: "sanctions",
    label: "I am not subject to any international sanctions or watchlist restrictions.",
  },
  {
    id: "docs",
    label: "I agree to provide additional supporting documentation if requested during review.",
  },
  {
    id: "accurate",
    label: "All information provided is accurate, complete and up to date.",
  },
] as const;

const MIN_TRADES = 5;
const MIN_VOLUME_USD = 100_000;

export default function AdvancedVerificationDialog({
  open,
  onOpenChange,
  defaultEmail = "",
  defaultPhone = "",
  tradeCount = 0,
}: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allDeclarationsChecked = AML_DECLARATIONS.every((d) => checked[d.id]);
  const canSubmit = email.trim() && phone.trim() && allDeclarationsChecked;

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    // Simulate a brief network round-trip so the button feels responsive.
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
  }

  function handleClose(open: boolean) {
    if (!open) {
      // Reset state when dialog is dismissed so it's fresh next time.
      setSubmitted(false);
      setChecked({});
      setEmail(defaultEmail);
      setPhone(defaultPhone);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <SubmittedView tradeCount={tradeCount} onClose={() => handleClose(false)} />
        ) : (
          <FormView
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            checked={checked}
            toggle={toggle}
            allDeclarationsChecked={allDeclarationsChecked}
            canSubmit={canSubmit}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Form view ──────────────────────────────────────────────────────────────────

function FormView({
  email, setEmail, phone, setPhone,
  checked, toggle, allDeclarationsChecked,
  canSubmit, submitting, onSubmit,
}: {
  email: string; setEmail: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  checked: Record<string, boolean>;
  toggle: (id: string) => void;
  allDeclarationsChecked: boolean;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <DialogTitle>Advanced Verification</DialogTitle>
        </div>
        <DialogDescription>
          Complete all sections below to apply for high-value trading access.
          Required for trades above $10,000.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-6 mt-2">

        {/* Contact details */}
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-3">Contact Details</h4>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="adv-email">Email address</Label>
              <Input
                id="adv-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adv-phone">Phone number</Label>
              <Input
                id="adv-phone"
                type="tel"
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Include country code. Used for verification only, never shared.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* AML declaration */}
        <section>
          <h4 className="text-sm font-semibold text-foreground mb-1">AML Declaration</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Anti-Money Laundering regulations require you to confirm all of the
            following before your application can be reviewed.
          </p>

          <div className="space-y-3">
            {AML_DECLARATIONS.map((d) => (
              <div key={d.id} className="flex items-start gap-3">
                <Checkbox
                  id={`aml-${d.id}`}
                  checked={!!checked[d.id]}
                  onCheckedChange={() => toggle(d.id)}
                  className="mt-0.5 shrink-0"
                />
                <Label
                  htmlFor={`aml-${d.id}`}
                  className="text-sm leading-snug font-normal cursor-pointer"
                >
                  {d.label}
                </Label>
              </div>
            ))}
          </div>

          {!allDeclarationsChecked && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              All declarations must be acknowledged before submitting.
            </p>
          )}
        </section>

        <Button
          type="submit"
          className="w-full"
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </form>
    </>
  );
}

// ── Submitted view ─────────────────────────────────────────────────────────────

function SubmittedView({
  tradeCount,
  onClose,
}: {
  tradeCount: number;
  onClose: () => void;
}) {
  const tradesNeeded = Math.max(0, MIN_TRADES - tradeCount);
  const meetsTradeReq = tradeCount >= MIN_TRADES;

  return (
    <div className="py-4 text-center space-y-5">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Heading */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Application Received</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your details and AML declaration have been submitted successfully.
        </p>
      </div>

      {/* Eligibility notice */}
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-5 py-4 text-left space-y-2">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Eligibility requirement not yet met
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
          Advanced verification is unlocked automatically once you reach{" "}
          <strong>at least 5 completed trades</strong> or{" "}
          <strong>$100,000 in total trading volume</strong>. Your application
          will be reviewed as soon as you meet either threshold.
        </p>

        {/* Progress snapshot */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-white dark:bg-amber-950/50 p-3">
            <p className="text-muted-foreground mb-0.5">Completed trades</p>
            <p className="text-base font-bold text-foreground">
              {tradeCount}
              <span className="text-muted-foreground font-normal"> / {MIN_TRADES} required</span>
            </p>
            {meetsTradeReq ? (
              <p className="text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Requirement met</p>
            ) : (
              <p className="text-amber-600 dark:text-amber-400 mt-0.5">
                {tradesNeeded} more trade{tradesNeeded !== 1 ? "s" : ""} needed
              </p>
            )}
          </div>
          <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-white dark:bg-amber-950/50 p-3">
            <p className="text-muted-foreground mb-0.5">Volume threshold</p>
            <p className="text-base font-bold text-foreground">$100k</p>
            <p className="text-amber-600 dark:text-amber-400 mt-0.5">Keep trading to qualify</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        You can check your progress on the dashboard at any time.
        We will notify you by email when your application is approved.
      </p>

      <Button onClick={onClose} className="w-full">Got it</Button>
    </div>
  );
}
