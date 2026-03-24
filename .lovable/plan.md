

# Demo/Mock KYC Verification System

Add a mock identity verification flow to TrustP2P that displays verification badges and a simulated KYC process without any real document processing.

---

## What Gets Built

1. **Verification Status on Profiles** — Add a `kyc_status` field to the `profiles` table (`unverified`, `pending`, `verified`) with a default of `unverified`.

2. **KYC Verification Page** (`/verify`) — A multi-step mock flow:
   - Step 1: Enter full name + date of birth
   - Step 2: Select ID type (passport, driver's license, national ID) — no actual upload
   - Step 3: Fake "processing" spinner (2-3 seconds), then auto-approve
   - Updates `kyc_status` to `verified` and `is_verified` to `true` on the profile

3. **Verification Badge UI** — Show a verified/unverified badge on:
   - Dashboard header (with "Get Verified" CTA if unverified)
   - UserProfile page
   - Offer cards in marketplace (small shield icon)
   - Trade page (counterparty info)

4. **Seeded Offer Updates** — ~70% of seeded offers already show `isVerified: true`; no change needed there.

---

## Technical Details

- **Migration**: `ALTER TABLE profiles ADD COLUMN kyc_status text NOT NULL DEFAULT 'unverified';` (reuse existing `is_verified` boolean, keep both in sync)
- **New page**: `src/pages/Verify.tsx` with route `/verify`
- **New component**: `src/components/VerificationBadge.tsx` — reusable badge showing verified/pending/unverified state
- **Profile update**: On mock completion, update both `kyc_status = 'verified'` and `is_verified = true` via Supabase
- **Auth guard**: `/verify` page requires authentication

