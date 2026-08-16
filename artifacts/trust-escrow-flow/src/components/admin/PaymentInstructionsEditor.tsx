import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
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

/** All fields that can appear on any rail, in display order. */
const ALL_RAIL_FIELDS: Record<string, string[]> = {
  US_WIRE: ["bank_name", "account_name", "account_number", "routing_number", "swift", "bank_address"],
  US_ACH:  ["bank_name", "account_name", "account_number", "routing_number"],
  UK:      ["bank_name", "account_name", "account_number", "sort_code"],
  EU:      ["bank_name", "account_name", "account_number", "iban", "swift"],
  HK:      ["bank_name", "account_name", "account_number", "bank_code"],
};

import { railShapeFor } from "@/integrations/supabase/demo";

const PLACEHOLDERS: Record<string, string> = {
  bank_name:      "Northgate Trust",
  account_name:   "Robert Shaw",
  account_number: "45863098",
  routing_number: "021000021",
  swift:          "NORZZ00",
  sort_code:      "20-00-00",
  iban:           "DE89370400440532013000",
  bank_code:      "004",
  bank_address:   "1200 Market Street, Wilmington, DE 19801",
};

const MAX_LENGTH: Record<string, number> = {
  bank_name: 80, account_name: 80, account_number: 24,
  routing_number: 20, swift: 16, sort_code: 10,
  iban: 34, bank_code: 10, bank_address: 160,
};

/**
 * Per-rail editor for a counterparty's stored payment instructions.
 *
 * Every field - including routing identifiers like Routing Number and
 * SWIFT / BIC - is editable here. On a real platform these are derived
 * from verified counterparty data; in the demo the operator sets them
 * manually so they match whatever test scenario is being run.
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

  // Determine which fields apply to this rail.
  const shape = railShapeFor(method, region);
  const { accountLabel, accountHint } = fieldSetFor(method, region);
  const allFields = ALL_RAIL_FIELDS[shape] ?? ["bank_name", "account_name", "account_number"];

  const [values, setValues] = useState<Record<string, string>>({});

  // Seed inputs from the stored record whenever it changes (save or switch).
  useEffect(() => {
    const seeded: Record<string, string> = {};
    for (const f of allFields) {
      seeded[f] = current?.fields[f] ?? "";
    }
    setValues(seeded);
    // allFields is derived from method/region which are stable props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const handleSave = async () => {
    // Build a clean fields object with only non-empty values.
    const fields: Record<string, string> = {};
    for (const f of allFields) {
      const v = values[f]?.trim();
      if (v) fields[f] = v;
    }

    try {
      await save.mutateAsync({ counterpartyId, method, fields });
      toast.success(`${method} details saved.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed.";
      toast.error(message.replace(/^(INVALID|NOT_FOUND):\s*/, ""));
    }
  };

  const label = (f: string) => f === "account_number" ? accountLabel : PAYMENT_FIELD_LABELS[f] ?? f;

  return (
    <div className="space-y-3">
      {allFields.map((f) => (
        <div key={f} className="space-y-1">
          <Label htmlFor={`${method}-${f}`} className="text-xs">
            {label(f)}
          </Label>
          <Input
            id={`${method}-${f}`}
            value={values[f] ?? ""}
            onChange={set(f)}
            placeholder={PLACEHOLDERS[f] ?? ""}
            maxLength={MAX_LENGTH[f] ?? 80}
            className="font-mono text-sm"
          />
          {f === "account_number" && accountHint && (
            <p className="text-[11px] text-muted-foreground">{accountHint}</p>
          )}
        </div>
      ))}

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
