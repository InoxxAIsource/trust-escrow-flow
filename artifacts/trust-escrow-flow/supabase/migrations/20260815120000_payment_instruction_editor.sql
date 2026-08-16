-- ============================================================================
-- P2PxBT — 13. Editable payment instructions, per-country field sets
-- ============================================================================
-- Three things happen here.
--
-- 1. Field sets become correct per country. A bank record is not one shape
--    with optional bits; each rail identifies an account differently:
--
--      US  wire/ACH   ABA routing number + account number
--      UK  FPS/BT     sort code + 8-digit account number
--      EU  SEPA/BT    IBAN + BIC, and no bare account number at all
--      HK  FPS/BT     3-digit clearing (bank) code + account number
--
--    "Bank Transfer" is quoted by UK, EU and HK counterparties, so it is
--    resolved against the counterparty's region rather than being one fixed
--    shape -- a German seller must not be shown a sort code.
--
-- 2. The stored values stop announcing themselves. "P2PxBT Demo Bank",
--    "<name> Demo Trading" and "DEMO-022" read as placeholder text because
--    they were placeholder text.
--
-- 3. Operators get a supported way to edit them --
--    admin_upsert_payment_instructions() -- instead of the values being
--    reachable only by editing a migration.
--
-- What does not change is which field carries the safety property. Money moves
-- on the ROUTING identifier, never on the account number:
--
--   * routing_number 000000000 -- fails the ABA checksum; no US bank accepts it
--   * sort_code      00-00-00  -- never issued to a UK institution
--   * bank_code      000       -- not an assigned HK clearing code
--   * IBAN check digits 00     -- valid check digits are 02-98, so the mod-97
--                                 test fails for every country
--   * BIC country segment ZZ   -- ISO 3166 user-assigned, never allocated, so
--                                 the BIC cannot resolve in the SWIFT directory
--
-- All five are derived server-side from the counterparty's country and are not
-- parameters of the editor. An operator can change the bank name, the account
-- name, the account number and the bank address -- everything a person reads --
-- and cannot turn the record into one that settles.
-- ============================================================================

-- ── Derivation helpers ─────────────────────────────────────────────────────

-- A BIC-shaped value whose country segment is the unallocated ZZ.
CREATE OR REPLACE FUNCTION public.unroutable_bic(_bank_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT left(upper(regexp_replace(coalesce(_bank_name, 'BANK'), '[^A-Za-z]', '', 'g')) || 'XXXX', 4)
         || 'ZZ00';
$$;

-- An earlier draft of this file took (country, account) and produced a fixed
-- 22-character IBAN for every country. CREATE OR REPLACE cannot change a
-- signature, so that version would linger as an overload if it were ever
-- applied. Dropped explicitly.
DROP FUNCTION IF EXISTS public.unroutable_iban(text, text);

-- An IBAN of the right LENGTH and SHAPE for its country, with check digits 00.
-- Length matters because a German IBAN is 22 characters and a French one is
-- 27; a fixed width would look wrong to anyone who banks there. Check digits
-- 00 fail mod-97 for every country code, so the value cannot be presented to
-- a SEPA scheme however well-formed it looks.
CREATE OR REPLACE FUNCTION public.unroutable_iban(
  _country_code text,
  _bank_name    text,
  _account_number text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cc     text := upper(coalesce(nullif(_country_code, ''), 'DE'));
  v_total  int;
  v_bban   int;
  v_digits text := regexp_replace(coalesce(_account_number, '0'), '\D', '', 'g');
BEGIN
  v_total := CASE v_cc
    WHEN 'BE' THEN 16 WHEN 'NL' THEN 18 WHEN 'FI' THEN 18 WHEN 'DK' THEN 18
    WHEN 'AT' THEN 20 WHEN 'LU' THEN 20 WHEN 'DE' THEN 22 WHEN 'IE' THEN 22
    WHEN 'ES' THEN 24 WHEN 'SE' THEN 24 WHEN 'PT' THEN 25
    WHEN 'FR' THEN 27 WHEN 'IT' THEN 27 WHEN 'GR' THEN 27
    ELSE 22
  END;
  v_bban := v_total - 4;

  -- IE and GB carry a four-letter bank identifier at the head of the BBAN;
  -- everywhere else in this roster the BBAN is numeric.
  IF v_cc IN ('IE', 'GB') THEN
    RETURN v_cc || '00'
      || left(upper(regexp_replace(coalesce(_bank_name, 'BANK'), '[^A-Za-z]', '', 'g')) || 'XXXX', 4)
      || lpad(left(v_digits, v_bban - 4), v_bban - 4, '0');
  END IF;

  RETURN v_cc || '00' || lpad(left(v_digits, v_bban), v_bban, '0');
END;
$$;

-- Which shape a counterparty's rail takes. "Bank Transfer" has no shape of its
-- own -- it inherits the region's domestic rail.
CREATE OR REPLACE FUNCTION public.payment_rail_shape(_method text, _region text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN _method = 'USA Bank Wire'      THEN 'US_WIRE'
    WHEN _method = 'ACH Transfer'       THEN 'US_ACH'
    WHEN _method = 'UK Faster Payments' THEN 'UK'
    WHEN _method = 'SEPA Transfer'      THEN 'EU'
    WHEN _method = 'FPS Transfer'       THEN 'HK'
    WHEN _method = 'Bank Transfer'      THEN
      CASE _region WHEN 'US' THEN 'US_WIRE' WHEN 'UK' THEN 'UK'
                   WHEN 'HK' THEN 'HK' ELSE 'EU' END
    ELSE CASE _region WHEN 'US' THEN 'US_WIRE' WHEN 'UK' THEN 'UK'
                      WHEN 'HK' THEN 'HK' ELSE 'EU' END
  END;
$$;

-- Builds the field object for a shape. Single source of truth: the seed below
-- and the operator editor both call this, so they cannot drift.
CREATE OR REPLACE FUNCTION public.build_payment_fields(
  _shape        text,
  _country_code text,
  _bank_name    text,
  _account_name text,
  _account_no   text,
  _bank_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fields jsonb;
BEGIN
  v_fields := CASE _shape
    WHEN 'US_WIRE' THEN jsonb_build_object(
      'bank_name', _bank_name, 'account_name', _account_name,
      'routing_number', '000000000', 'account_number', _account_no,
      'swift', public.unroutable_bic(_bank_name))
    WHEN 'US_ACH' THEN jsonb_build_object(
      'bank_name', _bank_name, 'account_name', _account_name,
      'routing_number', '000000000', 'account_number', _account_no)
    WHEN 'UK' THEN jsonb_build_object(
      'bank_name', _bank_name, 'account_name', _account_name,
      'sort_code', '00-00-00', 'account_number', _account_no)
    WHEN 'EU' THEN jsonb_build_object(
      'bank_name', _bank_name, 'account_name', _account_name,
      'iban', public.unroutable_iban(_country_code, _bank_name, _account_no),
      'swift', public.unroutable_bic(_bank_name))
    WHEN 'HK' THEN jsonb_build_object(
      'bank_name', _bank_name, 'account_name', _account_name,
      'bank_code', '000', 'account_number', _account_no)
    ELSE jsonb_build_object(
      'bank_name', _bank_name, 'account_name', _account_name,
      'account_number', _account_no)
  END;

  -- Only a US wire quotes a bank address in practice.
  IF _shape = 'US_WIRE' AND nullif(btrim(coalesce(_bank_address, '')), '') IS NOT NULL THEN
    v_fields := v_fields || jsonb_build_object('bank_address', btrim(_bank_address));
  END IF;

  RETURN v_fields;
END;
$$;

-- ── Formatter: teach it the HK bank code ───────────────────────────────────

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
    'bank_name','account_name','routing_number','bank_code','account_number',
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

-- ── Drop both constraints before touching the data ─────────────────────────
-- Order matters in both directions. The existing rows carry DEMOUS00-style
-- BICs and DEMO-prefixed IBANs, which the new constraint rejects; the rows
-- this migration writes carry plain account numbers, which the OLD constraint
-- rejects. So neither can be in force while the values are being restated.
-- The new one goes on afterwards, once every row already satisfies it.

ALTER TABLE public.demo_payment_instructions
  DROP CONSTRAINT IF EXISTS demo_payment_instructions_must_be_fake;

ALTER TABLE public.demo_payment_instructions
  DROP CONSTRAINT IF EXISTS demo_payment_instructions_unroutable;

-- ── Restate the seeded values, per country ─────────────────────────────────

WITH bank AS (
  SELECT
    c.id,
    c.display_name,
    c.country_code,
    c.region,
    CASE c.region
      WHEN 'US' THEN 'Northgate Trust'
      WHEN 'UK' THEN 'Northgate Bank UK'
      WHEN 'EU' THEN 'Northgate Bank Europe'
      WHEN 'HK' THEN 'Northgate Bank Asia'
      ELSE 'Northgate Bank'
    END AS bank_name,
    -- Deterministic per counterparty, so a re-run does not reshuffle every
    -- account number. UK accounts are 8 digits by convention; HK are 9-12.
    lpad((('x' || md5(c.id))::bit(32)::bigint % 100000000)::text, 8, '0') AS acct
  FROM public.demo_counterparties c
)
UPDATE public.demo_payment_instructions pi
SET fields = public.build_payment_fields(
      public.payment_rail_shape(pi.method, b.region),
      b.country_code,
      b.bank_name,
      b.display_name,
      CASE public.payment_rail_shape(pi.method, b.region)
        WHEN 'HK' THEN '0' || b.acct   -- 9 digits, HK convention
        ELSE b.acct
      END,
      '1200 Market Street, Wilmington, DE 19801')
FROM bank b
WHERE b.id = pi.counterparty_id;

-- ── Constraint: guard the routing identifiers, not the account number ──────
-- Added after the restatement above, so it validates against rows that already
-- comply. This is the load-bearing object in the whole migration: it is what
-- makes a stored record structurally incapable of settling, independent of
-- whatever an operator types into the editor.

ALTER TABLE public.demo_payment_instructions
  ADD CONSTRAINT demo_payment_instructions_unroutable CHECK (
    COALESCE(fields->>'routing_number', '000000000') = '000000000'
    AND COALESCE(fields->>'sort_code', '00-00-00') = '00-00-00'
    AND COALESCE(fields->>'bank_code', '000') = '000'
    AND substring(COALESCE(fields->>'swift', 'XXXXZZ00') from 5 for 2) = 'ZZ'
    AND substring(COALESCE(fields->>'iban', 'XX00') from 3 for 2) = '00'
  );

-- ── Operator editor ────────────────────────────────────────────────────────
-- Only the human-readable fields are accepted. The routing identifiers are
-- derived here rather than taken from the caller, so a crafted PostgREST call
-- cannot supply its own — the editor UI is a convenience, not the boundary.

CREATE OR REPLACE FUNCTION public.admin_upsert_payment_instructions(
  _counterparty_id text,
  _method          text,
  _bank_name       text,
  _account_name    text,
  _account_number  text,
  _bank_address    text DEFAULT NULL
)
RETURNS public.demo_payment_instructions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin uuid := public.require_admin();
  v_cp    public.demo_counterparties;
  v_shape text;
  v_bank  text := btrim(coalesce(_bank_name, ''));
  v_name  text := btrim(coalesce(_account_name, ''));
  v_acct  text := btrim(regexp_replace(coalesce(_account_number, ''), '[^A-Za-z0-9 -]', '', 'g'));
  v_addr  text := nullif(btrim(coalesce(_bank_address, '')), '');
  v_row   public.demo_payment_instructions;
BEGIN
  SELECT * INTO v_cp FROM public.demo_counterparties WHERE id = _counterparty_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: no such counterparty' USING ERRCODE = 'P0002';
  END IF;

  IF NOT (_method = ANY (v_cp.payment_methods)) THEN
    RAISE EXCEPTION 'INVALID: % does not quote %', v_cp.display_name, _method
      USING ERRCODE = '22023';
  END IF;

  IF v_bank = '' OR v_name = '' OR v_acct = '' THEN
    RAISE EXCEPTION 'INVALID: bank name, account name and account number are required'
      USING ERRCODE = '22023';
  END IF;

  IF length(v_bank) > 80 OR length(v_name) > 80 OR length(v_acct) > 24
     OR length(coalesce(v_addr, '')) > 160 THEN
    RAISE EXCEPTION 'INVALID: a field exceeds its maximum length' USING ERRCODE = '22023';
  END IF;

  v_shape := public.payment_rail_shape(_method, v_cp.region);

  INSERT INTO public.demo_payment_instructions (counterparty_id, method, fields)
  VALUES (_counterparty_id, _method,
          public.build_payment_fields(v_shape, v_cp.country_code, v_bank, v_name, v_acct, v_addr))
  ON CONFLICT (counterparty_id, method) DO UPDATE SET fields = EXCLUDED.fields
  RETURNING * INTO v_row;

  INSERT INTO public.admin_actions (admin_id, action, metadata)
  VALUES (v_admin, 'PAYMENT_INSTRUCTIONS_UPDATED',
          jsonb_build_object('counterparty_id', _counterparty_id,
                             'method', _method, 'shape', v_shape));

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_payment_instructions(text, text, text, text, text, text)
  FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_payment_instructions(text, text, text, text, text, text)
  TO authenticated;

-- ── Message wording ────────────────────────────────────────────────────────
-- The closing line drops the word "demonstration" and states the operative
-- fact directly: the account cannot receive a transfer. That is the sentence
-- doing the work, and it stays.

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
    'Important: this account cannot receive transfers. Any payment sent to it '
      || 'will not arrive. Do not send money.';

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

  INSERT INTO public.trade_messages (trade_id, sender_id, sender_role, message, metadata)
  VALUES (_trade_id, v_admin, 'system',
          'Payment confirmed and this trade is now complete. '
            || 'No crypto or fiat was transferred.',
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

-- ── Rebuild messages already sent ──────────────────────────────────────────
-- A trade opened before this migration would otherwise keep showing the old
-- placeholder bank record in its chat history.

UPDATE public.trade_messages m
SET message =
      'Your selected payment method is ' || t.payment_method || '.' || E'\n\n' ||
      'Please use the following payment details:' || E'\n\n' ||
      public.format_payment_instructions(pi.fields, t.trade_ref) || E'\n' ||
      'Please quote the payment reference exactly so the transfer can be matched.' || E'\n\n' ||
      'Important: this account cannot receive transfers. Any payment sent to it '
        || 'will not arrive. Do not send money.',
    metadata = m.metadata || jsonb_build_object('fields', pi.fields)
FROM public.trades t
JOIN public.demo_payment_instructions pi
  ON pi.counterparty_id = t.demo_counterparty_id
 AND pi.method = t.payment_method
WHERE m.trade_id = t.id
  AND m.is_payment_details;

UPDATE public.trade_messages
SET message = 'Payment confirmed and this trade is now complete. '
              || 'No crypto or fiat was transferred.'
WHERE metadata->>'kind' = 'COMPLETION_NOTICE';

-- Timeline metadata still carrying the old settlement tag.
UPDATE public.trade_events
SET metadata = metadata - 'settlement'
WHERE metadata ? 'settlement';
