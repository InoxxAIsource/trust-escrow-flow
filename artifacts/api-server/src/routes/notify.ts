import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const notifyRouter = Router();

// ADMIN_EMAIL: set this env var to override. Without a verified Resend sending
// domain, Resend only delivers to the account-owner's address. Once you verify
// a domain at resend.com/domains you can set this to any address you like.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "inoxxprotocol@gmail.com";
// FROM_EMAIL: must use a verified domain once you move beyond Resend test mode.
const FROM_EMAIL = process.env.FROM_EMAIL ?? "P2PxBT <onboarding@resend.dev>";

interface ChatPayload {
  type: "chat";
  tradeRef: string;
  tradeId: string;
  message: string;
  userName: string;
  userEmail: string;
  asset: string;
  amount: string;
}

interface KycPayload {
  type: "kyc";
  userName: string;
  userEmail: string;
  userId: string;
  phone: string;
  country: string;
  submittedAt: string;
}

interface SignupPayload {
  type: "signup";
  username: string;
  userEmail: string;
  signedUpAt: string;
}

type NotifyPayload = ChatPayload | KycPayload | SignupPayload;

notifyRouter.post("/notify", async (req: Request, res: Response) => {
  const payload = req.body as NotifyPayload;

  if (!payload?.type) {
    res.status(400).json({ error: "Missing required field: type" });
    return;
  }

  let subject = "";
  let html = "";

  if (payload.type === "chat") {
    subject = `[P2PxBT] New trade message — ${payload.tradeRef}`;
    html = buildChatHtml(payload);
  } else if (payload.type === "kyc") {
    subject = `[P2PxBT] KYC documents submitted — ${payload.userName || payload.userEmail}`;
    html = buildKycHtml(payload);
  } else if (payload.type === "signup") {
    subject = `[P2PxBT] New user registered — ${payload.username}`;
    html = buildSignupHtml(payload);
  } else {
    res.status(400).json({ error: "Unknown notification type" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "RESEND_API_KEY is not configured" });
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend ${response.status}: ${body}`);
    }

    const data = (await response.json()) as { id: string };
    logger.info({ emailId: data.id, type: payload.type }, "Admin notification sent");
    res.json({ ok: true, id: data.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err, type: payload.type }, "Admin notification failed");
    res.status(500).json({ error: message });
  }
});

export default notifyRouter;

// ── Email HTML builders ───────────────────────────────────────────────────────

function buildChatHtml(p: ChatPayload): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>New trade message</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
              P2PxBT <span style="color:#3b82f6;">Console</span>
            </p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Trade activity notification</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#0f172a;">New message in trade chat</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px;">
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;color:#64748b;width:36%;">Trade ref</td>
                      <td style="font-size:12px;color:#0f172a;font-weight:600;font-family:monospace;">${escHtml(p.tradeRef)}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;color:#64748b;">Asset</td>
                      <td style="font-size:12px;color:#0f172a;">${escHtml(p.asset)} · ${escHtml(p.amount)}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;color:#64748b;">User</td>
                      <td style="font-size:12px;color:#0f172a;">${escHtml(p.userName)} &lt;${escHtml(p.userEmail)}&gt;</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:13px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Message</p>
            <div style="background:#f1f5f9;border-left:3px solid #3b82f6;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#0f172a;line-height:1.6;">${escHtml(p.message)}</p>
            </div>

            <a href="https://p2pxbt.com/admin/trade/${escHtml(p.tradeId)}"
               style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
              Open in Admin Console →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              P2PxBT · This notification was sent because a buyer sent a message on your platform.<br/>
              Reply directly in the admin console at <a href="https://p2pxbt.com/admin" style="color:#3b82f6;">p2pxbt.com/admin</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildKycHtml(p: KycPayload): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>KYC submission</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
              P2PxBT <span style="color:#3b82f6;">Console</span>
            </p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">KYC verification notification</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#0f172a;">KYC documents submitted</p>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
              A user has submitted identity verification documents and is awaiting review.
              Please review the submission in the admin console and approve or reject it.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px;">
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;color:#64748b;width:36%;">Full name</td>
                      <td style="font-size:12px;color:#0f172a;font-weight:600;">${escHtml(p.userName)}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;color:#64748b;">Email</td>
                      <td style="font-size:12px;color:#0f172a;">${escHtml(p.userEmail)}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;color:#64748b;">Phone</td>
                      <td style="font-size:12px;color:#0f172a;">${escHtml(p.phone)}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;color:#64748b;">Country</td>
                      <td style="font-size:12px;color:#0f172a;">${escHtml(p.country)}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;color:#64748b;">Submitted</td>
                      <td style="font-size:12px;color:#0f172a;">${escHtml(p.submittedAt)}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;color:#64748b;">User ID</td>
                      <td style="font-size:12px;color:#0f172a;font-family:monospace;">${escHtml(p.userId)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                ⚠️ Documents are stored securely in private Supabase storage. Open the admin
                console to view and download them — they cannot be attached directly to email.
              </p>
            </div>

            <a href="https://p2pxbt.com/admin/kyc"
               style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
              Review KYC in Admin Console →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              P2PxBT · This notification was sent because a user submitted KYC documents.<br/>
              Manage submissions at <a href="https://p2pxbt.com/admin/kyc" style="color:#3b82f6;">p2pxbt.com/admin/kyc</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildSignupHtml(p: SignupPayload): string {
  const ts = new Date(p.signedUpAt).toLocaleString("en-GB", {
    dateStyle: "full", timeStyle: "short", timeZone: "UTC",
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>New user registration</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
              P2PxBT <span style="color:#3b82f6;">Console</span>
            </p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">New user registration</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a;">A new user just signed up</p>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
              Someone has created a new P2PxBT account. Their details are below.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px;">
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;color:#64748b;width:36%;">Username</td>
                      <td style="font-size:12px;color:#0f172a;font-weight:600;">${escHtml(p.username)}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;color:#64748b;">Email</td>
                      <td style="font-size:12px;color:#0f172a;">${escHtml(p.userEmail)}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;color:#64748b;">Signed up</td>
                      <td style="font-size:12px;color:#0f172a;">${escHtml(ts)} UTC</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <a href="https://p2pxbt.com/admin"
               style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
              Open Admin Console →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              P2PxBT · This notification was sent because a new account was registered on your platform.<br/>
              Manage users at <a href="https://p2pxbt.com/admin" style="color:#3b82f6;">p2pxbt.com/admin</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Minimal HTML entity escaping — prevents XSS in email body. */
function escHtml(str: string | null | undefined): string {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
