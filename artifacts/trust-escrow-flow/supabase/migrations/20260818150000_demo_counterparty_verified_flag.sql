-- Add an is_verified flag to demo_counterparties.
-- Defaults true so the existing roster stays verified; we explicitly
-- mark the two lowest-volume sellers as unverified.

ALTER TABLE public.demo_counterparties
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT true;

-- Pick the two sellers with the fewest trades (demo_seller_004 = 548 trades,
-- demo_seller_008 = 407 trades) as unverified low-limit sellers.
UPDATE public.demo_counterparties SET is_verified = false
  WHERE id IN ('demo_seller_004', 'demo_seller_008');
