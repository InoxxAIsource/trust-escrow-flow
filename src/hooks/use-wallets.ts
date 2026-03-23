import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface WalletRow {
  id: string;
  user_id: string;
  asset: string;
  balance: number;
  locked_balance: number;
}

export function useWallets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ["wallets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []) as WalletRow[];
    },
    enabled: !!user,
  });

  const getBalance = (asset: string) => {
    const w = wallets.find((w) => w.asset === asset);
    return w ? { balance: Number(w.balance), lockedBalance: Number(w.locked_balance) } : { balance: 0, lockedBalance: 0 };
  };

  const deposit = useMutation({
    mutationFn: async ({ asset, amount }: { asset: string; amount: number }) => {
      if (!user) throw new Error("Not logged in");
      const wallet = wallets.find((w) => w.asset === asset);
      if (!wallet) throw new Error("Wallet not found");
      const { error } = await supabase
        .from("wallets")
        .update({ balance: Number(wallet.balance) + amount })
        .eq("id", wallet.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });

  const lockBalance = useMutation({
    mutationFn: async ({ asset, amount }: { asset: string; amount: number }) => {
      if (!user) throw new Error("Not logged in");
      const wallet = wallets.find((w) => w.asset === asset);
      if (!wallet || Number(wallet.balance) < amount) throw new Error("Insufficient balance");
      const { error } = await supabase
        .from("wallets")
        .update({
          balance: Number(wallet.balance) - amount,
          locked_balance: Number(wallet.locked_balance) + amount,
        })
        .eq("id", wallet.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });

  return { wallets, isLoading, getBalance, deposit, lockBalance };
}
