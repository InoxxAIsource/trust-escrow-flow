-- ############################################################################
-- ## 20260816180000_kyc_income_and_terms.sql
-- ##
-- ## Adds phone, annual_income, and income_source columns to kyc_submissions
-- ## so the expanded personal-details form is fully persisted.
-- ## All three are nullable so existing submissions are unaffected.
-- ############################################################################

ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS phone          text,
  ADD COLUMN IF NOT EXISTS annual_income  text,
  ADD COLUMN IF NOT EXISTS income_source  text;
