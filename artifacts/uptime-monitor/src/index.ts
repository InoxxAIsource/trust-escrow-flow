/**
 * P2PxBT Uptime Monitor — standalone process
 *
 * Runs completely independently of the API server process.
 * Checks the live site every 3 minutes from the outside.
 * Sends one alert email per incident; one recovery email when restored.
 *
 * Also exposes a tiny HTTP status server so Replit can detect the port.
 */

import http from "node:http";
import { readFileSync, writeFileSync } from "node:fs";

// ─── Config ─────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "inoxxprotocol@gmail.com";
const FROM_EMAIL  = process.env.FROM_EMAIL  ?? "P2PxBT <onboarding@resend.dev>";
const INTERVAL_MS = 3 * 60 * 1_000; // 3 minutes
const TIMEOUT_MS  = 10_000;          // 10-second per-probe timeout
const STATE_FILE  = "/tmp/p2pxbt-monitor-state.json";

// ─── Targets ────────────────────────────────────────────────────────────────

interface Target {
  name: string;
  url: string;
  /** Returns true when the response counts as healthy. */
  isHealthy(status: number, body: string): boolean;
}

const TARGETS: Target[] = [
  {
    name: "Frontend",
    url: "https://p2pxbt.com",
    isHealthy: (status) => status === 200,
  },
  {
    name: "API Server",
    // Probe the explicit healthz endpoint — a 404 on /api proves nothing.
    url: "https://p2pxbt.com/api/healthz",
    isHealthy: (status, body) => {
      if (status !== 200) return false;
      try {
        const json = JSON.parse(body) as { status?: string };
        return json.status === "ok";
      } catch {
        return false;
      }
    },
  },
];

// ─── State ───────────────────────────────────────────────────────────────────

interface EndpointState {
  isDown: boolean;
  downSince: string | null; // ISO timestamp
  lastChecked: string | null;
  lastStatus: number | string | null;
}

type MonitorState = Record<string, EndpointState>;

function loadState(): MonitorState {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8")) as MonitorState;
  } catch {
    return {};
  }
}

function saveState(s: MonitorState): void {
  try {
    writeFileSync(STATE_FILE, JSON.stringify(s, null, 2), "utf8");
  } catch (err) {
    console.error("[Monitor] Failed to write state file:", err);
  }
}

const monitorState: MonitorState = loadState();

// Ensure every target has an entry.
for (const t of TARGETS) {
  if (!monitorState[t.url]) {
    monitorState[t.url] = {
      isDown: false,
      downSince: null,
      lastChecked: null,
      lastStatus: null,
    };
  }
}

// ─── Probe ───────────────────────────────────────────────────────────────────

async function probe(
  target: Target,
): Promise<{ healthy: boolean; status: number | string; body: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(target.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "Cache-Control": "no-cache", "User-Agent": "P2PxBT-Monitor/1.0" },
    });
    clearTimeout(timer);
    const body = await res.text();
    return { healthy: target.isHealthy(res.status, body), status: res.status, body };
  } catch (err) {
    clearTimeout(timer);
    const msg =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Timed out (>10 s)"
          : err.message
        : "Network error";
    return { healthy: false, status: msg, body: "" };
  }
}

// ─── Email ────────────────────────────────────────────────────────────────────

async function sendEmail(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Monitor] RESEND_API_KEY not set — skipping email");
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
  const data = (await res.json()) as { id: string };
  console.log(`[Monitor] Email sent (id=${data.id})`);
}

// ─── Email HTML builders ─────────────────────────────────────────────────────

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(iso: string): string {
  return new Date(iso).toUTCString().replace(" GMT", " UTC");
}

function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function shell(headerSub: string, accent: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
<tr><td style="background:#0f172a;padding:24px 32px;">
  <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-.3px;">P2PxBT <span style="color:#3b82f6;">Monitor</span></p>
  <p style="margin:4px 0 0;font-size:12px;color:${accent};">${headerSub}</p>
</td></tr>
<tr><td style="padding:32px;">${body}</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #e2e8f0;">
  <p style="margin:0;font-size:11px;color:#94a3b8;">P2PxBT Uptime Monitor · checks every 3 min ·
  <a href="https://p2pxbt.com/admin" style="color:#3b82f6;">Admin Console</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function buildDownEmail(
  name: string,
  url: string,
  status: number | string,
  detectedAt: string,
): string {
  return shell(
    "🔴 Downtime alert",
    "#fca5a5",
    `<p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:.8px;">🔴 Service Down</p>
<p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#0f172a;">${esc(name)} is not responding</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff1f2;border:1px solid #fecaca;border-radius:6px;margin-bottom:24px;">
<tr><td style="padding:16px;"><table width="100%" cellpadding="4" cellspacing="0">
<tr><td style="font-size:12px;color:#64748b;width:36%;">Endpoint</td><td style="font-size:12px;color:#0f172a;font-family:monospace;">${esc(url)}</td></tr>
<tr><td style="font-size:12px;color:#64748b;">Status</td><td style="font-size:12px;color:#dc2626;font-weight:600;">${esc(String(status))}</td></tr>
<tr><td style="font-size:12px;color:#64748b;">Detected at</td><td style="font-size:12px;color:#0f172a;">${esc(fmtDate(detectedAt))}</td></tr>
</table></td></tr></table>
<p style="margin:0 0 20px;font-size:13px;color:#64748b;line-height:1.6;">
The service failed to respond within 10 seconds or returned an unexpected status. Check the Replit deployment panel immediately.
</p>
<a href="https://p2pxbt.com/admin" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">Open Admin Console →</a>`,
  );
}

function buildUpEmail(
  name: string,
  url: string,
  downSince: string,
  recoveredAt: string,
): string {
  const ms = new Date(recoveredAt).getTime() - new Date(downSince).getTime();
  return shell(
    "✅ Recovery notification",
    "#86efac",
    `<p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:.8px;">✅ Service Restored</p>
<p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#0f172a;">${esc(name)} is back online</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin-bottom:24px;">
<tr><td style="padding:16px;"><table width="100%" cellpadding="4" cellspacing="0">
<tr><td style="font-size:12px;color:#64748b;width:36%;">Endpoint</td><td style="font-size:12px;color:#0f172a;font-family:monospace;">${esc(url)}</td></tr>
<tr><td style="font-size:12px;color:#64748b;">Down since</td><td style="font-size:12px;color:#0f172a;">${esc(fmtDate(downSince))}</td></tr>
<tr><td style="font-size:12px;color:#64748b;">Recovered at</td><td style="font-size:12px;color:#0f172a;">${esc(fmtDate(recoveredAt))}</td></tr>
<tr><td style="font-size:12px;color:#64748b;">Total downtime</td><td style="font-size:12px;color:#0f172a;font-weight:600;">${esc(fmtDuration(ms))}</td></tr>
</table></td></tr></table>
<a href="https://p2pxbt.com/admin" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">Open Admin Console →</a>`,
  );
}

// ─── Main check loop ──────────────────────────────────────────────────────────

async function runChecks(): Promise<void> {
  const now = new Date().toISOString();
  console.log(`[Monitor] Running checks at ${now}`);

  for (const target of TARGETS) {
    const prev = monitorState[target.url]!;
    const { healthy, status } = await probe(target);

    monitorState[target.url] = {
      isDown: !healthy,
      downSince: !healthy ? (prev.isDown ? prev.downSince : now) : null,
      lastChecked: now,
      lastStatus: status,
    };

    const curr = monitorState[target.url]!;

    if (!healthy && !prev.isDown) {
      // ── First failure ─────────────────────────────────────────────────────
      console.error(`[Monitor] DOWN: ${target.name} — status: ${status}`);
      try {
        await sendEmail(
          `🔴 [P2PxBT Monitor] ${target.name} is DOWN`,
          buildDownEmail(target.name, target.url, status, now),
        );
      } catch (err) {
        console.error("[Monitor] Failed to send down alert:", err);
      }
    } else if (healthy && prev.isDown) {
      // ── Recovery ──────────────────────────────────────────────────────────
      console.log(`[Monitor] RECOVERED: ${target.name}`);
      try {
        await sendEmail(
          `✅ [P2PxBT Monitor] ${target.name} is back UP`,
          buildUpEmail(target.name, target.url, prev.downSince ?? now, now),
        );
      } catch (err) {
        console.error("[Monitor] Failed to send recovery email:", err);
      }
    } else {
      console.log(
        `[Monitor] ${target.name} — ${healthy ? "OK" : "still DOWN"} (status: ${status})`,
      );
    }

    saveState(monitorState);
  }
}

// ─── HTTP status server ───────────────────────────────────────────────────────
// Exposes port so Replit can detect the process is running.
// Also serves live monitor state at GET /.

const PORT = Number(process.env.PORT ?? 9000);

const httpServer = http.createServer((_req, res) => {
  const endpoints = TARGETS.map((t) => ({
    name: t.name,
    url: t.url,
    ...monitorState[t.url],
  }));
  const anyDown = endpoints.some((e) => e.isDown);
  res.writeHead(anyDown ? 503 : 200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify(
      { ok: !anyDown, checkedAt: new Date().toISOString(), endpoints },
      null,
      2,
    ),
  );
});

httpServer.listen(PORT, () => {
  console.log(`[Monitor] HTTP status server listening on port ${PORT}`);
});

// ─── Start ────────────────────────────────────────────────────────────────────

console.log("[Monitor] P2PxBT Uptime Monitor starting");
console.log(`[Monitor] Watching: ${TARGETS.map((t) => t.url).join(", ")}`);
console.log(`[Monitor] Alerts → ${ADMIN_EMAIL}`);
console.log(`[Monitor] Check interval: 3 min | Timeout: 10 s`);

// First check after 30 s to let the monitor HTTP server bind.
setTimeout(() => {
  void runChecks();
  setInterval(() => void runChecks(), INTERVAL_MS);
}, 30_000);
