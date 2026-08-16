-- ============================================================================
-- P2PxBT Demo — 05. Trade chat, operator actions, demo reset
-- ============================================================================
-- The payment-details handshake is the heart of the demo, so it is worth being
-- explicit about why it is shaped this way:
--
--   A buyer selecting "USA Bank Wire" must NOT receive bank details from the
--   API. demo_payment_instructions is admin-read-only (migration 03), and the
--   only code path that can copy those values into a trade is
--   admin_send_payment_details(), which requires the admin role. The buyer
--   therefore genuinely has to wait for an operator, exactly as the product
--   brief describes — this is enforced, not simulated in the UI.
-- ============================================================================

-- ── Chat schema ────────────────────────────────────────────────────────────

ALTER TABLE public.trade_messages
  ADD COLUMN IF NOT EXISTS sender_role        text NOT NULL DEFAULT 'buyer',
  ADD COLUMN IF NOT EXISTS is_payment_details boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata           jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.trade_messages ALTER COLUMN sender_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS trade_messages_trade_idx
  ON public.trade_messages (trade_id, created_at);

-- Rebuild policies around owner_id (introduced in migration 04) and admins.
DROP POLICY IF EXISTS "Trade participants can read messages" ON public.trade_messages;
DROP POLICY IF EXISTS "Trade participants can send messages" ON public.trade_messages;

CREATE POLICY "Trade participants can read messages"
  ON public.trade_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trades t
      WHERE t.id = trade_messages.trade_id
        AND (t.owner_id = auth.uid() OR t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

CREATE POLICY "Admins can read every conversation"
  ON public.trade_messages FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Plain chat only. A client INSERT cannot set is_payment_details (see the
-- guard trigger), so it cannot forge an operator payment-details message.
CREATE POLICY "Trade participants can send messages"
  ON public.trade_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.trades t
      WHERE t.id = trade_messages.trade_id
        AND (t.owner_id = auth.uid() OR t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
        AND t.demo_state NOT IN ('COMPLETED', 'CANCELLED')
    )
  );

CREATE POLICY "Admins can post into any conversation"
  ON public.trade_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = sender_id);

CREATE OR REPLACE FUNCTION public.guard_trade_message_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('app.privileged', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- Only privileged paths may mint payment-details or system messages.
  IF NEW.is_payment_details THEN
    RAISE EXCEPTION 'FORBIDDEN: payment details are issued by an operator'
      USING ERRCODE = '42501';
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

-- Keep the trade's activity clock fresh so the operator table sorts usefully.
CREATE OR REPLACE FUNCTION public.touch_trade_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.privileged', 'on', true);
  UPDATE public.trades SET last_activity_at = now() WHERE id = NEW.trade_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_trade_on_message_trg ON public.trade_messages;
CREATE TRIGGER touch_trade_on_message_trg
  AFTER INSERT ON public.trade_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_trade_on_message();

-- ── Operator: send payment details ─────────────────────────────────────────

-- Renders the stored instruction fields into a readable block. Key order is
-- fixed rather than jsonb-natural so the message reads the same every time.
CREATE OR REPLACE FUNCTION public.format_payment_instructions(_fields jsonb, _reference text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_out   text := '';
  v_key   text;
  v_label text;
  -- Fixed order, mirrored by PAYMENT_FIELD_ORDER in src/integrations/supabase/demo.ts
  -- so the chat message and the operator panel render identically.
  v_keys  text[] := ARRAY[
    'bank_name','account_name','routing_number','account_number',
    'sort_code','iban','swift','bank_address','settlement_note'
  ];
BEGIN
  FOREACH v_key IN ARRAY v_keys LOOP
    IF _fields ? v_key THEN
      v_label := initcap(replace(v_key, '_', ' '));
      v_label := replace(replace(v_label, 'Swift', 'SWIFT / BIC'), 'Iban', 'IBAN');
      v_out := v_out || v_label || ': ' || (_fields ->> v_key) || E'\n';
    END IF;
  END LOOP;

  v_out := v_out || 'Payment Reference: ' || _reference || E'\n';
  RETURN v_out;
END;
$$;

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
    RAISE EXCEPTION 'NOT_FOUND: this trade has no demo counterparty' USING ERRCODE = 'P0002';
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
    'Please use the following simulated payment details:' || E'\n\n' ||
    public.format_payment_instructions(v_instr.fields, v_trade.trade_ref) || E'\n' ||
    '— SIMULATED PAYMENT DETAILS —' || E'\n' ||
    'This is a demonstration. No real account exists and no funds can move.';

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
  VALUES (v_admin, 'PAYMENT_DETAILS_SENT', _trade_id, v_trade.owner_id,
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

-- ── Operator: confirm the simulated payment ────────────────────────────────

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
    jsonb_build_object('confirmed_by', v_admin, 'settlement', 'SIMULATED'));

  PERFORM set_config('app.privileged', 'on', true);

  INSERT INTO public.trade_messages (trade_id, sender_id, sender_role, message, metadata)
  VALUES (_trade_id, v_admin, 'system',
          'Simulated payment confirmed. This demo trade is now complete — no crypto or fiat moved.',
          jsonb_build_object('kind', 'COMPLETION_NOTICE'));

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

-- ── Operator: mark a trade opened (audit breadcrumb) ───────────────────────

CREATE OR REPLACE FUNCTION public.admin_mark_trade_opened(_trade_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin uuid := public.require_admin();
BEGIN
  -- Only record the first open per operator, so the timeline stays readable.
  IF EXISTS (
    SELECT 1 FROM public.trade_events
    WHERE trade_id = _trade_id AND event_type = 'ADMIN_OPENED_TRADE' AND actor_id = v_admin
  ) THEN
    RETURN;
  END IF;

  PERFORM public.record_trade_event(_trade_id, 'ADMIN_OPENED_TRADE', 'admin', v_admin, '{}'::jsonb);

  INSERT INTO public.admin_actions (admin_id, action, trade_id)
  VALUES (v_admin, 'ADMIN_OPENED_TRADE', _trade_id);

  UPDATE public.admin_notifications
  SET status = 'READ', read_at = now()
  WHERE trade_id = _trade_id AND status = 'UNREAD';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_mark_trade_opened(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_mark_trade_opened(uuid) TO authenticated;

-- ── Dispute ────────────────────────────────────────────────────────────────

-- Either side can raise a dispute once payment details are in play. This
-- parks the trade off the happy path and puts it in front of an operator;
-- resolution is admin-only (admin_confirm_payment to settle, or
-- cancel_demo_trade to void).
CREATE OR REPLACE FUNCTION public.raise_trade_dispute(_trade_id uuid, _reason text)
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
  IF _reason IS NULL OR btrim(_reason) = '' THEN
    RAISE EXCEPTION 'VALIDATION: describe the problem so an operator can act on it'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_trade FROM public.trades WHERE id = _trade_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: no such trade' USING ERRCODE = 'P0002';
  END IF;
  IF NOT v_is_admin AND v_trade.owner_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'FORBIDDEN: this is not your trade' USING ERRCODE = '42501';
  END IF;

  v_trade := public.transition_demo_trade(
    _trade_id, 'DISPUTED',
    CASE WHEN v_is_admin THEN 'admin' ELSE 'buyer' END, v_uid,
    'TRADE_DISPUTED', jsonb_build_object('reason', _reason));

  PERFORM set_config('app.privileged', 'on', true);

  INSERT INTO public.trade_messages (trade_id, sender_id, sender_role, message, metadata)
  VALUES (_trade_id, v_uid, 'system',
          'A dispute was raised on this trade. A P2PxBT operator will review the conversation. Reason: ' || _reason,
          jsonb_build_object('kind', 'DISPUTE_RAISED', 'reason', _reason));

  PERFORM public.raise_admin_notification(
    'TRADE_DISPUTED',
    format('Dispute raised — Trade %s', v_trade.trade_ref),
    _reason,
    _trade_id, v_trade.owner_id,
    jsonb_build_object('trade_ref', v_trade.trade_ref, 'reason', _reason));

  RETURN v_trade;
END;
$$;

REVOKE ALL ON FUNCTION public.raise_trade_dispute(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.raise_trade_dispute(uuid, text) TO authenticated;

-- ── Operator: reset the demo environment ───────────────────────────────────

-- Clears user-generated demo activity and restores the seeded catalogue.
-- Deliberately does NOT touch auth.users or profiles: signed-up demo accounts
-- survive a reset, they simply lose their trades and go back to unverified.
CREATE OR REPLACE FUNCTION public.reset_demo_environment()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin   uuid := public.require_admin();
  v_trades  integer;
  v_kyc     integer;
BEGIN
  PERFORM set_config('app.privileged', 'on', true);

  SELECT count(*) INTO v_trades FROM public.trades WHERE is_demo;
  SELECT count(*) INTO v_kyc    FROM public.kyc_submissions;

  -- trade_messages and trade_events cascade from trades.
  DELETE FROM public.trades WHERE is_demo;
  DELETE FROM public.kyc_submissions;
  DELETE FROM public.admin_notifications;
  DELETE FROM public.admin_actions;

  UPDATE public.profiles
  SET kyc_status = 'unverified', kyc_level = 'guest',
      aml_status = 'not_checked', is_verified = false;

  ALTER SEQUENCE public.demo_trade_ref_seq RESTART WITH 8291;

  INSERT INTO public.admin_actions (admin_id, action, metadata)
  VALUES (v_admin, 'DEMO_RESET',
          jsonb_build_object('trades_cleared', v_trades, 'kyc_cleared', v_kyc));

  RETURN jsonb_build_object('ok', true, 'trades_cleared', v_trades, 'kyc_cleared', v_kyc);
END;
$$;

REVOKE ALL ON FUNCTION public.reset_demo_environment() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reset_demo_environment() TO authenticated;

-- ── Realtime ───────────────────────────────────────────────────────────────

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END
$$;
