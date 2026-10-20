import { createServerFn } from "@tanstack/react-start";

import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

type OrderCheckoutInput = {
  orderId: string;
  items: { name: string; unitAmount: number; qty: number }[];
  deliveryFeeCents: number;
  customerEmail?: string;
  returnUrl: string;
  environment: StripeEnv;
};

// Erstellt eine eingebettete Bezahl-Session für eine Restaurant-Bestellung.
// Die Positionen kommen aus dem Warenkorb (dynamische Preise), die Preise
// der Speisekarte enthalten bereits die MwSt. ("inkl. MwSt.").
export const createOrderCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: OrderCheckoutInput) => {
    if (!/^YJ-\d{4}$/.test(data.orderId)) throw new Error("Ungültige Bestellnummer");
    if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 50) {
      throw new Error("Ungültige Positionen");
    }
    for (const item of data.items) {
      if (typeof item.name !== "string" || item.name.length < 1 || item.name.length > 200) {
        throw new Error("Ungültiger Positionsname");
      }
      if (!Number.isInteger(item.unitAmount) || item.unitAmount < 1 || item.unitAmount > 100000) {
        throw new Error("Ungültiger Preis");
      }
      if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 20) throw new Error("Ungültige Menge");
    }
    if (!Number.isInteger(data.deliveryFeeCents) || data.deliveryFeeCents < 0 || data.deliveryFeeCents > 5000) {
      throw new Error("Ungültige Liefergebühr");
    }
    if (data.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) {
      throw new Error("Ungültige E-Mail");
    }
    if (typeof data.returnUrl !== "string" || !data.returnUrl.startsWith("http")) {
      throw new Error("Ungültige Rücksprung-Adresse");
    }
    if (data.environment !== "sandbox" && data.environment !== "live") throw new Error("Ungültige Umgebung");
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);

      const lineItems = data.items.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: { name: item.name },
          unit_amount: item.unitAmount,
        },
        quantity: item.qty,
      }));
      if (data.deliveryFeeCents > 0) {
        lineItems.push({
          price_data: {
            currency: "eur",
            product_data: { name: "Lieferung" },
            unit_amount: data.deliveryFeeCents,
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        ...(data.customerEmail && { customer_email: data.customerEmail }),
        payment_intent_data: { description: `Yamiin & Jaiyana's Bestellung ${data.orderId}` },
        metadata: { orderId: data.orderId },
      });

      // Bestellung mit der Session verknüpfen, damit der Zahlungs-Webhook sie findet.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", data.orderId);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
