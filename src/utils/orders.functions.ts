import { createServerFn } from "@tanstack/react-start";

import { fromRow, type Order, type OrderRow } from "@/lib/order-store";

type GuestOrderResult = { order: Omit<Order, "contact"> & { contact: { name: string } } } | { error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
