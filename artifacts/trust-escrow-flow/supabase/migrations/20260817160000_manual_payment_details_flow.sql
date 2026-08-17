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
