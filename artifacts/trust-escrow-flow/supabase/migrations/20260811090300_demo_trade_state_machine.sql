-- ============================================================================
-- P2PxBT Demo — 04. Trade state machine
-- ============================================================================
-- The audit found that trade status was client-controlled: any participant
-- could PATCH a trade straight to 'completed'. This migration removes the
-- client's INSERT and UPDATE policies on public.trades entirely. Every
-- lifecycle change now goes through a SECURITY DEFINER RPC that validates the
-- transition against an explicit edge list and records who did it.
--
-- It also fixes self-trading: a demo trade has exactly one human side
-- (owner_id) and one simulated side (demo_counterparty_id), so a user cannot
-- be both ends of the same trade by construction.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'demo_trade_state') THEN
    CREATE TYPE public.demo_trade_state AS ENUM (
      'CREATED',
      'KYC_PENDING',
      'KYC_APPROVED',
      'TRADE_OPEN',
      'PAYMENT_METHOD_SELECTED',
      'AWAITING_PAYMENT_DETAILS',
      'PAYMENT_DETAILS_SENT',
      'PAYMENT_MARKED',
      'COMPLETED',
      'CANCELLED',
      'DISPUTED'
    );
  END IF;
END
$$;

-- ── Schema extensions on trades ────────────────────────────────────────────

-- One human + one simulated counterparty, so the legacy NOT NULLs go.
ALTER TABLE public.trades ALTER COLUMN seller_id DROP NOT NULL;
ALTER TABLE public.trades ALTER COLUMN buyer_id  DROP NOT NULL;

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS owner_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS demo_counterparty_id text REFERENCES public.demo_counterparties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trade_ref           text,
  ADD COLUMN IF NOT EXISTS side                text CHECK (side IN ('BUY', 'SELL')),
  ADD COLUMN IF NOT EXISTS demo_state          public.demo_trade_state,
  ADD COLUMN IF NOT EXISTS is_demo             boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_activity_at    timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at        timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_reason    text;

-- Backfill legacy rows so the new RLS predicate keeps them visible.
UPDATE public.trades SET owner_id = buyer_id WHERE owner_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trades_trade_ref_idx ON public.trades (trade_ref)
  WHERE trade_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS trades_owner_idx      ON public.trades (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trades_demo_state_idx ON public.trades (demo_state, last_activity_at DESC);

-- Human-readable reference: P2PXBT-DEMO-8291
CREATE SEQUENCE IF NOT EXISTS public.demo_trade_ref_seq START WITH 8291;

CREATE OR REPLACE FUNCTION public.next_demo_trade_ref()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public, pg_temp
AS $$
  SELECT 'P2PXBT-DEMO-' || lpad(nextval('public.demo_trade_ref_seq')::text, 4, '0');
$$;

-- ── Transition table ───────────────────────────────────────────────────────

-- Single source of truth for legal edges, mirrored byte-for-byte in
-- src/lib/trade-state-machine.ts so the UI can grey out impossible actions
-- without ever being the thing that enforces them.
CREATE OR REPLACE FUNCTION public.demo_trade_can_transition(
  _from public.demo_trade_state,
  _to   public.demo_trade_state
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT (_from, _to) IN (
    ('CREATED',                 'KYC_PENDING'),
    ('CREATED',                 'KYC_APPROVED'),
    ('CREATED',                 'TRADE_OPEN'),
    ('KYC_PENDING',             'KYC_APPROVED'),
    ('KYC_PENDING',             'CANCELLED'),
    ('KYC_APPROVED',            'TRADE_OPEN'),
    ('TRADE_OPEN',              'PAYMENT_METHOD_SELECTED'),
    ('PAYMENT_METHOD_SELECTED', 'AWAITING_PAYMENT_DETAILS'),
    ('AWAITING_PAYMENT_DETAILS','PAYMENT_DETAILS_SENT'),
    ('PAYMENT_DETAILS_SENT',    'PAYMENT_MARKED'),
    ('PAYMENT_MARKED',          'COMPLETED'),
    -- Escape hatches available from any live state.
    ('TRADE_OPEN',              'CANCELLED'),
    ('PAYMENT_METHOD_SELECTED', 'CANCELLED'),
    ('AWAITING_PAYMENT_DETAILS','CANCELLED'),
    ('PAYMENT_DETAILS_SENT',    'CANCELLED'),
    ('PAYMENT_MARKED',          'CANCELLED'),
    ('PAYMENT_DETAILS_SENT',    'DISPUTED'),
    ('PAYMENT_MARKED',          'DISPUTED'),
    ('DISPUTED',                'COMPLETED'),
    ('DISPUTED',                'CANCELLED')
  );
$$;

-- Central mutator. Every RPC below funnels through here.
CREATE OR REPLACE FUNCTION public.transition_demo_trade(
  _trade_id   uuid,
  _to         public.demo_trade_state,
  _actor_role text,
  _actor_id   uuid,
  _event_type text DEFAULT NULL,
  _metadata   jsonb DEFAULT '{}'::jsonb
)
RETURNS public.trades
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_trade public.trades;
BEGIN
  SELECT * INTO v_trade FROM public.trades WHERE id = _trade_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: no such trade' USING ERRCODE = 'P0002';
  END IF;

  IF v_trade.demo_state IN ('COMPLETED', 'CANCELLED') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: % is terminal', v_trade.demo_state
      USING ERRCODE = '55000';
  END IF;

  IF NOT public.demo_trade_can_transition(v_trade.demo_state, _to) THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: % -> % is not permitted', v_trade.demo_state, _to
      USING ERRCODE = '55000';
  END IF;

  PERFORM set_config('app.privileged', 'on', true);

  UPDATE public.trades
  SET demo_state       = _to,
      last_activity_at = now(),
      completed_at     = CASE WHEN _to = 'COMPLETED' THEN now() ELSE completed_at END,
      -- Keep the legacy status column coherent for existing screens.
      status = CASE _to
                 WHEN 'COMPLETED' THEN 'completed'::public.trade_status
                 WHEN 'CANCELLED' THEN 'cancelled'::public.trade_status
                 WHEN 'DISPUTED'  THEN 'disputed'::public.trade_status
                 WHEN 'PAYMENT_MARKED' THEN 'paid'::public.trade_status
                 ELSE status
               END
  WHERE id = _trade_id
  RETURNING * INTO v_trade;

  PERFORM public.record_trade_event(
    _trade_id,
    COALESCE(_event_type, 'STATE_' || _to::text),
    _actor_role,
    _actor_id,
    _metadata
  );

  RETURN v_trade;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_demo_trade(uuid, public.demo_trade_state, text, uuid, text, jsonb)
  FROM public, anon, authenticated;

-- ── Lock down direct client writes on trades ───────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can create trades" ON public.trades;
DROP POLICY IF EXISTS "Trade participants can update"        ON public.trades;
DROP POLICY IF EXISTS "Users can view their own trades"      ON public.trades;

-- SELECT only. There is deliberately no INSERT or UPDATE policy anywhere on
-- this table: open_demo_trade() and the transition RPCs are the sole writers.
CREATE POLICY "Trade participants can read their trades"
  ON public.trades FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR auth.uid() = buyer_id
    OR auth.uid() = seller_id
  );

CREATE POLICY "Admins can read every trade"
  ON public.trades FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ── Trade opening ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.open_demo_trade(
  _offer_id        text,
  _amount          numeric,
  _unit_price      numeric,
  _payment_method  text
)
RETURNS public.trades
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid          uuid := auth.uid();
  v_offer        public.demo_offers;
  v_counterparty public.demo_counterparties;
  v_kyc          text;
  v_total        numeric;
  v_trade        public.trades;
  v_ref          text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: sign in to open a trade' USING ERRCODE = '42501';
  END IF;

  -- KYC gate. Read from profiles, which only a reviewer can promote.
  SELECT kyc_status INTO v_kyc FROM public.profiles WHERE user_id = v_uid;
  IF v_kyc IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'KYC_REQUIRED: identity verification must be approved first'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_offer FROM public.demo_offers WHERE id = _offer_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: offer is unavailable' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_counterparty
  FROM public.demo_counterparties WHERE id = v_offer.counterparty_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: counterparty is unavailable' USING ERRCODE = 'P0002';
  END IF;

  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'VALIDATION: amount must be positive' USING ERRCODE = '22023';
  END IF;
  IF _amount > v_offer.available_amount THEN
    RAISE EXCEPTION 'VALIDATION: amount exceeds the offer''s available volume'
      USING ERRCODE = '22023';
  END IF;
  IF _unit_price IS NULL OR _unit_price <= 0 THEN
    RAISE EXCEPTION 'VALIDATION: unit price must be positive' USING ERRCODE = '22023';
  END IF;
  IF NOT (_payment_method = ANY (v_offer.payment_methods)) THEN
    RAISE EXCEPTION 'VALIDATION: % is not offered on this listing', _payment_method
      USING ERRCODE = '22023';
  END IF;

  v_total := round(_amount * _unit_price, 2);

  IF v_total < v_offer.min_limit_usd OR v_total > v_offer.max_limit_usd THEN
    RAISE EXCEPTION 'VALIDATION: order value % is outside the % - % limit',
      v_total, v_offer.min_limit_usd, v_offer.max_limit_usd USING ERRCODE = '22023';
  END IF;

  v_ref := public.next_demo_trade_ref();

  PERFORM set_config('app.privileged', 'on', true);

  INSERT INTO public.trades (
    offer_id, owner_id,
    buyer_id, seller_id,
    demo_counterparty_id, trade_ref, side, asset, amount, price, total,
    currency, payment_method, status, demo_state, is_demo, expires_at
  )
  VALUES (
    _offer_id, v_uid,
    -- Exactly one side is a real user; the other stays NULL and is rendered
    -- from demo_counterparty_id. This is what makes self-trades impossible.
    CASE WHEN v_offer.side = 'BUY'  THEN v_uid ELSE NULL END,
    CASE WHEN v_offer.side = 'SELL' THEN v_uid ELSE NULL END,
    v_counterparty.id, v_ref, v_offer.side, v_offer.asset, _amount, _unit_price, v_total,
    'USD', _payment_method, 'pending', 'TRADE_OPEN', true,
    now() + interval '3 hours'
  )
  RETURNING * INTO v_trade;

  PERFORM public.record_trade_event(
    v_trade.id, 'TRADE_CREATED', 'buyer', v_uid,
    jsonb_build_object('trade_ref', v_ref, 'side', v_offer.side, 'asset', v_offer.asset,
                       'amount', _amount, 'unit_price', _unit_price, 'total', v_total)
  );
  PERFORM public.record_trade_event(
    v_trade.id, 'KYC_APPROVED', 'system', NULL,
    jsonb_build_object('note', 'Identity verification already approved for this account')
  );

  -- TRADE_OPEN -> PAYMENT_METHOD_SELECTED -> AWAITING_PAYMENT_DETAILS.
  -- The method was chosen on the order ticket, so both edges fire here; the
  -- trade parks in AWAITING_PAYMENT_DETAILS until an operator acts.
  v_trade := public.transition_demo_trade(
    v_trade.id, 'PAYMENT_METHOD_SELECTED', 'buyer', v_uid,
    'PAYMENT_METHOD_SELECTED', jsonb_build_object('payment_method', _payment_method));

  v_trade := public.transition_demo_trade(
    v_trade.id, 'AWAITING_PAYMENT_DETAILS', 'system', NULL,
    'ADMIN_NOTIFIED', jsonb_build_object('payment_method', _payment_method));

  PERFORM public.raise_admin_notification(
    'PAYMENT_DETAILS_REQUIRED',
    format('%s details required — Trade %s', _payment_method, v_ref),
    format('%s wants to %s %s %s via %s.',
           COALESCE((SELECT username FROM public.profiles WHERE user_id = v_uid), 'A demo user'),
           lower(v_offer.side), _amount::text, v_offer.asset, _payment_method),
    v_trade.id, v_uid,
    jsonb_build_object(
      'trade_ref', v_ref, 'side', v_offer.side, 'asset', v_offer.asset,
      'amount', _amount, 'total', v_total, 'payment_method', _payment_method,
      'counterparty_id', v_counterparty.id,
      'counterparty_name', v_counterparty.display_name)
  );

  RETURN v_trade;
END;
$$;

REVOKE ALL ON FUNCTION public.open_demo_trade(text, numeric, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.open_demo_trade(text, numeric, numeric, text) TO authenticated;

-- ── Buyer action: mark payment sent ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mark_demo_payment_sent(_trade_id uuid)
RETURNS public.trades
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_trade public.trades;
BEGIN
  SELECT * INTO v_trade FROM public.trades WHERE id = _trade_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: no such trade' USING ERRCODE = 'P0002';
  END IF;
  IF v_trade.owner_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'FORBIDDEN: this is not your trade' USING ERRCODE = '42501';
  END IF;

  v_trade := public.transition_demo_trade(
    _trade_id, 'PAYMENT_MARKED', 'buyer', v_uid, 'BUYER_MARKED_PAYMENT_SENT',
    jsonb_build_object('payment_method', v_trade.payment_method));

  PERFORM public.raise_admin_notification(
    'PAYMENT_MARKED',
    format('Payment marked sent — Trade %s', v_trade.trade_ref),
    'The buyer has marked the simulated payment as sent and is awaiting confirmation.',
    _trade_id, v_uid,
    jsonb_build_object('trade_ref', v_trade.trade_ref));

  RETURN v_trade;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_demo_payment_sent(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mark_demo_payment_sent(uuid) TO authenticated;

-- ── Participant action: cancel ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cancel_demo_trade(_trade_id uuid, _reason text DEFAULT NULL)
RETURNS public.trades
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_trade    public.trades;
  v_is_admin boolean := public.is_admin(v_uid);
BEGIN
  SELECT * INTO v_trade FROM public.trades WHERE id = _trade_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: no such trade' USING ERRCODE = 'P0002';
  END IF;
  IF NOT v_is_admin AND v_trade.owner_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'FORBIDDEN: this is not your trade' USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('app.privileged', 'on', true);
  UPDATE public.trades SET cancelled_reason = _reason WHERE id = _trade_id;

  v_trade := public.transition_demo_trade(
    _trade_id, 'CANCELLED',
    CASE WHEN v_is_admin THEN 'admin' ELSE 'buyer' END, v_uid,
    'TRADE_CANCELLED', jsonb_build_object('reason', _reason));

  IF v_is_admin THEN
    INSERT INTO public.admin_actions (admin_id, action, trade_id, metadata)
    VALUES (v_uid, 'TRADE_CANCELLED', _trade_id, jsonb_build_object('reason', _reason));
  END IF;

  RETURN v_trade;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_demo_trade(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_demo_trade(uuid, text) TO authenticated;
