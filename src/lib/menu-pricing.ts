// Preise aus der Speisekarte berechnen – läuft im Browser (Anzeige) und auf dem Server
// (Stripe-Checkout), damit online nur die echten Speisekarten-Preise abgebucht werden.
import {
  acais,
  bowls,
  bowlSteps,
  coffeeExtra,
  coffees,
  customBowl,
  iceBurgers,
  matchas,
  parseMenuPrice,
  wraps,
} from "@/lib/menu-data";

/** Eindeutige Beschreibung einer Warenkorb-Position – daraus wird der Preis berechnet. */
export type MenuRef =
  | { kind: "bowl"; name: string; size: "small" | "large"; base: string }
  | { kind: "product"; name: string; option?: string }
  | { kind: "coffee"; name: string; option: CoffeeOption }
  | { kind: "custom"; name: string; size: "small" | "large"; base: string; picks: CustomPicks };

/** Auswahl einer eigenen Bowl je Schritt (ohne Base), z. B. { protein: ["Falafel"], veggies: [...] }. */
export type CustomPicks = Record<string, string[]>;

/** Schritte nach der Base – deren Auswahl landet in `picks`. */
export const CUSTOM_STEPS = bowlSteps.slice(1);

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
  if (ref.kind === "custom") return customPrice(ref);
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

/**
 * Eigene Bowl: Grundpreis nach Größe plus Aufpreis für jede Auswahl über der Inklusiv-Menge.
 * Jede Zutat muss genau so auf der Speisekarte stehen, mindestens ein Protein ist Pflicht.
 */
function customPrice(ref: Extract<MenuRef, { kind: "custom" }>): number | null {
  const bases = bowlSteps[0]?.items ?? [];
  if (ref.name !== customBowl.name || (ref.size !== "small" && ref.size !== "large") || !bases.includes(ref.base))
    return null;
  const known = new Set(CUSTOM_STEPS.map((step) => step.id));
  if (Object.keys(ref.picks).some((id) => !known.has(id))) return null;
  let cents = toCents(customBowl[ref.size]);
  for (const step of CUSTOM_STEPS) {
    const picks = ref.picks[step.id] ?? [];
    if (new Set(picks).size !== picks.length || picks.some((pick) => !step.items.includes(pick))) return null;
    if (step.id === "protein" && picks.length < 1) return null;
    const extra = Math.max(0, picks.length - (step.included ?? 0));
    if (extra > 0) {
      if (!step.extraPrice) return null;
      cents += extra * toCents(step.extraPrice);
    }
  }
  return cents;
}

/** Zusammenstellung für Warenkorb, Küche und Beleg, z. B. "Groß · Bulgur · Protein: Falafel · Veggies: Mais, Gurken". */
export function customDetail(ref: Extract<MenuRef, { kind: "custom" }>): string {
  const parts = [ref.size === "small" ? "Klein" : "Groß", ref.base];
  for (const step of CUSTOM_STEPS) {
    const picks = ref.picks[step.id] ?? [];
    if (picks.length) parts.push(`${step.title}: ${picks.join(", ")}`);
  }
  return parts.join(" · ");
}

/** Bezeichnung für Beleg und Stripe, z. B. "Y's Bowl (Groß · Bulgur)". */
export function labelOf(ref: MenuRef): string {
  if (ref.kind === "custom") return `${ref.name} (${customDetail(ref)})`;
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
  if (ref["kind"] === "custom") {
    const picks = ref["picks"];
    if (typeof ref["size"] !== "string" || typeof ref["base"] !== "string") return false;
    if (!picks || typeof picks !== "object" || Array.isArray(picks)) return false;
    return Object.values(picks).every(
      (list) => Array.isArray(list) && list.length <= 20 && list.every((pick) => typeof pick === "string" && pick.length <= 60),
    );
  }
  if (ref["kind"] === "product")
    return ref["option"] === undefined || typeof ref["option"] === "string";
  return false;
}
