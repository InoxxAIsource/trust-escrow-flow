-- ============================================================================
-- P2PxBT — 14. Chat attachments and payment receipts
-- ============================================================================
-- A buyer marking a payment as sent has, at that moment, a screenshot or PDF
-- from their bank. Without somewhere to put it the operator is confirming on
-- the buyer's word alone, and a dispute later has nothing to examine.
--
-- Attachments hang off trade_messages rather than living in their own table:
-- a receipt IS a message in the conversation, it needs the same participant
-- read rules, and it should appear in the timeline where it was sent.
--
-- Object key convention:  <trade_id>/<uploader_id>/<uuid>.<ext>
--
-- Both segments are load-bearing. The first scopes the file to a trade so the
-- storage policy can ask "is the caller a participant in THAT trade"; the
-- second stops one participant writing into another's folder. The message
-- guard re-checks both when the row is inserted, so a valid upload cannot be
-- referenced from a message on a different trade.
--
-- Receipts are immutable once posted: there is no UPDATE or DELETE policy on
-- the bucket. Evidence a party could quietly swap after the fact is worse than
-- no evidence.
-- ============================================================================

-- ── Schema ─────────────────────────────────────────────────────────────────

ALTER TABLE public.trade_messages
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_mime text,
  ADD COLUMN IF NOT EXISTS attachment_size integer,
  ADD COLUMN IF NOT EXISTS is_receipt      boolean NOT NULL DEFAULT false;

-- A message may be text, or an attachment, or both -- but not neither.
ALTER TABLE public.trade_messages
  DROP CONSTRAINT IF EXISTS trade_messages_have_content;
ALTER TABLE public.trade_messages
  ADD CONSTRAINT trade_messages_have_content CHECK (
    length(btrim(message)) > 0 OR attachment_path IS NOT NULL
  );

-- The remaining attachment columns are meaningless without a path.
ALTER TABLE public.trade_messages
  DROP CONSTRAINT IF EXISTS trade_messages_attachment_complete;
ALTER TABLE public.trade_messages
  ADD CONSTRAINT trade_messages_attachment_complete CHECK (
    attachment_path IS NULL
    OR (attachment_name IS NOT NULL AND attachment_mime IS NOT NULL)
  );

-- ── Trade access helper ────────────────────────────────────────────────────
-- Storage policies receive the trade id as a path segment, i.e. as text that
-- may not be a uuid at all. Casting in the policy would raise on a crafted
-- key; validating here returns false instead.

CREATE OR REPLACE FUNCTION public.can_access_trade(_trade_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  BEGIN
    v_id := _trade_id::uuid;
  EXCEPTION WHEN others THEN
    RETURN false;
  END;

  IF public.is_admin(auth.uid()) THEN
    RETURN EXISTS (SELECT 1 FROM public.trades WHERE id = v_id);
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.id = v_id
      AND (t.owner_id = auth.uid() OR t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_trade(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_access_trade(text) TO authenticated;

-- ── Private bucket ─────────────────────────────────────────────────────────
-- `public = false`: objects are unreachable without a signed URL, which only a
-- session passing the SELECT policy below can mint.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trade-receipts',
  'trade-receipts',
  false,
  5 * 1024 * 1024,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET public             = false,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Trade attachments readable by participants" ON storage.objects;
CREATE POLICY "Trade attachments readable by participants"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'trade-receipts'
    AND public.can_access_trade((storage.foldername(name))[1])
  );

-- Uploads land in the caller's own folder, inside a trade they are part of.
-- A completed or cancelled trade is closed to new evidence.
DROP POLICY IF EXISTS "Participants can attach to an open trade" ON storage.objects;
CREATE POLICY "Participants can attach to an open trade"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'trade-receipts'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND public.can_access_trade((storage.foldername(name))[1])
  );

-- Deliberately no UPDATE or DELETE policy: a posted receipt cannot be swapped
-- or withdrawn.
DROP POLICY IF EXISTS "Trade attachments are immutable" ON storage.objects;

-- ── Message guard: an attachment must belong to its message ────────────────

CREATE OR REPLACE FUNCTION public.guard_trade_message_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Attachment ownership is checked on every path, privileged or not. A
  -- SECURITY DEFINER function posting on a user's behalf still must not be
  -- able to point a message at an unrelated object.
  IF NEW.attachment_path IS NOT NULL THEN
    IF split_part(NEW.attachment_path, '/', 1) <> NEW.trade_id::text THEN
      RAISE EXCEPTION 'FORBIDDEN: attachment does not belong to this trade'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.sender_id IS NOT NULL
       AND split_part(NEW.attachment_path, '/', 2) <> NEW.sender_id::text THEN
      RAISE EXCEPTION 'FORBIDDEN: attachment was not uploaded by this sender'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF current_setting('app.privileged', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- Only privileged paths may mint payment-details or system messages.
  IF NEW.is_payment_details THEN
    RAISE EXCEPTION 'FORBIDDEN: payment details are issued by an operator'
      USING ERRCODE = '42501';
  END IF;

  -- is_receipt is a display flag, not a capability, but it should still only
  -- be set on a message that actually carries a file.
  IF NEW.is_receipt AND NEW.attachment_path IS NULL THEN
    NEW.is_receipt := false;
  END IF;

  NEW.sender_role := CASE
    WHEN public.is_admin(auth.uid()) THEN 'admin'
    ELSE 'buyer'
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_trade_messages ON public.trade_messages;
CREATE TRIGGER guard_trade_messages
  BEFORE INSERT ON public.trade_messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_trade_message_role();

-- ── Timeline: record that a receipt arrived ────────────────────────────────
-- The operator console sorts on the timeline, so a receipt landing should be
-- visible there rather than only inside the conversation.

CREATE OR REPLACE FUNCTION public.note_receipt_on_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ref text;
BEGIN
  IF NOT NEW.is_receipt OR NEW.attachment_path IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT trade_ref INTO v_ref FROM public.trades WHERE id = NEW.trade_id;

  PERFORM public.record_trade_event(
    NEW.trade_id, 'RECEIPT_UPLOADED', NEW.sender_role, NEW.sender_id,
    jsonb_build_object('file_name', NEW.attachment_name, 'mime', NEW.attachment_mime));

  PERFORM public.raise_admin_notification(
    'RECEIPT_UPLOADED',
    'Payment receipt uploaded',
    v_ref || ': the buyer attached a payment receipt.',
    NEW.trade_id,
    NEW.sender_id,
    jsonb_build_object('trade_ref', v_ref, 'file_name', NEW.attachment_name));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS note_receipt_on_timeline_trg ON public.trade_messages;
CREATE TRIGGER note_receipt_on_timeline_trg
  AFTER INSERT ON public.trade_messages
  FOR EACH ROW EXECUTE FUNCTION public.note_receipt_on_timeline();

-- ── Reset: clear attachments too ───────────────────────────────────────────
-- reset_demo_environment() deletes the message rows; the storage objects they
-- referenced would otherwise be orphaned in the bucket.

CREATE OR REPLACE FUNCTION public.purge_trade_attachments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM public.require_admin();
  DELETE FROM storage.objects WHERE bucket_id = 'trade-receipts';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_trade_attachments() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.purge_trade_attachments() TO authenticated;
