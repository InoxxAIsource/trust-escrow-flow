-- ============================================================================
-- P2PxBT Demo — 02. KYC submissions + private document storage
-- ============================================================================
-- Replaces the previous "click a button and become verified" flow with a real
-- review pipeline. The applicant can only ever move their record INTO the
-- pending state; only an admin can move it to approved/rejected, and that
-- transition happens inside a SECURITY DEFINER function so it is impossible
-- to reach from the browser without the admin role.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_submission_status') THEN
    CREATE TYPE public.kyc_submission_status AS ENUM
      ('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_document_type') THEN
    CREATE TYPE public.kyc_document_type AS ENUM
      ('GOVERNMENT_ID', 'PASSPORT', 'DRIVER_LICENSE', 'ADDRESS_PROOF');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status           public.kyc_submission_status NOT NULL DEFAULT 'PENDING',
  document_type    public.kyc_document_type NOT NULL,
  -- Storage object path inside the private `kyc-documents` bucket. Never a
  -- public URL: the object is fetched through a short-lived signed URL.
  file_reference   text NOT NULL,
  full_name        text,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kyc_submissions_user_idx   ON public.kyc_submissions (user_id);
CREATE INDEX IF NOT EXISTS kyc_submissions_status_idx ON public.kyc_submissions (status, submitted_at DESC);

-- At most one in-flight application per user.
CREATE UNIQUE INDEX IF NOT EXISTS kyc_submissions_one_pending_per_user
  ON public.kyc_submissions (user_id)
  WHERE status = 'PENDING';

DROP TRIGGER IF EXISTS update_kyc_submissions_updated_at ON public.kyc_submissions;
CREATE TRIGGER update_kyc_submissions_updated_at
  BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own KYC submissions" ON public.kyc_submissions;
CREATE POLICY "Users can read their own KYC submissions"
  ON public.kyc_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all KYC submissions" ON public.kyc_submissions;
CREATE POLICY "Admins can read all KYC submissions"
  ON public.kyc_submissions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can file their own KYC submission" ON public.kyc_submissions;
CREATE POLICY "Users can file their own KYC submission"
  ON public.kyc_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'PENDING');

-- No client UPDATE policy at all: review happens only via review_kyc_submission().

-- Belt and braces — even if an UPDATE policy is added later by mistake, a
-- non-admin still cannot flip the decision fields.
CREATE OR REPLACE FUNCTION public.guard_kyc_submission_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('app.privileged', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'PENDING' THEN
      RAISE EXCEPTION 'FORBIDDEN: a new application must start as PENDING'
        USING ERRCODE = '42501';
    END IF;
    -- Never trust a client-supplied reviewer.
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;

  IF NEW.status           IS DISTINCT FROM OLD.status
  OR NEW.reviewed_by      IS DISTINCT FROM OLD.reviewed_by
  OR NEW.reviewed_at      IS DISTINCT FROM OLD.reviewed_at
  OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
  OR NEW.user_id          IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'FORBIDDEN: KYC decisions are made by reviewers only'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_kyc_submissions ON public.kyc_submissions;
CREATE TRIGGER guard_kyc_submissions
  BEFORE INSERT OR UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.guard_kyc_submission_review();

-- ── Notify the operator that documents are waiting ─────────────────────────

-- Raising the notification in a trigger rather than from the client means it
-- fires for every submission, including ones created by a direct API call,
-- and cannot be skipped by a buyer who simply doesn't send the request.
-- The notify-admin edge function turns this row into an email.
CREATE OR REPLACE FUNCTION public.notify_admin_of_kyc_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_username text;
BEGIN
  SELECT username INTO v_username FROM public.profiles WHERE user_id = NEW.user_id;

  PERFORM public.raise_admin_notification(
    'KYC_SUBMITTED',
    format('Identity verification submitted — %s', COALESCE(NEW.full_name, v_username, 'a demo user')),
    format('%s uploaded a %s for review. Open the operator console to approve or reject it.',
           COALESCE(v_username, 'A demo user'),
           replace(lower(NEW.document_type::text), '_', ' ')),
    NULL,
    NEW.user_id,
    jsonb_build_object(
      'submission_id', NEW.id,
      'document_type', NEW.document_type,
      'full_name', NEW.full_name,
      'username', v_username,
      -- Deliberately the storage path, not a URL. Any link must be a
      -- short-lived signed URL minted by an authenticated admin session.
      'file_reference', NEW.file_reference)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admin_on_kyc_submission ON public.kyc_submissions;
CREATE TRIGGER notify_admin_on_kyc_submission
  AFTER INSERT ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_of_kyc_submission();

-- ── Private document storage ───────────────────────────────────────────────

-- `public = false`: objects are unreachable without a signed URL, which is
-- only mintable by a session that passes the SELECT policies below.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  5 * 1024 * 1024,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET public             = false,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Object key convention: <user_id>/<uuid>.<ext> — the first path segment is
-- the owner, which is what these policies pivot on.
DROP POLICY IF EXISTS "KYC docs are readable by their owner" ON storage.objects;
CREATE POLICY "KYC docs are readable by their owner"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "KYC docs are readable by admins" ON storage.objects;
CREATE POLICY "KYC docs are readable by admins"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-documents' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can upload their own KYC docs" ON storage.objects;
CREATE POLICY "Users can upload their own KYC docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Deliberately no UPDATE/DELETE policy: submitted evidence is immutable.

-- ── Review RPCs ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.review_kyc_submission(
  _submission_id     uuid,
  _approve           boolean,
  _rejection_reason  text DEFAULT NULL
)
RETURNS public.kyc_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin uuid := public.require_admin();
  v_row   public.kyc_submissions;
BEGIN
  IF NOT _approve AND (_rejection_reason IS NULL OR btrim(_rejection_reason) = '') THEN
    RAISE EXCEPTION 'VALIDATION: a rejection reason is required'
      USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('app.privileged', 'on', true);

  -- FOR UPDATE serialises concurrent reviewers on the same application.
  SELECT * INTO v_row
  FROM public.kyc_submissions
  WHERE id = _submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: no such KYC submission' USING ERRCODE = 'P0002';
  END IF;

  IF v_row.status <> 'PENDING' THEN
    RAISE EXCEPTION 'CONFLICT: this application was already reviewed (%)', v_row.status
      USING ERRCODE = '55000';
  END IF;

  UPDATE public.kyc_submissions
  SET status           = CASE WHEN _approve THEN 'APPROVED' ELSE 'REJECTED' END::public.kyc_submission_status,
      reviewed_at      = now(),
      reviewed_by      = v_admin,
      rejection_reason = CASE WHEN _approve THEN NULL ELSE _rejection_reason END
  WHERE id = _submission_id
  RETURNING * INTO v_row;

  -- Mirror the decision onto the profile, which is what the trade gate reads.
  UPDATE public.profiles
  SET kyc_status  = CASE WHEN _approve THEN 'verified' ELSE 'rejected' END,
      kyc_level   = CASE WHEN _approve THEN 'verified' ELSE kyc_level END,
      is_verified = _approve
  WHERE user_id = v_row.user_id;

  INSERT INTO public.admin_actions (admin_id, action, target_user_id, metadata)
  VALUES (
    v_admin,
    CASE WHEN _approve THEN 'KYC_APPROVED' ELSE 'KYC_REJECTED' END,
    v_row.user_id,
    jsonb_build_object(
      'submission_id', _submission_id,
      'document_type', v_row.document_type,
      'rejection_reason', v_row.rejection_reason
    )
  );

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.review_kyc_submission(uuid, boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.review_kyc_submission(uuid, boolean, text) TO authenticated;
