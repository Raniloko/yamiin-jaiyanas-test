import { createServerFn } from "@tanstack/react-start";

import { checkOrder, type OrderDraft } from "@/lib/order-rules";
import { fromRow, type Order, type OrderRow } from "@/lib/order-store";
import { SITE } from "@/lib/site-info";

type GuestOrderResult = { order: Omit<Order, "contact"> & { contact: { name: string } } } | { error: string };
type PlaceOrderResult = { order: Order; token: string } | { error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Schutz vor Missbrauch (Fake-Bestellungen für die Küche, Bestätigungs-Mails an fremde Adressen).
// Großzügig genug für echten Betrieb; wer drüber liegt, soll anrufen.
const LIMITS = {
  /** Bestellungen pro E-Mail-Adresse (zählt auch abgebrochene Online-Zahlungen) … */
  perEmail: 5,
  perEmailMinutes: 15,
  /** … und insgesamt in kurzer Zeit. */
  overall: 40,
  overallMinutes: 10,
} as const;

const TOO_MANY = `Gerade gehen ungewöhnlich viele Bestellungen ein. Bitte versuch es in ein paar Minuten noch einmal oder ruf uns an: ${SITE.phone}`;

/** Bestellnummer YJ-123456 aus sicherem Zufall; die Datenbank lehnt doppelte Nummern ab. */
function newOrderId() {
  const [random = 0] = crypto.getRandomValues(new Uint32Array(1));
  return `YJ-${100000 + (random % 900000)}`;
}

// Einziger Weg, eine Bestellung anzulegen. Der Browser schickt nur Auswahl, Zeit und Kontakt;
// Preise, Summe, Bestellnummer, Status und Gast-Schlüssel entstehen hier auf dem Server.
// Die Datenbank erlaubt Gästen kein direktes Schreiben mehr (supabase/sql/0009_server_side_orders.sql).
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: OrderDraft) => data)
  .handler(async ({ data }): Promise<PlaceOrderResult> => {
    const now = Date.now();
    const checked = checkOrder(data, now);
    if ("error" in checked) return checked;
    const draft = checked.order;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const recent = (minutes: number) => new Date(now - minutes * 60000).toISOString();
    const [sameEmail, overall] = await Promise.all([
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("contact->>email", draft.contact.email).gte("created_at", recent(LIMITS.perEmailMinutes)),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", recent(LIMITS.overallMinutes)),
    ]);
    // Lässt sich nicht zählen, wird trotzdem bestellt – ein Zählfehler darf den Laden nicht lahmlegen.
    if (sameEmail.error || overall.error) console.error("[Bestellung] Limit nicht prüfbar:", (sameEmail.error ?? overall.error)?.message);
    if ((sameEmail.count ?? 0) >= LIMITS.perEmail) {
      return { error: `Mit dieser E-Mail wurden gerade schon mehrere Bestellungen aufgegeben. Bitte ruf uns kurz an: ${SITE.phone}` };
    }
    if ((overall.count ?? 0) >= LIMITS.overall) return { error: TOO_MANY };

    const token = crypto.randomUUID();
    const createdAt = new Date(now).toISOString();
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = newOrderId();
      const { data: row, error } = await supabaseAdmin
        .from("orders")
        .insert({
          id,
          created_at: createdAt,
          pickup_at: new Date(draft.pickupAt).toISOString(),
          pickup_label: draft.pickupLabel,
          fulfillment: draft.fulfillment,
          address: draft.address,
          delivery_fee: draft.deliveryFee,
          payment: draft.payment,
          contact: draft.contact,
          note: draft.note,
          items: JSON.parse(JSON.stringify(draft.items)),
          total: draft.total,
          status: "bestaetigt",
          paid: false,
          access_token: token,
        })
        .select("*")
        .single();
      if (error) {
        // 23505 = Bestellnummer schon vergeben → neue Nummer würfeln.
        if (error.code === "23505") continue;
        // Pause und "ausverkauft" meldet der Trigger orders_check_available – die Kasse übersetzt die Meldung.
        if (/ORDERS_PAUSED|SOLD_OUT:/.test(error.message)) return { error: error.message };
        console.error("[Bestellung] Speichern fehlgeschlagen:", error.message);
        return { error: "Deine Bestellung konnte nicht gespeichert werden. Bitte versuch es noch einmal." };
      }
      // Vor Ort: Bestätigung sofort. Online/PayPal sendet der Webhook erst nach der Zahlung.
      if (draft.payment === "onsite") {
        try {
          const { deliverOrderConfirmation } = await import("@/lib/mailer.server");
          await deliverOrderConfirmation(id);
        } catch (cause) {
          console.error("[Bestellung] Bestätigung nicht gesendet:", cause);
        }
      }
      return { order: fromRow(row as unknown as OrderRow), token };
    }
    console.error("[Bestellung] Keine freie Bestellnummer gefunden");
    return { error: "Deine Bestellung konnte nicht gespeichert werden. Bitte versuch es noch einmal." };
  });

// Statusseite für Gäste: Bestellungen sind in der Datenbank nur für Admins lesbar.
// Gäste bekommen ihre eigene Bestellung nur mit dem geheimen Schlüssel, der beim Bestellen
// auf ihrem Gerät gespeichert wurde.
export const getGuestOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; token: string }) => {
    if (typeof data?.id !== "string" || !/^YJ-\d{4,6}$/.test(data.id)) throw new Error("Ungültige Bestellnummer");
    if (typeof data.token !== "string" || !UUID.test(data.token)) throw new Error("Ungültiger Schlüssel");
    return data;
  })
  .handler(async ({ data }): Promise<GuestOrderResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .eq("access_token", data.token)
      .maybeSingle();
    if (error) return { error: "Bestellung konnte nicht geladen werden." };
    if (!row) return { error: "not_found" };
    const order = fromRow(row as unknown as OrderRow);
    // Telefon und E-Mail braucht die Statusseite nicht.
    return { order: { ...order, contact: { name: order.contact.name } } };
  });
