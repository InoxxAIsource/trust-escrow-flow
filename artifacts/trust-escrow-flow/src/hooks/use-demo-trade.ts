import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  demoDb,
  ACCEPTED_ATTACHMENT_MIME,
  MAX_ATTACHMENT_BYTES,
  TRADE_RECEIPTS_BUCKET,
  type DemoTrade,
  type TradeEvent,
  type TradeMessage,
  type DemoCounterparty,
} from "@/integrations/supabase/demo";
import { useAuth } from "./use-auth";
import {
  notifyAdminChatMessage,
  notifyAdminTradeOpened,
  notifyAdminPaymentSent,
  notifyAdminTradeCancelled,
} from "@/lib/notify";

/**
 * Subscribes to Postgres changes for one trade and invalidates the matching
 * queries. Shared by the buyer's trade page and the operator's mirror so both
 * sides of a conversation update live from the same signal.
 */
function useTradeRealtime(tradeId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tradeId) return;

    const channel = demoDb
      .channel(`trade:${tradeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trade_messages", filter: `trade_id=eq.${tradeId}` },
        () => queryClient.invalidateQueries({ queryKey: ["trade-messages", tradeId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trade_events", filter: `trade_id=eq.${tradeId}` },
        () => queryClient.invalidateQueries({ queryKey: ["trade-events", tradeId] }),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trades", filter: `id=eq.${tradeId}` },
        () => queryClient.invalidateQueries({ queryKey: ["demo-trade", tradeId] }),
      )
      .subscribe();

    return () => {
      demoDb.removeChannel(channel);
    };
  }, [tradeId, queryClient]);
}

export interface DemoTradeWithCounterparty extends DemoTrade {
  counterparty: DemoCounterparty | null;
}

export function useDemoTrade(tradeId: string | undefined) {
  useTradeRealtime(tradeId);

  return useQuery<DemoTradeWithCounterparty | null>({
    queryKey: ["demo-trade", tradeId],
    queryFn: async () => {
      if (!tradeId) return null;
      const { data, error } = await demoDb
        .from("trades")
        .select("*, counterparty:demo_counterparties(*)")
        .eq("id", tradeId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as DemoTradeWithCounterparty | null;
    },
    enabled: !!tradeId,
    // Realtime carries the load; this is a safety net for dropped sockets.
    refetchInterval: 30_000,
  });
}

export function useMyDemoTrades() {
  const { user } = useAuth();

  return useQuery<DemoTradeWithCounterparty[]>({
    queryKey: ["my-demo-trades", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await demoDb
        .from("trades")
        .select("*, counterparty:demo_counterparties(*)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DemoTradeWithCounterparty[];
    },
    enabled: !!user,
  });
}

export function useTradeEvents(tradeId: string | undefined) {
  return useQuery<TradeEvent[]>({
    queryKey: ["trade-events", tradeId],
    queryFn: async () => {
      if (!tradeId) return [];
      const { data, error } = await demoDb
        .from("trade_events")
        .select("*")
        .eq("trade_id", tradeId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as TradeEvent[];
    },
    enabled: !!tradeId,
  });
}

export function useTradeMessages(tradeId: string | undefined) {
  return useQuery<TradeMessage[]>({
    queryKey: ["trade-messages", tradeId],
    queryFn: async () => {
      if (!tradeId) return [];
      const { data, error } = await demoDb
        .from("trade_messages")
        .select("*")
        .eq("trade_id", tradeId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as TradeMessage[];
    },
    enabled: !!tradeId,
  });
}

/** Optional metadata passed at the hook call-site so notifications are rich. */
export interface TradeMessageContext {
  tradeRef: string;
  asset: string;
  amount: string;
}

export function useSendTradeMessage(
  tradeId: string | undefined,
  tradeContext?: TradeMessageContext,
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: string | { message?: string; file?: File; isReceipt?: boolean }) => {
      const { message = "", file, isReceipt = false } =
        typeof input === "string" ? { message: input } : input;

      if (!tradeId) throw new Error("No trade selected.");
      if (!user) throw new Error("You must be signed in to send a message.");

      const trimmed = message.trim();
      if (!trimmed && !file) throw new Error("Message is empty.");
      if (trimmed.length > 2000) throw new Error("Message is too long (2000 characters max).");

      let attachment: {
        attachment_path: string;
        attachment_name: string;
        attachment_mime: string;
        attachment_size: number;
      } | null = null;

      if (file) {
        if (file.size > MAX_ATTACHMENT_BYTES) {
          throw new Error("That file is larger than 5 MB.");
        }
        if (!ACCEPTED_ATTACHMENT_MIME.includes(file.type)) {
          throw new Error("Attach a PNG, JPEG, WebP, HEIC or PDF.");
        }

        // <trade_id>/<uploader>/<uuid>.<ext> - both leading segments are
        // re-checked by the storage policy and again by the message guard, so
        // this path is the only shape either will accept.
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const objectPath = `${tradeId}/${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await demoDb.storage
          .from(TRADE_RECEIPTS_BUCKET)
          .upload(objectPath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;

        attachment = {
          attachment_path: objectPath,
          attachment_name: file.name.slice(0, 120),
          attachment_mime: file.type,
          attachment_size: file.size,
        };
      }

      // sender_role and is_payment_details are forced server-side by
      // guard_trade_message_role(); sending them here would be ignored.
      const { data, error } = await demoDb
        .from("trade_messages")
        .insert({
          trade_id: tradeId,
          sender_id: user.id,
          message: trimmed,
          is_receipt: isReceipt && !!file,
          ...(attachment ?? {}),
        })
        .select()
        .single();
      if (error) throw error;
      return data as TradeMessage;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["trade-messages", tradeId] });
      // A receipt also writes a timeline event and an operator notification.
      queryClient.invalidateQueries({ queryKey: ["trade-events", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });

      // Fire-and-forget admin email - never block the UI on delivery.
      if (user && tradeContext) {
        const rawMessage = typeof input === "string" ? input : (input.message ?? "");
        const isSystemMessage = !rawMessage.trim() && typeof input !== "string" && input.file;
        const displayMessage = isSystemMessage ? "[File attachment]" : rawMessage.trim();

        notifyAdminChatMessage({
          tradeRef: tradeContext.tradeRef,
          tradeId: tradeId ?? "",
          message: displayMessage || "[attachment]",
          userName: user.user_metadata?.full_name ?? user.email ?? "Unknown",
          userEmail: user.email ?? "",
          asset: tradeContext.asset,
          amount: tradeContext.amount,
        });
      }
    },
  });
}

/**
 * Mints a short-lived signed URL for an attachment. The bucket is private, so
 * this is the only way to read one, and the policy behind it re-checks that
 * the caller is a participant in the owning trade.
 */
export function useAttachmentUrl() {
  return useMutation({
    mutationFn: async (path: string) => {
      const { data, error } = await demoDb.storage
        .from(TRADE_RECEIPTS_BUCKET)
        .createSignedUrl(path, 120);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export interface OpenTradeInput {
  offerId: string;
  amount: number;
  unitPrice: number;
  paymentMethod: string;
}

/**
 * Opens a demo trade. All validation - KYC approval, offer limits, payment
 * method availability - happens inside `open_demo_trade()`; the client cannot
 * bypass any of it by crafting its own insert, because `trades` has no INSERT
 * policy at all.
 */
export function useOpenDemoTrade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ offerId, amount, unitPrice, paymentMethod }: OpenTradeInput) => {
      const { data, error } = await demoDb.rpc("open_demo_trade", {
        _offer_id: offerId,
        _amount: amount,
        _unit_price: unitPrice,
        _payment_method: paymentMethod,
      });
      if (error) throw error;
      return data as DemoTrade;
    },
    onSuccess: (trade) => {
      queryClient.invalidateQueries({ queryKey: ["my-demo-trades"] });
      queryClient.invalidateQueries({ queryKey: ["admin-trades"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      // Opening a trade against a user listing decrements its remaining volume.
      queryClient.invalidateQueries({ queryKey: ["user-sell-offers"] });
      queryClient.invalidateQueries({ queryKey: ["user-offers"] });

      if (user && trade) {
        notifyAdminTradeOpened({
          tradeRef: trade.trade_ref,
          tradeId: trade.id,
          asset: trade.asset,
          amount: String(trade.amount),
          paymentMethod: trade.payment_method,
          userName: user.user_metadata?.full_name ?? user.email ?? "Unknown",
          userEmail: user.email ?? "",
          openedAt: new Date().toISOString(),
        });
      }
    },
  });
}

export function useMarkPaymentSent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tradeId: string) => {
      const { data, error } = await demoDb.rpc("mark_demo_payment_sent", { _trade_id: tradeId });
      if (error) throw error;
      return data as DemoTrade;
    },
    onSuccess: (trade, tradeId) => {
      queryClient.invalidateQueries({ queryKey: ["demo-trade", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["trade-events", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });

      if (user && trade) {
        notifyAdminPaymentSent({
          tradeRef: trade.trade_ref,
          tradeId: trade.id,
          asset: trade.asset,
          amount: String(trade.amount),
          paymentMethod: trade.payment_method,
          userName: user.user_metadata?.full_name ?? user.email ?? "Unknown",
          userEmail: user.email ?? "",
          sentAt: new Date().toISOString(),
        });
      }
    },
  });
}

export function useCancelDemoTrade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ tradeId, reason }: { tradeId: string; reason?: string }) => {
      const { data, error } = await demoDb.rpc("cancel_demo_trade", {
        _trade_id: tradeId,
        _reason: reason ?? null,
      });
      if (error) throw error;
      return data as DemoTrade;
    },
    onSuccess: (trade, { tradeId, reason }) => {
      queryClient.invalidateQueries({ queryKey: ["demo-trade", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["trade-events", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["my-demo-trades"] });
      queryClient.invalidateQueries({ queryKey: ["admin-trades"] });

      if (user && trade) {
        notifyAdminTradeCancelled({
          tradeRef: trade.trade_ref,
          tradeId: trade.id,
          asset: trade.asset,
          amount: String(trade.amount),
          reason: reason ?? "No reason given",
          userName: user.user_metadata?.full_name ?? user.email ?? "Unknown",
          userEmail: user.email ?? "",
          cancelledAt: new Date().toISOString(),
        });
      }
    },
  });
}

export function useRaiseDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tradeId, reason }: { tradeId: string; reason: string }) => {
      const { data, error } = await demoDb.rpc("raise_trade_dispute", {
        _trade_id: tradeId,
        _reason: reason,
      });
      if (error) throw error;
      return data as DemoTrade;
    },
    onSuccess: (_data, { tradeId }) => {
      queryClient.invalidateQueries({ queryKey: ["demo-trade", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["trade-events", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["trade-messages", tradeId] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-trades"] });
    },
  });
}

/**
 * Turns a Postgres error from one of the trade RPCs into something a person
 * can act on. The RPCs prefix their messages with a machine-readable tag.
 */
export function describeTradeError(error: unknown): string {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);

  if (message.includes("KYC_REQUIRED")) {
    return "Identity verification must be approved before you can open a trade.";
  }
  if (message.includes("INVALID_TRANSITION")) {
    return "That step isn't available yet for this trade.";
  }
  if (message.includes("FORBIDDEN")) {
    return "You don't have permission to do that.";
  }
  if (message.includes("AUTH_REQUIRED")) {
    return "Sign in to continue.";
  }
  if (message.includes("VALIDATION:")) {
    return message.split("VALIDATION:")[1]?.trim() ?? message;
  }
  if (message.includes("NOT_FOUND")) {
    return "That record no longer exists.";
  }
  return message;
}
