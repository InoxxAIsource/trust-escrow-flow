/**
 * P2PxBT Uptime Monitor
 *
 * Runs health checks against p2pxbt.com every 3 minutes.
 * Sends alert email on first failure, recovery email when restored.
 * Cooldown is per-incident: one alert per outage, not per check.
 */
import { logger } from "./logger.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "inoxxprotocol@gmail.com";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "P2PxBT <onboarding@resend.dev>";
const CHECK_INTERVAL_MS = 3 * 60 * 1_000; // 3 minutes
const TIMEOUT_MS = 10_000;               // 10-second per-request timeout
const STARTUP_DELAY_MS = 45_000;         // wait for server to fully boot before first check

// ─── Targets ─────────────────────────────────────────────────────────────────

interface CheckTarget {
  name: string;
  url: string;
  /** HTTP status codes that count as healthy for this endpoint. */
  okStatuses: number[];
}

const TARGETS: CheckTarget[] = [
  {
    name: "Frontend",
    url: "https://p2pxbt.com",
    okStatuses: [200],
  },
  {
    name: "API Server",
    // 404 is fine — the /api root is not a real route; 5xx means the server is broken.
    url: "https://p2pxbt.com/api",
    okStatuses: [200, 404],
  },
];

// ─── State ───────────────────────────────────────────────────────────────────

export interface EndpointStatus {
  name: string;
  url: string;
  isDown: boolean;
  downSince: string | null;   // ISO string
  lastChecked: string | null; // ISO string
  lastStatus: number | string | null;
}

const state = new Map<string, EndpointStatus>(
  TARGETS.map((t) => [
    t.url,
    { name: t.name, url: t.url, isDown: false, downSince: null, lastChecked: null, lastStatus: null },
  ]),
);

export function getMonitorStatus(): EndpointStatus[] {
  return TARGETS.map((t) => ({ ...state.get(t.url)! }));
}

// ─── Check logic ─────────────────────────────────────────────────────────────

async function checkTarget(
  target: CheckTarget,
): Promise<{ ok: boolean; status: number | string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(target.url, {
      signal: controller.signal,
      redirect: "follow",
      // Don't cache — we want a live probe every time.
      headers: { "Cache-Control": "no-cache" },
    });
    clearTimeout(timer);
    return { ok: target.okStatuses.includes(res.status), status: res.status };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error
      ? (err.name === "AbortError" ? "Timed out after 10s" : err.message)
      : "Network error";
    return { ok: false, status: msg };
  }
}

async function runChecks(): Promise<void> {
  const now = new Date();

  for (const target of TARGETS) {
    const prev = state.get(target.url)!;
    const { ok, status } = await checkTarget(target);

    const updated: EndpointStatus = {
      ...prev,
      isDown: !ok,
      lastChecked: now.toISOString(),
      lastStatus: status,
      downSince: !ok
        ? (prev.isDown ? prev.downSince : now.toISOString()) // first failure: record time
        : null,                                               // recovered: clear
    };
    state.set(target.url, updated);

    if (!ok && !prev.isDown) {
      // ── First failure → alert ─────────────────────────────────────────────
      logger.error({ url: target.url, status }, `[Monitor] DOWN: ${target.name}`);
      try {
        await sendEmail(
          `🔴 [P2PxBT Monitor] ${target.name} is DOWN`,
          buildDownHtml(target.name, target.url, status, now),
        );
        logger.info({ url: target.url }, "[Monitor] Down-alert email sent");
      } catch (err) {
        logger.error({ err }, "[Monitor] Failed to send down-alert email");
      }
    } else if (ok && prev.isDown) {
      // ── Recovered → recovery email ────────────────────────────────────────
      logger.info({ url: target.url, status }, `[Monitor] RECOVERED: ${target.name}`);
      const downSince = prev.downSince ? new Date(prev.downSince) : now;
      try {
        await sendEmail(
          `✅ [P2PxBT Monitor] ${target.name} is back UP`,
          buildUpHtml(target.name, target.url, downSince, now),
        );
        logger.info({ url: target.url }, "[Monitor] Recovery email sent");
      } catch (err) {
        logger.error({ err }, "[Monitor] Failed to send recovery email");
      }
    } else {
      // Normal check — log at debug level to avoid noise
      logger.debug({ url: target.url, status, ok }, `[Monitor] ${target.name} OK`);
    }
  }
}

// ─── Email ────────────────────────────────────────────────────────────────────

async function sendEmail(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("[Monitor] RESEND_API_KEY not set — alert email skipped");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [ADMIN_EMAIL], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

function fmtDate(d: Date): string {
  return d.toUTCString().replace(" GMT", " UTC");
}

function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function emailShell(headerLabel: string, headerColour: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
              P2PxBT <span style="color:#3b82f6;">Monitor</span>
            </p>
            <p style="margin:4px 0 0;font-size:12px;color:${headerColour};">${headerLabel}</p>
          </td>
        </tr>
        <tr><td style="padding:32px;">${body}</td></tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              P2PxBT Uptime Monitor · Checks run every 3 minutes ·
              <a href="https://p2pxbt.com/admin" style="color:#3b82f6;">Admin Console</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildDownHtml(
  name: string,
  url: string,
  status: number | string,
  detectedAt: Date,
): string {
  const body = `
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:.8px;">
      🔴 Service Down
    </p>
    <p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#0f172a;">
      ${esc(name)} is not responding
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff1f2;border:1px solid #fecaca;border-radius:6px;margin-bottom:24px;">
      <tr><td style="padding:16px;">
        <table width="100%" cellpadding="4" cellspacing="0">
          <tr>
            <td style="font-size:12px;color:#64748b;width:36%;">Endpoint</td>
            <td style="font-size:12px;color:#0f172a;font-family:monospace;">${esc(url)}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#64748b;">Status</td>
            <td style="font-size:12px;color:#dc2626;font-weight:600;">${esc(String(status))}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#64748b;">Detected at</td>
            <td style="font-size:12px;color:#0f172a;">${esc(fmtDate(detectedAt))}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 20px;font-size:13px;color:#64748b;line-height:1.6;">
      The service failed to respond within 10 seconds or returned an unexpected status code.
      Check the Replit deployment panel and server logs immediately.
    </p>

    <a href="https://p2pxbt.com/admin"
       style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;
              padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
      Open Admin Console →
    </a>`;

  return emailShell("🔴 Downtime alert", "#fca5a5", body);
}

function buildUpHtml(
  name: string,
  url: string,
  downSince: Date,
  recoveredAt: Date,
): string {
  const downtimeMs = recoveredAt.getTime() - downSince.getTime();

  const body = `
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:.8px;">
      ✅ Service Restored
    </p>
    <p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#0f172a;">
      ${esc(name)} is back online
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin-bottom:24px;">
      <tr><td style="padding:16px;">
        <table width="100%" cellpadding="4" cellspacing="0">
          <tr>
            <td style="font-size:12px;color:#64748b;width:36%;">Endpoint</td>
            <td style="font-size:12px;color:#0f172a;font-family:monospace;">${esc(url)}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#64748b;">Down since</td>
            <td style="font-size:12px;color:#0f172a;">${esc(fmtDate(downSince))}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#64748b;">Recovered at</td>
            <td style="font-size:12px;color:#0f172a;">${esc(fmtDate(recoveredAt))}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#64748b;">Total downtime</td>
            <td style="font-size:12px;color:#0f172a;font-weight:600;">${esc(fmtDuration(downtimeMs))}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 20px;font-size:13px;color:#64748b;line-height:1.6;">
      The service is responding normally again. No further action required unless you
      need to investigate the root cause of the outage.
    </p>

    <a href="https://p2pxbt.com/admin"
       style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;
              padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
      Open Admin Console →
    </a>`;

  return emailShell("✅ Recovery notification", "#86efac", body);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function startMonitor(): void {
  if (process.env.MONITOR_ENABLED === "false") {
    logger.info("[Monitor] Disabled via MONITOR_ENABLED=false");
    return;
  }

  logger.info(
    { intervalMin: CHECK_INTERVAL_MS / 60_000, startupDelayS: STARTUP_DELAY_MS / 1000 },
    "[Monitor] Uptime monitor starting",
  );

  // Delay first check to let the server (and any cold-start DB connections) settle.
  const tid = setTimeout(() => {
    void runChecks();
    setInterval(() => void runChecks(), CHECK_INTERVAL_MS);
  }, STARTUP_DELAY_MS);

  // Don't block process exit.
  if (typeof tid === "object" && "unref" in tid) (tid as NodeJS.Timeout).unref();
}
