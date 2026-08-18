-- @apply-all: skip
-- (This migration randomises offer limits on every run; it is a one-time
-- data-seeding step and is therefore NOT safe to include in APPLY_ALL.sql.)
-- ############################################################################
-- ## 20260816160000_hk_names_and_random_limits.sql
-- ##
-- ## 1. Replace English names on HK counterparties with Chinese romanized names.
-- ## 2. Randomise offer limits per-offer so each trader shows a unique range.
-- ############################################################################

-- ── 1. HK display names ──────────────────────────────────────────────────────

-- Drop the unique constraint temporarily so we can safely rewrite names
-- without hitting transient collisions mid-loop.
ALTER TABLE public.demo_counterparties
  DROP CONSTRAINT IF EXISTS demo_counterparties_display_name_unique;

DO $$
DECLARE
  -- 20 common Cantonese surnames (romanised)
  v_surnames text[] := ARRAY[
    'Chan','Lee','Wong','Lam','Ng',
    'Cheung','Ho','Ma','Yip','Kwong',
    'Tang','Chow','Liu','Fung','Tsang',
    'Leung','Mo','To','Siu','Poon'
  ];
  -- 20 Cantonese given names (romanised, two-syllable style)
  v_given text[] := ARRAY[
    'Wing Ki','Siu Man','Kin Fai','Pui Ying','Kwok Hang',
    'Mei Ling','Wai Lun','Tsz Kwan','Chun Hong','Siu Wai',
    'Yin Fong','Ka Shing','Ming Fat','Yee Man','Kam Tong',
    'Hoi Yin','Chi Keung','Wai Han','Lok Ting','Tak Wah'
  ];
  r  RECORD;
  vi int := 0;
BEGIN
  FOR r IN
    SELECT id FROM public.demo_counterparties
    WHERE region = 'HK'
    ORDER BY sort_order
  LOOP
    UPDATE public.demo_counterparties
       SET display_name = v_surnames[1 + (vi % 20)]
                       || ' '
                       || v_given[1 + ((vi * 7 + 3) % 20)]
     WHERE id = r.id;
    vi := vi + 1;
  END LOOP;
END;
$$;

-- Refresh the account_name embedded in payment instructions for HK counterparties.
UPDATE public.demo_payment_instructions i
   SET fields = jsonb_set(
         i.fields,
         '{account_name}',
         to_jsonb(c.display_name || ' Demo Trading')
       )
  FROM public.demo_counterparties c
 WHERE c.id  = i.counterparty_id
   AND c.region = 'HK'
   AND i.fields ? 'account_name';

-- Restore the uniqueness guarantee now that all names are distinct.
ALTER TABLE public.demo_counterparties
  ADD CONSTRAINT demo_counterparties_display_name_unique UNIQUE (display_name);

-- ── 2. Randomise offer limits ─────────────────────────────────────────────────
--
-- Each offer gets an independently drawn min and max from curated value sets,
-- producing the kind of natural variation seen on real P2P boards:
--   e.g.  $10 - $500    $60 - $11,500    $1,000 - $50,000    $350 - $35,000
--
-- Min values: $10 … $5,000 (16 realistic breakpoints)
-- Max values: $500 … $50,000 (16 realistic breakpoints)
-- Guarantee: max_limit_usd > min_limit_usd + 500

WITH random_limits AS (
  SELECT
    id,
    ( ARRAY[10,25,50,60,100,150,200,250,350,500,750,1000,1500,2000,3000,5000]
    )[1 + (floor(random() * 16))::int]  AS raw_min,
    ( ARRAY[500,750,1000,2500,5000,8000,10000,11500,15000,20000,25000,30000,35000,40000,48000,50000]
    )[1 + (floor(random() * 16))::int]  AS raw_max
  FROM public.demo_offers
)
UPDATE public.demo_offers o
   SET min_limit_usd = rl.raw_min,
       max_limit_usd = GREATEST(rl.raw_max, rl.raw_min + 500)
  FROM random_limits rl
 WHERE o.id = rl.id;

-- Recompute the local-currency columns from the new USD values.
-- FX rates match the fallback rates used by the front-end (APPROX_FX).
UPDATE public.demo_offers o
   SET min_limit = ROUND(
         o.min_limit_usd * CASE c.currency
           WHEN 'GBP' THEN 0.79
           WHEN 'EUR' THEN 0.92
           WHEN 'HKD' THEN 7.82
           ELSE 1
         END
       ),
       max_limit = ROUND(
         o.max_limit_usd * CASE c.currency
           WHEN 'GBP' THEN 0.79
           WHEN 'EUR' THEN 0.92
           WHEN 'HKD' THEN 7.82
           ELSE 1
         END
       )
  FROM public.demo_counterparties c
 WHERE o.counterparty_id = c.id;
