-- ============================================================================
-- P2PxBT Demo — 03. Demo counterparties, offers, payment instructions
-- ============================================================================
-- Market coverage: United States, United Kingdom, Europe.
--
-- Design note: the brief names `demo_sellers` and `demo_buyers`, but the two
-- would be column-for-column identical. They are stored in one
-- `demo_counterparties` table discriminated by `kind`, with views exposing
-- the two names from the brief.
--
-- PRICING. Each counterparty carries its own `spread_bps`, seeded once and
-- stored. For a SELLER it is the premium over the reference mid price
-- (400-600 bps = 4.00%-6.00%); for a BUYER it is the discount under mid
-- (200-400 bps). This is what produces visible price competition between
-- sellers on the same asset.
--
-- The spread is deliberately NOT randomised at read time. A price that
-- re-rolls on every render would make the order ticket disagree with the card
-- the user clicked, invalidate an open trade's agreed price, and make any
-- shared link show something different to the next person. Stored spreads give
-- variation across sellers while staying stable per seller.
--
-- SECURITY: demo_payment_instructions is readable by ADMINS ONLY. This is the
-- linchpin of the operator workflow — a buyer must never be able to pull bank
-- details straight out of the API; they only ever arrive as a chat message an
-- admin chose to send.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'demo_counterparty_kind') THEN
    CREATE TYPE public.demo_counterparty_kind AS ENUM ('SELLER', 'BUYER');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.demo_counterparties (
  id                  text PRIMARY KEY,
  kind                public.demo_counterparty_kind NOT NULL,
  display_name        text NOT NULL,
  avatar_url          text,
  verification_status text NOT NULL DEFAULT 'VERIFIED_DEMO',
  rating              numeric(2,1) NOT NULL DEFAULT 5.0,
  completion_rate     numeric(4,1) NOT NULL DEFAULT 100.0,
  trade_count         integer NOT NULL DEFAULT 0,
  online_status       boolean NOT NULL DEFAULT true,
  response_time_label text NOT NULL DEFAULT 'Replies in ~2 min',
  supported_assets    text[] NOT NULL DEFAULT ARRAY['BTC','ETH','SOL','USDT'],
  payment_methods     text[] NOT NULL DEFAULT ARRAY['USA Bank Wire'],
  country_code        text NOT NULL DEFAULT 'US',
  region              text NOT NULL DEFAULT 'US',
  -- SELLER: premium over mid. BUYER: discount under mid. Basis points.
  spread_bps          integer NOT NULL DEFAULT 500,
  -- Operator identity that fronts this simulated counterparty.
  admin_mirror_id     text NOT NULL,
  admin_mirror_label  text NOT NULL DEFAULT 'P2PxBT Operator',
  sort_order          integer NOT NULL DEFAULT 0,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Idempotent add for databases where an earlier revision of this file ran.
ALTER TABLE public.demo_counterparties
  ADD COLUMN IF NOT EXISTS region     text NOT NULL DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS spread_bps integer NOT NULL DEFAULT 500;

ALTER TABLE public.demo_counterparties
  DROP CONSTRAINT IF EXISTS demo_counterparties_spread_sane;
ALTER TABLE public.demo_counterparties
  ADD CONSTRAINT demo_counterparties_spread_sane
  CHECK (spread_bps BETWEEN 100 AND 800);

ALTER TABLE public.demo_counterparties ENABLE ROW LEVEL SECURITY;

-- The marketplace is browsable signed-out, so this is intentionally public.
-- Nothing sensitive lives here; payment details are a separate table.
DROP POLICY IF EXISTS "Demo counterparties are public" ON public.demo_counterparties;
CREATE POLICY "Demo counterparties are public"
  ON public.demo_counterparties FOR SELECT
  USING (is_active);

CREATE OR REPLACE VIEW public.demo_sellers AS
  SELECT * FROM public.demo_counterparties WHERE kind = 'SELLER';

CREATE OR REPLACE VIEW public.demo_buyers AS
  SELECT * FROM public.demo_counterparties WHERE kind = 'BUYER';

-- ── Offers ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.demo_offers (
  id               text PRIMARY KEY,
  counterparty_id  text NOT NULL REFERENCES public.demo_counterparties(id) ON DELETE CASCADE,
  -- 'BUY'  = the visitor buys crypto  (counterparty is a SELLER)
  -- 'SELL' = the visitor sells crypto (counterparty is a BUYER)
  side             text NOT NULL CHECK (side IN ('BUY', 'SELL')),
  asset            text NOT NULL CHECK (asset IN ('BTC', 'ETH', 'SOL', 'USDT')),
  available_amount numeric NOT NULL,
  min_limit_usd    numeric NOT NULL DEFAULT 100,
  max_limit_usd    numeric NOT NULL DEFAULT 50000,
  payment_methods  text[] NOT NULL,
  sort_order       integer NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_offers_lookup_idx
  ON public.demo_offers (side, asset, is_active, sort_order);

ALTER TABLE public.demo_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Demo offers are public" ON public.demo_offers;
CREATE POLICY "Demo offers are public"
  ON public.demo_offers FOR SELECT
  USING (is_active);

-- ── Payment instructions (ADMIN ONLY) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.demo_payment_instructions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counterparty_id text NOT NULL REFERENCES public.demo_counterparties(id) ON DELETE CASCADE,
  method          text NOT NULL,
  fields          jsonb NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (counterparty_id, method)
);

ALTER TABLE public.demo_payment_instructions ENABLE ROW LEVEL SECURITY;

-- Deliberately the ONLY policy on this table. A buyer cannot read it.
DROP POLICY IF EXISTS "Payment instructions are admin-only" ON public.demo_payment_instructions;
CREATE POLICY "Payment instructions are admin-only"
  ON public.demo_payment_instructions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- A structural guarantee that nobody ever pastes live banking data in here.
ALTER TABLE public.demo_payment_instructions
  DROP CONSTRAINT IF EXISTS demo_payment_instructions_must_be_fake;
ALTER TABLE public.demo_payment_instructions
  ADD CONSTRAINT demo_payment_instructions_must_be_fake CHECK (
    COALESCE(fields->>'routing_number', '000000000') = '000000000'
    AND COALESCE(fields->>'swift', 'DEMOUS00') LIKE 'DEMO%'
    AND COALESCE(fields->>'account_number', 'DEMO-') LIKE 'DEMO-%'
    AND COALESCE(fields->>'iban', 'DEMO') LIKE 'DEMO%'
    AND COALESCE(fields->>'sort_code', '00-00-00') = '00-00-00'
  );

-- ── Seed ───────────────────────────────────────────────────────────────────
-- Reseeded from scratch so re-running produces exactly this roster.
-- Offers cascade from the delete; trades keep their row and null the FK.

DELETE FROM public.demo_counterparties
WHERE id LIKE 'demo_seller_%' OR id LIKE 'demo_buyer_%';

-- 12 sellers. spread_bps 400-600 => a 4.00%-6.00% premium over mid, so the
-- same asset shows a spread of competing prices across the seller list.
INSERT INTO public.demo_counterparties
  (id, kind, display_name, rating, completion_rate, trade_count, online_status,
   response_time_label, supported_assets, payment_methods, country_code, region,
   spread_bps, admin_mirror_id, sort_order)
VALUES
  ('demo_seller_001','SELLER','James Whitfield',   4.9, 98.7, 1284, true,  'Replies in ~2 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['USA Bank Wire','ACH Transfer'],      'US','US',412,'mirror_001',10),
  ('demo_seller_002','SELLER','Sarah Bennett',     4.8, 97.2,  962, true,  'Replies in ~4 min',  ARRAY['BTC','ETH','USDT'],       ARRAY['USA Bank Wire','ACH Transfer'],      'US','US',455,'mirror_002',20),
  ('demo_seller_003','SELLER','Michael Reeves',    5.0, 99.4, 2107, true,  'Replies in ~1 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['USA Bank Wire','ACH Transfer'],      'US','US',503,'mirror_003',30),
  ('demo_seller_004','SELLER','Emily Carter',      4.7, 96.1,  548, true,  'Replies in ~6 min',  ARRAY['BTC','SOL','USDT'],       ARRAY['USA Bank Wire','ACH Transfer'],      'US','US',548,'mirror_004',40),
  ('demo_seller_005','SELLER','Robert Hayes',      4.9, 98.2, 1633, false, 'Replies in ~15 min', ARRAY['BTC','ETH','USDT'],       ARRAY['USA Bank Wire'],                     'US','US',587,'mirror_005',50),
  ('demo_seller_006','SELLER','Oliver Grant',      4.8, 97.9, 1122, true,  'Replies in ~3 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['UK Faster Payments','Bank Transfer'],'GB','UK',428,'mirror_006',60),
  ('demo_seller_007','SELLER','Charlotte Ellis',   5.0, 99.1, 1876, true,  'Replies in ~2 min',  ARRAY['BTC','ETH','USDT'],       ARRAY['UK Faster Payments','Bank Transfer'],'GB','UK',471,'mirror_007',70),
  ('demo_seller_008','SELLER','Thomas Wardle',     4.6, 95.4,  407, true,  'Replies in ~8 min',  ARRAY['BTC','SOL','USDT'],       ARRAY['UK Faster Payments'],                'GB','UK',536,'mirror_008',80),
  ('demo_seller_009','SELLER','Sophie Lawson',     4.9, 98.8, 1450, true,  'Replies in ~3 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['SEPA Transfer','Bank Transfer'],     'DE','EU',443,'mirror_009',90),
  ('demo_seller_010','SELLER','Daniel Brooks',     4.7, 96.8,  791, true,  'Replies in ~5 min',  ARRAY['BTC','ETH','USDT'],       ARRAY['SEPA Transfer','Bank Transfer'],     'NL','EU',492,'mirror_010',100),
  ('demo_seller_011','SELLER','Laura Fielding',    5.0, 99.6, 2340, true,  'Replies in ~1 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['SEPA Transfer','Bank Transfer'],     'IE','EU',517,'mirror_011',110),
  ('demo_seller_012','SELLER','Christopher Vaughn',4.8, 97.5,  1015,false, 'Replies in ~12 min', ARRAY['BTC','ETH','USDT'],       ARRAY['SEPA Transfer'],                     'FR','EU',564,'mirror_012',120);

-- 11 buyers. spread_bps 200-400 => a 2.00%-4.00% discount under mid.
INSERT INTO public.demo_counterparties
  (id, kind, display_name, rating, completion_rate, trade_count, online_status,
   response_time_label, supported_assets, payment_methods, country_code, region,
   spread_bps, admin_mirror_id, sort_order)
VALUES
  ('demo_buyer_001','BUYER','Jordan Blake',     4.9, 98.9, 1533, true,  'Replies in ~2 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['USA Bank Wire','ACH Transfer'],      'US','US',215,'mirror_101',10),
  ('demo_buyer_002','BUYER','Marcus Reed',      5.0, 99.1, 1902, true,  'Replies in ~1 min',  ARRAY['BTC','ETH','USDT'],       ARRAY['USA Bank Wire'],                     'US','US',248,'mirror_102',20),
  ('demo_buyer_003','BUYER','Rachel Turner',    4.8, 97.6,  874, true,  'Replies in ~4 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['USA Bank Wire','ACH Transfer'],      'US','US',276,'mirror_103',30),
  ('demo_buyer_004','BUYER','Adam Foster',      4.7, 95.8,  611, false, 'Replies in ~20 min', ARRAY['BTC','SOL','USDT'],       ARRAY['USA Bank Wire'],                     'US','US',309,'mirror_104',40),
  ('demo_buyer_005','BUYER','Grace Hamilton',   4.9, 98.4, 1288, true,  'Replies in ~3 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['UK Faster Payments','Bank Transfer'],'GB','UK',233,'mirror_105',50),
  ('demo_buyer_006','BUYER','Peter Mallory',    4.6, 96.2,  495, true,  'Replies in ~7 min',  ARRAY['BTC','ETH','USDT'],       ARRAY['UK Faster Payments'],                'GB','UK',287,'mirror_106',60),
  ('demo_buyer_007','BUYER','Victoria Shaw',    5.0, 99.3, 2044, true,  'Replies in ~1 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['UK Faster Payments','Bank Transfer'],'GB','UK',324,'mirror_107',70),
  ('demo_buyer_008','BUYER','Ethan Wright',     4.8, 97.1, 1067, true,  'Replies in ~5 min',  ARRAY['BTC','ETH','USDT'],       ARRAY['SEPA Transfer','Bank Transfer'],     'DE','EU',261,'mirror_108',80),
  ('demo_buyer_009','BUYER','Olivia Grant',     4.9, 98.6, 1391, true,  'Replies in ~2 min',  ARRAY['BTC','ETH','SOL','USDT'], ARRAY['SEPA Transfer','Bank Transfer'],     'ES','EU',298,'mirror_109',90),
  ('demo_buyer_010','BUYER','Samuel Pierce',    4.7, 96.5,  723, true,  'Replies in ~6 min',  ARRAY['BTC','SOL','USDT'],       ARRAY['SEPA Transfer'],                     'IT','EU',342,'mirror_110',100),
  ('demo_buyer_011','BUYER','Nathan Cole',      4.8, 97.8, 1156, false, 'Replies in ~18 min', ARRAY['BTC','ETH','USDT'],       ARRAY['SEPA Transfer','Bank Transfer'],     'NL','EU',377,'mirror_111',110);

-- ── Seed: offers ───────────────────────────────────────────────────────────
-- Generated by crossing each counterparty with the assets it supports, so
-- every seller is listed on every asset they trade and no combination is
-- missed. Volumes vary deterministically by sort_order rather than randomly.

INSERT INTO public.demo_offers
  (id, counterparty_id, side, asset, available_amount, min_limit_usd, max_limit_usd,
   payment_methods, sort_order)
SELECT
  'offer_' || lower(c.id) || '_' || lower(a.asset),
  c.id,
  CASE WHEN c.kind = 'SELLER' THEN 'BUY' ELSE 'SELL' END,
  a.asset,
  -- Deterministic spread of inventory: 60%-160% of the asset's base volume.
  round((a.base_amount * (0.6 + ((c.sort_order % 6) * 0.2)))::numeric, 4),
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
  max_limit_usd    = EXCLUDED.max_limit_usd,
  sort_order       = EXCLUDED.sort_order,
  is_active        = true;

-- ── Seed: simulated payment instructions ───────────────────────────────────
-- Generated per counterparty per supported method. Every value is
-- non-routable: routing numbers all zero, SWIFT codes reserved DEMO* strings,
-- account numbers DEMO- prefixed, IBANs DEMO prefixed, sort codes 00-00-00.
-- The CHECK constraint above enforces this structurally.

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
