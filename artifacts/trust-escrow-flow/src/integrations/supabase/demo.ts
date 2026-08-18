/**
 * Typed access to relations introduced by the demo migrations.
 *
 * `types.ts` is generated from the live database and predates these tables, so
 * regenerating it requires database access this repo does not currently carry.
 * Rather than sprinkle `@ts-expect-error` across every call site, the shared
 * client is re-exported once through a loosened handle and the row shapes are
 * declared explicitly below. Consumers annotate their results, so type safety
 * is preserved where it matters.
 *
 * When the migrations are applied, run
 *   supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts
 * and these hand-written interfaces can be deleted in favour of the generated ones.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";
import type { TradeState } from "@/lib/trade-state-machine";
import type { Currency, DemoAsset, MarketRegion, TradeSide } from "@/lib/pricing";

// Same instance as `supabase`, so the auth session is shared.
export const demoDb = supabase as unknown as SupabaseClient;

export type CounterpartyKind = "SELLER" | "BUYER";

export interface DemoCounterparty {
  id: string;
  kind: CounterpartyKind;
  display_name: string;
  avatar_url: string | null;
  verification_status: string;
  rating: number;
  completion_rate: number;
  trade_count: number;
  online_status: boolean;
  response_time_label: string;
  supported_assets: string[];
  payment_methods: string[];
  country_code: string;
  region: MarketRegion;
  /** Quote currency for this counterparty's market. */
  currency: Currency;
  /** SELLER: premium over mid. BUYER: discount under mid. Basis points. */
  spread_bps: number;
  admin_mirror_id: string;
  admin_mirror_label: string;
  sort_order: number;
  is_active: boolean;
}

export interface DemoOffer {
  id: string;
  counterparty_id: string;
  side: TradeSide;
  asset: DemoAsset;
  available_amount: number;
  /** Limits are held in `currency`, so no FX is needed to validate an order. */
  currency: Currency;
  min_limit: number;
  max_limit: number;
  /** USD equivalents — used for cross-currency amount filtering. */
  min_limit_usd: number;
  max_limit_usd: number;
  payment_methods: string[];
  sort_order: number;
  is_active: boolean;
}

/** An offer joined to its counterparty and priced against the live feed. */
export interface PricedOffer extends DemoOffer {
  counterparty: DemoCounterparty;
  marketPrice: number;
  p2pPrice: number;
  spreadLabel: string;
  /** Approximate USD equivalent of the offer's min/max limits (for cross-currency amount filtering). */
  minLimitUSD: number;
  maxLimitUSD: number;
  /** Set when this listing comes from a real user's `offers` row, not the seeded demo book. */
  isUserOffer?: boolean;
  /** The listing owner's auth user id — used to stop a seller trading against their own offer. */
  sellerUserId?: string;
}

export type KycStatus = "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED";
export type KycDocumentType =
  | "GOVERNMENT_ID"
  | "PASSPORT"
  | "DRIVER_LICENSE"
  | "ADDRESS_PROOF";

export interface KycSubmission {
  id: string;
  user_id: string;
  status: KycStatus;
  /** Legacy single-document fields, null on submissions made by the wizard. */
  document_type: KycDocumentType | null;
  file_reference: string | null;
  national_id_path: string | null;
  utility_bill_path: string | null;
  selfie_path: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  annual_income: string | null;
  income_source: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}

export interface DemoTrade {
  id: string;
  trade_ref: string;
  owner_id: string;
  demo_counterparty_id: string | null;
  side: TradeSide;
  asset: DemoAsset;
  amount: number;
  price: number;
  total: number;
  currency: string;
  payment_method: string;
  demo_state: TradeState;
  is_demo: boolean;
  created_at: string;
  last_activity_at: string;
  completed_at: string | null;
  cancelled_reason: string | null;
  expires_at: string | null;
}

export interface TradeEvent {
  id: string;
  trade_id: string;
  event_type: string;
  actor_role: "buyer" | "seller" | "admin" | "system";
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TradeMessage {
  id: string;
  trade_id: string;
  sender_id: string | null;
  sender_role: "buyer" | "seller" | "admin" | "system";
  message: string;
  is_payment_details: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  /** Object key in the `trade-receipts` bucket: <trade_id>/<uploader>/<uuid>.<ext> */
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
  /** Set when the attachment was posted as proof of payment. */
  is_receipt: boolean;
}

export const TRADE_RECEIPTS_BUCKET = "trade-receipts";
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_ATTACHMENT_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "application/pdf",
];

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  trade_id: string | null;
  user_id: string | null;
  status: "UNREAD" | "READ" | "ACTIONED";
  payload: Record<string, unknown>;
  email_sent_at: string | null;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string | null;
  action: string;
  trade_id: string | null;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PaymentInstruction {
  id: string;
  counterparty_id: string;
  method: string;
  fields: Record<string, string>;
}

/** Payment methods the platform supports, grouped by the region that uses them. */
export const PAYMENT_METHODS = [
  "USA Bank Wire",
  "ACH Transfer",
  "UK Faster Payments",
  "SEPA Transfer",
  "FPS Transfer",
  "Bank Transfer",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * A bank record is not one shape with optional fields - each country
 * identifies an account differently, and showing a German seller a sort code
 * is simply wrong. These mirror `payment_rail_shape()` and
 * `build_payment_fields()` in the SQL; a test asserts the two agree.
 */
export type RailShape = "US_WIRE" | "US_ACH" | "UK" | "EU" | "HK";

export interface RailFieldSet {
  /** Operator-editable, in display order. */
  editable: string[];
  /** Derived server-side and shown read-only. */
  locked: string[];
  /** What the account-number input is called on this rail. */
  accountLabel: string;
  accountHint?: string;
}

export const RAIL_FIELDS: Record<RailShape, RailFieldSet> = {
  US_WIRE: {
    editable: ["bank_name", "account_name", "account_number", "bank_address"],
    locked: ["routing_number", "swift"],
    accountLabel: "Account Number",
  },
  US_ACH: {
    editable: ["bank_name", "account_name", "account_number"],
    locked: ["routing_number"],
    accountLabel: "Account Number",
  },
  UK: {
    editable: ["bank_name", "account_name", "account_number"],
    locked: ["sort_code"],
    accountLabel: "Account Number",
    accountHint: "8 digits, UK convention.",
  },
  EU: {
    // SEPA identifies the account by IBAN; there is no bare account number on
    // the record. What the operator types becomes the IBAN's national body.
    editable: ["bank_name", "account_name", "account_number"],
    locked: ["iban", "swift"],
    accountLabel: "National account number",
    accountHint: "Becomes the body of the IBAN, padded to the country's length.",
  },
  HK: {
    editable: ["bank_name", "account_name", "account_number"],
    locked: ["bank_code"],
    accountLabel: "Account Number",
    accountHint: "9–12 digits, Hong Kong convention.",
  },
};

/**
 * "Bank Transfer" has no shape of its own - it is whatever the counterparty's
 * region uses domestically. Mirrors `payment_rail_shape()`.
 */
export function railShapeFor(method: string, region: string): RailShape {
  switch (method) {
    case "USA Bank Wire":
      return "US_WIRE";
    case "ACH Transfer":
      return "US_ACH";
    case "UK Faster Payments":
      return "UK";
    case "SEPA Transfer":
      return "EU";
    case "FPS Transfer":
      return "HK";
    default:
      break;
  }
  switch (region) {
    case "US":
      return "US_WIRE";
    case "UK":
      return "UK";
    case "HK":
      return "HK";
    default:
      return "EU";
  }
}

export function fieldSetFor(method: string, region: string): RailFieldSet {
  return RAIL_FIELDS[railShapeFor(method, region)];
}

/**
 * Field ordering for rendering payment instructions, mirroring
 * `format_payment_instructions()` so chat and the operator panel agree.
 */
export const PAYMENT_FIELD_ORDER = [
  "bank_name",
  "account_name",
  "routing_number",
  "bank_code",
  "account_number",
  "sort_code",
  "iban",
  "swift",
  "bank_address",
  "settlement_note",
] as const;

export const PAYMENT_FIELD_LABELS: Record<string, string> = {
  bank_name: "Bank Name",
  account_name: "Account Name",
  routing_number: "Routing Number",
  bank_code: "Bank Code",
  account_number: "Account Number",
  sort_code: "Sort Code",
  iban: "IBAN",
  swift: "SWIFT / BIC",
  bank_address: "Bank Address",
  settlement_note: "Settlement Note",
};
