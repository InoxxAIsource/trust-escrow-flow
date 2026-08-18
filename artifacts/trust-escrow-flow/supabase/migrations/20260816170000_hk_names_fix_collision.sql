-- @apply-all: skip
-- (This migration randomises offer limits on every run; it is a one-time
-- data-seeding step and is therefore NOT safe to include in APPLY_ALL.sql.)
-- ############################################################################
-- ## 20260816170000_hk_names_fix_collision.sql
-- ##
-- ## Fixes the duplicate display_name collision that prevented the previous
-- ## migration from completing. Uses a pre-built list of 24 unique Cantonese
-- ## romanised names (enough for 22 HK counterparties with 2 spare).
-- ############################################################################

-- Drop the unique constraint before rewriting names.
ALTER TABLE public.demo_counterparties
  DROP CONSTRAINT IF EXISTS demo_counterparties_display_name_unique;

DO $$
DECLARE
  -- 24 guaranteed-unique full names.
  v_names text[] := ARRAY[
    'Chan Wing Ki',   'Lee Siu Man',    'Wong Kin Fai',   'Lam Pui Ying',
    'Ng Kwok Hang',   'Cheung Mei Ling','Ho Wai Lun',     'Ma Tsz Kwan',
    'Yip Chun Hong',  'Kwong Siu Wai',  'Tang Yin Fong',  'Chow Ka Shing',
    'Liu Ming Fat',   'Fung Yee Man',   'Tsang Kam Tong', 'Leung Hoi Yin',
    'Mo Chi Keung',   'To Wai Han',     'Siu Lok Ting',   'Poon Tak Wah',
    'Chan Hoi Yan',   'Lee Wai Kit',    'Wong Yuk Ling',  'Lam Chun Wai'
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
       SET display_name = v_names[1 + (vi % 24)]
     WHERE id = r.id;
    vi := vi + 1;
  END LOOP;
END;
$$;

-- Refresh account_name in payment instructions for HK counterparties.
UPDATE public.demo_payment_instructions i
   SET fields = jsonb_set(
         i.fields,
         '{account_name}',
         to_jsonb(c.display_name || ' Demo Trading')
       )
  FROM public.demo_counterparties c
 WHERE c.id = i.counterparty_id
   AND c.region = 'HK'
   AND i.fields ? 'account_name';

-- Restore the uniqueness constraint now all names are distinct.
ALTER TABLE public.demo_counterparties
  ADD CONSTRAINT demo_counterparties_display_name_unique UNIQUE (display_name);

-- ── Randomise offer limits ────────────────────────────────────────────────────
-- Rerun in case the previous migration partially failed before reaching this step.

WITH random_limits AS (
  SELECT id,
    (ARRAY[10,25,50,60,100,150,200,250,350,500,750,1000,1500,2000,3000,5000])
      [1 + (floor(random() * 16))::int] AS raw_min,
    (ARRAY[500,750,1000,2500,5000,8000,10000,11500,15000,20000,25000,30000,35000,40000,48000,50000])
      [1 + (floor(random() * 16))::int] AS raw_max
  FROM public.demo_offers
)
UPDATE public.demo_offers o
   SET min_limit_usd = rl.raw_min,
       max_limit_usd = GREATEST(rl.raw_max, rl.raw_min + 500)
  FROM random_limits rl
 WHERE o.id = rl.id;

UPDATE public.demo_offers o
   SET min_limit = ROUND(o.min_limit_usd * CASE c.currency
                     WHEN 'GBP' THEN 0.79 WHEN 'EUR' THEN 0.92
                     WHEN 'HKD' THEN 7.82 ELSE 1 END),
       max_limit = ROUND(o.max_limit_usd * CASE c.currency
                     WHEN 'GBP' THEN 0.79 WHEN 'EUR' THEN 0.92
                     WHEN 'HKD' THEN 7.82 ELSE 1 END)
  FROM public.demo_counterparties c
 WHERE o.counterparty_id = c.id;
