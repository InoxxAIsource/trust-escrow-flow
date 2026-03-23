import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface TradeRow {
  id: string;
  buyer_id: string;
  seller_id: string;
  offer_id: string;
  asset: string;
  amount: number;
  price: number;
  total: number;
  currency: string;
  payment_method: string;
  status: "locked" | "expired" | "completed" | "paid" | "pending" | "disputed" | "cancelled";
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserTrades() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TradeRow[];
    },
    enabled: !!user,
  });

  const createTrade = useMutation({
    mutationFn: async (trade: {
      offer_id: string;
      seller_id: string;
      asset: string;
      amount: number;
      price: number;
      total: number;
      currency: string;
      payment_method: string;
    }) => {
      if (!user) throw new Error("Not logged in");
      const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("trades")
        .insert({
          ...trade,
          buyer_id: user.id,
          status: "locked" as const,
          expires_at: expiresAt,
        })
        .select()
        .single();
      if (error) throw error;

      // Try to reduce remaining_amount on the offer (only works for real DB offers)
      try {
        const { data: offer } = await supabase
          .from("offers")
          .select("remaining_amount")
          .eq("id", trade.offer_id)
          .single();
        if (offer) {
          const newRemaining = Math.max(0, Number(offer.remaining_amount) - trade.amount);
          await supabase
            .from("offers")
            .update({
              remaining_amount: newRemaining,
              status: newRemaining <= 0 ? "inactive" : "active",
            })
            .eq("id", trade.offer_id);
        }
      } catch {
        // Seeded offers won't exist in DB — ignore
      }

      return data as TradeRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["user-offers"] });
    },
  });

  const updateTradeStatus = useMutation({
    mutationFn: async ({ tradeId, status }: { tradeId: string; status: TradeRow["status"] }) => {
      const { data, error } = await supabase
        .from("trades")
        .update({ status })
        .eq("id", tradeId)
        .select()
        .single();
      if (error) throw error;
      return data as TradeRow;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trades"] }),
  });

  const activeTrades = trades.filter(
    (t) => (t.status === "locked" || t.status === "paid") && 
           (!t.expires_at || new Date(t.expires_at).getTime() > Date.now())
  );

  return { trades, activeTrades, isLoading, createTrade, updateTradeStatus };
}

export function useTradeById(tradeId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: trade, isLoading } = useQuery({
    queryKey: ["trade", tradeId],
    queryFn: async () => {
      if (!tradeId) return null;
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("id", tradeId)
        .single();
      if (error) throw error;
      return data as TradeRow;
    },
    enabled: !!tradeId && !!user,
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: TradeRow["status"]) => {
      if (!tradeId) throw new Error("No trade ID");
      const { data, error } = await supabase
        .from("trades")
        .update({ status })
        .eq("id", tradeId)
        .select()
        .single();
      if (error) throw error;
      return data as TradeRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    },
  });

  return { trade, isLoading, updateStatus };
}
