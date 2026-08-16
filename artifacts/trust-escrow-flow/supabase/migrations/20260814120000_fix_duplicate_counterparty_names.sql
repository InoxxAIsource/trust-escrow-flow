-- ============================================================================
-- P2PxBT Demo — 09. Fix duplicate counterparty names
-- ============================================================================
-- Bug: seed_demo_roster() reset its row counter to zero at the start of each
-- kind loop, so seller #1 and buyer #1 both drew name pair (5*1 mod 17,
-- 3*1 mod 19) and got the same name. Names were unique *within* each side but
-- collided *across* sides, giving 62 duplicates. A visitor switching from the
-- Buy tab to the Sell tab would see the same person quoting both directions.
--
-- Fix: redraw buyer names from a disjoint window of the same sequence. The
-- name pair repeats with period lcm(17, 19) = 323, so indices 1..64 (sellers)
-- and 162..223 (buyers) fall in the same period without overlapping.
--
-- A UNIQUE constraint is then added so this class of bug fails loudly at
-- insert time rather than silently producing a confusing marketplace.
-- ============================================================================

DO $$
DECLARE
  v_first text[] := ARRAY[
    'James','Sarah','Michael','Emily','Robert','Oliver','Charlotte','Thomas',
    'Sophie','Daniel','Laura','Christopher','Grace','Nathan','Victoria','Adam','Alice'];
  v_last text[] := ARRAY[
    'Whitfield','Bennett','Reeves','Carter','Hayes','Grant','Ellis','Wardle',
    'Lawson','Brooks','Fielding','Vaughn','Hamilton','Mallory','Shaw','Wright',
    'Pierce','Sinclair','Ashford'];
  -- Offset places buyers in a window of the sequence sellers never reach.
  v_offset constant int := 161;
  r RECORD;
  v_idx int;
BEGIN
  FOR r IN
    SELECT id FROM public.demo_counterparties
    WHERE kind = 'BUYER'
    ORDER BY sort_order
  LOOP
    -- sort_order was assigned as idx * 10 by the seeding function.
    v_idx := v_offset + (SELECT sort_order / 10 FROM public.demo_counterparties WHERE id = r.id);

    UPDATE public.demo_counterparties
    SET display_name = v_first[1 + ((v_idx * 5) % 17)] || ' ' || v_last[1 + ((v_idx * 3) % 19)]
    WHERE id = r.id;
  END LOOP;
END
$$;

-- Payment instructions embed the display name, so refresh the account names
-- that were generated from the old duplicates.
UPDATE public.demo_payment_instructions i
SET fields = jsonb_set(
      i.fields,
      '{account_name}',
      to_jsonb(c.display_name || ' Demo Trading')
    )
FROM public.demo_counterparties c
WHERE c.id = i.counterparty_id
  AND i.fields ? 'account_name';

-- Fail loudly next time rather than shipping a confusing marketplace.
ALTER TABLE public.demo_counterparties
  DROP CONSTRAINT IF EXISTS demo_counterparties_display_name_unique;
ALTER TABLE public.demo_counterparties
  ADD CONSTRAINT demo_counterparties_display_name_unique UNIQUE (display_name);
