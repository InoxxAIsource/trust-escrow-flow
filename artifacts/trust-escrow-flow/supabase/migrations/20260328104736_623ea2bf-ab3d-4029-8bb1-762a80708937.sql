
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS kyc_level text NOT NULL DEFAULT 'guest',
  ADD COLUMN IF NOT EXISTS aml_status text NOT NULL DEFAULT 'not_checked',
  ADD COLUMN IF NOT EXISTS is_phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS is_email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS kyc_provider text DEFAULT 'mock',
  ADD COLUMN IF NOT EXISTS is_demo_user boolean NOT NULL DEFAULT false;
