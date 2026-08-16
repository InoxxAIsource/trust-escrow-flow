-- ============================================================================
-- P2PxBT — 11. Reword operator messages
-- ============================================================================
-- The interface no longer carries demo badges on every surface. Two messages
-- keep their disclosure regardless, because they are the two moments where a
-- person could act on a false belief and lose money:
--
--   1. The payment-details message. It hands someone bank fields and tells
--      them to pay. If that arrives with no indication the account is not
--      real, the reasonable response is to send money.
--   2. The completion message. It states a trade settled. Without the
--      qualifier a user believes they have bought an asset they do not hold.
--
-- The wording moves from shouty banners to a plain closing line, so the
-- message reads like a payment instruction from a desk rather than a warning
-- sticker, while still being unambiguous about what did not happen.
-- ============================================================================

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
    'Please quote the payment reference exactly so the transfer can be matched.' || E'\n\n' ||
    'Note: P2PxBT is a product demonstration. This account does not exist and '
      || 'no transfer to it can be received. Do not send money.';

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

-- ── Completion message ─────────────────────────────────────────────────────

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
          'Payment confirmed and this trade is now complete. '
            || 'No crypto or fiat moved: P2PxBT is a product demonstration.',
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
