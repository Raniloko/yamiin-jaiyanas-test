// E-Mail-Versand über Resend. Nur auf dem Server verwenden – die Schlüssel liegen ausschließlich in process.env.
//  * Eigenes Hosting (Vercel): RESEND_API_KEY ist ein echter Resend-Schlüssel (re_…) → direkt an api.resend.com.
//  * Lovable: RESEND_API_KEY ist ein Verbindungsschlüssel des Lovable-Connectors → über das Connector-Gateway
//    (braucht zusätzlich LOVABLE_API_KEY).
import { SITE } from "@/lib/site-info";

const RESEND_API = "https://api.resend.com";
const GATEWAY = "https://connector-gateway.lovable.dev/resend";

/** Absender auf der in Resend bestätigten Domain. */
export const SENDERS = {
  orders: `${SITE.name} <bestellung@yamiin-jaiyanas.de>`,
  team: `${SITE.name} Team <team@yamiin-jaiyanas.de>`,
} as const;

export type EmailMessage = { to: string; subject: string; html: string; text: string };

export async function sendEmail(from: keyof typeof SENDERS, message: EmailMessage): Promise<{ ok: true } | { ok: false; error: string }> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  const direct = resendKey?.startsWith("re_") === true;
  if (!resendKey || (!direct && !lovableKey)) {
    console.error("[E-Mail] RESEND_API_KEY fehlt (oder LOVABLE_API_KEY für den Lovable-Connector) – E-Mail-Versand ist nicht eingerichtet.");
    return { ok: false, error: "E-Mail-Versand ist nicht eingerichtet." };
  }
  try {
    const response = await fetch(direct ? `${RESEND_API}/emails` : `${GATEWAY}/emails`, {
      method: "POST",
      headers: direct
        ? { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }
        : { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": resendKey, "Content-Type": "application/json" },
      body: JSON.stringify({ from: SENDERS[from], reply_to: SITE.email, ...message }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error(`[E-Mail] Resend ${response.status}:`, detail.slice(0, 300));
      return { ok: false, error: "Die E-Mail konnte nicht verschickt werden." };
    }
    return { ok: true };
  } catch (error) {
    console.error("[E-Mail] Versand fehlgeschlagen:", error);
    return { ok: false, error: "Die E-Mail konnte nicht verschickt werden." };
  }
}
