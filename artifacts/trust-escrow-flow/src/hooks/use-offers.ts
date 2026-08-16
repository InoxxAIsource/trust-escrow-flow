import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useWallets } from "./use-wallets";

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
  const { unlockBalance } = useWallets();

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

  const cancelOffer = useMutation({
    mutationFn: async (offerId: string) => {
      if (!user) throw new Error("Not logged in");
      // Find the offer
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) throw new Error("Offer not found");
      if (offer.user_id !== user.id) throw new Error("Not your offer");
      if (offer.status !== "active") throw new Error("Offer is not active");

      // Update offer status to inactive
      const { error } = await supabase
        .from("offers")
        .update({ status: "inactive" as const })
        .eq("id", offerId);
      if (error) throw error;

      // Restore locked funds (remaining_amount, not original amount)
      if (offer.type === "sell" && Number(offer.remaining_amount) > 0) {
        await unlockBalance.mutateAsync({
          asset: offer.asset,
          amount: Number(offer.remaining_amount),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-offers"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });

  return { offers, isLoading, createOffer, cancelOffer };
}
