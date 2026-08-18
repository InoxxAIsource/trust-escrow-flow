-- Rename the US-region counterparties to the operator-specified names.
UPDATE public.demo_counterparties SET display_name = 'Ales Perera'     WHERE id = 'demo_seller_001';
UPDATE public.demo_counterparties SET display_name = 'Marco de Silva'   WHERE id = 'demo_seller_002';
UPDATE public.demo_counterparties SET display_name = 'Alen Rajapaksa'   WHERE id = 'demo_seller_003';
UPDATE public.demo_counterparties SET display_name = 'Monteze Morales'  WHERE id = 'demo_seller_004';
UPDATE public.demo_counterparties SET display_name = 'Boris Karloff'    WHERE id = 'demo_seller_005';
UPDATE public.demo_counterparties SET display_name = 'Vivian Derozio'   WHERE id = 'demo_buyer_001';
