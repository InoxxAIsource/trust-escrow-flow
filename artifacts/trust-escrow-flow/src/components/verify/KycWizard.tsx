import { useState } from "react";
import { Check, FileCheck, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  KYC_STEPS,
  MIN_AGE_YEARS,
  EMPTY_APPLICANT_DETAILS,
  validateApplicantDetails,
  useSubmitKyc,
  type KycApplicantDetails,
  type KycStepKey,
} from "@/hooks/use-kyc";

type Files = Partial<Record<KycStepKey, File>>;

/**
 * Surfaces the real reason a submission failed. A bare "Submission failed"
 * hides the common case entirely - the migrations not being applied, which
 * returns a missing-column error the operator needs to see.
 */
function describeSubmitError(error: unknown): string {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);

  if (/column .* does not exist|schema cache/i.test(message)) {
    return "The backend is missing the verification tables. Apply the latest migration in supabase/migrations, then try again.";
  }
  if (/row-level security|violates row-level/i.test(message)) {
    return "Permission denied writing this submission. Check you are signed in.";
  }
  if (/kyc_submissions_dob_plausible/i.test(message)) {
    return `You must be at least ${MIN_AGE_YEARS} to trade.`;
  }
  if (/kyc_submissions_documents_present/i.test(message)) {
    return "All three documents are required.";
  }
  if (/one_pending_per_user|duplicate key/i.test(message)) {
    return "You already have an application under review.";
  }
  return message || "Submission failed.";
}

/**
 * Three-step verification capture: national ID, proof of address, selfie.
 *
 * Uploads happen only on the final submit, not per step, so abandoning the
 * wizard halfway leaves nothing in storage to clean up. The database
 * additionally rejects a submission missing any of the three.
 */
/** Markets the platform covers, matching the marketplace regions. */
export const KYC_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Netherlands",
  "Ireland",
  "Spain",
  "Italy",
];

export function KycWizard() {
  // Step 0..2 collect documents; step 3 is details + review + submit.
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<KycApplicantDetails>(EMPTY_APPLICANT_DETAILS);
  const [files, setFiles] = useState<Files>({});
  const submit = useSubmitKyc();

  const isReview = step === KYC_STEPS.length;
  const current = KYC_STEPS[step];
  const allPresent = KYC_STEPS.every((s) => !!files[s.key]);
  const detailError = validateApplicantDetails(details);

  const setDetail = (key: keyof KycApplicantDetails, value: string) =>
    setDetails((prev) => ({ ...prev, [key]: value }));

  // The date input's own max stops most under-18 entries before submit.
  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - MIN_AGE_YEARS);
    return d.toISOString().slice(0, 10);
  })();

  const handleSubmit = async () => {
    try {
      await submit.mutateAsync({
        details,
        files: files as Record<KycStepKey, File>,
      });
      toast.success("Verification submitted - an operator will review it shortly.");
    } catch (error) {
      toast.error(describeSubmitError(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <FileCheck className="h-5 w-5 text-primary" />
          {isReview ? "Review and submit" : `Step ${step + 1} of ${KYC_STEPS.length}`}
        </CardTitle>
        <CardDescription>
          Upload placeholder or redacted images - do not upload real identity documents.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <StepRail step={step} files={files} />

        {isReview ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-foreground">Your details</h3>
              <p className="text-sm text-muted-foreground">
                These are checked against the documents you uploaded.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                id="kyc-name"
                label="Full name"
                className="sm:col-span-2"
                value={details.fullName}
                onChange={(v) => setDetail("fullName", v)}
                placeholder="As shown on your ID"
                maxLength={100}
              />
              <Field
                id="kyc-dob"
                label="Date of birth"
                type="date"
                value={details.dateOfBirth}
                onChange={(v) => setDetail("dateOfBirth", v)}
                max={maxDob}
              />
              <div className="space-y-1.5">
                <Label htmlFor="kyc-country">Country</Label>
                <select
                  id="kyc-country"
                  value={details.country}
                  onChange={(e) => setDetail("country", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select…</option>
                  {KYC_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                id="kyc-addr1"
                label="Street address"
                className="sm:col-span-2"
                value={details.addressLine1}
                onChange={(v) => setDetail("addressLine1", v)}
                placeholder="e.g. 12 Maple Street"
                maxLength={120}
              />
              <Field
                id="kyc-addr2"
                label="Address line 2 (optional)"
                className="sm:col-span-2"
                value={details.addressLine2}
                onChange={(v) => setDetail("addressLine2", v)}
                placeholder="Apartment, suite, etc."
                maxLength={120}
              />
              <Field
                id="kyc-city"
                label="City"
                value={details.city}
                onChange={(v) => setDetail("city", v)}
                maxLength={80}
              />
              <Field
                id="kyc-postal"
                label="Postal code"
                value={details.postalCode}
                onChange={(v) => setDetail("postalCode", v)}
                maxLength={20}
              />
            </div>

            <ul className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              {KYC_STEPS.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-foreground">{s.title}</span>
                  </span>
                  <span className="max-w-[55%] truncate text-xs text-muted-foreground">
                    {files[s.key]?.name}
                  </span>
                </li>
              ))}
            </ul>

            <p className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Uploads go to private storage. Only you and an authorised P2PxBT operator can
              retrieve them, and only through short-lived signed links. No third-party identity
              provider is contacted and no real identity check is performed.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(KYC_STEPS.length - 1)}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!allPresent || !!detailError || submit.isPending}
              >
                {submit.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Submit for review
              </Button>
            </div>
            {detailError && <p className="text-xs text-destructive">{detailError}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-foreground">{current.title}</h3>
              <p className="text-sm text-muted-foreground">{current.description}</p>
            </div>

            <FileDrop
              id={`kyc-${current.key}`}
              file={files[current.key]}
              onSelect={(file) => setFiles((prev) => ({ ...prev, [current.key]: file }))}
            />

            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={() => setStep(step + 1)}
                disabled={!files[current.key]}
              >
                {step === KYC_STEPS.length - 1 ? "Review" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StepRail({ step, files }: { step: number; files: Files }) {
  return (
    <ol className="flex items-center gap-2">
      {KYC_STEPS.map((s, i) => {
        const done = !!files[s.key];
        const active = i === step;
        return (
          <li key={s.key} className="flex flex-1 flex-col gap-1.5">
            <span
              className={cn(
                "h-1.5 rounded-full transition-colors",
                done ? "bg-primary" : active ? "bg-primary/50" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "text-[11px]",
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {s.title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  className,
  ...inputProps
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
} & Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange" | "className">) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} {...inputProps} />
    </div>
  );
}

function FileDrop({
  id,
  file,
  onSelect,
}: {
  id: string;
  file?: File;
  onSelect: (file: File) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors hover:bg-accent/30",
          file ? "border-primary/40 bg-primary/[0.04]" : "border-border",
        )}
      >
        {file ? (
          <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
        <span className="max-w-full truncate text-sm text-foreground">
          {file ? file.name : "Choose a file"}
        </span>
        <span className="text-xs text-muted-foreground">PNG, JPEG, WebP or PDF · max 5 MB</span>
      </label>
      <Input
        id={id}
        type="file"
        className="sr-only"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) onSelect(selected);
        }}
      />
    </div>
  );
}
