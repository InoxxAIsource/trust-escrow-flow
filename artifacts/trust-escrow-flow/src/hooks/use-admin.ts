import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  demoDb,
  type AdminAction,
  type AdminNotification,
  type DemoCounterparty,
  type DemoTrade,
  type PaymentInstruction,
  type TradeMessage,
} from "@/integrations/supabase/demo";
import { useAuth } from "./use-auth";

/**
 * Whether the signed-in account holds the admin role.
 *
 * This drives navigation and layout only. Every admin capability is
 * independently enforced by `require_admin()` inside the relevant RPC and by
 * RLS on the underlying tables, so a user who forces this to `true` in devtools
 * gains exactly nothing.
 */
export function useIsAdmin() {
  const { user, loading } = useAuth();

  const query = useQuery<boolean>({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await demoDb
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return {
    isAdmin: query.data ?? false,
    isLoading: loading || (!!user && query.isLoading),
  };
}

export interface AdminTradeRow extends DemoTrade {
  counterparty: DemoCounterparty | null;
  owner: { username: string; kyc_status: string } | null;
}

export function useAdminTrades(filter?: "active" | "completed") {
  return useQuery<AdminTradeRow[]>({
    queryKey: ["admin-trades", filter ?? "all"],
    queryFn: async () => {
      let q = demoDb
        .from("trades")
        .select("*, counterparty:demo_counterparties(*), owner:profiles!trades_owner_id_fkey(username, kyc_status)")
        .eq("is_demo", true);

      if (filter === "active") {
        q = q.not("demo_state", "in", "(COMPLETED,CANCELLED)");
      } else if (filter === "completed") {
        q = q.in("demo_state", ["COMPLETED", "CANCELLED"]);
      }

      const { data, error } = await q.order("last_activity_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminTradeRow[];
    },
    refetchInterval: 15_000,
  });
}

export function useAdminNotifications() {
  return useQuery<AdminNotification[]>({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await demoDb
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AdminNotification[];
    },
    refetchInterval: 15_000,
  });
}

export function useAdminActions() {
  return useQuery<AdminAction[]>({
    queryKey: ["admin-actions"],
    queryFn: async () => {
      const { data, error } = await demoDb
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as AdminAction[];
    },
    refetchInterval: 20_000,
  });
}

/** Payment instructions for one counterparty. Admin-readable only. */
export function usePaymentInstructions(counterpartyId: string | undefined) {
  return useQuery<PaymentInstruction[]>({
    queryKey: ["payment-instructions", counterpartyId],
    queryFn: async () => {
      if (!counterpartyId) return [];
      const { data, error } = await demoDb
        .from("demo_payment_instructions")
        .select("*")
        .eq("counterparty_id", counterpartyId)
        .order("method");
      if (error) throw error;
      return (data ?? []) as PaymentInstruction[];
    },
    enabled: !!counterpartyId,
  });
}

/**
 * Saves a counterparty's payment instructions for one rail.
 *
 * Stores all operator-entered fields (including routing identifiers) directly
 * so the operator can override any value — useful for demo environments where
 * the auto-derived placeholders need to be replaced with real-looking data.
 */
export function useSavePaymentInstructions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      counterpartyId: string;
      method: string;
      fields: Record<string, string>;
    }) => {
      // Upsert the full fields object directly so every field (including
      // routing_number, swift, sort_code, iban etc.) is operator-controlled.
      const { data, error } = await demoDb
        .from("demo_payment_instructions")
        .upsert(
          {
            counterparty_id: input.counterpartyId,
            method: input.method,
            fields: input.fields,
          },
          { onConflict: "counterparty_id,method" },
        )
        .select()
        .single();
      if (error) throw error;
      return data as PaymentInstruction;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ["payment-instructions", input.counterpartyId] });
      qc.invalidateQueries({ queryKey: ["admin-actions"] });
    },
  });
}

/** Records that an operator opened a trade, for the timeline and action log. */
export function useMarkTradeOpened() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tradeId: string) => {
      const { error } = await demoDb.rpc("admin_mark_trade_opened", { _trade_id: tradeId });
      if (error) throw error;
    },
    onSuccess: (_d, tradeId) => {
      queryClient.invalidateQueries({ queryKey: ["trade-events", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });
}

/**
 * The operator action the whole demo pivots on: copies the counterparty's
 * simulated payment details into the trade chat. The buyer has no route to
 * this data other than an operator choosing to send it.
 */
export function useSendPaymentDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tradeId: string) => {
      const { data, error } = await demoDb.rpc("admin_send_payment_details", {
        _trade_id: tradeId,
      });
      if (error) throw error;
      return data as TradeMessage;
    },
    onSuccess: (_data, tradeId) => {
      queryClient.invalidateQueries({ queryKey: ["trade-messages", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["trade-events", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["demo-trade", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["admin-trades"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-actions"] });
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tradeId: string) => {
      const { data, error } = await demoDb.rpc("admin_confirm_payment", { _trade_id: tradeId });
      if (error) throw error;
      return data as DemoTrade;
    },
    onSuccess: (_data, tradeId) => {
      queryClient.invalidateQueries({ queryKey: ["demo-trade", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["trade-events", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["trade-messages", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["admin-trades"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });
}

export function useResetDemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await demoDb.rpc("reset_demo_environment");
      if (error) throw error;

      // The reset deletes the message rows; the objects they referenced would
      // otherwise stay in the bucket with nothing pointing at them. Failing
      // here should not report the reset itself as failed, since it succeeded.
      const { error: purgeError } = await demoDb.rpc("purge_trade_attachments");
      if (purgeError) console.warn("Attachment purge failed:", purgeError.message);

      return data as { ok: boolean; trades_cleared: number; kyc_cleared: number };
    },
    onSuccess: () => {
      // A reset touches essentially everything.
      queryClient.invalidateQueries();
    },
  });
}

export interface AdminOverview {
  pendingKyc: number;
  activeTrades: number;
  paymentRequests: number;
  unreadNotifications: number;
  completedTrades: number;
}

export function useAdminOverview() {
  return useQuery<AdminOverview>({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      // `head: true` with an exact count fetches the tally without the rows.
      const unwrap = ({ count, error }: { count: number | null; error: unknown }) => {
        if (error) throw error;
        return count ?? 0;
      };

      const [pendingKyc, activeTrades, paymentRequests, unreadNotifications, completedTrades] =
        await Promise.all([
          demoDb
            .from("kyc_submissions")
            .select("id", { count: "exact", head: true })
            .eq("status", "PENDING")
            .then(unwrap),
          demoDb
            .from("trades")
            .select("id", { count: "exact", head: true })
            .not("demo_state", "in", "(COMPLETED,CANCELLED)")
            .then(unwrap),
          demoDb
            .from("trades")
            .select("id", { count: "exact", head: true })
            .eq("demo_state", "AWAITING_PAYMENT_DETAILS")
            .then(unwrap),
          demoDb
            .from("admin_notifications")
            .select("id", { count: "exact", head: true })
            .eq("status", "UNREAD")
            .then(unwrap),
          demoDb
            .from("trades")
            .select("id", { count: "exact", head: true })
            .eq("demo_state", "COMPLETED")
            .then(unwrap),
        ]);

      return {
        pendingKyc,
        activeTrades,
        paymentRequests,
        unreadNotifications,
        completedTrades,
      };
    },
    refetchInterval: 15_000,
  });
}
