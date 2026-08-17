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
