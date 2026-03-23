import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface OfferRow {
  id: string;
  user_id: string;
  type: "buy" | "sell";
  asset: string;
  amount: number;
  remaining_amount: number;
  price: number;
  currency: string;
  payment_methods: string[];
  min_limit: number;
  max_limit: number;
  status: "active" | "inactive" | "completed";
  views_count: number;
  clicks_count: number;
  locks_count: number;
  created_at: string;
}

export function useUserOffers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["user-offers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OfferRow[];
    },
    enabled: !!user,
  });

  const createOffer = useMutation({
    mutationFn: async (offer: {
      type: "buy" | "sell";
      asset: string;
      amount: number;
      price: number;
      currency: string;
      payment_methods: string[];
      min_limit: number;
      max_limit: number;
    }) => {
      if (!user) throw new Error("Not logged in");
      const { data, error } = await supabase
        .from("offers")
        .insert({
          user_id: user.id,
          ...offer,
          remaining_amount: offer.amount,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-offers"] }),
  });

  return { offers, isLoading, createOffer };
}
