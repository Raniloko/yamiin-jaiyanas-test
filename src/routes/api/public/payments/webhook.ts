import { createFileRoute } from "@tanstack/react-router";

import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

// Markiert eine Bestellung als bezahlt, sobald die Zahlung abgeschlossen ist.
async function markOrderPaid(session: any) {
  const orderId = session?.metadata?.orderId;
  if (typeof orderId !== "string" || !/^YJ-\d{4}$/.test(orderId)) {
    console.error("Webhook ohne gültige Bestellnummer:", session?.id);
    return;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ paid: true, stripe_session_id: session.id })
    .eq("id", orderId);
  if (error) console.error("Bestellung konnte nicht als bezahlt markiert werden:", error.message);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // Bei verzögerten Zahlungsarten (z. B. SEPA) erst bei "paid" erfüllen.
      if (session.payment_status !== "unpaid") {
        await markOrderPaid(session);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await markOrderPaid(event.data.object);
      break;
    default:
      console.log("Unbehandeltes Zahlungs-Event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook mit ungültigem env-Parameter:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (error) {
          console.error("Webhook-Fehler:", error);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
