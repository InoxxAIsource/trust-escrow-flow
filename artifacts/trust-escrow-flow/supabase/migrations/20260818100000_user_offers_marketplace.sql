-- ============================================================================
-- P2PxBT — User-created sell offers are tradable in the marketplace
-- ============================================================================
-- The Create Offer dialog writes rows to public.offers, but open_demo_trade()
-- only knew demo_offers, so a buyer clicking a real user's listing had no way
-- to open a trade against it.
--
-- This redefines open_demo_trade() with a fallback branch: when _offer_id is
-- not a demo offer, it is looked up in public.offers (active sell offers).
-- A user-offer trade has two real humans — the buyer (caller) and the seller
-- (offer owner) — and no demo counterparty. Opening one reserves volume by
-- decrementing remaining_amount, and the listing auto-completes at zero.
--
-- The demo branch is byte-identical to its last definition
-- (20260814130000_local_currency_pricing.sql, with the 4-hour window from
-- 20260816150000_trade_expiry_4h.sql).
-- ============================================================================

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
  v_user_offer   public.offers;
  v_counterparty public.demo_counterparties;
  v_kyc          text;
  v_total        numeric;
  v_trade        public.trades;
  v_ref          text;
  v_seller_name  text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: sign in to open a trade' USING ERRCODE = '42501';
  END IF;

  SELECT kyc_status INTO v_kyc FROM public.profiles WHERE user_id = v_uid;
  IF v_kyc IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'KYC_REQUIRED: identity verification must be approved first'
      USING ERRCODE = '42501';
  END IF;

  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'VALIDATION: amount must be positive' USING ERRCODE = '22023';
  END IF;
  IF _unit_price IS NULL OR _unit_price <= 0 THEN
    RAISE EXCEPTION 'VALIDATION: unit price must be positive' USING ERRCODE = '22023';
  END IF;

  -- ── Branch 1: seeded demo offer ────────────────────────────────────────
  SELECT * INTO v_offer FROM public.demo_offers WHERE id = _offer_id AND is_active;
  IF FOUND THEN
    SELECT * INTO v_counterparty
    FROM public.demo_counterparties WHERE id = v_offer.counterparty_id AND is_active;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'NOT_FOUND: counterparty is unavailable' USING ERRCODE = 'P0002';
    END IF;

    IF _amount > v_offer.available_amount THEN
      RAISE EXCEPTION 'VALIDATION: amount exceeds the offer''s available volume'
        USING ERRCODE = '22023';
    END IF;
    IF NOT (_payment_method = ANY (v_offer.payment_methods)) THEN
      RAISE EXCEPTION 'VALIDATION: % is not offered on this listing', _payment_method
        USING ERRCODE = '22023';
    END IF;

    v_total := round(_amount * _unit_price, 2);

    -- Both sides of this comparison are in v_offer.currency, so no FX rate is
    -- involved and none can be supplied by the caller.
    IF v_total < v_offer.min_limit OR v_total > v_offer.max_limit THEN
      RAISE EXCEPTION 'VALIDATION: order value %.2f %s is outside the %.0f - %.0f limit',
        v_total, v_offer.currency, v_offer.min_limit, v_offer.max_limit
        USING ERRCODE = '22023';
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
      CASE WHEN v_offer.side = 'BUY'  THEN v_uid ELSE NULL END,
      CASE WHEN v_offer.side = 'SELL' THEN v_uid ELSE NULL END,
      v_counterparty.id, v_ref, v_offer.side, v_offer.asset, _amount, _unit_price, v_total,
      v_offer.currency, _payment_method, 'pending', 'TRADE_OPEN', true,
      now() + interval '4 hours'
    )
    RETURNING * INTO v_trade;

    PERFORM public.record_trade_event(
      v_trade.id, 'TRADE_CREATED', 'buyer', v_uid,
      jsonb_build_object('trade_ref', v_ref, 'side', v_offer.side, 'asset', v_offer.asset,
                         'amount', _amount, 'unit_price', _unit_price, 'total', v_total,
                         'currency', v_offer.currency)
    );
    PERFORM public.record_trade_event(
      v_trade.id, 'KYC_APPROVED', 'system', NULL,
      jsonb_build_object('note', 'Identity verification already approved for this account')
    );

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
        'amount', _amount, 'total', v_total, 'currency', v_offer.currency,
        'payment_method', _payment_method,
        'counterparty_id', v_counterparty.id,
        'counterparty_name', v_counterparty.display_name)
    );

    RETURN v_trade;
  END IF;

  -- ── Branch 2: user-created sell offer ──────────────────────────────────
  -- FOR UPDATE serialises concurrent takers so remaining_amount cannot be
  -- double-spent by two simultaneous orders.
  SELECT * INTO v_user_offer
  FROM public.offers
  WHERE id::text = _offer_id AND status = 'active' AND type = 'sell'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: offer is unavailable' USING ERRCODE = 'P0002';
  END IF;

  IF v_user_offer.user_id = v_uid THEN
    RAISE EXCEPTION 'VALIDATION: you cannot open a trade against your own offer'
      USING ERRCODE = '22023';
  END IF;
  IF _amount > v_user_offer.remaining_amount THEN
    RAISE EXCEPTION 'VALIDATION: amount exceeds the offer''s available volume'
      USING ERRCODE = '22023';
  END IF;
  -- User offers are fixed-price: the caller must transact at the listed price.
  IF abs(_unit_price - v_user_offer.price) > 0.01 THEN
    RAISE EXCEPTION 'VALIDATION: the listing price has changed - refresh and try again'
      USING ERRCODE = '22023';
  END IF;
  IF NOT (_payment_method = ANY (v_user_offer.payment_methods)) THEN
    RAISE EXCEPTION 'VALIDATION: % is not offered on this listing', _payment_method
      USING ERRCODE = '22023';
  END IF;

  v_total := round(_amount * _unit_price, 2);

  IF v_total < v_user_offer.min_limit OR v_total > v_user_offer.max_limit THEN
    RAISE EXCEPTION 'VALIDATION: order value %.2f %s is outside the %.0f - %.0f limit',
      v_total, v_user_offer.currency, v_user_offer.min_limit, v_user_offer.max_limit
      USING ERRCODE = '22023';
  END IF;

  v_ref := public.next_demo_trade_ref();

  PERFORM set_config('app.privileged', 'on', true);

  -- Two real humans on this trade; no demo counterparty. The caller is the
  -- buyer (user offers are SELL listings), the offer owner is the seller.
  INSERT INTO public.trades (
    offer_id, owner_id,
    buyer_id, seller_id,
    demo_counterparty_id, trade_ref, side, asset, amount, price, total,
    currency, payment_method, status, demo_state, is_demo, expires_at
  )
  VALUES (
    _offer_id, v_uid,
    v_uid, v_user_offer.user_id,
    NULL, v_ref, 'BUY', v_user_offer.asset, _amount, _unit_price, v_total,
    v_user_offer.currency, _payment_method, 'pending', 'TRADE_OPEN', true,
    now() + interval '4 hours'
  )
  RETURNING * INTO v_trade;

  -- Reserve the taken volume on the listing; auto-complete when exhausted.
  UPDATE public.offers
     SET remaining_amount = remaining_amount - _amount,
         locks_count      = locks_count + 1,
         status           = CASE WHEN remaining_amount - _amount <= 0
                                 THEN 'completed'::public.offer_status
                                 ELSE status END
   WHERE id = v_user_offer.id;

  PERFORM public.record_trade_event(
    v_trade.id, 'TRADE_CREATED', 'buyer', v_uid,
    jsonb_build_object('trade_ref', v_ref, 'side', 'BUY', 'asset', v_user_offer.asset,
                       'amount', _amount, 'unit_price', _unit_price, 'total', v_total,
                       'currency', v_user_offer.currency, 'user_offer', true)
  );
  PERFORM public.record_trade_event(
    v_trade.id, 'KYC_APPROVED', 'system', NULL,
    jsonb_build_object('note', 'Identity verification already approved for this account')
  );

  v_trade := public.transition_demo_trade(
    v_trade.id, 'PAYMENT_METHOD_SELECTED', 'buyer', v_uid,
    'PAYMENT_METHOD_SELECTED', jsonb_build_object('payment_method', _payment_method));

  v_trade := public.transition_demo_trade(
    v_trade.id, 'AWAITING_PAYMENT_DETAILS', 'system', NULL,
    'ADMIN_NOTIFIED', jsonb_build_object('payment_method', _payment_method));

  SELECT username INTO v_seller_name
  FROM public.profiles WHERE user_id = v_user_offer.user_id;

  PERFORM public.raise_admin_notification(
    'PAYMENT_DETAILS_REQUIRED',
    format('%s details required — Trade %s', _payment_method, v_ref),
    format('%s wants to buy %s %s from %s via %s (community listing).',
           COALESCE((SELECT username FROM public.profiles WHERE user_id = v_uid), 'A user'),
           _amount::text, v_user_offer.asset,
           COALESCE(v_seller_name, 'a community seller'), _payment_method),
    v_trade.id, v_uid,
    jsonb_build_object(
      'trade_ref', v_ref, 'side', 'BUY', 'asset', v_user_offer.asset,
      'amount', _amount, 'total', v_total, 'currency', v_user_offer.currency,
      'payment_method', _payment_method,
      'user_offer', true,
      'seller_user_id', v_user_offer.user_id,
      'counterparty_name', COALESCE(v_seller_name, 'Community seller'))
  );

  RETURN v_trade;
END;
$$;

REVOKE ALL ON FUNCTION public.open_demo_trade(text, numeric, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.open_demo_trade(text, numeric, numeric, text) TO authenticated;

-- ============================================================================
-- Reservation release on cancellation and expiry
-- ============================================================================
-- Opening a trade against a user listing decrements offers.remaining_amount.
-- If that trade dies without completing, the reserved volume must go back or
-- a buyer could burn a seller's listing by opening and cancelling trades.
--
-- Idempotence: this only ever runs inside the single legal transition into
-- CANCELLED or EXPIRED — transition_demo_trade() raises INVALID_TRANSITION on
-- a repeat, so a reservation can never be restored twice for one trade.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.restore_user_offer_reservation(_trade_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_trade public.trades;
BEGIN
  SELECT * INTO v_trade FROM public.trades WHERE id = _trade_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Only community-listing trades: no demo counterparty, a real seller.
  IF v_trade.demo_counterparty_id IS NOT NULL OR v_trade.seller_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.offers
     SET remaining_amount = remaining_amount + v_trade.amount,
         -- Reactivate a listing that auto-completed when fully reserved.
         -- A listing the seller cancelled themselves stays 'inactive'.
         status = CASE WHEN status = 'completed'
                       THEN 'active'::public.offer_status
                       ELSE status END
   WHERE id::text = v_trade.offer_id
     AND user_id = v_trade.seller_id;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_user_offer_reservation(uuid)
  FROM public, anon, authenticated;

-- cancel_demo_trade(): unchanged except the reservation release after the
-- (state-machine-guarded) transition into CANCELLED succeeds.
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

  -- Return reserved volume to the community listing, if this trade held any.
  PERFORM public.restore_user_offer_reservation(_trade_id);

  IF v_is_admin THEN
    INSERT INTO public.admin_actions (admin_id, action, trade_id, metadata)
    VALUES (v_uid, 'TRADE_CANCELLED', _trade_id, jsonb_build_object('reason', _reason));
  END IF;

  RETURN v_trade;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_demo_trade(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_demo_trade(uuid, text) TO authenticated;

-- expire_overdue_demo_trades(): each trade is now CLAIMED atomically — the
-- UPDATE re-checks the live-state predicate and only a row it actually
-- flipped (RETURNING) gets an event and a reservation release. A trade that
-- was cancelled (or already expired by a concurrent run) between the SELECT
-- and the UPDATE is skipped, so a terminal state is never overwritten and a
-- reservation can never be restored twice.
CREATE OR REPLACE FUNCTION public.expire_overdue_demo_trades()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_trade record;
  v_claimed_id uuid;
  v_count integer := 0;
BEGIN
  FOR v_trade IN
    SELECT id
    FROM public.trades
    WHERE is_demo = true
      AND expires_at IS NOT NULL
      AND expires_at < now()
      AND demo_state NOT IN ('COMPLETED', 'CANCELLED', 'EXPIRED')
  LOOP
    BEGIN
      PERFORM set_config('app.privileged', 'on', true);

      -- Atomic claim: the WHERE re-checks the state so a concurrent
      -- cancellation or a second expiry run cannot double-process this row.
      UPDATE public.trades
      SET demo_state       = 'EXPIRED',
          last_activity_at = now(),
          status           = 'expired'::public.trade_status
      WHERE id = v_trade.id
        AND demo_state NOT IN ('COMPLETED', 'CANCELLED', 'EXPIRED')
      RETURNING id INTO v_claimed_id;

      IF v_claimed_id IS NULL THEN
        CONTINUE; -- Lost the race; another actor already finalised this trade.
      END IF;

      PERFORM public.record_trade_event(
        v_claimed_id,
        'TRADE_EXPIRED',
        'system',
        NULL,
        jsonb_build_object('reason', 'Payment window elapsed (4 hours)')
      );

      -- Return reserved volume to the community listing, if any. Runs only
      -- on the run that won the claim above.
      PERFORM public.restore_user_offer_reservation(v_claimed_id);

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
