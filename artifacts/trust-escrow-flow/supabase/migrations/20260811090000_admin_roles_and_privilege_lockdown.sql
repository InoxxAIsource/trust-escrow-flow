-- ============================================================================
-- P2PxBT Demo — 01. Admin authorization boundary + privilege lockdown
-- ============================================================================
-- Context: this project ships only the Supabase *anon* key to the browser.
-- Anyone can therefore call PostgREST directly with a valid user JWT. That
-- makes RLS + triggers the ONLY real security boundary; nothing enforced in
-- React counts. This migration establishes:
--
--   1. A real role model (user_roles) that users cannot write to.
--   2. has_role()/is_admin() SECURITY DEFINER helpers (no RLS recursion).
--   3. A privileged-column guard on profiles so a user can no longer set
--      their own kyc_status / aml_status / is_verified / reputation fields.
--   4. The same guard on wallets + transactions so demo balances cannot be
--      minted by hand from the browser console.
--
-- Privileged writes are performed by SECURITY DEFINER functions which opt in
-- via set_config('app.privileged', 'on', true). That flag is transaction-local
-- (third arg = true), so it cannot leak between requests on a pooled
-- connection, and it can never be set by PostgREST clients because they have
-- no way to execute set_config on a reserved GUC outside these functions.
-- ============================================================================

-- ── 1. Role model ──────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- A user may read their OWN roles (so the UI can show/hide admin nav).
-- Note this is a convenience only; hiding nav is not a security control.
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Deliberately NO insert/update/delete policy. With RLS enabled and no
-- permissive policy, every client-side write is denied. Roles are granted
-- either out-of-band in the SQL editor or via grant_admin_role() below.

-- ── 2. Authorization helpers ───────────────────────────────────────────────

-- SECURITY DEFINER so it can read user_roles without tripping the RLS policy
-- above. STABLE so the planner can cache it within a statement.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT _user_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = _user_id AND role = 'admin'
     );
$$;

-- Raises unless the caller is an admin. Used at the top of every admin RPC.
CREATE OR REPLACE FUNCTION public.require_admin()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: you must be signed in'
      USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_admin(v_uid) THEN
    RAISE EXCEPTION 'FORBIDDEN: admin role required'
      USING ERRCODE = '42501';
  END IF;
  RETURN v_uid;
END;
$$;

-- Bootstrap-safe admin grant: an existing admin can promote another user.
-- The very first admin must be inserted manually (see docs/DEMO_SETUP.md).
CREATE OR REPLACE FUNCTION public.grant_admin_role(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin uuid := public.require_admin();
BEGIN
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_target_user_id, 'admin', v_admin)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_admin_role(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.grant_admin_role(uuid) TO authenticated;

-- ── 3. Privileged-column guard on profiles ─────────────────────────────────

-- RLS cannot express "you may update these columns but not those", so the
-- column-level rule lives in a trigger. This closes the audit finding that a
-- user could mark themselves KYC-verified with a single PATCH request.
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Privileged code paths (admin RPCs) set this transaction-local flag.
  IF current_setting('app.privileged', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- Admins acting directly are also permitted.
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.kyc_status   IS DISTINCT FROM OLD.kyc_status
  OR NEW.kyc_level    IS DISTINCT FROM OLD.kyc_level
  OR NEW.aml_status   IS DISTINCT FROM OLD.aml_status
  OR NEW.is_verified  IS DISTINCT FROM OLD.is_verified
  OR NEW.kyc_provider IS DISTINCT FROM OLD.kyc_provider THEN
    RAISE EXCEPTION
      'FORBIDDEN: verification status is set by review, not by the account holder'
      USING ERRCODE = '42501';
  END IF;

  -- Reputation is derived from trade history, never self-reported.
  IF NEW.rating          IS DISTINCT FROM OLD.rating
  OR NEW.trades_count    IS DISTINCT FROM OLD.trades_count
  OR NEW.completion_rate IS DISTINCT FROM OLD.completion_rate THEN
    RAISE EXCEPTION 'FORBIDDEN: reputation fields are system-maintained'
      USING ERRCODE = '42501';
  END IF;

  -- user_id is the RLS anchor; re-pointing it would be a takeover primitive.
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'FORBIDDEN: user_id is immutable' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profiles_privileged ON public.profiles;
CREATE TRIGGER guard_profiles_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- Admins need to read every profile for the operator dashboard.
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ── 4. Wallet + transaction lockdown ───────────────────────────────────────

-- Previously any user could PATCH their own wallet balance to an arbitrary
-- number. Demo balances now move only through privileged code paths.
CREATE OR REPLACE FUNCTION public.guard_wallet_balances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('app.privileged', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.balance        IS DISTINCT FROM OLD.balance
  OR NEW.locked_balance IS DISTINCT FROM OLD.locked_balance THEN
    RAISE EXCEPTION
      'FORBIDDEN: wallet balances are adjusted by the platform, not the client'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_wallets_balances ON public.wallets;
CREATE TRIGGER guard_wallets_balances
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.guard_wallet_balances();

-- Transactions are an audit log: append-only, written by privileged paths.
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ── 5. Risk event lockdown ─────────────────────────────────────────────────

-- A user could previously insert their own score-lowering risk events.
DROP POLICY IF EXISTS "Authenticated users can insert risk events" ON public.risk_events;

DROP POLICY IF EXISTS "Admins can view all risk events" ON public.risk_events;
CREATE POLICY "Admins can view all risk events"
  ON public.risk_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all risk profiles" ON public.risk_profiles;
CREATE POLICY "Admins can view all risk profiles"
  ON public.risk_profiles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
