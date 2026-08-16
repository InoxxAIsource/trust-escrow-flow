
-- risk_profiles table
CREATE TABLE public.risk_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  risk_score integer NOT NULL DEFAULT 50,
  risk_level text NOT NULL DEFAULT 'medium',
  last_updated timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own risk profile"
  ON public.risk_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- risk_events table
CREATE TABLE public.risk_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  score_impact integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own risk events"
  ON public.risk_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert risk events"
  ON public.risk_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- recalculate_risk_score function
CREATE OR REPLACE FUNCTION public.recalculate_risk_score(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_score integer := 50;
  v_event_sum integer;
  v_kyc_status text;
  v_aml_status text;
  v_completion_rate numeric;
  v_trades_count integer;
  v_level text;
BEGIN
  -- Sum risk event impacts
  SELECT COALESCE(SUM(score_impact), 0) INTO v_event_sum
  FROM public.risk_events WHERE user_id = p_user_id;
  
  v_score := v_score + v_event_sum;

  -- Get profile info
  SELECT kyc_status, aml_status, completion_rate, trades_count
  INTO v_kyc_status, v_aml_status, v_completion_rate, v_trades_count
  FROM public.profiles WHERE user_id = p_user_id;

  -- KYC adjustments
  IF v_kyc_status = 'verified' THEN v_score := v_score - 15;
  ELSIF v_kyc_status = 'rejected' THEN v_score := v_score + 40;
  ELSIF v_kyc_status = 'unverified' THEN v_score := v_score + 10;
  END IF;

  -- AML adjustments
  IF v_aml_status = 'cleared' THEN v_score := v_score - 20;
  ELSIF v_aml_status = 'flagged' THEN v_score := v_score + 70;
  END IF;

  -- Trade history adjustments
  IF v_trades_count > 0 THEN
    v_score := v_score - (v_trades_count * 5);
  END IF;
  IF v_completion_rate > 95 THEN
    v_score := v_score - 10;
  END IF;

  -- Clamp 0-100
  v_score := GREATEST(0, LEAST(100, v_score));

  -- Derive level
  IF v_score < 20 THEN v_level := 'low';
  ELSIF v_score < 50 THEN v_level := 'medium';
  ELSIF v_score < 75 THEN v_level := 'high';
  ELSE v_level := 'critical';
  END IF;

  -- Upsert risk_profiles
  INSERT INTO public.risk_profiles (user_id, risk_score, risk_level, last_updated)
  VALUES (p_user_id, v_score, v_level, now())
  ON CONFLICT (user_id) DO UPDATE
  SET risk_score = EXCLUDED.risk_score,
      risk_level = EXCLUDED.risk_level,
      last_updated = EXCLUDED.last_updated;

  RETURN v_score;
END;
$$;

-- Auto-create risk_profiles on new profile
CREATE OR REPLACE FUNCTION public.create_risk_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.risk_profiles (user_id) VALUES (NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_create_risk
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_risk_profile();
