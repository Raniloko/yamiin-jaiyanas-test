// Regeln für eine neue Bestellung. Der Server (placeOrder, createOrderCheckout) prüft damit alles,
// was aus dem Browser kommt: Positionen, Preise, Zeit, Kontakt, Liefergebiet. Der Browser schickt
// nur, WAS bestellt wird – Name, Preis und Summe jeder Position entstehen hier aus der Speisekarte.
// Rein gehalten (keine Datenbank, keine Uhr), damit sich jede Regel testen lässt.
import type { CartItem } from "@/lib/cart-store";
import { acais, bowls, iceBurgers, matchas, wraps } from "@/lib/menu-data";
import { CUSTOM_STEPS, DELIVERY, customDetail, isMenuRef, labelOf, priceOf, type MenuRef } from "@/lib/menu-pricing";
import type { Fulfillment, Order } from "@/lib/order-store";
import { PREP_MINUTES } from "@/lib/pickup-slots";
import { SITE } from "@/lib/site-info";

type Payment = Order["payment"];
type Address = { street: string; zip: string; city: string };

/** Was der Browser beim Bestellen schickt. */
export type OrderDraft = {
  items: { ref: MenuRef; qty: number; note?: string }[];
  fulfillment: Fulfillment;
  /** "asap" oder die gewählte Wunschzeit als Zeitstempel (ms). */
  pickup: "asap" | number;
  payment: Payment;
  contact: { name: string; phone: string; email: string };
  address?: Address;
  note: string;
};

/** Geprüfte Bestellung – alle Beträge in Euro, vom Server berechnet. */
export type CheckedOrder = {
  pickupAt: number;
  pickupLabel: string;
  fulfillment: Fulfillment;
  address: Address | null;
  deliveryFee: number;
  payment: Payment;
  contact: { name: string; phone: string; email: string };
  note: string;
  items: CartItem[];
  total: number;
};

export const ORDER_LIMITS = {
  lines: 50,
  qtyPerLine: 20,
  qtyTotal: 100,
  itemNote: 200,
  note: 500,
  name: 80,
  phone: 30,
  email: 200,
  street: 120,
  city: 60,
  /** Wunschzeit frühestens so viele Minuten in der Zukunft (die Kasse bietet erst ab 30 Min an). */
  slotLeadMinutes: 20,
  /** Wunschzeit höchstens so viele Tage im Voraus. */
  slotDaysAhead: 7,
  /** Raster der Wunschzeiten und Abstand der letzten Zeit zum Ladenschluss – wie in pickup-slots.ts. */
  slotStepMinutes: 15,
  slotBeforeCloseMinutes: 15,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9 ()/-]{7,}$/;
const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

// ============= Uhrzeit des Ladens (Europe/Berlin – der Server läuft in UTC) =============

const BERLIN = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Berlin",
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Wochentag, Minuten seit Mitternacht und laufende Tagesnummer in Hanauer Ortszeit. */
export function shopTime(time: number): { weekday: number; minutes: number; dayNumber: number } {
  const parts: Record<string, string> = {};
  for (const part of BERLIN.formatToParts(new Date(time))) parts[part.type] = part.value;
  return {
    weekday: WEEKDAY_INDEX[parts["weekday"] ?? ""] ?? 0,
    minutes: Number(parts["hour"]) * 60 + Number(parts["minute"]),
    dayNumber: Math.round(Date.UTC(Number(parts["year"]), Number(parts["month"]) - 1, Number(parts["day"])) / 86400000),
  };
}

const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Abhol- bzw. Lieferzeit prüfen und beschriften. */
function checkPickup(pickup: unknown, fulfillment: Fulfillment, now: number): { pickupAt: number; pickupLabel: string } | { error: string } {
  const prep = PREP_MINUTES[fulfillment];
  if (pickup === "asap") {
    const { weekday, minutes } = shopTime(now);
    const hours = SITE.openingHours[weekday];
    if (!hours || minutes < hours[0] || minutes + prep > hours[1]) {
      return { error: "Wir haben gerade geschlossen. Bitte wähle eine Wunschzeit innerhalb unserer Öffnungszeiten." };
    }
    return { pickupAt: now + prep * 60000, pickupLabel: "Schnellstmöglich" };
  }
  if (typeof pickup !== "number" || !Number.isSafeInteger(pickup)) return { error: "Bitte wähle eine Abholzeit." };
  if (pickup < now + ORDER_LIMITS.slotLeadMinutes * 60000) {
    return { error: "Die gewählte Zeit ist nicht mehr möglich. Bitte wähle eine spätere Zeit." };
  }
  if (pickup > now + ORDER_LIMITS.slotDaysAhead * 86400000) return { error: "So weit im Voraus können wir keine Bestellung annehmen." };
  const slot = shopTime(pickup);
  const hours = SITE.openingHours[slot.weekday];
  const onGrid = pickup % 60000 === 0 && slot.minutes % ORDER_LIMITS.slotStepMinutes === 0;
  if (!hours || !onGrid || slot.minutes < hours[0] || slot.minutes > hours[1] - ORDER_LIMITS.slotBeforeCloseMinutes) {
    return { error: "Die gewählte Zeit liegt außerhalb unserer Öffnungszeiten. Bitte wähle eine andere Zeit." };
  }
  const offset = slot.dayNumber - shopTime(now).dayNumber;
  const day = offset === 0 ? "Heute" : offset === 1 ? "Morgen" : (WEEKDAYS[slot.weekday] ?? "");
  return { pickupAt: pickup, pickupLabel: `${day} ${clock(slot.minutes)} Uhr` };
}

// ============= Positionen =============

const products = [...matchas, ...acais, ...iceBurgers, ...wraps];

/** Variante einer Position, wie Warenkorb und Küche sie anzeigen (ohne Notiz). */
function variantOf(ref: MenuRef): string {
  if (ref.kind === "custom") return customDetail(ref);
  if (ref.kind === "bowl") return `${ref.size === "small" ? "Klein" : "Groß"} · ${ref.base}`;
  return ref.option || "Standard";
}

function imageOf(ref: MenuRef): string {
  if (ref.kind === "bowl") return bowls.find((item) => item.name === ref.name)?.image ?? "";
  if (ref.kind === "product") return products.find((item) => item.name === ref.name)?.image ?? "";
  return "";
}

/** Nur die bekannten Felder einer Referenz übernehmen – was der Browser sonst mitschickt, wird nicht gespeichert. */
function cleanRef(ref: MenuRef): MenuRef {
  if (ref.kind === "bowl") return { kind: "bowl", name: ref.name, size: ref.size, base: ref.base };
  if (ref.kind === "coffee") return { kind: "coffee", name: ref.name, option: ref.option };
  if (ref.kind === "custom") {
    const picks: Record<string, string[]> = {};
    for (const step of CUSTOM_STEPS) {
      const list = ref.picks[step.id];
      if (list?.length) picks[step.id] = [...list];
    }
    return { kind: "custom", name: ref.name, size: ref.size, base: ref.base, picks };
  }
  return { kind: "product", name: ref.name, ...(ref.option ? { option: ref.option } : {}) };
}

/** Mehrzeiliger Text (Hinweis an die Küche): gekürzt um Leerraum am Rand, null wenn zu lang oder kein Text. */
const text = (value: unknown, max: number): string | null => (typeof value === "string" && value.trim().length <= max ? value.trim() : null);
/** Einzeiliger Text (Name, Straße, Notiz zur Position): Zeilenumbrüche und Mehrfach-Leerzeichen werden zu einem Leerzeichen. */
const line = (value: unknown, max: number): string | null => (typeof value === "string" ? text(value.replace(/\s+/g, " "), max) : null);

/**
 * Eine Bestellung aus dem Browser prüfen und mit den Preisen der Speisekarte neu aufbauen.
 * `now` = Serverzeit in ms.
 */
export function checkOrder(input: unknown, now: number): { order: CheckedOrder } | { error: string } {
  const invalid = { error: "Deine Bestellung ist unvollständig. Bitte lade die Seite neu und versuch es noch einmal." };
  if (!input || typeof input !== "object") return invalid;
  const draft = input as Record<string, unknown>;

  const fulfillment = draft["fulfillment"];
  if (fulfillment !== "pickup" && fulfillment !== "delivery") return invalid;
  const payment = draft["payment"];
  if (payment !== "online" && payment !== "paypal" && payment !== "onsite") return invalid;

  // Positionen: nur Referenz, Menge und Notiz zählen – alles andere kommt aus der Speisekarte.
  const rawItems = draft["items"];
  if (!Array.isArray(rawItems) || rawItems.length < 1) return { error: "Dein Warenkorb ist leer." };
  if (rawItems.length > ORDER_LIMITS.lines) return { error: "So viele verschiedene Positionen können wir online nicht annehmen. Bitte ruf uns an." };
  const items: CartItem[] = [];
  let subtotalCents = 0;
  let pieces = 0;
  for (const raw of rawItems as unknown[]) {
    if (!raw || typeof raw !== "object") return invalid;
    const { ref: rawRef, qty, note: rawNote } = raw as { ref?: unknown; qty?: unknown; note?: unknown };
    if (!isMenuRef(rawRef)) return invalid;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > ORDER_LIMITS.qtyPerLine) {
      return { error: `Pro Position sind höchstens ${ORDER_LIMITS.qtyPerLine} Stück möglich.` };
    }
    const note = rawNote === undefined ? "" : line(rawNote, ORDER_LIMITS.itemNote);
    if (note === null) return { error: `Eine Notiz darf höchstens ${ORDER_LIMITS.itemNote} Zeichen lang sein.` };
    const cents = priceOf(rawRef);
    if (cents === null) return { error: `„${rawRef.name.slice(0, 60)}“ gibt es so nicht auf der Speisekarte. Bitte entferne es aus dem Warenkorb.` };
    const ref = cleanRef(rawRef);
    const variant = variantOf(ref);
    items.push({
      id: `${ref.name}-${variant}-${note}`,
      name: ref.name,
      detail: `${variant}${note ? ` · ${note}` : ""}`,
      price: cents / 100,
      image: imageOf(ref),
      qty,
      ref,
      ...(note ? { note } : {}),
    });
    subtotalCents += cents * qty;
    pieces += qty;
  }
  if (pieces > ORDER_LIMITS.qtyTotal) return { error: "So große Bestellungen nehmen wir gern telefonisch an." };

  // Kontakt
  const contact = (draft["contact"] ?? {}) as Record<string, unknown>;
  const name = line(contact["name"], ORDER_LIMITS.name);
  const phone = line(contact["phone"], ORDER_LIMITS.phone);
  const email = line(contact["email"], ORDER_LIMITS.email)?.toLowerCase() ?? null;
  if (!name || name.length < 2) return { error: "Bitte gib deinen Namen ein." };
  if (!phone || !PHONE.test(phone)) return { error: "Bitte gib eine gültige Telefonnummer ein." };
  if (!email || !EMAIL.test(email)) return { error: "Bitte gib eine gültige E-Mail ein." };
  const note = draft["note"] === undefined ? "" : text(draft["note"], ORDER_LIMITS.note);
  if (note === null) return { error: `Der Hinweis an die Küche darf höchstens ${ORDER_LIMITS.note} Zeichen lang sein.` };

  // Lieferung: Liefergebiet, Mindestbestellwert und Gebühr legt der Server fest.
  let address: Address | null = null;
  let deliveryFeeCents = 0;
  if (fulfillment === "delivery") {
    const raw = (draft["address"] ?? {}) as Record<string, unknown>;
    const street = line(raw["street"], ORDER_LIMITS.street);
    const zip = typeof raw["zip"] === "string" ? raw["zip"] : "";
    const city = line(raw["city"], ORDER_LIMITS.city);
    if (!street || street.length < 4) return { error: "Bitte gib Straße und Hausnummer ein." };
    if (!/^\d{5}$/.test(zip) || !zip.startsWith(DELIVERY.zipPrefix)) return { error: `Wir liefern nur innerhalb von ${DELIVERY.city}.` };
    if (city === null) return invalid;
    if (subtotalCents < Math.round(DELIVERY.minOrder * 100)) return { error: "Der Mindestbestellwert für die Lieferung ist nicht erreicht." };
    address = { street, zip, city: city || DELIVERY.city };
    deliveryFeeCents = Math.round(DELIVERY.fee * 100);
  }

  const time = checkPickup(draft["pickup"], fulfillment, now);
  if ("error" in time) return time;

  return {
    order: {
      ...time,
      fulfillment,
      address,
      deliveryFee: deliveryFeeCents / 100,
      payment,
      contact: { name, phone, email },
      note,
      items,
      total: (subtotalCents + deliveryFeeCents) / 100,
    },
  };
}

// ============= Bezahlen =============

export type CheckoutLine = { name: string; unitAmount: number; qty: number };

/**
 * Stripe-Positionen aus der GESPEICHERTEN Bestellung – nie aus dem Browser. Die Preise werden noch
 * einmal aus der Speisekarte berechnet; weicht die Summe vom gespeicherten Betrag ab (z. B. weil eine
 * alte Bestellung ihre Preise noch aus dem Browser hatte), wird nicht kassiert.
 */
export function checkoutLines(order: { items: unknown; fulfillment: string | null; total: number | string }): { lines: CheckoutLine[]; totalCents: number } | { error: string } {
  const stale = { error: "Diese Bestellung lässt sich nicht mehr bezahlen. Bitte bestelle noch einmal neu." };
  if (!Array.isArray(order.items) || order.items.length < 1) return stale;
  const lines: CheckoutLine[] = [];
  let totalCents = 0;
  for (const raw of order.items as unknown[]) {
    const { ref, qty } = (raw ?? {}) as { ref?: unknown; qty?: unknown };
    if (!isMenuRef(ref) || typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > ORDER_LIMITS.qtyPerLine) return stale;
    const cents = priceOf(ref);
    if (cents === null) return stale;
    lines.push({ name: labelOf(ref), unitAmount: cents, qty });
    totalCents += cents * qty;
  }
  if (order.fulfillment === "delivery") {
    const fee = Math.round(DELIVERY.fee * 100);
    if (totalCents < Math.round(DELIVERY.minOrder * 100)) return stale;
    lines.push({ name: "Lieferung", unitAmount: fee, qty: 1 });
    totalCents += fee;
  }
  if (totalCents !== Math.round(Number(order.total) * 100)) return stale;
  return { lines, totalCents };
}
