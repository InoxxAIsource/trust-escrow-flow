/**
 * Static assertions over the migration SQL.
 *
 * These cannot replace exercising the policies against a live database, but
 * they do lock in the security *decisions* so a future edit cannot quietly
 * reintroduce one of the findings from the original audit. Every test here
 * maps to a specific finding.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  PAYMENT_METHODS,
  fieldSetFor,
  railShapeFor,
} from "@/integrations/supabase/demo";

const MIGRATIONS_DIR = resolve(__dirname, "../../supabase/migrations");

function migration(nameFragment: string): string {
  const file = readdirSync(MIGRATIONS_DIR).find((f) => f.includes(nameFragment));
  if (!file) throw new Error(`No migration matching "${nameFragment}"`);
  return readFileSync(resolve(MIGRATIONS_DIR, file), "utf8");
}

const allSql = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(resolve(MIGRATIONS_DIR, f), "utf8"))
  .join("\n");

describe("migration SQL is structurally sound", () => {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));

  // These tests do not parse SQL -- they catch the shapes that a regex-based
  // suite would otherwise wave through, and that only surface when the file is
  // pasted into a live database.

  it("gives every function body an AS $$ delimiter", () => {
    for (const file of files) {
      const sql = readFileSync(resolve(MIGRATIONS_DIR, file), "utf8");
      // Between a CREATE FUNCTION and the BEGIN/DECLARE that opens its body
      // there must be an AS $$. Editing a body can silently remove it.
      const bodies = sql.matchAll(
        /CREATE (?:OR REPLACE )?FUNCTION\s+([\w.]+)\s*\([\s\S]*?\n(DECLARE|BEGIN)\b/g,
      );
      for (const match of bodies) {
        expect(match[0], `${file}: ${match[1]} has no AS $$ before ${match[2]}`).toMatch(
          /AS\s+\$\$/,
        );
      }
    }
  });

  it("balances every $$ delimiter", () => {
    for (const file of files) {
      const sql = readFileSync(resolve(MIGRATIONS_DIR, file), "utf8");
      const count = (sql.match(/\$\$/g) ?? []).length;
      expect(count % 2, `${file} has an odd number of $$ delimiters`).toBe(0);
    }
  });

  it("terminates every statement", () => {
    for (const file of files) {
      const sql = readFileSync(resolve(MIGRATIONS_DIR, file), "utf8")
        .replace(/--[^\n]*/g, "")
        .trim();
      expect(sql.endsWith(";"), `${file} does not end in a semicolon`).toBe(true);
    }
  });
});

describe("audit finding: KYC status could be self-updated", () => {
  const sql = migration("admin_roles_and_privilege_lockdown");

  it("guards the privileged profile columns with a trigger", () => {
    expect(sql).toMatch(/guard_profile_privileged_columns/);
    expect(sql).toMatch(/CREATE TRIGGER guard_profiles_privileged/);
  });

  it("blocks self-service changes to every verification field", () => {
    for (const column of ["kyc_status", "kyc_level", "aml_status", "is_verified"]) {
      expect(sql, `${column} must be guarded`).toMatch(
        new RegExp(`NEW\\.${column}\\s+IS DISTINCT FROM OLD\\.${column}`),
      );
    }
  });

  it("blocks self-reported reputation", () => {
    for (const column of ["rating", "trades_count", "completion_rate"]) {
      expect(sql).toMatch(new RegExp(`NEW\\.${column}\\s+IS DISTINCT FROM OLD\\.${column}`));
    }
  });

  it("routes KYC decisions through an admin-gated function", () => {
    const kyc = migration("kyc_submissions_and_private_storage");
    expect(kyc).toMatch(/CREATE OR REPLACE FUNCTION public\.review_kyc_submission/);
    expect(kyc).toMatch(/public\.require_admin\(\)/);
    // No client UPDATE policy may exist on the submissions table.
    expect(kyc).not.toMatch(/CREATE POLICY[^;]*ON public\.kyc_submissions FOR UPDATE/);
  });
});

describe("audit finding: no admin access model", () => {
  const sql = migration("admin_roles_and_privilege_lockdown");

  it("stores roles in a dedicated table, not on the user-writable profile", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.user_roles/);
    expect(sql).toMatch(/ALTER TABLE public\.user_roles ENABLE ROW LEVEL SECURITY/);
  });

  it("gives user_roles no client write policy", () => {
    expect(sql).not.toMatch(/CREATE POLICY[^;]*ON public\.user_roles FOR (INSERT|UPDATE|DELETE)/);
  });

  it("resolves roles through a SECURITY DEFINER helper to avoid RLS recursion", () => {
    expect(sql).toMatch(/FUNCTION public\.has_role[\s\S]*?SECURITY DEFINER/);
    expect(sql).toMatch(/FUNCTION public\.is_admin[\s\S]*?SECURITY DEFINER/);
  });

  it("pins search_path on every SECURITY DEFINER function", () => {
    // An unpinned search_path on a definer function is a privilege-escalation
    // primitive: a caller could shadow a referenced object.
    const definers = [...allSql.matchAll(/SECURITY DEFINER([\s\S]{0,200}?)AS \$\$/g)];
    expect(definers.length).toBeGreaterThan(10);
    for (const [, tail] of definers) {
      expect(tail).toMatch(/SET search_path/);
    }
  });
});

describe("audit finding: trade transitions were client-controlled", () => {
  const sql = migration("demo_trade_state_machine");

  it("drops the client INSERT and UPDATE policies on trades", () => {
    expect(sql).toMatch(/DROP POLICY IF EXISTS "Authenticated users can create trades" ON public\.trades/);
    expect(sql).toMatch(/DROP POLICY IF EXISTS "Trade participants can update"\s+ON public\.trades/);
  });

  it("leaves trades with SELECT-only policies", () => {
    const created = [...sql.matchAll(/CREATE POLICY[^;]*?ON public\.trades FOR (\w+)/g)].map(
      (m) => m[1],
    );
    expect(created.length).toBeGreaterThan(0);
    expect(new Set(created)).toEqual(new Set(["SELECT"]));
  });

  it("validates every transition against the edge list", () => {
    expect(sql).toMatch(/IF NOT public\.demo_trade_can_transition\(v_trade\.demo_state, _to\)/);
    expect(sql).toMatch(/INVALID_TRANSITION/);
  });

  it("refuses to move a terminal trade", () => {
    expect(sql).toMatch(/IF v_trade\.demo_state IN \('COMPLETED', 'CANCELLED'\)/);
  });

  it("gates trade creation on approved KYC", () => {
    expect(sql).toMatch(/KYC_REQUIRED/);
    expect(sql).toMatch(/v_kyc IS DISTINCT FROM 'verified'/);
  });
});

describe("audit finding: trades could become self-trades", () => {
  const sql = migration("demo_trade_state_machine");

  it("assigns the human to exactly one side of the trade", () => {
    // One of buyer_id/seller_id is the caller and the other is NULL, so the
    // same account cannot occupy both ends.
    expect(sql).toMatch(/CASE WHEN v_offer\.side = 'BUY'\s+THEN v_uid ELSE NULL END/);
    expect(sql).toMatch(/CASE WHEN v_offer\.side = 'SELL' THEN v_uid ELSE NULL END/);
  });
});

describe("payment details are operator-issued", () => {
  const offers = migration("demo_counterparties_offers_payment_instructions");
  const chat = migration("chat_operator_actions_and_reset");

  it("makes payment instructions readable only by admins", () => {
    expect(offers).toMatch(
      /CREATE POLICY "Payment instructions are admin-only"[\s\S]*?USING \(public\.is_admin\(auth\.uid\(\)\)\)/,
    );
  });

  it("exposes no non-admin policy on the instructions table", () => {
    const policies = [
      ...offers.matchAll(/CREATE POLICY "([^"]+)"\s+ON public\.demo_payment_instructions/g),
    ];
    expect(policies).toHaveLength(1);
  });

  it("requires the admin role to push details into chat", () => {
    expect(chat).toMatch(
      /FUNCTION public\.admin_send_payment_details[\s\S]*?public\.require_admin\(\)/,
    );
  });

  it("stops a client forging a payment-details message", () => {
    expect(chat).toMatch(/IF NEW\.is_payment_details THEN[\s\S]*?RAISE EXCEPTION/);
  });
});

describe("stored payment instructions cannot settle", () => {
  const editor = migration("payment_instruction_editor");

  // The account number is what a buyer reads; the routing identifier is what
  // moves money. The constraint guards the second, which is why the first is
  // free to look like an ordinary account.
  it("constrains every routing identifier to a reserved value", () => {
    const constraint = editor.match(
      /ADD CONSTRAINT demo_payment_instructions_unroutable CHECK \(([\s\S]*?)\);/,
    );
    expect(constraint, "the unroutable constraint is missing").toBeTruthy();
    const body = constraint![1];

    expect(body).toMatch(/routing_number[^\n]*=\s*'000000000'/);
    expect(body).toMatch(/sort_code[^\n]*=\s*'00-00-00'/);
    expect(body).toMatch(/bank_code[^\n]*=\s*'000'/);
    // BIC positions 5-6 are the ISO 3166 country; ZZ is user-assigned and
    // never allocated, so the code cannot resolve.
    expect(body).toMatch(/swift[\s\S]*?from 5 for 2\) = 'ZZ'/);
    // IBAN check digits 00 fail mod-97 for every country code.
    expect(body).toMatch(/iban[\s\S]*?from 3 for 2\) = '00'/);
  });

  it("adds the constraint only after the rows already comply", () => {
    // Both constraints have to be off while the values are restated: the old
    // rows fail the new CHECK, and the new rows fail the old one. Adding the
    // new constraint before the UPDATE aborts the whole migration.
    const dropOld = editor.indexOf("DROP CONSTRAINT IF EXISTS demo_payment_instructions_must_be_fake");
    const restate = editor.indexOf("SET fields = public.build_payment_fields(");
    const addNew = editor.indexOf("ADD CONSTRAINT demo_payment_instructions_unroutable");

    expect(dropOld).toBeGreaterThan(-1);
    expect(restate).toBeGreaterThan(-1);
    expect(addNew).toBeGreaterThan(-1);

    expect(dropOld, "the old constraint must be dropped before the rewrite").toBeLessThan(restate);
    expect(addNew, "the new constraint must be added after the rewrite").toBeGreaterThan(restate);
  });

  it("covers every rail a counterparty can quote", () => {
    // A method with no branch would fall through to the ELSE and be given the
    // wrong country's identifiers -- the bug that shipped sort codes to
    // German sellers.
    const shape = editor.match(/FUNCTION public\.payment_rail_shape([\s\S]*?)\$\$;/)![1];
    for (const method of PAYMENT_METHODS) {
      expect(shape, `${method} has no branch in payment_rail_shape`).toContain(`'${method}'`);
    }
  });

  it("agrees with the client on which shape each method takes", () => {
    // railShapeFor() drives which inputs the operator form renders; the SQL
    // decides what is actually stored. A mismatch means the form collects
    // fields the database then ignores.
    const shape = editor.match(/FUNCTION public\.payment_rail_shape([\s\S]*?)\$\$;/)![1];

    for (const method of PAYMENT_METHODS) {
      if (method === "Bank Transfer") continue; // region-resolved, checked below
      const sqlShape = shape.match(
        new RegExp(`_method = '${method}'\\s*THEN\\s*'(\\w+)'`),
      );
      expect(sqlShape, `no SQL mapping for ${method}`).toBeTruthy();
      expect(railShapeFor(method, "US"), `${method} disagrees`).toBe(sqlShape![1]);
    }

    // Bank Transfer inherits the region's domestic rail on both sides.
    for (const [region, expected] of [
      ["US", "US_WIRE"],
      ["UK", "UK"],
      ["HK", "HK"],
      ["EU", "EU"],
    ] as const) {
      expect(railShapeFor("Bank Transfer", region)).toBe(expected);
    }
  });

  it("never puts a sort code on a non-UK record", () => {
    for (const region of ["US", "EU", "HK"] as const) {
      const { locked, editable } = fieldSetFor("Bank Transfer", region);
      expect([...locked, ...editable]).not.toContain("sort_code");
    }
    expect(fieldSetFor("Bank Transfer", "UK").locked).toContain("sort_code");
  });

  it("identifies a SEPA account by IBAN, not a bare account number", () => {
    const eu = fieldSetFor("SEPA Transfer", "EU");
    expect(eu.locked).toContain("iban");
    const build = editor.match(/FUNCTION public\.build_payment_fields([\s\S]*?)\$\$;/)![1];
    const euBranch = build.match(/WHEN 'EU' THEN jsonb_build_object\(([\s\S]*?)\)\n/)![1];
    expect(euBranch).toContain("iban");
    expect(euBranch).not.toContain("account_number");
  });

  it("gives Hong Kong a clearing code", () => {
    expect(fieldSetFor("FPS Transfer", "HK").locked).toContain("bank_code");
    const build = editor.match(/FUNCTION public\.build_payment_fields([\s\S]*?)\$\$;/)![1];
    expect(build).toMatch(/WHEN 'HK' THEN[\s\S]*?'bank_code', '000'/);
  });

  it("derives the routing identifiers instead of accepting them", () => {
    const fn = editor.match(
      /FUNCTION public\.admin_upsert_payment_instructions\(([\s\S]*?)\)\s*RETURNS/,
    );
    expect(fn, "the editor RPC is missing").toBeTruthy();
    const params = fn![1];

    // If these were parameters, a crafted PostgREST call could set them.
    for (const banned of ["routing_number", "sort_code", "iban", "swift"]) {
      expect(params, `${banned} must not be a parameter`).not.toMatch(
        new RegExp(`_${banned}\\b`),
      );
    }
    expect(params).toMatch(/_bank_name/);
    expect(params).toMatch(/_account_number/);
  });

  it("requires the admin role to write instructions", () => {
    expect(editor).toMatch(
      /FUNCTION public\.admin_upsert_payment_instructions[\s\S]*?public\.require_admin\(\)/,
    );
    expect(editor).toMatch(
      /REVOKE ALL ON FUNCTION public\.admin_upsert_payment_instructions[\s\S]*?FROM public, anon/,
    );
  });

  it("keeps the do-not-send warning on the payment-details message", () => {
    expect(editor).toMatch(/FUNCTION public\.admin_send_payment_details/);
    expect(editor).toMatch(/cannot receive transfers/);
    expect(editor).toMatch(/Do not send money/);
  });
});

describe("chat attachments are scoped to their trade", () => {
  const att = migration("trade_attachments");

  it("keeps the receipts bucket private", () => {
    expect(att).toMatch(/INSERT INTO storage\.buckets[\s\S]*?'trade-receipts'[\s\S]*?false,/);
    // The ON CONFLICT branch must not be able to flip an existing bucket public.
    expect(att).toMatch(/ON CONFLICT \(id\) DO UPDATE[\s\S]*?SET public\s*=\s*false/);
  });

  it("pivots both storage policies on trade membership", () => {
    for (const policy of [
      /CREATE POLICY "Trade attachments readable by participants"[\s\S]*?USING \(([\s\S]*?)\);/,
      /CREATE POLICY "Participants can attach to an open trade"[\s\S]*?WITH CHECK \(([\s\S]*?)\);/,
    ]) {
      const body = att.match(policy);
      expect(body, "policy missing").toBeTruthy();
      expect(body![1]).toMatch(/bucket_id = 'trade-receipts'/);
      expect(body![1]).toMatch(/can_access_trade\(\(storage\.foldername\(name\)\)\[1\]\)/);
    }
  });

  it("confines an upload to the caller's own folder", () => {
    const insert = att.match(
      /CREATE POLICY "Participants can attach to an open trade"[\s\S]*?WITH CHECK \(([\s\S]*?)\);/,
    )![1];
    expect(insert).toMatch(/\(storage\.foldername\(name\)\)\[2\] = auth\.uid\(\)::text/);
  });

  it("exposes no UPDATE or DELETE policy on attachments", () => {
    // Evidence a party could swap after the fact is worse than no evidence.
    expect(att).not.toMatch(/CREATE POLICY[^;]*storage\.objects FOR UPDATE/);
    expect(att).not.toMatch(/CREATE POLICY[^;]*storage\.objects FOR DELETE/);
  });

  it("re-checks attachment ownership on the message row", () => {
    // The storage policy governs the upload; this governs which message may
    // reference it, so a file cannot be attached to a different trade.
    const guard = att.match(/FUNCTION public\.guard_trade_message_role([\s\S]*?)\$\$;/)![1];
    expect(guard).toMatch(/split_part\(NEW\.attachment_path, '\/', 1\) <> NEW\.trade_id::text/);
    expect(guard).toMatch(/split_part\(NEW\.attachment_path, '\/', 2\) <> NEW\.sender_id::text/);
  });

  it("checks attachment ownership before the privileged short-circuit", () => {
    // A SECURITY DEFINER caller posting on a user's behalf still must not be
    // able to point a message at an unrelated object.
    const guard = att.match(/FUNCTION public\.guard_trade_message_role([\s\S]*?)\$\$;/)![1];
    const ownership = guard.indexOf("attachment does not belong to this trade");
    const shortCircuit = guard.indexOf("current_setting('app.privileged'");
    expect(ownership).toBeGreaterThan(-1);
    expect(shortCircuit).toBeGreaterThan(-1);
    expect(ownership).toBeLessThan(shortCircuit);
  });

  it("rejects a trade id that is not a uuid instead of raising", () => {
    // Storage hands the policy a raw path segment, which a crafted key
    // controls. A bare ::uuid cast would error rather than deny.
    const fn = migration("trade_attachments").match(
      /FUNCTION public\.can_access_trade([\s\S]*?)\$\$;/,
    )![1];
    expect(fn).toMatch(/EXCEPTION WHEN others THEN\s*RETURN false/);
  });

  it("requires a message to carry text or a file", () => {
    expect(att).toMatch(
      /CONSTRAINT trade_messages_have_content CHECK \([\s\S]*?attachment_path IS NOT NULL/,
    );
  });
});

describe("seeded market data", () => {
  const offers = migration("demo_counterparties_offers_payment_instructions");

  it("generates offers for all four assets", () => {
    // Offers are produced by crossing counterparties with this VALUES list,
    // so every asset present here is listed for every counterparty trading it.
    for (const asset of ["BTC", "ETH", "SOL", "USDT"]) {
      expect(offers, `${asset} missing from the offer generator`).toMatch(
        new RegExp(`\\('${asset}',`),
      );
    }
  });

  it("keeps every asset covered on both sides of the market", () => {
    // Guards the eight acceptance-test paths: BUY/SELL x BTC/ETH/SOL/USDT.
    const sellerAssets = new Set<string>();
    const buyerAssets = new Set<string>();

    for (const [, kind, assets] of offers.matchAll(
      /'demo_(?:seller|buyer)_\d+','(SELLER|BUYER)'[^\n]*?ARRAY\[((?:'[A-Z]+',?)+)\]/g,
    )) {
      const parsed = [...assets.matchAll(/'([A-Z]+)'/g)].map((m) => m[1]);
      const target = kind === "SELLER" ? sellerAssets : buyerAssets;
      parsed.forEach((a) => target.add(a));
    }

    for (const asset of ["BTC", "ETH", "SOL", "USDT"]) {
      expect(sellerAssets, `no seller trades ${asset}`).toContain(asset);
      expect(buyerAssets, `no buyer trades ${asset}`).toContain(asset);
    }
  });
});

describe("marketplace roster", () => {
  const offers = migration("demo_counterparties_offers_payment_instructions");

  const counterparties = (kind: "SELLER" | "BUYER") =>
    [...offers.matchAll(new RegExp(`'(demo_(?:seller|buyer)_\\d+)','${kind}','([^']+)'`, "g"))];

  it("seeds 10-12 active sellers", () => {
    const sellers = counterparties("SELLER");
    expect(sellers.length).toBeGreaterThanOrEqual(10);
    expect(sellers.length).toBeLessThanOrEqual(12);
  });

  it("seeds 9-12 active buyers", () => {
    const buyers = counterparties("BUYER");
    expect(buyers.length).toBeGreaterThanOrEqual(9);
    expect(buyers.length).toBeLessThanOrEqual(12);
  });

  it("gives every counterparty a distinct, plain-ASCII English display name", () => {
    const names = [...counterparties("SELLER"), ...counterparties("BUYER")].map((m) => m[2]);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name, `"${name}" should be a two-part English name`).toMatch(
        /^[A-Z][a-z]+ [A-Z][a-z]+$/,
      );
    }
    expect(new Set(names).size, "display names must be unique").toBe(names.length);
  });

  it("covers only the US, UK and EU markets", () => {
    const regions = new Set([...offers.matchAll(/,'(US|UK|EU)',\d{3},'mirror_/g)].map((m) => m[1]));
    expect(regions).toEqual(new Set(["US", "UK", "EU"]));
  });

  it("quotes seller premiums inside the 4%-6% band", () => {
    const spreads = [...offers.matchAll(/'(demo_seller_\d+)','SELLER'[\s\S]*?,'(?:US|UK|EU)',(\d{3}),/g)]
      .map((m) => Number(m[2]));
    expect(spreads.length).toBeGreaterThanOrEqual(10);
    for (const bps of spreads) {
      expect(bps, `${bps} bps is outside 400-600`).toBeGreaterThanOrEqual(400);
      expect(bps).toBeLessThanOrEqual(600);
    }
    // The whole point is variation: they must not all be the same number.
    expect(new Set(spreads).size).toBeGreaterThan(1);
  });

  it("quotes buyer discounts inside the 2%-4% band", () => {
    const spreads = [...offers.matchAll(/'(demo_buyer_\d+)','BUYER'[\s\S]*?,'(?:US|UK|EU)',(\d{3}),/g)]
      .map((m) => Number(m[2]));
    expect(spreads.length).toBeGreaterThanOrEqual(9);
    for (const bps of spreads) {
      expect(bps, `${bps} bps is outside 200-400`).toBeGreaterThanOrEqual(200);
      expect(bps).toBeLessThanOrEqual(400);
    }
    expect(new Set(spreads).size).toBeGreaterThan(1);
  });

  it("constrains spreads at the database level too", () => {
    expect(offers).toMatch(/CHECK \(spread_bps BETWEEN 100 AND 800\)/);
  });
});

describe("KYC documents are private", () => {
  const sql = migration("kyc_submissions_and_private_storage");

  it("creates the bucket as non-public", () => {
    expect(sql).toMatch(/'kyc-documents',\s*'kyc-documents',\s*false/);
    expect(sql).toMatch(/SET public\s+= false/);
  });

  it("scopes object reads to the owner or an admin", () => {
    expect(sql).toMatch(/\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
    expect(sql).toMatch(/bucket_id = 'kyc-documents' AND public\.is_admin\(auth\.uid\(\)\)/);
  });

  it("makes submitted evidence immutable", () => {
    expect(sql).not.toMatch(/ON storage\.objects FOR (UPDATE|DELETE)/);
  });
});

describe("balances cannot be minted from the client", () => {
  const sql = migration("admin_roles_and_privilege_lockdown");

  it("guards wallet balances", () => {
    expect(sql).toMatch(/guard_wallet_balances/);
    expect(sql).toMatch(/NEW\.balance\s+IS DISTINCT FROM OLD\.balance/);
  });

  it("removes the client insert policy on the transaction ledger", () => {
    expect(sql).toMatch(
      /DROP POLICY IF EXISTS "Users can insert their own transactions" ON public\.transactions/,
    );
  });

  it("removes the client insert policy on risk events", () => {
    expect(sql).toMatch(
      /DROP POLICY IF EXISTS "Authenticated users can insert risk events" ON public\.risk_events/,
    );
  });
});
