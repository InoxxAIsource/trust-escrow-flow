-- ============================================================================
-- P2PxBT Demo — 07. Three-step KYC document capture
-- ============================================================================
-- Verification now collects three artefacts instead of one:
--
--   1. National ID / passport
--   2. Proof of address (utility bill)
--   3. Selfie
--
-- Modelled as three columns rather than a child table: the flow is a fixed
-- three-step wizard, not an open-ended document list, so a row per submission
-- keeps the review query a single select and the admin panel a single row.
--
-- The legacy single-document columns are kept and relaxed to NULL so
-- submissions filed before this migration remain readable.
-- ============================================================================

ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS national_id_path  text,
  ADD COLUMN IF NOT EXISTS utility_bill_path text,
  ADD COLUMN IF NOT EXISTS selfie_path       text;

-- Applicant details captured alongside the documents, so a reviewer can check
-- the form against what the uploads actually show.
ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city          text,
  ADD COLUMN IF NOT EXISTS postal_code   text,
  ADD COLUMN IF NOT EXISTS country       text;

-- Age gate. Rejects impossible dates outright rather than leaving a reviewer
-- to spot a typo, and keeps obviously-underage applications out of the queue.
ALTER TABLE public.kyc_submissions
  DROP CONSTRAINT IF EXISTS kyc_submissions_dob_plausible;
ALTER TABLE public.kyc_submissions
  ADD CONSTRAINT kyc_submissions_dob_plausible CHECK (
    date_of_birth IS NULL
    OR (date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')
        AND date_of_birth >= (CURRENT_DATE - INTERVAL '120 years'))
  );

-- Older rows carry document_type/file_reference; new ones carry the trio.
ALTER TABLE public.kyc_submissions ALTER COLUMN document_type  DROP NOT NULL;
ALTER TABLE public.kyc_submissions ALTER COLUMN file_reference DROP NOT NULL;

-- A submission must carry either the legacy single document or all three of
-- the new ones. Enforced here so a half-finished wizard cannot be persisted
-- by a client that skips steps.
ALTER TABLE public.kyc_submissions
  DROP CONSTRAINT IF EXISTS kyc_submissions_documents_present;
ALTER TABLE public.kyc_submissions
  ADD CONSTRAINT kyc_submissions_documents_present CHECK (
    file_reference IS NOT NULL
    OR (national_id_path IS NOT NULL
        AND utility_bill_path IS NOT NULL
        AND selfie_path IS NOT NULL)
  );

-- Every uploaded object must sit under the submitting user's own folder.
-- The storage policies already enforce this on write; this stops a crafted
-- INSERT from *recording* a path belonging to somebody else, which would let
-- one user point an admin's document viewer at another user's evidence.
CREATE OR REPLACE FUNCTION public.guard_kyc_document_paths()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_prefix text := NEW.user_id::text || '/';
  v_path   text;
BEGIN
  FOREACH v_path IN ARRAY ARRAY[
    NEW.file_reference, NEW.national_id_path, NEW.utility_bill_path, NEW.selfie_path
  ] LOOP
    IF v_path IS NOT NULL AND position(v_prefix in v_path) <> 1 THEN
      RAISE EXCEPTION 'FORBIDDEN: document path must live under your own folder'
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_kyc_document_paths_trg ON public.kyc_submissions;
CREATE TRIGGER guard_kyc_document_paths_trg
  BEFORE INSERT OR UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.guard_kyc_document_paths();

-- Refresh the operator notification so the email names all three documents.
CREATE OR REPLACE FUNCTION public.notify_admin_of_kyc_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_username text;
  v_docs     integer;
BEGIN
  SELECT username INTO v_username FROM public.profiles WHERE user_id = NEW.user_id;

  v_docs := (CASE WHEN NEW.national_id_path  IS NOT NULL THEN 1 ELSE 0 END)
          + (CASE WHEN NEW.utility_bill_path IS NOT NULL THEN 1 ELSE 0 END)
          + (CASE WHEN NEW.selfie_path       IS NOT NULL THEN 1 ELSE 0 END);

  PERFORM public.raise_admin_notification(
    'KYC_SUBMITTED',
    format('Identity verification submitted — %s',
           COALESCE(NEW.full_name, v_username, 'a demo user')),
    format('%s uploaded %s document(s) for review. Open the operator console to approve or reject.',
           COALESCE(v_username, 'A demo user'),
           GREATEST(v_docs, 1)),
    NULL,
    NEW.user_id,
    jsonb_build_object(
      'submission_id', NEW.id,
      'full_name', NEW.full_name,
      'username', v_username,
      -- Storage paths, never URLs. Any link must be a short-lived signed URL
      -- minted by an authenticated admin session.
      'national_id_path', NEW.national_id_path,
      'utility_bill_path', NEW.utility_bill_path,
      'selfie_path', NEW.selfie_path)
  );

  RETURN NEW;
END;
$$;
