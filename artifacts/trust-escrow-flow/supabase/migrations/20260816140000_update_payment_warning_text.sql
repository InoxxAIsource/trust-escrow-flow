-- ============================================================================
-- Replace the old "this account cannot receive transfers" disclaimer with the
-- correct payment instruction for buyers.
-- ============================================================================

-- 1. Patch the function that inserts the payment-details chat message.
CREATE OR REPLACE FUNCTION public.admin_send_payment_instructions(_trade_id uuid)
RETURNS public.trade_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin  uuid := auth.uid();
  v_trade  record;
  v_cp     record;
  v_instr  record;
  v_body   text;
  v_message public.trade_messages;
BEGIN
  -- Must be admin
  IF NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_trade FROM public.trades WHERE id = _trade_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: trade' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_cp FROM public.demo_counterparties WHERE id = v_trade.demo_counterparty_id;

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
    'Important: Do not send payment through a 3rd party or online transfer — '
      || 'physical wire only. Once your payment is done, upload your receipt in the Documents tab.';

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
    _trade_id, 'AWAITING_PAYMENT_DETAILS', v_admin, 'admin',
    'PAYMENT_DETAILS_SENT', '{}'::jsonb
  );

  RETURN v_message;
END;
$$;

-- 2. Patch any already-stored payment-details messages in existing trades.
UPDATE public.trade_messages
SET message = regexp_replace(
  message,
  'Important: this account cannot receive transfers\. Any payment sent to it will not arrive\. Do not send money\.',
  'Important: Do not send payment through a 3rd party or online transfer — physical wire only. Once your payment is done, upload your receipt in the Documents tab.',
  'g'
)
WHERE is_payment_details = true
  AND message LIKE '%cannot receive transfers%';
