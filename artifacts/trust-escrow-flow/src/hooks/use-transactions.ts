import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface TransactionRow {
  id: string;
  user_id: string;
  asset: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

export function useTransactions() {
  const { user } = useAuth();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TransactionRow[];
    },
    enabled: !!user,
  });

  return { transactions, isLoading };
}
