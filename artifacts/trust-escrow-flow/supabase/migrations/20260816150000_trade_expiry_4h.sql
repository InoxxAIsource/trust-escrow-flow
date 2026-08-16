-- ============================================================================
-- 4-hour payment window with auto-expiry
--
-- 1. Add EXPIRED terminal state to the enum
-- 2. Wire EXPIRED into the transition table and mutator
-- 3. Expose expires_at on the trades SELECT policy
-- 4. Create expire_overdue_demo_trades() for the cron job
-- 5. Schedule it every minute via pg_cron
-- 6. Change open_demo_trade() window from 3 h → 4 h
-- ============================================================================

-- 1. Add enum value (DDL outside transaction – Postgres requires this)
ALTER TYPE public.demo_trade_state ADD VALUE IF NOT EXISTS 'EXPIRED';

-- ============================================================================
-- 2a. Transition table – allow any live state → EXPIRED
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

-- ============================================================================
-- 2b. Central mutator – recognise EXPIRED as terminal
-- ============================================================================
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

  -- Treat COMPLETED, CANCELLED, and EXPIRED as terminal
  IF v_trade.demo_state IN ('COMPLETED', 'CANCELLED', 'EXPIRED') THEN
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
      -- Keep legacy status coherent
      status = CASE _to
                 WHEN 'COMPLETED' THEN 'completed'::public.trade_status
                 WHEN 'CANCELLED' THEN 'cancelled'::public.trade_status
                 WHEN 'EXPIRED'   THEN 'expired'::public.trade_status
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

-- ============================================================================
-- 3. Expose expires_at in the buyer SELECT policy
--    (column already exists; just make sure the view/query can read it)
-- ============================================================================
-- No policy change needed – the column is in the trades table that the
-- existing SELECT policy already covers.  The frontend just needs to request it.

-- ============================================================================
-- 4. Auto-expiry worker function (called by cron every minute)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.expire_overdue_demo_trades()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_trade record;
  v_count integer := 0;
BEGIN
  FOR v_trade IN
    SELECT id, demo_state
    FROM public.trades
    WHERE is_demo = true
      AND expires_at IS NOT NULL
      AND expires_at < now()
      AND demo_state NOT IN ('COMPLETED', 'CANCELLED', 'EXPIRED')
  LOOP
    BEGIN
      PERFORM set_config('app.privileged', 'on', true);

      UPDATE public.trades
      SET demo_state       = 'EXPIRED',
          last_activity_at = now(),
          status           = 'expired'::public.trade_status
      WHERE id = v_trade.id;

      PERFORM public.record_trade_event(
        v_trade.id,
        'TRADE_EXPIRED',
        'system',
        NULL,
        jsonb_build_object('reason', 'Payment window elapsed (4 hours)')
      );

      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log but continue so one bad row doesn't block the rest
      RAISE WARNING 'expire_overdue_demo_trades: failed on trade %: %', v_trade.id, SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_overdue_demo_trades() FROM public, anon, authenticated;

-- ============================================================================
-- 5. Schedule via pg_cron (already enabled)
-- ============================================================================
SELECT cron.unschedule('expire-overdue-demo-trades') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'expire-overdue-demo-trades'
);

SELECT cron.schedule(
  'expire-overdue-demo-trades',
  '* * * * *',   -- every minute
  $$SELECT public.expire_overdue_demo_trades();$$
);

-- ============================================================================
-- 6. Change the 4-hour window in open_demo_trade()
--    Re-create only the expires_at line — full function redeploy needed
--    because the body is one atomic block.
-- ============================================================================
-- NOTE: open_demo_trade() is redefined in full below so the 4-hour line takes
-- effect on new trades.  The function signature is unchanged.

DO $$
DECLARE
  v_src text;
BEGIN
  -- Retrieve current body, swap the interval, re-create
  SELECT pg_get_functiondef(oid) INTO v_src
  FROM pg_proc
  WHERE proname = 'open_demo_trade'
    AND pronamespace = 'public'::regnamespace;

  IF v_src IS NULL THEN
    RAISE WARNING 'open_demo_trade not found – skipping interval patch';
    RETURN;
  END IF;

  -- Replace 3 hours with 4 hours
  v_src := replace(v_src, 'interval ''3 hours''', 'interval ''4 hours''');

  -- pg_get_functiondef returns "CREATE OR REPLACE FUNCTION …" so just execute it
  EXECUTE v_src;
END;
$$;
