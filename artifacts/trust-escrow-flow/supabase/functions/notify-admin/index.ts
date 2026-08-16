/**
 * Admin notification dispatcher.
 *
 * Invoked by a database webhook on INSERT into public.admin_notifications
 * (see docs/DEMO_SETUP.md), or directly with { notification_id }.
 *
 * The repository had no email infrastructure, so rather than hardcode a
 * provider this exposes a small abstraction with one implementation (Resend)
 * and an explicit no-op fallback. If no provider is configured the function
 * still succeeds and records that delivery was skipped — a demo must not fail
 * to open a trade just because SMTP is not wired up.
 *
 * Required environment (set via `supabase secrets set`, never committed):
 *   ADMIN_NOTIFICATION_EMAIL  destination address for operator alerts
 *   RESEND_API_KEY            optional; when absent, email is skipped
 *   RESEND_FROM_EMAIL         optional; defaults to onboarding@resend.dev
 *   PUBLIC_SITE_URL           optional; used to build the trade link
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  trade_id: string | null;
  payload: Record<string, unknown>;
}

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<{ delivered: boolean; detail?: string }>;
}

class ResendProvider implements EmailProvider {
  readonly name = "resend";
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Resend responded ${res.status}: ${detail}`);
    }
    return { delivered: true };
  }
}

/** Used when no provider is configured. Keeps the workflow observable in logs. */
class NoopProvider implements EmailProvider {
  readonly name = "noop";
  // deno-lint-ignore require-await
  async send(message: EmailMessage) {
    console.log("[notify-admin] email provider not configured; skipping send", {
      to: message.to,
      subject: message.subject,
    });
    return { delivered: false, detail: "no email provider configured" };
  }
}

function resolveProvider(): EmailProvider {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (apiKey) {
    return new ResendProvider(apiKey, Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev");
  }
  return new NoopProvider();
}

function buildEmail(
  notification: AdminNotificationRow,
  recipient: string,
  siteUrl: string,
): EmailMessage {
  const p = notification.payload ?? {};
  const ref = String(p.trade_ref ?? notification.trade_id ?? "—");
  const tradeUrl = notification.trade_id ? `${siteUrl}/admin/trade/${notification.trade_id}` : "—";

  const lines = [
    notification.body ?? notification.title,
    "",
    `Buyer:           ${String(p.buyer_username ?? "demo user")}`,
    `Demo Seller:     ${String(p.counterparty_name ?? "—")}`,
    `Asset:           ${String(p.asset ?? "—")}`,
    `Amount:          ${String(p.amount ?? "—")}`,
    `Value:           ${String(p.total ?? "—")} USD`,
    `Payment Method:  ${String(p.payment_method ?? "—")}`,
    `Trade ID:        ${ref}`,
    `Trade URL:       ${tradeUrl}`,
    "",
    "— P2PxBT demonstration environment. All counterparties, payment details",
    "  and settlement in this system are simulated. No funds move.",
  ];

  return {
    to: recipient,
    subject: `[P2PxBT Demo] ${notification.title}`,
    text: lines.join("\n"),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const payload = await req.json().catch(() => ({}));
    // Supabase database webhooks deliver the row under `record`.
    const record: Partial<AdminNotificationRow> | undefined = payload.record;
    const notificationId: string | undefined = record?.id ?? payload.notification_id;

    if (!notificationId) {
      return json({ error: "notification_id or record.id is required" }, 400);
    }

    const { data: notification, error } = await supabase
      .from("admin_notifications")
      .select("id, type, title, body, trade_id, payload, email_sent_at")
      .eq("id", notificationId)
      .single();

    if (error) throw error;

    // Idempotency: webhooks can be retried, and duplicate operator alerts are
    // worse than a missed one.
    if (notification.email_sent_at) {
      return json({ ok: true, skipped: "already dispatched" });
    }

    const recipient = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
    if (!recipient) {
      console.warn("[notify-admin] ADMIN_NOTIFICATION_EMAIL is not set");
      return json({ ok: true, skipped: "no recipient configured" });
    }

    const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") ?? "https://p2pxbt.com").replace(/\/$/, "");
    const provider = resolveProvider();
    const result = await provider.send(
      buildEmail(notification as AdminNotificationRow, recipient, siteUrl),
    );

    if (result.delivered) {
      await supabase
        .from("admin_notifications")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", notificationId);
    }

    return json({ ok: true, provider: provider.name, delivered: result.delivered });
  } catch (err) {
    console.error("[notify-admin]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
