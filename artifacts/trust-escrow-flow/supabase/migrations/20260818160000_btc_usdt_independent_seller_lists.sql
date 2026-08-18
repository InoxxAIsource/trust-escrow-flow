-- ============================================================================
-- P2PxBT Demo — BTC / USDT independent seller lists
-- ============================================================================
-- BTC sellers: demo_seller_001–021, demo_seller_065
--   → Renamed to the 22 names supplied by the operator.
--   → BTC offer limits updated to operator-provided figures.
--   → USDT offers deleted so they vanish from the USDT marketplace.
--
-- USDT sellers: demo_seller_069–090 (brand-new rows)
--   → Completely different trader names (no overlap with BTC list).
--   → Independently randomised limits following the required distribution.
--   → USDT offers + payment instructions created for each.
--
-- NOTE FOR OPERATOR
-- -----------------
-- This file is committed to GitHub but does NOT auto-apply to Supabase.
-- Paste the entire contents into the Supabase SQL Editor and click Run.
-- ============================================================================


-- ============================================================================
-- SECTION 1  BTC sellers — rename, limit update, USDT offer removal
-- ============================================================================

-- ── 1a. Rename ───────────────────────────────────────────────────────────────
UPDATE public.demo_counterparties SET display_name = 'Michael Carter'   WHERE id = 'demo_seller_001';
UPDATE public.demo_counterparties SET display_name = 'Daniel Kim'        WHERE id = 'demo_seller_002';
UPDATE public.demo_counterparties SET display_name = 'Ryan Cooper'       WHERE id = 'demo_seller_003';
UPDATE public.demo_counterparties SET display_name = 'Marcus Thompson'   WHERE id = 'demo_seller_004';
UPDATE public.demo_counterparties SET display_name = 'Kevin Nguyen'      WHERE id = 'demo_seller_005';
UPDATE public.demo_counterparties SET display_name = 'Jason Mitchell'    WHERE id = 'demo_seller_006';
UPDATE public.demo_counterparties SET display_name = 'Ethan Reynolds'    WHERE id = 'demo_seller_007';
UPDATE public.demo_counterparties SET display_name = 'Andrew Chen'       WHERE id = 'demo_seller_008';
UPDATE public.demo_counterparties SET display_name = 'Brandon Parker'    WHERE id = 'demo_seller_009';
UPDATE public.demo_counterparties SET display_name = 'Christopher Hayes' WHERE id = 'demo_seller_010';
UPDATE public.demo_counterparties SET display_name = 'Kenji Tanaka'      WHERE id = 'demo_seller_011';
UPDATE public.demo_counterparties SET display_name = 'Tyler Morgan'      WHERE id = 'demo_seller_012';
UPDATE public.demo_counterparties SET display_name = 'Matthew Foster'    WHERE id = 'demo_seller_013';
UPDATE public.demo_counterparties SET display_name = 'Jonathan Reed'     WHERE id = 'demo_seller_014';
UPDATE public.demo_counterparties SET display_name = 'Arjun Patel'       WHERE id = 'demo_seller_015';
UPDATE public.demo_counterparties SET display_name = 'Justin Wallace'    WHERE id = 'demo_seller_016';
UPDATE public.demo_counterparties SET display_name = 'Nathan Collins'    WHERE id = 'demo_seller_017';
UPDATE public.demo_counterparties SET display_name = 'Alexander Grant'   WHERE id = 'demo_seller_018';
UPDATE public.demo_counterparties SET display_name = 'Daniel Brooks'     WHERE id = 'demo_seller_019';
UPDATE public.demo_counterparties SET display_name = 'Benjamin Wright'   WHERE id = 'demo_seller_020';
UPDATE public.demo_counterparties SET display_name = 'Jason Martinez'    WHERE id = 'demo_seller_021';
UPDATE public.demo_counterparties SET display_name = 'Ryan Sullivan'     WHERE id = 'demo_seller_065';

-- ── 1b. Remove USDT from supported_assets (keeps BTC/ETH/SOL intact) ─────────
UPDATE public.demo_counterparties
SET supported_assets = array_remove(supported_assets, 'USDT')
WHERE id IN (
  'demo_seller_001','demo_seller_002','demo_seller_003','demo_seller_004',
  'demo_seller_005','demo_seller_006','demo_seller_007','demo_seller_008',
  'demo_seller_009','demo_seller_010','demo_seller_011','demo_seller_012',
  'demo_seller_013','demo_seller_014','demo_seller_015','demo_seller_016',
  'demo_seller_017','demo_seller_018','demo_seller_019','demo_seller_020',
  'demo_seller_021','demo_seller_065'
);

-- ── 1c. Delete USDT offers so these sellers disappear from the USDT tab ───────
DELETE FROM public.demo_offers
WHERE counterparty_id IN (
  'demo_seller_001','demo_seller_002','demo_seller_003','demo_seller_004',
  'demo_seller_005','demo_seller_006','demo_seller_007','demo_seller_008',
  'demo_seller_009','demo_seller_010','demo_seller_011','demo_seller_012',
  'demo_seller_013','demo_seller_014','demo_seller_015','demo_seller_016',
  'demo_seller_017','demo_seller_018','demo_seller_019','demo_seller_020',
  'demo_seller_021','demo_seller_065'
) AND asset = 'USDT';

-- ── 1d. Update BTC offer limits (operator-provided figures) ───────────────────
-- Rows already exist; we patch only min/max.
-- Michael Carter   max=$500 (min=max: fixed-amount offer)
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =     500 WHERE counterparty_id = 'demo_seller_001' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  47325  WHERE counterparty_id = 'demo_seller_002' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd = 128750  WHERE counterparty_id = 'demo_seller_003' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  53680  WHERE counterparty_id = 'demo_seller_004' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  18450  WHERE counterparty_id = 'demo_seller_005' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  72915  WHERE counterparty_id = 'demo_seller_006' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  44280  WHERE counterparty_id = 'demo_seller_007' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =   9275  WHERE counterparty_id = 'demo_seller_008' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  57460  WHERE counterparty_id = 'demo_seller_009' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =   3180  WHERE counterparty_id = 'demo_seller_010' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  49835  WHERE counterparty_id = 'demo_seller_011' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  83640  WHERE counterparty_id = 'demo_seller_012' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  52190  WHERE counterparty_id = 'demo_seller_013' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  24680  WHERE counterparty_id = 'demo_seller_014' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd = 141350  WHERE counterparty_id = 'demo_seller_015' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  38275  WHERE counterparty_id = 'demo_seller_016' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  55740  WHERE counterparty_id = 'demo_seller_017' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  68520  WHERE counterparty_id = 'demo_seller_018' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  46915  WHERE counterparty_id = 'demo_seller_019' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  51380  WHERE counterparty_id = 'demo_seller_020' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =  34560  WHERE counterparty_id = 'demo_seller_021' AND asset = 'BTC';
UPDATE public.demo_offers SET min_limit_usd =   500, max_limit_usd =   2475  WHERE counterparty_id = 'demo_seller_065' AND asset = 'BTC';

-- Also update payment instructions to reflect the new display names.
UPDATE public.demo_payment_instructions pi
SET fields = jsonb_set(
      jsonb_set(pi.fields, '{account_name}', to_jsonb(c.display_name || ' Demo Trading')),
      '{account_name}', to_jsonb(c.display_name || ' Demo Trading'))
FROM public.demo_counterparties c
WHERE pi.counterparty_id = c.id
  AND c.id IN (
    'demo_seller_001','demo_seller_002','demo_seller_003','demo_seller_004',
    'demo_seller_005','demo_seller_006','demo_seller_007','demo_seller_008',
    'demo_seller_009','demo_seller_010','demo_seller_011','demo_seller_012',
    'demo_seller_013','demo_seller_014','demo_seller_015','demo_seller_016',
    'demo_seller_017','demo_seller_018','demo_seller_019','demo_seller_020',
    'demo_seller_021','demo_seller_065'
  );


-- ============================================================================
-- SECTION 2  New USDT-only sellers (demo_seller_069 – demo_seller_090)
-- ============================================================================
-- Names: 22 unique US male names, ~18 % Asian, no overlap with BTC list.
-- Limits (max_limit_usd): independently generated per the required distribution.
--   Distribution (22 sellers):
--     $500–$10 k   : 3 sellers (~14 %)   [incl. exactly $500]
--     $10 k–$40 k  : 5 sellers (~23 %)
--     $40 k–$60 k  : 8 sellers (~36 %)
--     $60 k–$100 k : 4 sellers (~18 %)
--     >$100 k      : 2 sellers ( ~9 %)
-- ============================================================================

-- ── 2a. Counterparties ────────────────────────────────────────────────────────
INSERT INTO public.demo_counterparties (
  id, kind, display_name,
  rating, completion_rate, trade_count,
  online_status, response_time_label,
  supported_assets, payment_methods,
  country_code, region, spread_bps,
  admin_mirror_id, sort_order
) VALUES
  -- $500–$10 k range
  ('demo_seller_070','SELLER','Robert Johnson',    4.7, 96.3,  583, true,  'Replies in ~5 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 521, 'mirror_070', 700),
  ('demo_seller_076','SELLER','Richard Torres',    4.8, 97.1,  812, true,  'Replies in ~3 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 468, 'mirror_076', 760),
  ('demo_seller_081','SELLER','Donald Miller',     4.6, 95.7,  347, false, 'Replies in ~12 min', ARRAY['USDT'], ARRAY['USA Bank Wire'],               'US','US', 577, 'mirror_081', 810),
  -- $10 k–$40 k range
  ('demo_seller_069','SELLER','James Anderson',    4.9, 98.4, 1247, true,  'Replies in ~2 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 437, 'mirror_069', 690),
  ('demo_seller_079','SELLER','Paul Robinson',     4.8, 97.6,  934, true,  'Replies in ~4 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 493, 'mirror_079', 790),
  ('demo_seller_083','SELLER','Mark Lee',          4.7, 96.8,  671, true,  'Replies in ~5 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 549, 'mirror_083', 830),
  ('demo_seller_086','SELLER','Brian Adams',       4.9, 98.1, 1089, true,  'Replies in ~2 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 415, 'mirror_086', 860),
  ('demo_seller_089','SELLER','Victor Hughes',     4.8, 97.3,  758, false, 'Replies in ~8 min',  ARRAY['USDT'], ARRAY['USA Bank Wire'],               'US','US', 537, 'mirror_089', 890),
  -- $40 k–$60 k range
  ('demo_seller_071','SELLER','David Chen',        5.0, 99.2, 2184, true,  'Replies in ~1 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 412, 'mirror_071', 710),
  ('demo_seller_073','SELLER','Charles Rivera',    4.9, 98.6, 1521, true,  'Replies in ~2 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 448, 'mirror_073', 730),
  ('demo_seller_075','SELLER','Wei Zhang',         5.0, 99.5, 2673, true,  'Replies in ~1 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 426, 'mirror_075', 750),
  ('demo_seller_077','SELLER','Steven Jackson',    4.8, 97.9, 1063, true,  'Replies in ~3 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 461, 'mirror_077', 770),
  ('demo_seller_080','SELLER','Edward Garcia',     4.7, 96.5,  894, true,  'Replies in ~5 min',  ARRAY['USDT'], ARRAY['USA Bank Wire'],               'US','US', 514, 'mirror_080', 800),
  ('demo_seller_084','SELLER','Frank Walker',      4.9, 98.3, 1372, true,  'Replies in ~2 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 443, 'mirror_084', 840),
  ('demo_seller_087','SELLER','Larry Evans',       4.8, 97.7,  968, true,  'Replies in ~3 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 479, 'mirror_087', 870),
  ('demo_seller_090','SELLER','Kevin Lim',         5.0, 99.0, 1845, true,  'Replies in ~1 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 431, 'mirror_090', 900),
  -- $60 k–$100 k range
  ('demo_seller_072','SELLER','William Harris',    4.9, 98.8, 1634, true,  'Replies in ~2 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 418, 'mirror_072', 720),
  ('demo_seller_078','SELLER','Kenneth White',     4.8, 97.4, 1108, true,  'Replies in ~3 min',  ARRAY['USDT'], ARRAY['USA Bank Wire'],               'US','US', 502, 'mirror_078', 780),
  ('demo_seller_082','SELLER','George Davis',      4.9, 98.7, 1489, true,  'Replies in ~2 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 456, 'mirror_082', 820),
  ('demo_seller_088','SELLER','Raymond Scott',     4.7, 96.9,  742, true,  'Replies in ~6 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 528, 'mirror_088', 880),
  -- >$100 k range
  ('demo_seller_074','SELLER','Thomas Wilson',     5.0, 99.3, 2918, true,  'Replies in ~1 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 407, 'mirror_074', 740),
  ('demo_seller_085','SELLER','Hiroshi Yamamoto',  4.9, 98.9, 2251, true,  'Replies in ~2 min',  ARRAY['USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 423, 'mirror_085', 850)
ON CONFLICT (id) DO UPDATE SET
  display_name        = EXCLUDED.display_name,
  rating              = EXCLUDED.rating,
  completion_rate     = EXCLUDED.completion_rate,
  trade_count         = EXCLUDED.trade_count,
  online_status       = EXCLUDED.online_status,
  response_time_label = EXCLUDED.response_time_label,
  supported_assets    = EXCLUDED.supported_assets,
  payment_methods     = EXCLUDED.payment_methods,
  country_code        = EXCLUDED.country_code,
  region              = EXCLUDED.region,
  spread_bps          = EXCLUDED.spread_bps,
  admin_mirror_id     = EXCLUDED.admin_mirror_id,
  sort_order          = EXCLUDED.sort_order;

-- ── 2b. USDT offers ───────────────────────────────────────────────────────────
-- One row per seller. available_amount scales loosely with max_limit.
-- min_limit_usd = 500 for all; max_limit_usd = independently set values.
INSERT INTO public.demo_offers (
  id, counterparty_id, side, asset,
  available_amount, min_limit_usd, max_limit_usd,
  payment_methods, sort_order
) VALUES
  -- $500–$10 k range (3 sellers, incl. exactly $500)
  ('offer_demo_seller_070_usdt', 'demo_seller_070', 'BUY', 'USDT',   25000,  500,    500, ARRAY['USA Bank Wire','ACH Transfer'], 700),
  ('offer_demo_seller_076_usdt', 'demo_seller_076', 'BUY', 'USDT',   40000,  500,   9180, ARRAY['USA Bank Wire','ACH Transfer'], 760),
  ('offer_demo_seller_081_usdt', 'demo_seller_081', 'BUY', 'USDT',   18000,  500,   1850, ARRAY['USA Bank Wire'],               810),
  -- $10 k–$40 k range (5 sellers)
  ('offer_demo_seller_069_usdt', 'demo_seller_069', 'BUY', 'USDT',  120000,  500,  32680, ARRAY['USA Bank Wire','ACH Transfer'], 690),
  ('offer_demo_seller_079_usdt', 'demo_seller_079', 'BUY', 'USDT',   80000,  500,  15760, ARRAY['USA Bank Wire','ACH Transfer'], 790),
  ('offer_demo_seller_083_usdt', 'demo_seller_083', 'BUY', 'USDT',  100000,  500,  37125, ARRAY['USA Bank Wire','ACH Transfer'], 830),
  ('offer_demo_seller_086_usdt', 'demo_seller_086', 'BUY', 'USDT',   95000,  500,  26840, ARRAY['USA Bank Wire','ACH Transfer'], 860),
  ('offer_demo_seller_089_usdt', 'demo_seller_089', 'BUY', 'USDT',   75000,  500,  28340, ARRAY['USA Bank Wire'],               890),
  -- $40 k–$60 k range (8 sellers)
  ('offer_demo_seller_071_usdt', 'demo_seller_071', 'BUY', 'USDT',  200000,  500,  54215, ARRAY['USA Bank Wire','ACH Transfer'], 710),
  ('offer_demo_seller_073_usdt', 'demo_seller_073', 'BUY', 'USDT',  160000,  500,  46320, ARRAY['USA Bank Wire','ACH Transfer'], 730),
  ('offer_demo_seller_075_usdt', 'demo_seller_075', 'BUY', 'USDT',  240000,  500,  58915, ARRAY['USA Bank Wire','ACH Transfer'], 750),
  ('offer_demo_seller_077_usdt', 'demo_seller_077', 'BUY', 'USDT',  175000,  500,  41380, ARRAY['USA Bank Wire','ACH Transfer'], 770),
  ('offer_demo_seller_080_usdt', 'demo_seller_080', 'BUY', 'USDT',  145000,  500,  52830, ARRAY['USA Bank Wire'],               800),
  ('offer_demo_seller_084_usdt', 'demo_seller_084', 'BUY', 'USDT',  190000,  500,  43660, ARRAY['USA Bank Wire','ACH Transfer'], 840),
  ('offer_demo_seller_087_usdt', 'demo_seller_087', 'BUY', 'USDT',  210000,  500,  59740, ARRAY['USA Bank Wire','ACH Transfer'], 870),
  ('offer_demo_seller_090_usdt', 'demo_seller_090', 'BUY', 'USDT',  180000,  500,  46190, ARRAY['USA Bank Wire','ACH Transfer'], 900),
  -- $60 k–$100 k range (4 sellers)
  ('offer_demo_seller_072_usdt', 'demo_seller_072', 'BUY', 'USDT',  320000,  500,  78940, ARRAY['USA Bank Wire','ACH Transfer'], 720),
  ('offer_demo_seller_078_usdt', 'demo_seller_078', 'BUY', 'USDT',  280000,  500,  67240, ARRAY['USA Bank Wire'],               780),
  ('offer_demo_seller_082_usdt', 'demo_seller_082', 'BUY', 'USDT',  360000,  500,  88490, ARRAY['USA Bank Wire','ACH Transfer'], 820),
  ('offer_demo_seller_088_usdt', 'demo_seller_088', 'BUY', 'USDT',  260000,  500,  72560, ARRAY['USA Bank Wire','ACH Transfer'], 880),
  -- >$100 k range (2 sellers)
  ('offer_demo_seller_074_usdt', 'demo_seller_074', 'BUY', 'USDT',  600000,  500, 112750, ARRAY['USA Bank Wire','ACH Transfer'], 740),
  ('offer_demo_seller_085_usdt', 'demo_seller_085', 'BUY', 'USDT',  750000,  500, 131480, ARRAY['USA Bank Wire','ACH Transfer'], 850)
ON CONFLICT (id) DO UPDATE SET
  available_amount = EXCLUDED.available_amount,
  min_limit_usd    = EXCLUDED.min_limit_usd,
  max_limit_usd    = EXCLUDED.max_limit_usd,
  payment_methods  = EXCLUDED.payment_methods,
  sort_order       = EXCLUDED.sort_order,
  is_active        = true;

-- ── 2c. Payment instructions ──────────────────────────────────────────────────
-- All values are non-routable per the CHECK constraint on the table:
--   routing_number = '000000000', swift LIKE 'DEMO%',
--   account_number LIKE 'DEMO-%', sort_code = '00-00-00'
INSERT INTO public.demo_payment_instructions (counterparty_id, method, fields)
SELECT
  c.id,
  m.method,
  CASE m.method
    WHEN 'USA Bank Wire' THEN jsonb_build_object(
      'bank_name',      'P2PxBT Demo Bank',
      'account_name',   c.display_name || ' Demo Trading',
      'routing_number', '000000000',
      'account_number', 'DEMO-' || upper(right(c.id, 3)),
      'swift',          'DEMOUS00',
      'bank_address',   '1 Simulation Way, Demo City, DC 00000')
    WHEN 'ACH Transfer' THEN jsonb_build_object(
      'bank_name',      'P2PxBT Demo Bank',
      'account_name',   c.display_name || ' Demo Trading',
      'routing_number', '000000000',
      'account_number', 'DEMO-' || upper(right(c.id, 3)))
    ELSE jsonb_build_object(
      'bank_name',      'P2PxBT Demo Bank',
      'account_name',   c.display_name || ' Demo Trading',
      'account_number', 'DEMO-' || upper(right(c.id, 3)),
      'sort_code',      '00-00-00')
  END
FROM public.demo_counterparties c
CROSS JOIN LATERAL unnest(c.payment_methods) AS m(method)
WHERE c.id IN (
  'demo_seller_069','demo_seller_070','demo_seller_071','demo_seller_072',
  'demo_seller_073','demo_seller_074','demo_seller_075','demo_seller_076',
  'demo_seller_077','demo_seller_078','demo_seller_079','demo_seller_080',
  'demo_seller_081','demo_seller_082','demo_seller_083','demo_seller_084',
  'demo_seller_085','demo_seller_086','demo_seller_087','demo_seller_088',
  'demo_seller_089','demo_seller_090'
)
ON CONFLICT (counterparty_id, method) DO UPDATE SET fields = EXCLUDED.fields;


-- ============================================================================
-- VALIDATION QUERIES (run after the above to confirm correctness)
-- ============================================================================

-- 1. BTC sellers: confirm 22 rows, no USDT offers
-- SELECT c.display_name, o.asset, o.min_limit_usd, o.max_limit_usd
-- FROM demo_offers o JOIN demo_counterparties c ON c.id = o.counterparty_id
-- WHERE c.region = 'US' AND c.kind = 'SELLER'
--   AND c.id IN ('demo_seller_001','demo_seller_002','demo_seller_003','demo_seller_004',
--                'demo_seller_005','demo_seller_006','demo_seller_007','demo_seller_008',
--                'demo_seller_009','demo_seller_010','demo_seller_011','demo_seller_012',
--                'demo_seller_013','demo_seller_014','demo_seller_015','demo_seller_016',
--                'demo_seller_017','demo_seller_018','demo_seller_019','demo_seller_020',
--                'demo_seller_021','demo_seller_065')
-- ORDER BY c.sort_order, o.asset;

-- 2. USDT sellers: confirm 22 new rows, USDT only
-- SELECT c.display_name, o.min_limit_usd, o.max_limit_usd
-- FROM demo_offers o JOIN demo_counterparties c ON c.id = o.counterparty_id
-- WHERE c.id LIKE 'demo_seller_0[789]%' OR c.id IN ('demo_seller_090')
-- ORDER BY o.max_limit_usd;

-- 3. No name overlap between BTC and USDT sellers
-- SELECT btc.display_name
-- FROM demo_counterparties btc
-- JOIN demo_counterparties usdt ON btc.display_name = usdt.display_name
-- WHERE btc.id IN ('demo_seller_001','demo_seller_002','demo_seller_003','demo_seller_004',
--                  'demo_seller_005','demo_seller_006','demo_seller_007','demo_seller_008',
--                  'demo_seller_009','demo_seller_010','demo_seller_011','demo_seller_012',
--                  'demo_seller_013','demo_seller_014','demo_seller_015','demo_seller_016',
--                  'demo_seller_017','demo_seller_018','demo_seller_019','demo_seller_020',
--                  'demo_seller_021','demo_seller_065')
--   AND usdt.id IN ('demo_seller_069','demo_seller_070','demo_seller_071','demo_seller_072',
--                   'demo_seller_073','demo_seller_074','demo_seller_075','demo_seller_076',
--                   'demo_seller_077','demo_seller_078','demo_seller_079','demo_seller_080',
--                   'demo_seller_081','demo_seller_082','demo_seller_083','demo_seller_084',
--                   'demo_seller_085','demo_seller_086','demo_seller_087','demo_seller_088',
--                   'demo_seller_089','demo_seller_090');
-- Expected: 0 rows (no overlapping names)
