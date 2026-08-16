-- ============================================================================
-- P2PxBT — 12. Drop DEMO from the trade reference
-- ============================================================================
-- References were minted as P2PXBT-DEMO-8291. The token appears in the trade
-- header, the breadcrumb, the order summary and, most visibly, in the payment
-- reference a buyer is asked to quote on a transfer. It now reads P2PXBT-8291.
--
-- Existing references are rewritten so a trade opened before this migration
-- does not display differently from one opened after. The uniqueness index on
-- trade_ref still holds: the transform strips a constant substring from every
-- value, so no two distinct references can collide.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.next_demo_trade_ref()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public, pg_temp
AS $$
  SELECT 'P2PXBT-' || lpad(nextval('public.demo_trade_ref_seq')::text, 4, '0');
$$;

-- Rewrite references already issued.
UPDATE public.trades
SET trade_ref = replace(trade_ref, 'P2PXBT-DEMO-', 'P2PXBT-')
WHERE trade_ref LIKE 'P2PXBT-DEMO-%';

-- The reference is also embedded in the payment-details chat message and in
-- the metadata the timeline and operator console read back.
UPDATE public.trade_messages
SET message = replace(message, 'P2PXBT-DEMO-', 'P2PXBT-')
WHERE message LIKE '%P2PXBT-DEMO-%';

UPDATE public.trade_messages
SET metadata = jsonb_set(metadata, '{reference}',
      to_jsonb(replace(metadata->>'reference', 'P2PXBT-DEMO-', 'P2PXBT-')))
WHERE metadata->>'reference' LIKE 'P2PXBT-DEMO-%';

UPDATE public.trade_events
SET metadata = jsonb_set(metadata, '{trade_ref}',
      to_jsonb(replace(metadata->>'trade_ref', 'P2PXBT-DEMO-', 'P2PXBT-')))
WHERE metadata->>'trade_ref' LIKE 'P2PXBT-DEMO-%';

UPDATE public.admin_notifications
SET title   = replace(title, 'P2PXBT-DEMO-', 'P2PXBT-'),
    body    = replace(body, 'P2PXBT-DEMO-', 'P2PXBT-'),
    payload = CASE
                WHEN payload->>'trade_ref' LIKE 'P2PXBT-DEMO-%'
                THEN jsonb_set(payload, '{trade_ref}',
                       to_jsonb(replace(payload->>'trade_ref', 'P2PXBT-DEMO-', 'P2PXBT-')))
                ELSE payload
              END
WHERE title LIKE '%P2PXBT-DEMO-%'
   OR body LIKE '%P2PXBT-DEMO-%'
   OR payload->>'trade_ref' LIKE 'P2PXBT-DEMO-%';

UPDATE public.admin_actions
SET metadata = jsonb_set(metadata, '{trade_ref}',
      to_jsonb(replace(metadata->>'trade_ref', 'P2PXBT-DEMO-', 'P2PXBT-')))
WHERE metadata->>'trade_ref' LIKE 'P2PXBT-DEMO-%';
