-- ============================================================================
-- P2PxBT Demo — 10. Local-currency pricing
-- ============================================================================
-- Counterparties now quote in their own market's currency:
--
--   US -> USD    UK -> GBP    EU -> EUR    HK -> HKD
--
-- Design note on where FX lives. The obvious implementation is to keep limits
-- in USD and have the client send a conversion rate when opening a trade, but
-- a client-supplied rate is a limit-bypass primitive: send a bogus rate and a
-- huge order passes the min/max check. Instead the limits are stored in the
-- SAME currency the trade is denominated in, so open_demo_trade() compares
-- like with like and never needs an FX rate at all.
--
-- Live crypto prices are still fetched per-currency from the price feed on the
-- client. Only the limit thresholds are stored, and those are slow-moving
-- figures rather than quotes.
-- ============================================================================

ALTER TABLE public.demo_counterparties
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';

ALTER TABLE public.demo_counterparties
  DROP CONSTRAINT IF EXISTS demo_counterparties_currency_supported;
ALTER TABLE public.demo_counterparties
  ADD CONSTRAINT demo_counterparties_currency_supported
  CHECK (currency IN ('USD', 'GBP', 'EUR', 'HKD'));

UPDATE public.demo_counterparties
SET currency = CASE region
                 WHEN 'US' THEN 'USD'
                 WHEN 'UK' THEN 'GBP'
                 WHEN 'EU' THEN 'EUR'
                 WHEN 'HK' THEN 'HKD'
                 ELSE 'USD'
               END;

-- ── Limits move into local currency ────────────────────────────────────────

ALTER TABLE public.demo_offers
  ADD COLUMN IF NOT EXISTS currency  text,
  ADD COLUMN IF NOT EXISTS min_limit numeric,
  ADD COLUMN IF NOT EXISTS max_limit numeric;

-- Indicative conversion, used once to derive limit thresholds. These are not
-- quotes: they set the size band a counterparty will trade in, so a slow-
-- moving approximation is appropriate and does not drift into pricing.
UPDATE public.demo_offers o
SET currency  = c.currency,
    min_limit = round((o.min_limit_usd * CASE c.currency
                                            WHEN 'GBP' THEN 0.79
                                            WHEN 'EUR' THEN 0.92
                                            WHEN 'HKD' THEN 7.82
                                            ELSE 1 END)::numeric, -1),
    max_limit = round((o.max_limit_usd * CASE c.currency
                                            WHEN 'GBP' THEN 0.79
                                            WHEN 'EUR' THEN 0.92
                                            WHEN 'HKD' THEN 7.82
                                            ELSE 1 END)::numeric, -2)
FROM public.demo_counterparties c
WHERE c.id = o.counterparty_id;

ALTER TABLE public.demo_offers ALTER COLUMN currency  SET NOT NULL;
ALTER TABLE public.demo_offers ALTER COLUMN min_limit SET NOT NULL;
ALTER TABLE public.demo_offers ALTER COLUMN max_limit SET NOT NULL;

ALTER TABLE public.demo_offers
  DROP CONSTRAINT IF EXISTS demo_offers_limits_ordered;
ALTER TABLE public.demo_offers
  ADD CONSTRAINT demo_offers_limits_ordered CHECK (min_limit > 0 AND max_limit > min_limit);

-- ── open_demo_trade validates in the offer's own currency ──────────────────

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
    now() + interval '3 hours'
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
END;
$$;

REVOKE ALL ON FUNCTION public.open_demo_trade(text, numeric, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.open_demo_trade(text, numeric, numeric, text) TO authenticated;
