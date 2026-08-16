-- ============================================================================
-- Allow admins to INSERT and UPDATE demo_payment_instructions,
-- and drop the fake-data constraint that blocked real-looking test data.
-- ============================================================================

-- Write policies (previously only SELECT existed)
DROP POLICY IF EXISTS "Admins can insert payment instructions" ON public.demo_payment_instructions;
CREATE POLICY "Admins can insert payment instructions"
  ON public.demo_payment_instructions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update payment instructions" ON public.demo_payment_instructions;
CREATE POLICY "Admins can update payment instructions"
  ON public.demo_payment_instructions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Drop the constraint that blocked non-DEMO placeholder values.
-- Admins need to be able to store real-looking bank details for their sellers.
ALTER TABLE public.demo_payment_instructions
  DROP CONSTRAINT IF EXISTS demo_payment_instructions_must_be_fake;
