import type { AdminData } from "@/lib/admin-data";
import { inRange } from "@/lib/admin-metrics";

export const PAYMENT_LABEL = { onsite: "Vor Ort", online: "Karte & Wallet", paypal: "PayPal" } as const;

/** Bestellungen im gewählten Zeitraum und im gleich langen Vorzeitraum. */
export function scopeOrders(data: AdminData) {
  const { orders, bounds } = data;
  return {
    current: orders.filter((order) => inRange(order, bounds.from, bounds.to)),
    previous: bounds.prevFrom ? orders.filter((order) => inRange(order, bounds.prevFrom, bounds.prevTo)) : null,
  };
}
