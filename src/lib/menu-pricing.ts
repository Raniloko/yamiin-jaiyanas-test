// Preise aus der Speisekarte berechnen – läuft im Browser (Anzeige) und auf dem Server
// (Stripe-Checkout), damit online nur die echten Speisekarten-Preise abgebucht werden.
import {
  acais,
  bowls,
  bowlSteps,
  coffeeExtra,
  coffees,
  iceBurgers,
  matchas,
  parseMenuPrice,
  wraps,
} from "@/lib/menu-data";

/** Eindeutige Beschreibung einer Warenkorb-Position – daraus wird der Preis berechnet. */
export type MenuRef =
  | { kind: "bowl"; name: string; size: "small" | "large"; base: string }
  | { kind: "product"; name: string; option?: string }
  | { kind: "coffee"; name: string; option: CoffeeOption };

export const COFFEE_OPTIONS = ["Ohne Extra", "Extra Flavor"] as const;
export type CoffeeOption = (typeof COFFEE_OPTIONS)[number];

// Liefer-Einstellungen – hier zentral anpassen (Kasse und Server nutzen dieselben Werte).
export const DELIVERY = {
  fee: 2.5,
  minOrder: 15,
  /** Liefergebiet: Hanau (PLZ 63450–63457) */
  zipPrefix: "6345",
  city: "Hanau",
};

const toCents = (price: string) => Math.round(parseMenuPrice(price) * 100);
const products = [...matchas, ...acais, ...iceBurgers, ...wraps];

/** Preis einer Position in Cent oder null, wenn es die Kombination auf der Speisekarte nicht gibt. */
export function priceOf(ref: MenuRef): number | null {
  if (ref.kind === "bowl") {
    const bowl = bowls.find((item) => item.name === ref.name);
    const bases = bowlSteps[0]?.items ?? [];
    if (!bowl || (ref.size !== "small" && ref.size !== "large") || !bases.includes(ref.base))
      return null;
    return toCents(bowl[ref.size]);
  }
  if (ref.kind === "coffee") {
    const coffee = coffees.find(([name]) => name === ref.name);
    if (!coffee?.[1] || !COFFEE_OPTIONS.includes(ref.option)) return null;
    return toCents(coffee[1]) + (ref.option === "Extra Flavor" ? toCents(coffeeExtra.price) : 0);
  }
  const product = products.find((item) => item.name === ref.name);
  if (!product) return null;
  if (product.options ? !product.options.includes(ref.option ?? "") : ref.option) return null;
  return toCents(product.price);
}

/** Bezeichnung für Beleg und Stripe, z. B. "Y's Bowl (Groß · Bulgur)". */
export function labelOf(ref: MenuRef): string {
  if (ref.kind === "bowl")
    return `${ref.name} (${ref.size === "small" ? "Klein" : "Groß"} · ${ref.base})`;
  if (ref.kind === "coffee")
    return ref.option === "Extra Flavor" ? `${ref.name} (Extra Flavor)` : ref.name;
  return ref.option ? `${ref.name} (${ref.option})` : ref.name;
}

/** Laufzeit-Prüfung für Daten aus dem Browser. */
export function isMenuRef(value: unknown): value is MenuRef {
  if (!value || typeof value !== "object") return false;
  const ref = value as Record<string, unknown>;
  if (typeof ref["name"] !== "string" || ref["name"].length > 100) return false;
  if (ref["kind"] === "bowl")
    return typeof ref["size"] === "string" && typeof ref["base"] === "string";
  if (ref["kind"] === "coffee") return typeof ref["option"] === "string";
  if (ref["kind"] === "product")
    return ref["option"] === undefined || typeof ref["option"] === "string";
  return false;
}
