import { createServerFn } from "@tanstack/react-start";

import { DELIVERY, isMenuRef, labelOf, priceOf, type MenuRef } from "@/lib/menu-pricing";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

type OrderCheckoutInput = {
  orderId: string;
  /** Nur Referenz + Menge – Preise berechnet ausschließlich der Server aus der Speisekarte. */
  items: { ref: MenuRef; qty: number }[];
  fulfillment: "pickup" | "delivery";
  customerEmail?: string;
  returnUrl: string;
  environment: StripeEnv;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Erstellt eine eingebettete Bezahl-Session für eine Restaurant-Bestellung.
// Positionen werden dynamisch als price_data angelegt; die Beträge stammen aus menu-data.ts
// (inkl. MwSt.), nie aus dem Browser – so lässt sich der Preis nicht manipulieren.
export const createOrderCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: OrderCheckoutInput) => {
    if (!/^YJ-\d{4}$/.test(data.orderId)) throw new Error("Ungültige Bestellnummer");
    if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 50) {
      throw new Error("Ungültige Positionen");
    }
    for (const item of data.items) {
      if (!isMenuRef(item.ref)) throw new Error("Ungültige Position");
      if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 20)
        throw new Error("Ungültige Menge");
    }
    if (data.fulfillment !== "pickup" && data.fulfillment !== "delivery")
      throw new Error("Ungültige Lieferart");
    if (data.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) {
      throw new Error("Ungültige E-Mail");
    }
    if (typeof data.returnUrl !== "string" || !data.returnUrl.startsWith("http")) {
      throw new Error("Ungültige Rücksprung-Adresse");
    }
    if (data.environment !== "sandbox" && data.environment !== "live")
      throw new Error("Ungültige Umgebung");
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    // Preise serverseitig aus der Speisekarte.
    const lines: { name: string; unitAmount: number; qty: number }[] = [];
    for (const item of data.items) {
      const unitAmount = priceOf(item.ref);
      if (unitAmount === null) {
        return {
          error: `„${item.ref.name}“ gibt es so nicht auf der Speisekarte. Bitte entferne es aus dem Warenkorb.`,
        };
      }
      lines.push({ name: labelOf(item.ref), unitAmount, qty: item.qty });
    }
    const subtotal = lines.reduce((sum, line) => sum + line.unitAmount * line.qty, 0);
    const delivery = data.fulfillment === "delivery";
    const deliveryFeeCents = delivery ? Math.round(DELIVERY.fee * 100) : 0;
    if (delivery && subtotal < Math.round(DELIVERY.minOrder * 100)) {
      return { error: "Der Mindestbestellwert für die Lieferung ist nicht erreicht." };
    }
    const totalCents = subtotal + deliveryFeeCents;

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Die Bestellung wird im Browser angelegt – kurz warten, falls sie noch gespeichert wird.
      let order: { paid: boolean | null; payment: string } | null = null;
      for (let attempt = 0; attempt < 5 && !order; attempt++) {
        if (attempt > 0) await sleep(400);
        const { data: row } = await supabaseAdmin
          .from("orders")
          .select("paid, payment")
          .eq("id", data.orderId)
          .maybeSingle();
        order = row;
      }
      if (!order)
        return { error: "Die Bestellung wurde nicht gefunden. Bitte versuche es erneut." };
      if (order.paid) return { error: "Diese Bestellung ist bereits bezahlt." };
      if (order.payment === "onsite") return { error: "Diese Bestellung wird vor Ort bezahlt." };

      const stripe = createStripeClient(data.environment);
      const lineItems = lines.map((line) => ({
        price_data: {
          currency: "eur",
          product_data: { name: line.name },
          unit_amount: line.unitAmount,
        },
        quantity: line.qty,
      }));
      if (deliveryFeeCents > 0) {
        lineItems.push({
          price_data: {
            currency: "eur",
            product_data: { name: "Lieferung" },
            unit_amount: deliveryFeeCents,
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

      // Session verknüpfen (für den Webhook) und den geprüften Betrag speichern,
      // damit Küche und Beleg genau das zeigen, was abgebucht wird.
      await supabaseAdmin
        .from("orders")
        .update({
          stripe_session_id: session.id,
          total: totalCents / 100,
          delivery_fee: deliveryFeeCents / 100,
        })
        .eq("id", data.orderId);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
