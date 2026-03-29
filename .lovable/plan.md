

# Progressive Verification Card + Access Control

## What Gets Built

1. **Dashboard Verification Card** — A prominent card at the top of the dashboard showing verification progress (0–100%), checklist of steps, and a dynamic CTA button that adapts to the user's current level.
2. **Verification Gate Dialog** — A reusable alert dialog that blocks restricted actions (sell offers, high-value trades) and prompts the appropriate verification step.
3. **Access control enforcement** in BuyModal, SellModal, and SellToOfferModal.

## Files to Modify

### 1. New: `src/components/VerificationProgressCard.tsx`
A self-contained card component that:
- Computes progress: 25% per step (email, phone, ID, AML)
- Shows a `<Progress>` bar with percentage
- Renders a 4-item checklist with check/X icons
- Displays a state-dependent heading and subtext:
  - Guest: "Complete your account setup" / CTA "Verify Now"
  - Basic: "Unlock higher trading limits" / CTA "Verify Identity" / "Increase limits up to ₹5,00,000"
  - Verified: "Enable high-value trading" / CTA "Complete Advanced Verification" / "Required for trades above ₹1,00,000"
  - Trusted: "You are fully verified" / Trusted Trader badge, no CTA
- CTA navigates to `/verify`
- Only renders if user is not fully trusted

### 2. New: `src/components/VerificationGateDialog.tsx`
An `AlertDialog` component accepting:
- `open`, `onClose`, `requiredLevel` (basic/verified/trusted), `action` description
- Shows what verification is needed and a "Verify Now" button → `/verify`
- Used by trade modals to block restricted actions

### 3. Edit: `src/pages/Dashboard.tsx`
- Import and render `<VerificationProgressCard>` between the demo banner and the welcome header section
- Remove the existing inline verify button from the welcome section (replaced by the card)

### 4. Edit: `src/components/marketplace/BuyModal.tsx`
- Import `computeKycLevel`, `getTradeLimits` from `use-auth`, and `VerificationGateDialog`
- Before locking trade: check if `numAmount > tradeLimits.max` → show gate dialog
- Check if user is guest → show gate dialog requiring basic

### 5. Edit: `src/components/marketplace/SellModal.tsx`
- Before creating offer: check if `kycLevel < "verified"` → show gate dialog
- Block sell offer creation for basic/guest users

### 6. Edit: `src/components/marketplace/SellToOfferModal.tsx`
- Same trade limit checks as BuyModal

## Technical Notes
- Uses existing `computeKycLevel()` and `getTradeLimits()` from `use-auth.tsx`
- Uses existing `<Progress>` component for the progress bar
- No database changes needed — all data already exists on the `profiles` table

