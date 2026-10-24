// E-Mail-Versand über Resend (Lovable Connector-Gateway). Nur auf dem Server verwenden –
// die Schlüssel (LOVABLE_API_KEY, RESEND_API_KEY) liegen ausschließlich in process.env.
import { SITE } from "@/lib/site-info";

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
  if (!lovableKey || !resendKey) {
    console.error("[E-Mail] LOVABLE_API_KEY oder RESEND_API_KEY fehlt – ist Resend mit dem Projekt verknüpft?");
    return { ok: false, error: "E-Mail-Versand ist nicht eingerichtet." };
  }
  try {
    const response = await fetch(`${GATEWAY}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
        "Content-Type": "application/json",
      },
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
