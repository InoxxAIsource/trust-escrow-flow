import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canTransition,
  nextStates,
  isTerminal,
  happyPathIndex,
  labelForEvent,
  TRANSITIONS,
  TRADE_STATES,
  TERMINAL_STATES,
  HAPPY_PATH,
  STATE_LABELS,
  STATE_TONES,
  type TradeState,
} from "@/lib/trade-state-machine";

const MIGRATION = resolve(
  __dirname,
  // Latest migration that redefines demo_trade_can_transition() — keep this
  // pointing at the newest override so the parity check tracks reality.
  "../../supabase/migrations/20260817160000_manual_payment_details_flow.sql",
);

/** Pulls the tuple list out of demo_trade_can_transition() in the migration. */
function transitionsDeclaredInSql(): Array<[string, string]> {
  const sql = readFileSync(MIGRATION, "utf8");
  const start = sql.indexOf("SELECT (_from, _to) IN (");
  expect(start, "demo_trade_can_transition() not found in migration").toBeGreaterThan(-1);
  const end = sql.indexOf(");", start);
  const body = sql.slice(start, end);

  return [...body.matchAll(/\(\s*'([A-Z_]+)'\s*,\s*'([A-Z_]+)'\s*\)/g)].map(
    (m) => [m[1], m[2]] as [string, string],
  );
}

describe("state machine / SQL parity", () => {
  // The database is the enforcement point. If this mirror drifts, the UI will
  // offer buttons the server rejects, which is exactly the class of bug the
  // original client-controlled implementation had.
  it("declares exactly the same edges as the migration", () => {
    const sqlEdges = transitionsDeclaredInSql()
      .map(([f, t]) => `${f}->${t}`)
      .sort();
    const tsEdges = TRANSITIONS.map(([f, t]) => `${f}->${t}`).sort();

    expect(sqlEdges.length).toBeGreaterThan(0);
    expect(tsEdges).toEqual(sqlEdges);
  });
});

describe("canTransition()", () => {
  it("permits the full happy path end to end", () => {
    for (let i = 0; i < HAPPY_PATH.length - 1; i++) {
      expect(
        canTransition(HAPPY_PATH[i], HAPPY_PATH[i + 1]),
        `${HAPPY_PATH[i]} -> ${HAPPY_PATH[i + 1]} should be legal`,
      ).toBe(true);
    }
  });

  it("allows the buyer to mark payment once awaiting details (manual flow)", () => {
    // The operator sends bank details by chat, so the buyer may mark payment
    // from AWAITING_PAYMENT_DETAILS — but never earlier, and never straight
    // to COMPLETED.
    expect(canTransition("AWAITING_PAYMENT_DETAILS", "PAYMENT_MARKED")).toBe(true);
    expect(canTransition("PAYMENT_METHOD_SELECTED", "PAYMENT_MARKED")).toBe(false);
    expect(canTransition("AWAITING_PAYMENT_DETAILS", "COMPLETED")).toBe(false);
  });

  it("refuses to jump straight to COMPLETED", () => {
    const illegal: TradeState[] = [
      "CREATED",
      "KYC_PENDING",
      "KYC_APPROVED",
      "TRADE_OPEN",
      "PAYMENT_METHOD_SELECTED",
      "AWAITING_PAYMENT_DETAILS",
      "PAYMENT_DETAILS_SENT",
    ];
    for (const from of illegal) {
      expect(canTransition(from, "COMPLETED"), `${from} -> COMPLETED must be blocked`).toBe(false);
    }
    expect(canTransition("PAYMENT_MARKED", "COMPLETED")).toBe(true);
  });

  it("treats COMPLETED and CANCELLED as terminal", () => {
    for (const terminal of TERMINAL_STATES) {
      expect(isTerminal(terminal)).toBe(true);
      expect(nextStates(terminal)).toEqual([]);
      for (const to of TRADE_STATES) {
        expect(canTransition(terminal, to), `${terminal} -> ${to} must be blocked`).toBe(false);
      }
    }
  });

  it("does not allow a trade to run backwards", () => {
    expect(canTransition("PAYMENT_MARKED", "PAYMENT_DETAILS_SENT")).toBe(false);
    expect(canTransition("PAYMENT_DETAILS_SENT", "AWAITING_PAYMENT_DETAILS")).toBe(false);
    expect(canTransition("TRADE_OPEN", "CREATED")).toBe(false);
  });

  it("allows cancellation from every live state, and dispute where relevant", () => {
    for (const from of [
      "TRADE_OPEN",
      "PAYMENT_METHOD_SELECTED",
      "AWAITING_PAYMENT_DETAILS",
      "PAYMENT_DETAILS_SENT",
      "PAYMENT_MARKED",
    ] as TradeState[]) {
      expect(canTransition(from, "CANCELLED"), `${from} -> CANCELLED`).toBe(true);
    }
    expect(canTransition("PAYMENT_DETAILS_SENT", "DISPUTED")).toBe(true);
    expect(canTransition("DISPUTED", "COMPLETED")).toBe(true);
  });
});

describe("presentation metadata", () => {
  it("labels and tones every state", () => {
    for (const state of TRADE_STATES) {
      expect(STATE_LABELS[state], `missing label for ${state}`).toBeTruthy();
      expect(STATE_TONES[state], `missing tone for ${state}`).toBeTruthy();
    }
  });

  it("never uses escrow or custody language in state labels", () => {
    // Copy audit guard: these words imply a protocol this demo does not have.
    const banned = /escrow|custody|settle|vault|locked funds/i;
    for (const label of Object.values(STATE_LABELS)) {
      expect(label, `"${label}" implies real settlement`).not.toMatch(banned);
    }
  });

  it("orders the happy path monotonically", () => {
    expect(happyPathIndex("TRADE_OPEN")).toBe(0);
    expect(happyPathIndex("COMPLETED")).toBe(HAPPY_PATH.length - 1);
    expect(happyPathIndex("DISPUTED")).toBe(-1);
  });

  it("falls back gracefully for unknown event types", () => {
    expect(labelForEvent("TRADE_CREATED")).toBe("Trade created");
    expect(labelForEvent("STATE_PAYMENT_MARKED")).toBe("Payment marked sent");
    expect(labelForEvent("SOMETHING_NEW")).toBe("something new");
  });
});
