
-- Drop the FK constraint on trades.offer_id so seeded offer IDs work
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_offer_id_fkey;

-- Change offer_id from uuid to text to accept seeded IDs like "seed-xxx"
ALTER TABLE public.trades ALTER COLUMN offer_id TYPE text USING offer_id::text;

-- Update INSERT RLS to allow either buyer or seller to create trades
DROP POLICY IF EXISTS "Authenticated users can create trades" ON public.trades;
CREATE POLICY "Authenticated users can create trades"
ON public.trades FOR INSERT
TO public
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
