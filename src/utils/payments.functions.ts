import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { checkoutLines } from "@/lib/order-rules";
import { paymentsEnvironment, type StripeEnv } from "@/lib/payments-env";
import { createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** So lange nach dem Bestellen lässt sich die Zahlung starten; danach bitte neu bestellen (Abholzeit wäre sonst vorbei). */
const PAYABLE_MINUTES = 30;
/** Stripe verlangt mindestens 30 Minuten Laufzeit – danach verfällt die offene Zahlung von selbst. */
const SESSION_MINUTES = 31;

const FAILED = "Die Zahlung konnte nicht gestartet werden. Bitte versuch es noch einmal oder zahle vor Ort.";

// Erstellt die eingebettete Bezahl-Session für eine gespeicherte Bestellung.
// Der Browser schickt nur Bestellnummer + Gast-Schlüssel. Positionen, Beträge, Rücksprung-Adresse und
// Test-/Live-Umgebung bestimmt der Server – so lässt sich weder der Preis noch die Umgebung manipulieren
// und niemand kann für eine fremde Bestellung eine Zahlung starten.
export const createOrderCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: { orderId: string; token: string }) => {
    if (typeof data?.orderId !== "string" || !/^YJ-\d{4,6}$/.test(data.orderId)) throw new Error("Ungültige Bestellnummer");
    if (typeof data.token !== "string" || !UUID.test(data.token)) throw new Error("Ungültiger Schlüssel");
    return { orderId: data.orderId, token: data.token };
  })
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    let environment: StripeEnv;
    try {
      environment = paymentsEnvironment();
    } catch {
      return { error: "Die Online-Zahlung ist noch nicht eingerichtet. Bitte wähle „Vor Ort zahlen“." };
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .select("id, created_at, paid, payment, fulfillment, items, total, contact")
        .eq("id", data.orderId)
        .eq("access_token", data.token)
        .maybeSingle();
      if (error) {
        console.error("[Zahlung] Bestellung nicht lesbar:", error.message);
        return { error: FAILED };
      }
      if (!order) return { error: "Die Bestellung wurde nicht gefunden. Bitte versuche es erneut." };
      if (order.paid) return { error: "Diese Bestellung ist bereits bezahlt." };
      if (order.payment === "onsite") return { error: "Diese Bestellung wird vor Ort bezahlt." };
      if (Date.now() - Date.parse(order.created_at) > PAYABLE_MINUTES * 60000) {
        return { error: "Diese Bestellung ist abgelaufen. Bitte bestelle noch einmal neu." };
      }

      // Positionen und Summe aus der gespeicherten Bestellung, Preise noch einmal aus der Speisekarte.
      const checked = checkoutLines(order);
      if ("error" in checked) return checked;

      const email = (order.contact as { email?: unknown } | null)?.email;
      const { appOrigin } = await import("@/lib/mailer.server");
      const stripe = createStripeClient(environment);
      const session = await stripe.checkout.sessions.create({
        line_items: checked.lines.map((line) => ({
          price_data: { currency: "eur", product_data: { name: line.name }, unit_amount: line.unitAmount },
          quantity: line.qty,
        })),
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: `${appOrigin(getRequest())}/order-success?id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
        ...(typeof email === "string" && EMAIL.test(email) && { customer_email: email }),
        payment_intent_data: { description: `Yamiin & Jaiyana's Bestellung ${order.id}` },
        client_reference_id: order.id,
        metadata: { orderId: order.id },
      });
      if (typeof session.amount_total === "number" && session.amount_total !== checked.totalCents) {
        console.error(`[Zahlung] Betrag der Session ${session.id} (${session.amount_total}) passt nicht zur Bestellung ${order.id} (${checked.totalCents})`);
        return { error: FAILED };
      }

      // Session verknüpfen – bezahlt markiert erst der Webhook.
      const { error: linkError } = await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id).eq("paid", false);
      if (linkError) console.error("[Zahlung] Session nicht verknüpft:", linkError.message);

      return session.client_secret ? { clientSecret: session.client_secret } : { error: FAILED };
    } catch (error) {
      // Einzelheiten nur ins Server-Protokoll – der Gast bekommt eine verständliche Meldung.
      console.error("[Zahlung] Stripe-Fehler:", getStripeErrorMessage(error));
      return { error: FAILED };
    }
  });
