
-- Add expires_at to trades
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Extend trade_status enum with 'locked' and 'expired'
ALTER TYPE public.trade_status ADD VALUE IF NOT EXISTS 'locked';
ALTER TYPE public.trade_status ADD VALUE IF NOT EXISTS 'expired';

-- Create trade_messages table
CREATE TABLE public.trade_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on trade_messages
ALTER TABLE public.trade_messages ENABLE ROW LEVEL SECURITY;

-- RLS: participants can read messages for their trades
CREATE POLICY "Trade participants can read messages"
  ON public.trade_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trades t
      WHERE t.id = trade_messages.trade_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

-- RLS: participants can send messages
CREATE POLICY "Trade participants can send messages"
  ON public.trade_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.trades t
      WHERE t.id = trade_messages.trade_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

-- Enable realtime on trade_messages and trades
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
