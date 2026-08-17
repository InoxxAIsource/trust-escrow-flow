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
