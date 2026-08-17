-- ============================================================================
-- APPLY-PENDING: run this whole file once in the Supabase SQL Editor.
-- Consolidates all migrations written locally but not yet applied live.
-- Idempotent: safe to run more than once.
-- ============================================================================

-- ── 1. Fix "admin can't save bank details" (migration 20260816120000) ───────
-- ============================================================================
-- Allow admins to INSERT and UPDATE demo_payment_instructions,
-- and drop the fake-data constraint that blocked real-looking test data.
-- ============================================================================

-- Write policies (previously only SELECT existed)
DROP POLICY IF EXISTS "Admins can insert payment instructions" ON public.demo_payment_instructions;
CREATE POLICY "Admins can insert payment instructions"
  ON public.demo_payment_instructions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update payment instructions" ON public.demo_payment_instructions;
CREATE POLICY "Admins can update payment instructions"
  ON public.demo_payment_instructions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Drop the constraint that blocked non-DEMO placeholder values.
-- Admins need to be able to store real-looking bank details for their sellers.
ALTER TABLE public.demo_payment_instructions
  DROP CONSTRAINT IF EXISTS demo_payment_instructions_must_be_fake;

-- ── 2. Remove COMPLETION_NOTICE chat message (migration 20260817100000) ────
-- ============================================================================
-- Remove the "Payment confirmed and this trade is now complete. No crypto or
-- fiat was transferred." system message from the admin_confirm_payment RPC
-- and delete any existing messages of that kind from the database.
-- ============================================================================

-- 1. Delete existing COMPLETION_NOTICE messages already in the database.
DELETE FROM public.trade_messages
WHERE metadata->>'kind' = 'COMPLETION_NOTICE';

-- 2. Replace admin_confirm_payment without the completion notice INSERT.
CREATE OR REPLACE FUNCTION public.admin_confirm_payment(_trade_id uuid)
RETURNS public.trades
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin uuid := public.require_admin();
  v_trade public.trades;
BEGIN
  v_trade := public.transition_demo_trade(
    _trade_id, 'COMPLETED', 'admin', v_admin, 'TRADE_COMPLETED',
    jsonb_build_object('confirmed_by', v_admin));

  PERFORM set_config('app.privileged', 'on', true);

  -- (No completion notice inserted — operators removed this message.)

  INSERT INTO public.admin_actions (admin_id, action, trade_id, target_user_id, metadata)
  VALUES (v_admin, 'TRADE_COMPLETED', _trade_id, v_trade.owner_id,
          jsonb_build_object('trade_ref', v_trade.trade_ref));

  UPDATE public.admin_notifications
  SET status = 'ACTIONED' WHERE trade_id = _trade_id AND status <> 'ACTIONED';

  RETURN v_trade;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_confirm_payment(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_confirm_payment(uuid) TO authenticated;

-- ── 3. Remove payment-details disclaimer (migration 20260817150000) ────────
-- ============================================================================
-- Remove the "Important: this account cannot receive transfers…" disclaimer
-- from the admin_send_payment_details function and any existing messages.
-- ============================================================================

-- 1. Replace the function without the disclaimer paragraph.
CREATE OR REPLACE FUNCTION public.admin_send_payment_details(_trade_id uuid)
RETURNS public.trade_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin    uuid := public.require_admin();
  v_trade    public.trades;
  v_instr    public.demo_payment_instructions;
  v_cp       public.demo_counterparties;
  v_body     text;
  v_message  public.trade_messages;
BEGIN
  SELECT * INTO v_trade FROM public.trades WHERE id = _trade_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: no such trade' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_cp FROM public.demo_counterparties WHERE id = v_trade.demo_counterparty_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: this trade has no counterparty' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_instr
  FROM public.demo_payment_instructions
  WHERE counterparty_id = v_trade.demo_counterparty_id
    AND method = v_trade.payment_method;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: % has no stored instructions for %',
      v_cp.display_name, v_trade.payment_method USING ERRCODE = 'P0002';
  END IF;

  v_body :=
    'Your selected payment method is ' || v_trade.payment_method || '.' || E'\n\n' ||
    'Please use the following payment details:' || E'\n\n' ||
    public.format_payment_instructions(v_instr.fields, v_trade.trade_ref) || E'\n' ||
    'Please quote the payment reference exactly so the transfer can be matched.';

  PERFORM set_config('app.privileged', 'on', true);

  INSERT INTO public.trade_messages
    (trade_id, sender_id, sender_role, message, is_payment_details, metadata)
  VALUES
    (_trade_id, v_admin, 'admin', v_body, true,
     jsonb_build_object('payment_method', v_trade.payment_method,
                        'counterparty_id', v_cp.id,
                        'counterparty_name', v_cp.display_name,
                        'reference', v_trade.trade_ref,
                        'fields', v_instr.fields))
  RETURNING * INTO v_message;

  PERFORM public.transition_demo_trade(
    _trade_id, 'PAYMENT_DETAILS_SENT', 'admin', v_admin, 'PAYMENT_DETAILS_SENT',
    jsonb_build_object('payment_method', v_trade.payment_method, 'sent_by', v_admin));

  INSERT INTO public.admin_actions (admin_id, action, trade_id, target_user_id, metadata)
  VALUES (v_admin, 'TRADE_COMPLETED', _trade_id, v_trade.owner_id,
          jsonb_build_object('payment_method', v_trade.payment_method,
                             'counterparty_id', v_cp.id));

  UPDATE public.admin_notifications
  SET status = 'ACTIONED'
  WHERE trade_id = _trade_id AND type = 'PAYMENT_DETAILS_REQUIRED' AND status <> 'ACTIONED';

  RETURN v_message;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_send_payment_details(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_send_payment_details(uuid) TO authenticated;

-- 2. Strip the disclaimer from any already-stored payment-details messages.
UPDATE public.trade_messages
SET message = trim(
  regexp_replace(
    regexp_replace(
      message,
      E'\\n\\nImportant: this account cannot receive transfers\\. Any payment sent to it will not arrive\\. Do not send money\\.',
      '', 'g'
    ),
    E'\\n\\nImportant: Do not send payment through a 3rd party or online transfer[^\n]*',
    '', 'g'
  )
)
WHERE is_payment_details = true;
-- ============================================================================
-- Manual payment-details flow:
-- The operator now types bank details directly into the trade chat instead of
-- sending stored instructions. The buyer can mark payment as sent from the
-- moment the trade is awaiting details, so add the edge
-- AWAITING_PAYMENT_DETAILS -> PAYMENT_MARKED.
-- Mirrored in src/lib/trade-state-machine.ts.
-- ============================================================================

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
    ('CREATED',                  'KYC_PENDING'),
    ('CREATED',                  'KYC_APPROVED'),
    ('CREATED',                  'TRADE_OPEN'),
    ('KYC_PENDING',              'KYC_APPROVED'),
    ('KYC_PENDING',              'CANCELLED'),
    ('KYC_APPROVED',             'TRADE_OPEN'),
    ('TRADE_OPEN',               'PAYMENT_METHOD_SELECTED'),
    ('PAYMENT_METHOD_SELECTED',  'AWAITING_PAYMENT_DETAILS'),
    ('AWAITING_PAYMENT_DETAILS', 'PAYMENT_DETAILS_SENT'),
    ('AWAITING_PAYMENT_DETAILS', 'PAYMENT_MARKED'),
    ('PAYMENT_DETAILS_SENT',     'PAYMENT_MARKED'),
    ('PAYMENT_MARKED',           'COMPLETED'),
    -- Cancellation escape hatches
    ('TRADE_OPEN',               'CANCELLED'),
    ('PAYMENT_METHOD_SELECTED',  'CANCELLED'),
    ('AWAITING_PAYMENT_DETAILS', 'CANCELLED'),
    ('PAYMENT_DETAILS_SENT',     'CANCELLED'),
    ('PAYMENT_MARKED',           'CANCELLED'),
    -- Dispute
    ('PAYMENT_DETAILS_SENT',     'DISPUTED'),
    ('PAYMENT_MARKED',           'DISPUTED'),
    ('DISPUTED',                 'COMPLETED'),
    ('DISPUTED',                 'CANCELLED'),
    -- Expiry (system-only, from any live state)
    ('TRADE_OPEN',               'EXPIRED'),
    ('PAYMENT_METHOD_SELECTED',  'EXPIRED'),
    ('AWAITING_PAYMENT_DETAILS', 'EXPIRED'),
    ('PAYMENT_DETAILS_SENT',     'EXPIRED'),
    ('PAYMENT_MARKED',           'EXPIRED'),
    ('DISPUTED',                 'EXPIRED')
  );
$$;
