import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { demoDb, type KycSubmission, type KycDocumentType } from "@/integrations/supabase/demo";
import { useAuth } from "./use-auth";
import { notifyAdminKyc } from "@/lib/notify";

export const KYC_BUCKET = "kyc-documents";

export const KYC_DOCUMENT_TYPES: Array<{ value: KycDocumentType; label: string }> = [
  { value: "GOVERNMENT_ID", label: "Government ID" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVER_LICENSE", label: "Driver License" },
  { value: "ADDRESS_PROOF", label: "Address Proof" },
];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

/** The signed-in user's most recent application, if any. */
export function useMyKycSubmission() {
  const { user } = useAuth();

  return useQuery<KycSubmission | null>({
    queryKey: ["kyc-submission", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await demoDb
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as KycSubmission | null;
    },
    enabled: !!user,
  });
}

/** The three artefacts the wizard collects, in step order. */
export const KYC_STEPS = [
  {
    key: "nationalId" as const,
    column: "national_id_path" as const,
    title: "National ID",
    description: "A government-issued ID card or passport photo page.",
  },
  {
    key: "utilityBill" as const,
    column: "utility_bill_path" as const,
    title: "Proof of Address",
    description: "A utility bill or bank statement showing your address.",
  },
  {
    key: "selfie" as const,
    column: "selfie_path" as const,
    title: "Selfie",
    description: "A clear photo of your face, holding your ID if you can.",
  },
];

export type KycStepKey = (typeof KYC_STEPS)[number]["key"];

export interface KycApplicantDetails {
  fullName: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface SubmitKycInput {
  details: KycApplicantDetails;
  files: Record<KycStepKey, File>;
}

export const EMPTY_APPLICANT_DETAILS: KycApplicantDetails = {
  fullName: "",
  dateOfBirth: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: "",
};

/** Mirrors the CHECK on kyc_submissions so the message is useful, not opaque. */
export const MIN_AGE_YEARS = 18;

export function validateApplicantDetails(d: KycApplicantDetails): string | null {
  if (!d.fullName.trim()) return "Enter the name shown on your documents.";
  if (!d.dateOfBirth) return "Enter your date of birth.";

  const dob = new Date(d.dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "That date of birth isn't valid.";

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE_YEARS);
  if (dob > cutoff) return `You must be at least ${MIN_AGE_YEARS} to trade.`;

  const oldest = new Date();
  oldest.setFullYear(oldest.getFullYear() - 120);
  if (dob < oldest) return "That date of birth isn't valid.";

  if (!d.addressLine1.trim()) return "Enter your street address.";
  if (!d.city.trim()) return "Enter your city.";
  if (!d.postalCode.trim()) return "Enter your postal code.";
  if (!d.country.trim()) return "Select your country.";
  return null;
}

function validateFile(file: File, label: string) {
  // Client-side guards mirror the bucket's own limits so the user gets a
  // useful message instead of an opaque storage rejection.
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`${label} is larger than the 5 MB limit.`);
  }
  if (!ACCEPTED_MIME.includes(file.type)) {
    throw new Error(`${label} must be a PNG, JPEG, WebP or PDF.`);
  }
}

export function useSubmitKyc() {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ details, files }: SubmitKycInput) => {
      if (!user) throw new Error("You must be signed in to submit verification.");

      const detailError = validateApplicantDetails(details);
      if (detailError) throw new Error(detailError);

      for (const step of KYC_STEPS) {
        const file = files[step.key];
        if (!file) throw new Error(`${step.title} is missing.`);
        validateFile(file, step.title);
      }

      // The first path segment must be the user's id - both the storage
      // policies and guard_kyc_document_paths() pivot on it.
      const uploaded: string[] = [];
      const paths = {} as Record<string, string>;

      try {
        for (const step of KYC_STEPS) {
          const file = files[step.key];
          const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
          const objectPath = `${user.id}/${crypto.randomUUID()}.${extension}`;

          const { error: uploadError } = await demoDb.storage
            .from(KYC_BUCKET)
            .upload(objectPath, file, { contentType: file.type, upsert: false });
          if (uploadError) throw uploadError;

          uploaded.push(objectPath);
          paths[step.column] = objectPath;
        }

        const { data, error } = await demoDb
          .from("kyc_submissions")
          .insert({
            user_id: user.id,
            status: "PENDING",
            full_name: details.fullName.trim(),
            date_of_birth: details.dateOfBirth,
            address_line1: details.addressLine1.trim(),
            address_line2: details.addressLine2.trim() || null,
            city: details.city.trim(),
            postal_code: details.postalCode.trim(),
            country: details.country.trim(),
            ...paths,
          })
          .select()
          .single();
        if (error) throw error;

        return data as KycSubmission;
      } catch (error) {
        // Never leave orphaned objects behind if a later step fails.
        if (uploaded.length > 0) {
          await demoDb.storage.from(KYC_BUCKET).remove(uploaded);
        }
        throw error;
      }
    },
    onSuccess: async (_data, variables) => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["kyc-submission"] });
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-queue"] });

      // Fire-and-forget admin email notification.
      if (user) {
        notifyAdminKyc({
          userName: variables.details.fullName.trim(),
          userEmail: user.email ?? "",
          userId: user.id,
          country: variables.details.country.trim(),
          submittedAt: new Date().toLocaleString("en-GB", {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "UTC",
          }) + " UTC",
        });
      }
    },
  });
}

/** Admin: every application, newest pending first. */
export function useKycQueue() {
  return useQuery<KycSubmission[]>({
    queryKey: ["admin-kyc-queue"],
    queryFn: async () => {
      const { data, error } = await demoDb
        .from("kyc_submissions")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as KycSubmission[];
    },
    refetchInterval: 20_000,
  });
}

/**
 * Mints a short-lived signed URL for a submitted document. The bucket is
 * private, so this is the only way to view one - and it only succeeds for the
 * owner or an admin, enforced by the storage policies.
 */
export function useKycDocumentUrl() {
  return useMutation({
    mutationFn: async (fileReference: string) => {
      const { data, error } = await demoDb.storage
        .from(KYC_BUCKET)
        .createSignedUrl(fileReference, 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export function useReviewKyc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      approve,
      rejectionReason,
    }: {
      submissionId: string;
      approve: boolean;
      rejectionReason?: string;
    }) => {
      const { data, error } = await demoDb.rpc("review_kyc_submission", {
        _submission_id: submissionId,
        _approve: approve,
        _rejection_reason: rejectionReason ?? null,
      });
      if (error) throw error;
      return data as KycSubmission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-actions"] });
    },
  });
}

/** Gate used by the marketplace: can this account open a trade yet? */
export function useKycGate() {
  const { profile } = useAuth();
  const { data: submission, isLoading } = useMyKycSubmission();

  const isApproved = profile?.kyc_status === "verified";
  const isPending = !isApproved && submission?.status === "PENDING";
  const isRejected = !isApproved && submission?.status === "REJECTED";

  return {
    isApproved,
    isPending,
    isRejected,
    rejectionReason: submission?.rejection_reason ?? null,
    submission: submission ?? null,
    isLoading,
  };
}
