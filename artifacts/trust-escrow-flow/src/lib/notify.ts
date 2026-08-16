/**
 * Admin notification utilities.
 *
 * Each helper fires-and-forgets: notification failures are logged to the
 * console but never surface as errors to the user. The main trade/KYC
 * flows must not be blocked by an email delivery issue.
 */

const API_BASE = "/api";

/** Send an email notification to the platform admin. */
async function post(payload: Record<string, unknown>): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.status.toString());
      console.warn("[notify] Admin notification failed:", text);
    }
  } catch (err) {
    console.warn("[notify] Admin notification error:", err);
  }
}

/** Notify admin that a user sent a message in a trade. */
export async function notifyAdminChatMessage(opts: {
  tradeRef: string;
  tradeId: string;
  message: string;
  userName: string;
  userEmail: string;
  asset: string;
  amount: string;
}): Promise<void> {
  await post({ type: "chat", ...opts });
}

/** Notify admin that a user submitted KYC verification documents. */
export async function notifyAdminKyc(opts: {
  userName: string;
  userEmail: string;
  userId: string;
  country: string;
  submittedAt: string;
}): Promise<void> {
  await post({ type: "kyc", ...opts });
}
