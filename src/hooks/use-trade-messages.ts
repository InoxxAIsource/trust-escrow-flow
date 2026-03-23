import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface TradeMessage {
  id: string;
  trade_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export function useTradeMessages(tradeId: string | undefined) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    if (!tradeId || !user) return;
    setLoading(true);
    supabase
      .from("trade_messages")
      .select("*")
      .eq("trade_id", tradeId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setMessages(data as TradeMessage[]);
        setLoading(false);
      });
  }, [tradeId, user]);

  // Realtime subscription
  useEffect(() => {
    if (!tradeId || !user) return;
    const channel = supabase
      .channel(`trade-messages-${tradeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trade_messages",
          filter: `trade_id=eq.${tradeId}`,
        },
        (payload) => {
          const newMsg = payload.new as TradeMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tradeId, user]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!user || !tradeId) throw new Error("Missing context");
      const { data, error } = await supabase
        .from("trade_messages")
        .insert({
          trade_id: tradeId,
          sender_id: user.id,
          message,
        })
        .select()
        .single();
      if (error) throw error;
      return data as TradeMessage;
    },
  });

  return { messages, loading, sendMessage };
}
