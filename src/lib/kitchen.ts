// Küchen-Logik – rein (ohne Oberfläche/Datenbank), damit sie testbar bleibt.
import type { CartItem } from "@/lib/cart-store";
import type { Order, OrderStatus } from "@/lib/order-store";

export type Lane = "pickup" | "delivery";
export const laneOf = (order: Order): Lane => (order.fulfillment === "delivery" ? "delivery" : "pickup");

/** Für die Küche sichtbar: vor Ort zu zahlen oder online bestätigt bezahlt. */
export const isKitchenOrder = (order: Order) => order.payment === "onsite" || order.paid === true;

/** Status-Bezeichnungen je nach Abholung oder Lieferung. */
export const STAGE_LABEL: Record<Lane, Record<OrderStatus, string>> = {
  pickup: { bestaetigt: "Neu", zubereitung: "In Zubereitung", abholbereit: "Abholbereit", abgeholt: "Abgeholt" },
  delivery: { bestaetigt: "Neu", zubereitung: "In Zubereitung", abholbereit: "Unterwegs", abgeholt: "Zugestellt" },
};

/** Nächster Schritt mit Button-Text – null, wenn erledigt. */
export function nextStep(order: Order): { status: OrderStatus; label: string } | null {
  const lane = laneOf(order);
  switch (order.status) {
    case "bestaetigt":
      return { status: "zubereitung", label: "Zubereitung starten" };
    case "zubereitung":
      return { status: "abholbereit", label: lane === "pickup" ? "Fertig – abholbereit" : "An Fahrer übergeben" };
    case "abholbereit":
      return { status: "abgeholt", label: lane === "pickup" ? "Wurde abgeholt" : "Wurde zugestellt" };
    default:
      return null;
  }
}

/** Einen Schritt zurück (bei Fehlklick). */
export function previousStatus(status: OrderStatus): OrderStatus | null {
  const order: OrderStatus[] = ["bestaetigt", "zubereitung", "abholbereit", "abgeholt"];
  const index = order.indexOf(status);
  return index > 0 ? order[index - 1]! : null;
}

export type Due = { time: string; minutes: number; overdue: boolean; soon: boolean; text: string };

/** Fälligkeit: Uhrzeit + "in 12 Min" / "seit 5 Min überfällig". */
export function dueInfo(order: Order, now: number): Due {
  const minutes = Math.round((order.pickupAt - now) / 60000);
  const done = order.status === "abgeholt" || (order.status === "abholbereit" && laneOf(order) === "pickup");
  const time = new Date(order.pickupAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const overdue = !done && minutes < 0;
  const text = done ? `${time} Uhr` : minutes < 0 ? `${-minutes} Min überfällig` : minutes === 0 ? "jetzt fällig" : minutes < 60 ? `in ${minutes} Min` : `${time} Uhr`;
  return { time, minutes, overdue, soon: !done && minutes >= 0 && minutes <= 10, text };
}

/** Variante und persönliche Notiz einer Position trennen (Notiz hängt im Detailtext hinten an). */
export function splitItem(item: CartItem): { variant: string; note: string } {
  const note = item.note?.trim() ?? "";
  let variant = item.detail ?? "";
  if (note && variant.endsWith(` · ${note}`)) variant = variant.slice(0, -(note.length + 3));
  if (variant === "Standard") variant = "";
  return { variant, note };
}

export const itemCount = (order: Order) => order.items.reduce((sum, item) => sum + item.qty, 0);

/** Zahlung aus Sicht der Mitarbeitenden: schon bezahlt oder noch kassieren? */
export function paymentInfo(order: Order): { paid: boolean; label: string } {
  if (order.payment === "onsite") {
    return { paid: false, label: laneOf(order) === "delivery" ? "bei Übergabe kassieren" : "an der Theke kassieren" };
  }
  return { paid: order.paid === true, label: order.payment === "paypal" ? "Bezahlt mit PayPal" : "Online bezahlt" };
}

/** Reihenfolge in einer Spalte: zuerst die, die am frühesten fertig sein müssen. */
export const byDue = (a: Order, b: Order) => a.pickupAt - b.pickupAt;
