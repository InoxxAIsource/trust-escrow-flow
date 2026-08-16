-- ============================================================================
-- P2PxBT Demo — 01b. Operational audit surface
-- ============================================================================
-- Three append-only logs that the operator console is built on:
--
--   trade_events        per-trade lifecycle timeline shown to both sides
--   admin_actions       who did what, for the Admin Activity view
--   admin_notifications the operator inbox (e.g. "bank wire details required")
--
-- All three are written by SECURITY DEFINER functions. Clients get SELECT
-- only, scoped by RLS. Ordering note: this runs before the KYC migration
-- because review_kyc_submission() writes into admin_actions.
-- ============================================================================

-- ── Trade timeline ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.trade_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id   uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  -- 'buyer' | 'seller' | 'admin' | 'system'
  actor_role text NOT NULL DEFAULT 'system',
  actor_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trade_events_trade_idx
  ON public.trade_events (trade_id, created_at);

ALTER TABLE public.trade_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trade participants can read the timeline" ON public.trade_events;
CREATE POLICY "Trade participants can read the timeline"
  ON public.trade_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trades t
      WHERE t.id = trade_events.trade_id
        AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can read every timeline" ON public.trade_events;
CREATE POLICY "Admins can read every timeline"
  ON public.trade_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- No client INSERT policy: events are emitted by record_trade_event() only.

CREATE OR REPLACE FUNCTION public.record_trade_event(
  _trade_id   uuid,
  _event_type text,
  _actor_role text DEFAULT 'system',
  _actor_id   uuid DEFAULT NULL,
  _metadata   jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.trade_events (trade_id, event_type, actor_role, actor_id, metadata)
  VALUES (_trade_id, _event_type, _actor_role, _actor_id, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Internal helper — not part of the client API surface.
REVOKE ALL ON FUNCTION public.record_trade_event(uuid, text, text, uuid, jsonb)
  FROM public, anon, authenticated;

-- ── Admin action log ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action         text NOT NULL,
  trade_id       uuid REFERENCES public.trades(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_actions_created_idx ON public.admin_actions (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_actions_trade_idx   ON public.admin_actions (trade_id, created_at DESC);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read the admin action log" ON public.admin_actions;
CREATE POLICY "Admins can read the admin action log"
  ON public.admin_actions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ── Operator inbox ─────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_notification_status') THEN
    CREATE TYPE public.admin_notification_status AS ENUM ('UNREAD', 'READ', 'ACTIONED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text NOT NULL,
  title        text NOT NULL,
  body         text,
  trade_id     uuid REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status       public.admin_notification_status NOT NULL DEFAULT 'UNREAD',
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Set by the notify-admin edge function once the email actually goes out,
  -- so the console can distinguish "queued" from "delivered".
  email_sent_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  read_at      timestamptz
);

CREATE INDEX IF NOT EXISTS admin_notifications_status_idx
  ON public.admin_notifications (status, created_at DESC);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read notifications" ON public.admin_notifications;
CREATE POLICY "Admins can read notifications"
  ON public.admin_notifications FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.raise_admin_notification(
  _type     text,
  _title    text,
  _body     text DEFAULT NULL,
  _trade_id uuid DEFAULT NULL,
  _user_id  uuid DEFAULT NULL,
  _payload  jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.admin_notifications (type, title, body, trade_id, user_id, payload)
  VALUES (_type, _title, _body, _trade_id, _user_id, COALESCE(_payload, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.raise_admin_notification(text, text, text, uuid, uuid, jsonb)
  FROM public, anon, authenticated;
