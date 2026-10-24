import { createServerFn } from "@tanstack/react-start";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Nach dem Bestellen (Vor-Ort) bzw. nach der Rückkehr von der Zahlung: Bestätigung an den Gast.
// Nur mit dem Gast-Schlüssel der Bestellung; gesendet wird höchstens einmal und bei Online-Zahlung erst wenn bezahlt.
export const sendOrderConfirmation = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; token: string }) => {
    if (typeof data?.id !== "string" || !/^YJ-\d{4,6}$/.test(data.id)) throw new Error("Ungültige Bestellnummer");
    if (typeof data.token !== "string" || !UUID.test(data.token)) throw new Error("Ungültiger Schlüssel");
    return data;
  })
  .handler(async ({ data }): Promise<{ status: "sent" | "skipped" | "failed" }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("orders").select("id").eq("id", data.id).eq("access_token", data.token).maybeSingle();
    if (!row) return { status: "skipped" };
    const { deliverOrderConfirmation } = await import("@/lib/mailer.server");
    return { status: await deliverOrderConfirmation(data.id) };
  });
