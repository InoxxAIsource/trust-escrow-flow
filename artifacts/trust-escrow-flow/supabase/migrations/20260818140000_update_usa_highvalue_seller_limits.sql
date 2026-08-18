-- Correct names and per-seller trade limits for the 4 high-value US sellers.

UPDATE public.demo_counterparties SET display_name = 'Zeshaan Ahmed' WHERE id = 'demo_seller_065';
UPDATE public.demo_counterparties SET display_name = 'Hope Larry'    WHERE id = 'demo_seller_068';

-- Update min/max limits on every offer belonging to these 4 sellers.
UPDATE public.demo_offers SET min_limit_usd = 10000, max_limit_usd =  85000 WHERE counterparty_id = 'demo_seller_065';
UPDATE public.demo_offers SET min_limit_usd =  5000, max_limit_usd =  65000 WHERE counterparty_id = 'demo_seller_066';
UPDATE public.demo_offers SET min_limit_usd =  1000, max_limit_usd = 100000 WHERE counterparty_id = 'demo_seller_067';
UPDATE public.demo_offers SET min_limit_usd =  2000, max_limit_usd =  76000 WHERE counterparty_id = 'demo_seller_068';
