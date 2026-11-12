import { createFileRoute } from "@tanstack/react-router";

import { type StripeEnv, type WebhookEvent, verifyWebhook } from "@/lib/stripe.server";

/** Die Felder einer Stripe-Checkout-Session, die der Webhook auswertet. */
type PaidSession = {
  id: string;
  metadata?: { orderId?: unknown } | null;
  currency?: string | null;
  amount_total?: number | null;
  payment_status?: string;
};

// Markiert eine Bestellung als bezahlt, sobald die Zahlung abgeschlossen ist – aber nur, wenn der
// bezahlte Betrag genau zur gespeicherten Bestellung passt. Wirft bei Datenbank-Fehlern, damit Stripe
// das Ereignis später noch einmal schickt.
async function markOrderPaid(session: PaidSession) {
  const orderId = session?.metadata?.orderId;
  if (typeof orderId !== "string" || !/^YJ-\d{4,6}$/.test(orderId)) {
    console.error("Webhook ohne gültige Bestellnummer:", session?.id);
    return;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error } = await supabaseAdmin.from("orders").select("id, paid, payment, total").eq("id", orderId).maybeSingle();
  if (error) throw new Error(`Bestellung ${orderId} nicht lesbar: ${error.message}`);
  if (!order) {
    console.error(`Zahlung ${session.id} für unbekannte Bestellung ${orderId}`);
    return;
  }
  // Ab hier: Geld ist geflossen, passt aber nicht zur Bestellung → nicht freigeben, im Protokoll melden (ggf. erstatten).
  if (order.payment === "onsite") {
    console.error(`Zahlung ${session.id} für Vor-Ort-Bestellung ${orderId} – bitte prüfen`);
    return;
  }
  const expectedCents = Math.round(Number(order.total) * 100);
  if (session.currency !== "eur" || session.amount_total !== expectedCents) {
    console.error(`Zahlung ${session.id}: ${session.amount_total} ${session.currency} passt nicht zu Bestellung ${orderId} (${expectedCents} eur) – bitte prüfen`);
    return;
  }

  if (!order.paid) {
    const { error: updateError } = await supabaseAdmin.from("orders").update({ paid: true, stripe_session_id: session.id }).eq("id", orderId);
    if (updateError) throw new Error(`Bestellung ${orderId} nicht als bezahlt markiert: ${updateError.message}`);
  }
  // Bezahlt → Bestellbestätigung an den Gast (höchstens einmal, auch wenn Stripe das Event wiederholt).
  const { deliverOrderConfirmation } = await import("@/lib/mailer.server");
  await deliverOrderConfirmation(orderId);
}

async function handleEvent(event: WebhookEvent) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as PaidSession;
      // Bei verzögerten Zahlungsarten (z. B. SEPA) erst bei "paid" erfüllen.
      if (session.payment_status === "paid") await markOrderPaid(session);
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await markOrderPaid(event.data.object as PaidSession);
      break;
    default:
      console.log("Unbehandeltes Zahlungs-Event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ?env= wählt nur, mit welchem Geheimnis die Signatur geprüft wird. Ob ein Ereignis echt ist,
        // entscheidet allein die Signatur; verifyWebhook lehnt außerdem Test-Ereignisse am Live-Zugang ab.
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook mit ungültigem env-Parameter:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        let event: WebhookEvent;
        try {
          event = await verifyWebhook(request, env);
        } catch (error) {
          console.error("Webhook abgelehnt:", error instanceof Error ? error.message : error);
          return new Response("Webhook error", { status: 400 });
        }
        try {
          await handleEvent(event);
          return Response.json({ received: true });
        } catch (error) {
          // 500 → Stripe versucht es später erneut; sonst bliebe eine bezahlte Bestellung für die Küche unsichtbar.
          console.error("Webhook-Fehler:", error);
          return new Response("Webhook processing failed", { status: 500 });
        }
      },
    },
  },
});
