import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface DealRow {
  id: string;
  offer_id: string;
  user_id: string;
  asset: string;
  asset_symbol: string;
  amount: number;
  price: number;
  currency: string;
  payment_method: string;
  type: "buy" | "sell";
  status: "locked" | "expired" | "completed";
  seller_username: string;
  expires_at: string;
  created_at: string;
}

export function useDeals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["locked-deals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("locked_deals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DealRow[];
    },
    enabled: !!user,
  });

  const lockDeal = useMutation({
    mutationFn: async (deal: {
      offer_id: string;
      asset: string;
      asset_symbol: string;
      amount: number;
      price: number;
      currency: string;
      payment_method: string;
      type: "buy" | "sell";
      seller_username: string;
    }) => {
      if (!user) throw new Error("Not logged in");
      const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("locked_deals")
        .insert({
          ...deal,
          user_id: user.id,
          expires_at: expiresAt,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locked-deals"] }),
  });

  const activeDeals = deals.filter(
    (d) => d.status === "locked" && new Date(d.expires_at).getTime() > Date.now()
  );
  const expiredDeals = deals.filter(
    (d) => d.status === "expired" || (d.status === "locked" && new Date(d.expires_at).getTime() <= Date.now())
  );

  return { deals, activeDeals, expiredDeals, isLoading, lockDeal };
}
