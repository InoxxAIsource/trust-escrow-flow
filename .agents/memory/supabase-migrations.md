---
name: Supabase migration application
description: How schema changes reach the live Supabase DB in this project
---
Local files in `supabase/migrations/` do NOT auto-apply to the live Supabase project. Replit cannot reach the DB directly (direct host unresolvable; pooler rejects creds), so DDL must be pasted into the Supabase SQL Editor by the user.

**Why:** Multiple bugs this project shipped (admin bank-details save failing 400, disclaimer text persisting) were "fixed" locally but broken live because the migration was never run.

**How to apply:** Write the migration file, then give the user the full SQL inline in chat (they once pasted a filename instead of contents). Keep `supabase/apply-pending.sql` as the consolidated idempotent script. As of 2026-08-17 all pending migrations up to 20260817150000 are applied live (user confirmed).

Data-only changes (DELETE/UPDATE) CAN be run from Replit via the Supabase REST API with the anon key where RLS permits.
