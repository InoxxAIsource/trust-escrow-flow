/**
 * Demo backend readiness probe.
 *
 * The migrations in supabase/migrations are committed to the repo but may not
 * have been applied to the linked Supabase project yet. Without this probe the
 * app would render a wall of red errors the moment it queried a table that
 * does not exist. Instead every demo surface checks readiness first and shows
 * an honest "not provisioned" panel.
 *
 * This is intentionally the only place that knows how to recognise a missing
 * table, so the detection rule lives in one testable function.
 */

import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Postgres `undefined_table`, plus the PostgREST schema-cache codes returned
 * when a relation or RPC is absent from the exposed schema.
 */
const MISSING_SCHEMA_CODES = new Set([
  "42P01", // undefined_table
  "42883", // undefined_function (a missing RPC)
  "PGRST202", // RPC not found in schema cache
  "PGRST205", // table not found in schema cache
]);

export function isMissingSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as Partial<PostgrestError> & { message?: string };

  if (e.code && MISSING_SCHEMA_CODES.has(e.code)) return true;

  // Some PostgREST versions only surface this in the message body.
  const message = (e.message ?? "").toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("could not find the function") ||
    message.includes("schema cache")
  );
}

export type DemoBackendStatus = "ready" | "not-provisioned" | "error";

export interface DemoBackendState {
  status: DemoBackendStatus;
  /** Present when status is "error" — an unexpected failure worth surfacing. */
  message?: string;
}

/**
 * Classifies the result of probing a demo table.
 * Split out from the hook so it can be unit-tested without a network round trip.
 */
export function classifyProbe(error: unknown): DemoBackendState {
  if (!error) return { status: "ready" };
  if (isMissingSchemaError(error)) return { status: "not-provisioned" };

  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message: unknown }).message)
      : "Unknown error contacting the demo backend.";
  return { status: "error", message };
}

/** Ordered list of migrations an operator needs to apply, for the setup panel. */
export const REQUIRED_MIGRATIONS = [
  "20260811090000_admin_roles_and_privilege_lockdown.sql",
  "20260811090050_operational_audit_tables.sql",
  "20260811090100_kyc_submissions_and_private_storage.sql",
  "20260811090200_demo_counterparties_offers_payment_instructions.sql",
  "20260811090300_demo_trade_state_machine.sql",
  "20260811090400_chat_operator_actions_and_reset.sql",
] as const;
