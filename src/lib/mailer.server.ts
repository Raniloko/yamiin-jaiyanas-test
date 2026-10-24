// Wann welche Mail rausgeht – nur Server (Service-Rolle). Vorlagen: email-templates.ts, Versand: email.server.ts.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendEmail } from "@/lib/email.server";
import { orderConfirmationEmail } from "@/lib/email-templates";
import { fromRow, type OrderRow } from "@/lib/order-store";
import { SITE } from "@/lib/site-info";

const OWN_HOST = /^https:\/\/([a-z0-9-]+\.)*(yamiin-jaiyanas\.de|lovable\.app)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** Basis für Links in Mails: die Seite, von der die Anfrage kam – nur eigene Domains, sonst die Hauptadresse. */
export function appOrigin(request: Request | undefined) {
  const origin = request?.headers.get("origin") ?? "";
  return OWN_HOST.test(origin) ? origin : SITE.url;
}

/**
 * Bestellbestätigung genau einmal: Vor-Ort-Bestellungen sofort, Online/PayPal erst wenn bezahlt.
 * Der Platzhalter `confirmation_sent_at` wird atomar gesetzt – doppelte Aufrufe (Gast + Webhook) senden nicht doppelt.
 */
export async function deliverOrderConfirmation(id: string): Promise<"sent" | "skipped" | "failed"> {
  const { data: row, error } = await supabaseAdmin
    .from("orders")
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq("id", id)
    .is("confirmation_sent_at", null)
    .or("payment.eq.onsite,paid.eq.true")
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[E-Mail] Bestellung konnte nicht geladen werden:", error.message);
    return "failed";
  }
  if (!row) return "skipped";
  const order = fromRow(row as unknown as OrderRow);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.contact.email)) return "skipped";

  const statusUrl = `${SITE.url}/order-success?id=${encodeURIComponent(order.id)}&t=${encodeURIComponent(row.access_token)}`;
  const result = await sendEmail("orders", orderConfirmationEmail(order, statusUrl));
  if (!result.ok) {
    // Wieder freigeben, damit ein späterer Aufruf (z. B. Webhook-Wiederholung) es erneut versucht.
    await supabaseAdmin.from("orders").update({ confirmation_sent_at: null }).eq("id", id);
    return "failed";
  }
  return "sent";
}

const LIMITS = { invite: 5, recovery: 3, email_change: 3 } as const;

/** Höchstens ein paar Team-Mails pro Adresse und Stunde – schützt Postfächer und das Resend-Kontingent. */
export async function allowAuthMail(email: string, kind: keyof typeof LIMITS): Promise<boolean> {
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("auth_mail_log")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .eq("kind", kind)
    .gte("sent_at", since);
  if (error) {
    console.error("[E-Mail] Protokoll nicht lesbar:", error.message);
    return false;
  }
  if ((count ?? 0) >= LIMITS[kind]) return false;
  await supabaseAdmin.from("auth_mail_log").insert({ email, kind });
  return true;
}
