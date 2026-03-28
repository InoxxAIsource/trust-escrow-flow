

# Real-Time Risk Engine for P2P Marketplace

Build a client-side risk scoring system that dynamically evaluates user behavior, displays trust scores, and enforces trade restrictions based on risk level.

---

## What Gets Built

1. **Two new database tables**: `risk_profiles` (per-user score + level) and `risk_events` (individual risk event log)
2. **Risk scoring hook** (`use-risk.ts`): computes and updates risk scores based on trade history, KYC status, disputes, and behavioral signals
3. **Trust Score UI**: visible trust badge on user profiles, marketplace cards, and trade pages
4. **Automated restrictions**: trade size limits and warnings based on risk level
5. **Admin Risk Dashboard** (`/admin/risk`): view high-risk users, recent events, and take actions

---

## Database

### Table: `risk_profiles`
| Column | Type | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| user_id | uuid | NOT NULL, UNIQUE |
| risk_score | integer | 50 |
| risk_level | text | 'medium' |
| last_updated | timestamptz | now() |

RLS: Users can read their own; admin function updates via security definer.

### Table: `risk_events`
| Column | Type | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| user_id | uuid | NOT NULL |
| event_type | text | NOT NULL |
| severity | text | 'low' |
| score_impact | integer | 0 |
| details | jsonb | '{}' |
| created_at | timestamptz | now() |

RLS: Users can read their own events.

### Database function: `recalculate_risk_score(p_user_id uuid)`
A security definer function that:
- Starts at base score 50
- Queries `risk_events` to sum positive impacts
- Queries `profiles` for KYC/AML status adjustments
- Queries `trades` for completion rate adjustments
- Updates `risk_profiles` with new score and derived level
- Returns the new score

---

## Risk Scoring Logic

**Increases (bad signals):**
- Rapid trades (3+ in 5 min): +10
- Cancel after payment: +20
- Frequent disputes (3+ in 7 days): +30
- No KYC: +10
- KYC rejected: +40
- AML flagged: +70
- New account + large trade: +20

**Decreases (trust signals):**
- Each successful trade: -5
- KYC verified: -15
- AML cleared: -20
- High completion rate (>95%): -10

**Levels:** <20 LOW, <50 MEDIUM, <75 HIGH, ≥75 CRITICAL

---

## New Files

### `src/hooks/use-risk.ts`
- `useRiskProfile(userId)`: fetches risk_profiles row
- `useRiskEvents(userId)`: fetches recent risk_events
- `useRecordRiskEvent()`: mutation to insert risk_event + call recalculate
- `getRiskLevel(score)` and `getTrustScore(riskScore)` utilities

### `src/pages/AdminRisk.tsx`
- Protected page showing all high/critical risk users
- Recent risk events table
- Actions: force KYC, reduce limits (updates profile fields)

### `src/components/TrustScoreBadge.tsx`
- Compact badge showing trust score (100 - risk_score)
- Color-coded: green (low risk), yellow (medium), red (high), black (critical)

---

## Integration Points

1. **Trade creation** (BuyModal, SellToOfferModal): check risk level before allowing trade; show warning for medium, block for critical
2. **Trade status updates** (TradePage): record risk events on cancel-after-paid, disputes
3. **Marketplace offer cards**: show TrustScoreBadge next to trader name
4. **UserProfile page**: display trust score prominently
5. **Dashboard**: show user's own trust score + any active restrictions
6. **Profile creation trigger**: auto-create risk_profiles row via DB trigger on new profile

---

## Automated Restrictions (enforced client-side)

| Level | Max Trade | Can Create Offers | Warning |
|-------|-----------|-------------------|---------|
| LOW | Unlimited | Yes | None |
| MEDIUM | ₹2,00,000 | Yes | "Limited history" |
| HIGH | ₹50,000 | No sell offers | "Proceed with caution" |
| CRITICAL | Blocked | No | "Account restricted" |

---

## Route Addition

Add `/admin/risk` route in App.tsx for the admin risk dashboard.

---

## Technical Notes

- Risk recalculation runs via a Supabase database function (not edge function) for speed
- Auto-create `risk_profiles` row via trigger on `profiles` insert
- All risk events are append-only for audit trail
- Trust score = 100 - risk_score, displayed user-facing
- No real IP/device tracking (mock/demo) — event types are recorded but multi-account detection is simulated

