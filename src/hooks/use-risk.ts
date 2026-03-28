import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface RiskProfile {
  id: string;
  user_id: string;
  risk_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  last_updated: string;
}

export interface RiskEvent {
  id: string;
  user_id: string;
  event_type: string;
  severity: string;
  score_impact: number;
  details: Record<string, unknown>;
  created_at: string;
}

export type RiskEventType =
  | "multiple_accounts"
  | "rapid_trades"
  | "payment_mismatch"
  | "cancel_after_payment"
  | "frequent_disputes"
  | "new_account_large_trade"
  | "false_payment_claim"
  | "suspicious_bank";

export function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 20) return "low";
  if (score < 50) return "medium";
  if (score < 75) return "high";
  return "critical";
}

export function getTrustScore(riskScore: number): number {
  return 100 - riskScore;
}

export function getRiskRestrictions(level: "low" | "medium" | "high" | "critical") {
  switch (level) {
    case "low":
      return { maxTrade: Infinity, canCreateOffers: true, canCreateSellOffers: true, warning: null };
    case "medium":
      return { maxTrade: 200000, canCreateOffers: true, canCreateSellOffers: true, warning: "This user has limited history" };
    case "high":
      return { maxTrade: 50000, canCreateOffers: true, canCreateSellOffers: false, warning: "Proceed with caution" };
    case "critical":
      return { maxTrade: 0, canCreateOffers: false, canCreateSellOffers: false, warning: "Account restricted" };
  }
}

export function useRiskProfile(userId?: string) {
  return useQuery({
    queryKey: ["risk-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as RiskProfile | null;
    },
    enabled: !!userId,
  });
}

export function useRiskEvents(userId?: string) {
  return useQuery({
    queryKey: ["risk-events", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_events")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as RiskEvent[];
    },
    enabled: !!userId,
  });
}

export function useRecordRiskEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventType,
      severity,
      scoreImpact,
      details,
    }: {
      eventType: RiskEventType;
      severity: "low" | "medium" | "high";
      scoreImpact: number;
      details?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error: insertError } = await supabase.from("risk_events").insert([{
        user_id: user.id,
        event_type: eventType,
        severity,
        score_impact: scoreImpact,
        details: (details ?? {}) as any,
      }]);
      if (insertError) throw insertError;

      // Recalculate via DB function
      const { error: rpcError } = await supabase.rpc("recalculate_risk_score", {
        p_user_id: user.id,
      });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-profile"] });
      queryClient.invalidateQueries({ queryKey: ["risk-events"] });
    },
  });
}

// Hook for current user's risk data
export function useMyRisk() {
  const { user } = useAuth();
  const { data: riskProfile, isLoading } = useRiskProfile(user?.id);

  const score = riskProfile?.risk_score ?? 50;
  const level = riskProfile?.risk_level as "low" | "medium" | "high" | "critical" ?? "medium";
  const trustScore = getTrustScore(score);
  const restrictions = getRiskRestrictions(level);

  return { riskProfile, score, level, trustScore, restrictions, isLoading };
}
