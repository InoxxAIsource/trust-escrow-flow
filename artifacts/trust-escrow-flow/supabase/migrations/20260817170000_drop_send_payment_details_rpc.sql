-- ============================================================================
-- Drop the stored-instructions payment-details RPC. Operators now type bank
-- details directly into the trade chat; the privileged RPC that posted stored
-- demo_payment_instructions (and exposed them to any admin caller) is retired.
-- ============================================================================

DROP FUNCTION IF EXISTS public.admin_send_payment_details(uuid);
