/**
 * Static assertions over the user-offers marketplace migration
 * (20260818100000_user_offers_marketplace.sql).
 *
 * Like security-model.test.ts, these cannot replace exercising the SQL
 * against a live database, but they lock in the decisions that make
 * community listings safe to trade:
 *
 *   1. Opening a trade against a user listing reserves volume atomically.
 *   2. Cancellation and expiry both return the reservation, exactly once,
 *      via the state-machine-guarded transition path.
 *   3. A trade opened against a community listing never depends on a demo
 *      counterparty, so it can progress through the manual payment flow.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATIONS_DIR = resolve(__dirname, "../../supabase/migrations");

function migration(nameFragment: string): string {
  const file = readdirSync(MIGRATIONS_DIR).find((f) => f.includes(nameFragment));
  if (!file) throw new Error(`No migration matching "${nameFragment}"`);
  return readFileSync(resolve(MIGRATIONS_DIR, file), "utf8");
}

const sql = migration("user_offers_marketplace");

describe("opening a trade against a user listing", () => {
  it("locks the offers row so concurrent takers cannot double-spend volume", () => {
    // FOR UPDATE on the fallback lookup serialises simultaneous orders.
    expect(sql).toMatch(/FROM public\.offers[\s\S]{0,200}FOR UPDATE/);
  });

  it("only matches active sell listings", () => {
    expect(sql).toMatch(/status = 'active' AND type = 'sell'/);
  });

  it("rejects self-trading against your own listing", () => {
    expect(sql).toMatch(/v_user_offer\.user_id = v_uid[\s\S]{0,200}your own offer/);
  });

  it("pins the trade to the listed price so the client cannot pick its own", () => {
    expect(sql).toMatch(/abs\(_unit_price - v_user_offer\.price\)/);
  });

  it("reserves the taken volume on the listing", () => {
    expect(sql).toMatch(/SET remaining_amount = remaining_amount - _amount/);
  });

  it("records the seller as a real user with no demo counterparty", () => {
    // The user-offer INSERT passes NULL for demo_counterparty_id and the
    // offer owner as seller_id — two humans, no simulated side.
    expect(sql).toMatch(/v_uid, v_user_offer\.user_id,\s*\n\s*NULL, v_ref, 'BUY'/);
  });

  it("does not require the trade to ever touch demo_payment_instructions", () => {
    // The manual payment flow (operator types details in chat; buyer can mark
    // payment from AWAITING_PAYMENT_DETAILS) must remain counterparty-free.
    expect(sql).not.toMatch(/demo_payment_instructions/);
  });
});

describe("reservation release on cancellation and expiry", () => {
  it("defines restore_user_offer_reservation guarded to community trades only", () => {
    expect(sql).toMatch(
      /restore_user_offer_reservation[\s\S]*?demo_counterparty_id IS NOT NULL OR v_trade\.seller_id IS NULL/,
    );
  });

  it("returns the reserved amount and reactivates an auto-completed listing", () => {
    expect(sql).toMatch(/remaining_amount = remaining_amount \+ v_trade\.amount/);
    expect(sql).toMatch(/WHEN status = 'completed'[\s\S]{0,80}'active'::public\.offer_status/);
  });

  it("restores only the owning seller's listing", () => {
    expect(sql).toMatch(/id::text = v_trade\.offer_id\s*\n\s*AND user_id = v_trade\.seller_id/);
  });

  it("is not callable by clients directly", () => {
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.restore_user_offer_reservation\(uuid\)\s*\n\s*FROM public, anon, authenticated/,
    );
  });

  it("runs inside cancel_demo_trade after the guarded CANCELLED transition", () => {
    const cancel = sql.slice(sql.indexOf("FUNCTION public.cancel_demo_trade"));
    const transitionIdx = cancel.indexOf("'CANCELLED'");
    const restoreIdx = cancel.indexOf("restore_user_offer_reservation");
    expect(transitionIdx).toBeGreaterThan(-1);
    expect(restoreIdx).toBeGreaterThan(transitionIdx);
  });

  it("runs inside expire_overdue_demo_trades only after an atomic claim", () => {
    const expire = sql.slice(sql.indexOf("FUNCTION public.expire_overdue_demo_trades"));
    // The expiry UPDATE must re-check the live-state predicate and RETURNING
    // the claimed id — a lost race must skip both the event and the restore.
    expect(expire).toMatch(
      /WHERE id = v_trade\.id\s*\n\s*AND demo_state NOT IN \('COMPLETED', 'CANCELLED', 'EXPIRED'\)\s*\n\s*RETURNING id INTO v_claimed_id/,
    );
    expect(expire).toMatch(/IF v_claimed_id IS NULL THEN\s*\n\s*CONTINUE;/);
    // Event + restore run on the claimed id, not the preselected one.
    expect(expire).toMatch(/record_trade_event\(\s*\n\s*v_claimed_id/);
    expect(expire).toMatch(/restore_user_offer_reservation\(v_claimed_id\)/);
    expect(expire).not.toMatch(/restore_user_offer_reservation\(v_trade\.id\)/);
    // The restore must happen before the per-trade exception handler closes.
    expect(expire.indexOf("restore_user_offer_reservation")).toBeLessThan(
      expire.indexOf("EXCEPTION WHEN OTHERS"),
    );
  });

  it("cancel-versus-expire cannot double-restore: cancel goes through the guarded transition", () => {
    // cancel_demo_trade() restores only after transition_demo_trade() into
    // CANCELLED succeeds; transitioning an EXPIRED/CANCELLED trade raises
    // INVALID_TRANSITION first, so the restore line is unreachable twice.
    const cancel = sql.slice(
      sql.indexOf("FUNCTION public.cancel_demo_trade"),
      sql.indexOf("FUNCTION public.expire_overdue_demo_trades"),
    );
    const transitionIdx = cancel.indexOf("transition_demo_trade");
    const restoreIdx = cancel.indexOf("restore_user_offer_reservation");
    expect(transitionIdx).toBeGreaterThan(-1);
    expect(restoreIdx).toBeGreaterThan(transitionIdx);
    // And EXPIRED is a terminal state with no outgoing edge to CANCELLED.
    const stateMachine = migration("trade_expiry_4h");
    expect(stateMachine).not.toMatch(/\('EXPIRED',\s*'CANCELLED'\)/);
  });
});

describe("state machine still supports counterparty-free progression", () => {
  it("keeps the AWAITING_PAYMENT_DETAILS -> PAYMENT_MARKED edge from the manual flow", () => {
    const manualFlow = migration("manual_payment_details_flow");
    expect(manualFlow).toMatch(/\('AWAITING_PAYMENT_DETAILS', 'PAYMENT_MARKED'\)/);
  });

  it("keeps admin_send_payment_details dropped (it required a demo counterparty)", () => {
    const drop = migration("drop_send_payment_details_rpc");
    expect(drop).toMatch(/DROP FUNCTION IF EXISTS public\.admin_send_payment_details/);
  });
});
