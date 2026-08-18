-- Add 4 high-value US sellers (min $10k / max $200k USD per trade).
-- IDs continue from the expansion cap of demo_seller_064.

INSERT INTO public.demo_counterparties (
  id, kind, display_name, rating, completion_rate, trade_count,
  online_status, response_time_label, supported_assets, payment_methods,
  country_code, region, spread_bps, admin_mirror_id, sort_order
) VALUES
  ('demo_seller_065','SELLER','Zeshaan Akbar', 4.9, 98.5, 1740, true,  'Replies in ~2 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 430, 'mirror_065', 650),
  ('demo_seller_066','SELLER','Atul Chug',     4.8, 97.8, 2310, true,  'Replies in ~3 min',  ARRAY['BTC','ETH','USDT'],       ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 450, 'mirror_066', 660),
  ('demo_seller_067','SELLER','Neil Sud',      5.0, 99.2, 3105, true,  'Replies in ~1 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['USA Bank Wire'],               'US','US', 470, 'mirror_067', 670),
  ('demo_seller_068','SELLER','Hope Lary',     4.7, 96.9, 1092, false, 'Replies in ~10 min', ARRAY['BTC','ETH','USDT'],       ARRAY['USA Bank Wire','ACH Transfer'], 'US','US', 490, 'mirror_068', 680)
ON CONFLICT (id) DO UPDATE SET
  display_name          = EXCLUDED.display_name,
  rating                = EXCLUDED.rating,
  completion_rate       = EXCLUDED.completion_rate,
  trade_count           = EXCLUDED.trade_count,
  online_status         = EXCLUDED.online_status,
  response_time_label   = EXCLUDED.response_time_label,
  supported_assets      = EXCLUDED.supported_assets,
  payment_methods       = EXCLUDED.payment_methods,
  country_code          = EXCLUDED.country_code,
  region                = EXCLUDED.region,
  spread_bps            = EXCLUDED.spread_bps,
  admin_mirror_id       = EXCLUDED.admin_mirror_id,
  sort_order            = EXCLUDED.sort_order;

-- Create BUY-side offers (visitors buy crypto from these sellers).
-- min_limit_usd = 10 000, max_limit_usd = 200 000.
INSERT INTO public.demo_offers (
  id, counterparty_id, side, asset,
  available_amount, min_limit_usd, max_limit_usd,
  payment_methods, sort_order
)
SELECT
  'offer_' || lower(c.id) || '_' || lower(a.asset),
  c.id,
  'BUY',
  a.asset,
  a.base_amount,
  10000,
  200000,
  c.payment_methods,
  c.sort_order
FROM public.demo_counterparties c
CROSS JOIN (VALUES
  ('BTC',    20.0),
  ('ETH',   300.0),
  ('SOL',  9000.0),
  ('USDT', 1500000.0)
) AS a(asset, base_amount)
WHERE c.id IN ('demo_seller_065','demo_seller_066','demo_seller_067','demo_seller_068')
  AND a.asset = ANY (c.supported_assets)
ON CONFLICT (id) DO UPDATE SET
  available_amount = EXCLUDED.available_amount,
  min_limit_usd    = EXCLUDED.min_limit_usd,
  max_limit_usd    = EXCLUDED.max_limit_usd,
  payment_methods  = EXCLUDED.payment_methods,
  sort_order       = EXCLUDED.sort_order,
  is_active        = true;
