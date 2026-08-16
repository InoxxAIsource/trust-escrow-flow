import { useEffect, useState } from "react";
import { Loader2, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavePaymentInstructions } from "@/hooks/use-admin";
import {
  PAYMENT_FIELD_LABELS,
  fieldSetFor,
  type DemoCounterparty,
  type PaymentInstruction,
} from "@/integrations/supabase/demo";

const PLACEHOLDERS: Record<string, string> = {
  bank_name: "Northgate Bank UK",
  account_name: "Sophie Brooks",
  account_number: "40218837",
  bank_address: "1200 Market Street, Wilmington, DE 19801",
};

/**
 * Per-rail editor for a counterparty's stored payment instructions.
 *
 * One tab per method the counterparty actually quotes, so a US seller never
 * sees a sort-code field and a UK seller never sees a routing number. The
 * routing identifiers are rendered read-only because the RPC derives them —
 * they are not fields this form can submit.
 */
export function PaymentInstructionsEditor({
  counterparty,
  instructions,
}: {
  counterparty: DemoCounterparty;
  instructions: PaymentInstruction[];
}) {
  const methods = counterparty.payment_methods;
  const [method, setMethod] = useState(methods[0] ?? "Bank Transfer");

  if (methods.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        This counterparty quotes no payment methods.
      </p>
    );
  }

  return (
    <Tabs value={method} onValueChange={setMethod}>
      <TabsList className="flex-wrap">
        {methods.map((m) => (
          <TabsTrigger key={m} value={m} className="text-xs">
            {m}
          </TabsTrigger>
        ))}
      </TabsList>

      {methods.map((m) => (
        <TabsContent key={m} value={m} className="mt-3">
          <MethodForm
            counterpartyId={counterparty.id}
            region={counterparty.region}
            method={m}
            current={instructions.find((i) => i.method === m)}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function MethodForm({
  counterpartyId,
  region,
  method,
  current,
}: {
  counterpartyId: string;
  region: string;
  method: string;
  current?: PaymentInstruction;
}) {
  const save = useSavePaymentInstructions();
  const { editable, locked, accountLabel, accountHint } = fieldSetFor(method, region);

  const [values, setValues] = useState<Record<string, string>>({});

  // Re-seed the inputs whenever the underlying record changes — switching
  // counterparty or saving both replace `current`.
  useEffect(() => {
    setValues({
      bank_name: current?.fields.bank_name ?? "",
      account_name: current?.fields.account_name ?? "",
      account_number: current?.fields.account_number ?? "",
      bank_address: current?.fields.bank_address ?? "",
    });
  }, [current]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const handleSave = async () => {
    try {
      await save.mutateAsync({
        counterpartyId,
        method,
        bankName: values.bank_name ?? "",
        accountName: values.account_name ?? "",
        accountNumber: values.account_number ?? "",
        bankAddress: editable.includes("bank_address") ? values.bank_address : undefined,
      });
      toast.success(`${method} details saved.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed.";
      toast.error(message.replace(/^INVALID:\s*/, "").replace(/^NOT_FOUND:\s*/, ""));
    }
  };

  return (
    <div className="space-y-3">
      {editable.map((f) => (
        <div key={f} className="space-y-1">
          <Label htmlFor={`${method}-${f}`} className="text-xs">
            {f === "account_number" ? accountLabel : PAYMENT_FIELD_LABELS[f]}
          </Label>
          <Input
            id={`${method}-${f}`}
            value={values[f] ?? ""}
            onChange={set(f)}
            placeholder={PLACEHOLDERS[f]}
            maxLength={f === "account_number" ? 24 : f === "bank_address" ? 160 : 80}
          />
          {f === "account_number" && accountHint && (
            <p className="text-[11px] text-muted-foreground">{accountHint}</p>
          )}
        </div>
      ))}

      {locked.length > 0 && (
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Set automatically</span>
          </div>
          <dl className="space-y-0.5 font-mono text-xs text-muted-foreground">
            {locked.map((f) => (
              <div key={f} className="flex gap-2">
                <dt className="text-foreground/60">{PAYMENT_FIELD_LABELS[f]}:</dt>
                <dd>{current?.fields[f] ?? "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Derived from the counterparty's country when you save. These are reserved values that
            no payment scheme accepts, so nothing sent to this record can settle.
          </p>
        </div>
      )}

      <Button size="sm" onClick={handleSave} disabled={save.isPending}>
        {save.isPending ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-1.5 h-4 w-4" />
        )}
        Save {method} details
      </Button>
    </div>
  );
}
