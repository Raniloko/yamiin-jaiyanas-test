import { ORDER_STEPS, type Order, type OrderStatus } from "@/lib/order-store";

/** Status-Text für Gäste – bei Lieferungen heißen die letzten beiden Schritte anders. */
export function stepText(order: Pick<Order, "fulfillment">, status: OrderStatus) {
  const step = ORDER_STEPS.find((entry) => entry.key === status) ?? ORDER_STEPS[0]!;
  if (order.fulfillment !== "delivery") return { label: step.label, hint: step.hint };
  if (status === "abholbereit") return { label: "Unterwegs", hint: "Dein Essen ist auf dem Weg zu dir." };
  if (status === "abgeholt") return { label: "Zugestellt", hint: "Guten Appetit!" };
  return { label: step.label, hint: step.hint };
}

/** Läuft die Bestellung noch? (heute, nicht abgeholt; unbezahlte Online-Bestellungen nur kurz) */
export function isActiveOrder(order: Order, now: number) {
  if (order.status === "abgeholt") return false;
  if (now - order.createdAt > 12 * 3600000) return false;
  if (order.payment !== "onsite" && !order.paid && now - order.createdAt > 45 * 60000) return false;
  return true;
}
