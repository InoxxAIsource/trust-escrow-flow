-- ============================================================================
-- P2PxBT Demo — 08. Regional roster expansion
-- ============================================================================
-- Market coverage becomes United States, United Kingdom, Europe and Hong Kong.
-- India is removed entirely, along with its payment rails (UPI/IFSC).
--
-- Roster size per side:
--   US 21 · UK 13 · EU 19 · HK 11   =  64 sellers
--   US 20 · UK 13 · EU 18 · HK 11   =  62 buyers
--
-- Rows are generated rather than hand-written, but every value is DERIVED,
-- not random: names come from two coprime-length arrays indexed by row number,
-- and spreads/volumes from modular arithmetic on the same index. Re-running
-- this migration reproduces the identical roster, which is what keeps trade
-- links and screenshots stable.
-- ============================================================================

-- Hong Kong joins the region set.
ALTER TABLE public.demo_counterparties
  DROP CONSTRAINT IF EXISTS demo_counterparties_region_supported;
ALTER TABLE public.demo_counterparties
  ADD CONSTRAINT demo_counterparties_region_supported
  CHECK (region IN ('US', 'UK', 'EU', 'HK'));

-- Clear the previous roster. demo_offers and demo_payment_instructions cascade;
-- trades keep their row and null the counterparty FK.
DELETE FROM public.demo_counterparties
WHERE id LIKE 'demo_seller_%' OR id LIKE 'demo_buyer_%';

-- ── Generated roster ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.seed_demo_roster()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  -- 17 and 19 are coprime with the multipliers below, so the 64 name pairs
  -- drawn for each side are all distinct.
  v_first text[] := ARRAY[
    'James','Sarah','Michael','Emily','Robert','Oliver','Charlotte','Thomas',
    'Sophie','Daniel','Laura','Christopher','Grace','Nathan','Victoria','Adam','Alice'];
  v_last text[] := ARRAY[
    'Whitfield','Bennett','Reeves','Carter','Hayes','Grant','Ellis','Wardle',
    'Lawson','Brooks','Fielding','Vaughn','Hamilton','Mallory','Shaw','Wright',
    'Pierce','Sinclair','Ashford'];

  v_regions text[]  := ARRAY['US','UK','EU','HK'];
  v_seller_counts int[] := ARRAY[21, 13, 19, 11];
  v_buyer_counts  int[] := ARRAY[20, 13, 18, 11];

  v_kind text;
  v_counts int[];
  v_prefix text;
  v_region text;
  v_country text;
  v_methods text[];
  v_idx int;
  -- Name index is offset for buyers. The name pair repeats with period
  -- lcm(17, 19) = 323, so sellers drawing 1..64 and buyers drawing 162..223
  -- sit in the same period without overlapping. Without this both sides start
  -- at 1 and every buyer shares a name with a seller.
  v_name_idx int;
  v_r int;
  v_c int;
  v_spread int;
BEGIN
  FOREACH v_kind IN ARRAY ARRAY['SELLER','BUYER'] LOOP
    v_counts := CASE WHEN v_kind = 'SELLER' THEN v_seller_counts ELSE v_buyer_counts END;
    v_prefix := CASE WHEN v_kind = 'SELLER' THEN 'demo_seller_' ELSE 'demo_buyer_' END;
    v_idx := 0;

    FOR v_r IN 1 .. array_length(v_regions, 1) LOOP
      v_region := v_regions[v_r];

      FOR v_c IN 1 .. v_counts[v_r] LOOP
        v_idx := v_idx + 1;
        v_name_idx := CASE WHEN v_kind = 'SELLER' THEN v_idx ELSE v_idx + 161 END;

        -- Sellers quote a 4.00%-6.00% premium, buyers a 2.00%-4.00% discount.
        v_spread := CASE WHEN v_kind = 'SELLER'
                         THEN 400 + ((v_idx * 37) % 201)
                         ELSE 200 + ((v_idx * 41) % 201) END;

        SELECT
          CASE v_region
            WHEN 'US' THEN 'US'
            WHEN 'UK' THEN 'GB'
            WHEN 'HK' THEN 'HK'
            ELSE (ARRAY['DE','FR','NL','IE','ES','IT'])[1 + (v_idx % 6)]
          END,
          CASE v_region
            WHEN 'US' THEN ARRAY['USA Bank Wire','ACH Transfer']
            WHEN 'UK' THEN ARRAY['UK Faster Payments','Bank Transfer']
            WHEN 'HK' THEN ARRAY['FPS Transfer','Bank Transfer']
            ELSE ARRAY['SEPA Transfer','Bank Transfer']
          END
        INTO v_country, v_methods;

        INSERT INTO public.demo_counterparties (
          id, kind, display_name, rating, completion_rate, trade_count,
          online_status, response_time_label, supported_assets, payment_methods,
          country_code, region, spread_bps, admin_mirror_id, sort_order
        ) VALUES (
          v_prefix || lpad(v_idx::text, 3, '0'),
          v_kind::public.demo_counterparty_kind,
          v_first[1 + ((v_name_idx * 5) % 17)] || ' ' || v_last[1 + ((v_name_idx * 3) % 19)],
          -- 4.6 - 5.0, weighted high like a curated marketplace.
          4.6 + ((v_idx * 7) % 5) * 0.1,
          95.0 + ((v_idx * 11) % 50) * 0.1,
          320 + ((v_idx * 137) % 2100),
          -- Roughly four in five online at any time.
          (v_idx % 5) <> 0,
          (ARRAY['Replies in ~1 min','Replies in ~2 min','Replies in ~3 min',
                 'Replies in ~5 min','Replies in ~8 min','Replies in ~15 min'])[1 + (v_idx % 6)],
          -- Every counterparty trades at least BTC and USDT.
          CASE WHEN v_idx % 3 = 0 THEN ARRAY['BTC','ETH','SOL','USDT']
               WHEN v_idx % 3 = 1 THEN ARRAY['BTC','ETH','USDT']
               ELSE ARRAY['BTC','SOL','USDT'] END,
          v_methods,
          v_country,
          v_region,
          v_spread,
          'mirror_' || CASE WHEN v_kind = 'SELLER' THEN 's' ELSE 'b' END || lpad(v_idx::text, 3, '0'),
          v_idx * 10
        );
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

SELECT public.seed_demo_roster();
DROP FUNCTION public.seed_demo_roster();

-- ── Offers ─────────────────────────────────────────────────────────────────

INSERT INTO public.demo_offers
  (id, counterparty_id, side, asset, available_amount, min_limit_usd, max_limit_usd,
   payment_methods, sort_order)
SELECT
  'offer_' || lower(c.id) || '_' || lower(a.asset),
  c.id,
  CASE WHEN c.kind = 'SELLER' THEN 'BUY' ELSE 'SELL' END,
  a.asset,
  round((a.base_amount * (0.6 + ((c.sort_order / 10) % 6) * 0.2))::numeric, 4),
  100,
  a.max_limit,
  c.payment_methods,
  c.sort_order
FROM public.demo_counterparties c
CROSS JOIN (VALUES
  ('BTC',       4.0,   120000),
  ('ETH',      60.0,    80000),
  ('SOL',    1800.0,    50000),
  ('USDT', 300000.0,   100000)
) AS a(asset, base_amount, max_limit)
WHERE c.is_active
  AND a.asset = ANY (c.supported_assets)
ON CONFLICT (id) DO UPDATE SET
  counterparty_id  = EXCLUDED.counterparty_id,
  available_amount = EXCLUDED.available_amount,
  payment_methods  = EXCLUDED.payment_methods,
  sort_order       = EXCLUDED.sort_order,
  is_active        = true;

-- ── Payment instructions ───────────────────────────────────────────────────
-- Every value is non-routable and enforced by the CHECK on the table.

INSERT INTO public.demo_payment_instructions (counterparty_id, method, fields)
SELECT
  c.id,
  m.method,
  CASE m.method
    WHEN 'USA Bank Wire' THEN jsonb_build_object(
      'bank_name','P2PxBT Demo Bank',
      'account_name', c.display_name || ' Demo Trading',
      'routing_number','000000000',
      'account_number','DEMO-' || upper(right(c.id, 3)),
      'swift','DEMOUS00',
      'bank_address','1 Simulation Way, Demo City, DC 00000')
    WHEN 'ACH Transfer' THEN jsonb_build_object(
      'bank_name','P2PxBT Demo Bank',
      'account_name', c.display_name || ' Demo Trading',
      'routing_number','000000000',
      'account_number','DEMO-' || upper(right(c.id, 3)))
    WHEN 'UK Faster Payments' THEN jsonb_build_object(
      'bank_name','P2PxBT Demo Bank UK',
      'account_name', c.display_name || ' Demo Trading',
      'sort_code','00-00-00',
      'account_number','DEMO-' || upper(right(c.id, 3)),
      'swift','DEMOGB00')
    WHEN 'SEPA Transfer' THEN jsonb_build_object(
      'bank_name','P2PxBT Demo Bank EU',
      'account_name', c.display_name || ' Demo Trading',
      'iban','DEMO00000000000000' || upper(right(c.id, 3)),
      'swift','DEMOEU00')
    WHEN 'FPS Transfer' THEN jsonb_build_object(
      'bank_name','P2PxBT Demo Bank HK',
      'account_name', c.display_name || ' Demo Trading',
      'account_number','DEMO-' || upper(right(c.id, 3)),
      'swift','DEMOHK00')
    ELSE jsonb_build_object(
      'bank_name','P2PxBT Demo Bank',
      'account_name', c.display_name || ' Demo Trading',
      'account_number','DEMO-' || upper(right(c.id, 3)),
      'sort_code','00-00-00')
  END
FROM public.demo_counterparties c
CROSS JOIN LATERAL unnest(c.payment_methods) AS m(method)
WHERE c.is_active
ON CONFLICT (counterparty_id, method) DO UPDATE SET fields = EXCLUDED.fields;
