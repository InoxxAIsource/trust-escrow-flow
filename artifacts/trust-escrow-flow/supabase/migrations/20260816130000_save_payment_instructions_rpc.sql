-- ============================================================================
-- admin_save_payment_instructions: SECURITY DEFINER RPC so the admin can
-- upsert demo_payment_instructions without fighting PostgREST/RLS upsert
-- edge-cases. Only callable by authenticated admins; all others get a 403.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_save_payment_instructions(
  p_counterparty_id text,
  p_method          text,
  p_fields          jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Caller must be an admin.
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'FORBIDDEN: admin access required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.demo_payment_instructions (counterparty_id, method, fields)
  VALUES (p_counterparty_id, p_method, p_fields)
  ON CONFLICT (counterparty_id, method)
  DO UPDATE SET fields = EXCLUDED.fields
  RETURNING to_jsonb(demo_payment_instructions.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- Only authenticated users can even call it (the body re-checks is_admin).
REVOKE ALL ON FUNCTION public.admin_save_payment_instructions(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_payment_instructions(text, text, jsonb) TO authenticated;
