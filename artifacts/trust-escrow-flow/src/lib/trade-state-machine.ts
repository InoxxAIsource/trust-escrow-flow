/**
 * Client mirror of the trade state machine.
 *
 * IMPORTANT: this file does not enforce anything. The authoritative copy lives
 * in `demo_trade_can_transition()` (migration 20260811090300) and every
 * transition runs inside a SECURITY DEFINER function. This mirror exists so
 * the UI can disable buttons that would fail, and so the timeline can be
 * labelled - it is a convenience layer over a server-side rule, never a
 * substitute for one.
 *
 * If you change an edge here, change it in the migration too. The test suite
 * asserts the two lists agree by parsing the SQL.
 */

export const TRADE_STATES = [
  "CREATED",
  "KYC_PENDING",
  "KYC_APPROVED",
  "TRADE_OPEN",
  "PAYMENT_METHOD_SELECTED",
  "AWAITING_PAYMENT_DETAILS",
  "PAYMENT_DETAILS_SENT",
  "PAYMENT_MARKED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
  "EXPIRED",
] as const;

export type TradeState = (typeof TRADE_STATES)[number];

export const TERMINAL_STATES: readonly TradeState[] = ["COMPLETED", "CANCELLED", "EXPIRED"] as const;

/** Legal edges, in the same order as the SQL function. */
export const TRANSITIONS: ReadonlyArray<readonly [TradeState, TradeState]> = [
  ["CREATED", "KYC_PENDING"],
  ["CREATED", "KYC_APPROVED"],
  ["CREATED", "TRADE_OPEN"],
  ["KYC_PENDING", "KYC_APPROVED"],
  ["KYC_PENDING", "CANCELLED"],
  ["KYC_APPROVED", "TRADE_OPEN"],
  ["TRADE_OPEN", "PAYMENT_METHOD_SELECTED"],
  ["PAYMENT_METHOD_SELECTED", "AWAITING_PAYMENT_DETAILS"],
  ["AWAITING_PAYMENT_DETAILS", "PAYMENT_DETAILS_SENT"],
  ["PAYMENT_DETAILS_SENT", "PAYMENT_MARKED"],
  ["PAYMENT_MARKED", "COMPLETED"],
  ["TRADE_OPEN", "CANCELLED"],
  ["PAYMENT_METHOD_SELECTED", "CANCELLED"],
  ["AWAITING_PAYMENT_DETAILS", "CANCELLED"],
  ["PAYMENT_DETAILS_SENT", "CANCELLED"],
  ["PAYMENT_MARKED", "CANCELLED"],
  ["PAYMENT_DETAILS_SENT", "DISPUTED"],
  ["PAYMENT_MARKED", "DISPUTED"],
  ["DISPUTED", "COMPLETED"],
  ["DISPUTED", "CANCELLED"],
  // Expiry – system-driven, from any live state
  ["TRADE_OPEN", "EXPIRED"],
  ["PAYMENT_METHOD_SELECTED", "EXPIRED"],
  ["AWAITING_PAYMENT_DETAILS", "EXPIRED"],
  ["PAYMENT_DETAILS_SENT", "EXPIRED"],
  ["PAYMENT_MARKED", "EXPIRED"],
  ["DISPUTED", "EXPIRED"],
] as const;

export function isTerminal(state: TradeState): boolean {
  return TERMINAL_STATES.includes(state);
}

export function canTransition(from: TradeState, to: TradeState): boolean {
  if (isTerminal(from)) return false;
  return TRANSITIONS.some(([f, t]) => f === from && t === to);
}

export function nextStates(from: TradeState): TradeState[] {
  if (isTerminal(from)) return [];
  return TRANSITIONS.filter(([f]) => f === from).map(([, t]) => t);
}

/** Copy for status chips. Kept demo-explicit - no "escrow", no "settlement". */
export const STATE_LABELS: Record<TradeState, string> = {
  CREATED: "Created",
  KYC_PENDING: "Verification pending",
  KYC_APPROVED: "Verification approved",
  TRADE_OPEN: "Trade open",
  PAYMENT_METHOD_SELECTED: "Payment method selected",
  AWAITING_PAYMENT_DETAILS: "Awaiting payment details",
  PAYMENT_DETAILS_SENT: "Payment details sent",
  PAYMENT_MARKED: "Payment marked sent",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
  EXPIRED: "Expired",
};

export type StateTone = "neutral" | "progress" | "attention" | "success" | "danger";

export const STATE_TONES: Record<TradeState, StateTone> = {
  CREATED: "neutral",
  KYC_PENDING: "attention",
  KYC_APPROVED: "progress",
  TRADE_OPEN: "progress",
  PAYMENT_METHOD_SELECTED: "progress",
  AWAITING_PAYMENT_DETAILS: "attention",
  PAYMENT_DETAILS_SENT: "progress",
  PAYMENT_MARKED: "attention",
  COMPLETED: "success",
  CANCELLED: "danger",
  DISPUTED: "danger",
  EXPIRED: "danger",
};

/**
 * The happy path, used to render the progress rail on the trade page.
 * Cancellation and dispute are off-rail by design.
 */
export const HAPPY_PATH: readonly TradeState[] = [
  "TRADE_OPEN",
  "PAYMENT_METHOD_SELECTED",
  "AWAITING_PAYMENT_DETAILS",
  "PAYMENT_DETAILS_SENT",
  "PAYMENT_MARKED",
  "COMPLETED",
] as const;

export function happyPathIndex(state: TradeState): number {
  return HAPPY_PATH.indexOf(state);
}

/** Human-readable labels for `trade_events.event_type`. */
export const EVENT_LABELS: Record<string, string> = {
  TRADE_CREATED: "Trade created",
  KYC_APPROVED: "Identity verification approved",
  PAYMENT_METHOD_SELECTED: "Payment method selected",
  ADMIN_NOTIFIED: "Operator notified",
  ADMIN_OPENED_TRADE: "Operator opened the trade",
  PAYMENT_DETAILS_SENT: "Operator sent payment details",
  BUYER_MARKED_PAYMENT_SENT: "Payment marked as sent",
  RECEIPT_UPLOADED: "Payment receipt uploaded",
  TRADE_COMPLETED: "Payment confirmed - trade complete",
  TRADE_CANCELLED: "Trade cancelled",
  TRADE_DISPUTED: "Dispute raised - awaiting operator review",
  TRADE_EXPIRED: "Trade expired - payment window elapsed",
};

export function labelForEvent(eventType: string): string {
  if (EVENT_LABELS[eventType]) return EVENT_LABELS[eventType];
  // STATE_PAYMENT_MARKED -> "Payment marked sent"
  if (eventType.startsWith("STATE_")) {
    const state = eventType.slice("STATE_".length) as TradeState;
    if (STATE_LABELS[state]) return STATE_LABELS[state];
  }
  return eventType.replace(/_/g, " ").toLowerCase();
}

/**
 * Which party may drive a given transition. Mirrors the RPC that owns it, and
 * drives whether the UI offers the control at all.
 */
export const TRANSITION_ACTOR: Partial<Record<TradeState, "buyer" | "admin">> = {
  PAYMENT_DETAILS_SENT: "admin",
  PAYMENT_MARKED: "buyer",
  COMPLETED: "admin",
};
