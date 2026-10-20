// Kennzahlen fürs Admin-Dashboard – reine Funktionen (ohne Datenbank), damit sie testbar bleiben.
import { acais, bowls, coffees, iceBurgers, matchas, menuCategories, wraps } from "@/lib/menu-data";
import type { Order } from "@/lib/order-store";

export type RangeKey = "today" | "7d" | "30d" | "90d" | "all";
export const RANGES: { key: RangeKey; label: string; short: string }[] = [
  { key: "today", label: "Heute", short: "Heute" },
  { key: "7d", label: "Letzte 7 Tage", short: "7 T." },
  { key: "30d", label: "Letzte 30 Tage", short: "30 T." },
  { key: "90d", label: "Letzte 90 Tage", short: "90 T." },
  { key: "all", label: "Gesamter Zeitraum", short: "Alles" },
];

export type Bounds = { from: Date; to: Date; prevFrom: Date | null; prevTo: Date | null; bucket: "hour" | "day" };

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Zeitraum (lokale Tage) plus gleich langer Vorzeitraum für den Vergleich. */
export function rangeBounds(range: RangeKey, now: Date, earliest?: Date): Bounds {
  const tomorrow = addDays(startOfDay(now), 1);
  if (range === "today") {
    const from = startOfDay(now);
    return { from, to: tomorrow, prevFrom: addDays(from, -1), prevTo: from, bucket: "hour" };
  }
  if (range === "all") {
    const from = startOfDay(earliest ?? addDays(now, -29));
    return { from, to: tomorrow, prevFrom: null, prevTo: null, bucket: "day" };
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const from = addDays(tomorrow, -days);
  return { from, to: tomorrow, prevFrom: addDays(from, -days), prevTo: from, bucket: "day" };
}

// ---------- Bestellungen ----------

/** Zählt als Verkauf: vor Ort bezahlt (bei Abholung/Lieferung) oder online bestätigt bezahlt. */
export const isSale = (order: Order) => order.payment === "onsite" || order.paid === true;
/** Online-Bestellung, deren Zahlung nie bestätigt wurde (abgebrochen oder offen). */
export const isUnpaidOnline = (order: Order) => order.payment !== "onsite" && order.paid !== true;

export const inRange = (order: Order, from: Date | null, to: Date | null) =>
  from !== null && to !== null && order.createdAt >= from.getTime() && order.createdAt < to.getTime();

export function kpis(orders: Order[]) {
  const sales = orders.filter(isSale);
  const revenue = sales.reduce((sum, order) => sum + order.total, 0);
  const items = sales.reduce((sum, order) => sum + order.items.reduce((count, item) => count + item.qty, 0), 0);
  return {
    revenue,
    orders: sales.length,
    average: sales.length ? revenue / sales.length : 0,
    items,
    unpaidOnline: orders.filter(isUnpaidOnline).length,
  };
}

/** Veränderung in Prozent gegenüber dem Vorzeitraum; null, wenn kein Vergleich möglich ist. */
export function delta(current: number, previous: number | null | undefined) {
  if (previous === null || previous === undefined) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export type SeriesPoint = { key: string; label: string; revenue: number; orders: number };

export function revenueSeries(orders: Order[], bounds: Bounds): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  const index = new Map<string, SeriesPoint>();
  if (bounds.bucket === "hour") {
    for (let hour = 0; hour < 24; hour++) {
      const point = { key: String(hour), label: `${String(hour).padStart(2, "0")}:00`, revenue: 0, orders: 0 };
      points.push(point);
      index.set(point.key, point);
    }
  } else {
    for (let day = new Date(bounds.from); day < bounds.to; day = addDays(day, 1)) {
      const key = dayKey(day);
      const point = { key, label: day.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }), revenue: 0, orders: 0 };
      points.push(point);
      index.set(key, point);
    }
  }
  for (const order of orders) {
    if (!isSale(order) || !inRange(order, bounds.from, bounds.to)) continue;
    const date = new Date(order.createdAt);
    const point = index.get(bounds.bucket === "hour" ? String(date.getHours()) : dayKey(date));
    if (!point) continue;
    point.revenue += order.total;
    point.orders += 1;
  }
  return points;
}

export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Bestellungen nach Uhrzeit (Stoßzeiten), Öffnungszeiten 10–20 Uhr. */
export function ordersByHour(orders: Order[]) {
  const hours = Array.from({ length: 11 }, (_, index) => ({ hour: 10 + index, label: `${10 + index}`, orders: 0 }));
  for (const order of orders.filter(isSale)) {
    const hour = new Date(order.createdAt).getHours();
    const slot = hours.find((entry) => entry.hour === hour);
    if (slot) slot.orders += 1;
  }
  return hours;
}

export function split<T extends string>(orders: Order[], keyOf: (order: Order) => T, keys: readonly T[]) {
  const sales = orders.filter(isSale);
  return keys.map((key) => {
    const matching = sales.filter((order) => keyOf(order) === key);
    return { key, orders: matching.length, revenue: matching.reduce((sum, order) => sum + order.total, 0) };
  });
}

// ---------- Produkte ----------

export type CatalogItem = { name: string; category: string; categoryLabel: string };

const categoryLabel = (id: string) => menuCategories.find((category) => category.id === id)?.label ?? id;

/** Alle Gerichte der Speisekarte – auch solche ohne Verkäufe tauchen so im Dashboard auf. */
export const CATALOG: CatalogItem[] = [
  ...bowls.map((item) => ({ name: item.name, category: "bowls" })),
  ...matchas.map((item) => ({ name: item.name, category: "matcha" })),
  ...coffees.map(([name]) => ({ name: name ?? "", category: "coffee" })),
  ...acais.map((item) => ({ name: item.name, category: "acai" })),
  ...iceBurgers.map((item) => ({ name: item.name, category: "ice" })),
  ...wraps.map((item) => ({ name: item.name, category: "wrap" })),
].map((item) => ({ ...item, categoryLabel: categoryLabel(item.category) }));

export type AnalyticsItem = { item: string; category: string | null; event: string; n: number; s: number; qty: number };

export type ProductStat = CatalogItem & {
  sold: number;
  revenue: number;
  orders: number;
  views: number;
  added: number;
  removed: number;
  /** Anteil der Sitzungen mit Aufruf, in denen das Gericht in den Warenkorb kam. */
  addRate: number | null;
};

export function productStats(orders: Order[], analyticsItems: AnalyticsItem[]): ProductStat[] {
  const stats = new Map<string, ProductStat>(
    CATALOG.map((item) => [item.name, { ...item, sold: 0, revenue: 0, orders: 0, views: 0, added: 0, removed: 0, addRate: null }]),
  );
  const ensure = (name: string) => {
    let stat = stats.get(name);
    if (!stat) {
      // Gericht ist nicht (mehr) auf der Karte – trotzdem auswerten.
      stat = { name, category: "other", categoryLabel: "Nicht mehr auf der Karte", sold: 0, revenue: 0, orders: 0, views: 0, added: 0, removed: 0, addRate: null };
      stats.set(name, stat);
    }
    return stat;
  };
  for (const order of orders.filter(isSale)) {
    const seen = new Set<string>();
    for (const item of order.items) {
      const stat = ensure(item.name);
      stat.sold += item.qty;
      stat.revenue += item.price * item.qty;
      if (!seen.has(item.name)) stat.orders += 1;
      seen.add(item.name);
    }
  }
  const viewSessions = new Map<string, number>();
  const addSessions = new Map<string, number>();
  for (const row of analyticsItems) {
    const stat = ensure(row.item);
    if (row.event === "item_view") { stat.views += row.s; viewSessions.set(row.item, (viewSessions.get(row.item) ?? 0) + row.s); }
    if (row.event === "add_to_cart") { stat.added += row.qty; addSessions.set(row.item, (addSessions.get(row.item) ?? 0) + row.s); }
    if (row.event === "remove_from_cart") stat.removed += row.qty;
  }
  for (const stat of stats.values()) {
    const views = viewSessions.get(stat.name) ?? 0;
    stat.addRate = views > 0 ? Math.min(1, (addSessions.get(stat.name) ?? 0) / views) : null;
  }
  return [...stats.values()];
}

/** Varianten aus verkauften Positionen, z. B. Größe, Basis, Milch, Topping. */
export function variantStats(orders: Order[]) {
  const groups = new Map<string, Map<string, number>>();
  const add = (group: string, value: string, qty: number) => {
    if (!value) return;
    const map = groups.get(group) ?? new Map<string, number>();
    map.set(value, (map.get(value) ?? 0) + qty);
    groups.set(group, map);
  };
  for (const order of orders.filter(isSale)) {
    for (const item of order.items) {
      const ref = item.ref;
      if (ref?.kind === "bowl") {
        add("Bowl-Größe", ref.size === "small" ? "Klein" : "Groß", item.qty);
        add("Bowl-Basis", ref.base, item.qty);
      } else if (ref?.kind === "coffee") {
        add("Kaffee-Extra", ref.option, item.qty);
      } else if (ref?.kind === "product" && ref.option) {
        const group = matchas.some((entry) => entry.name === ref.name) ? "Matcha-Milch" : acais.some((entry) => entry.name === ref.name) ? "Açaí-Topping" : "Optionen";
        add(group, ref.option, item.qty);
      } else if (!ref) {
        // Ältere Bestellungen ohne Referenz: "Klein · Bulgur" aus dem Text lesen.
        const [first, second] = item.detail.split(" · ");
        if (first === "Klein" || first === "Groß") {
          add("Bowl-Größe", first, item.qty);
          if (second) add("Bowl-Basis", second, item.qty);
        }
      }
    }
  }
  return [...groups.entries()].map(([group, values]) => ({
    group,
    values: [...values.entries()].map(([label, qty]) => ({ label, qty })).sort((a, b) => b.qty - a.qty),
  }));
}

// ---------- Kunden ----------

export type CustomerStat = { key: string; name: string; email: string; phone: string; orders: number; revenue: number; first: number; last: number };

export function customerStats(orders: Order[]): CustomerStat[] {
  const customers = new Map<string, CustomerStat>();
  for (const order of orders.filter(isSale)) {
    const email = order.contact.email.trim().toLowerCase();
    const phone = order.contact.phone.replace(/\D/g, "");
    const key = email || phone || order.contact.name.trim().toLowerCase();
    if (!key) continue;
    const customer = customers.get(key) ?? { key, name: order.contact.name, email: order.contact.email, phone: order.contact.phone, orders: 0, revenue: 0, first: order.createdAt, last: order.createdAt };
    customer.orders += 1;
    customer.revenue += order.total;
    customer.first = Math.min(customer.first, order.createdAt);
    if (order.createdAt >= customer.last) {
      customer.last = order.createdAt;
      customer.name = order.contact.name || customer.name;
    }
    customers.set(key, customer);
  }
  return [...customers.values()].sort((a, b) => b.revenue - a.revenue);
}

// ---------- Speisekarten-Statistik (aus der Datenbank-Funktion admin_menu_analytics) ----------

export type MenuAnalytics = {
  totals: Record<string, { events: number; sessions: number }> | null;
  sessions: number;
  items: AnalyticsItem[];
  variants: { item: string; variant: string; n: number; qty: number }[];
  categories: { category: string; s: number }[];
  searches: { query: string; n: number; s: number }[];
  devices: { device: string; s: number }[];
  daily: { day: string; event: string; s: number }[];
};

export const EMPTY_ANALYTICS: MenuAnalytics = { totals: {}, sessions: 0, items: [], variants: [], categories: [], searches: [], devices: [], daily: [] };

export const sessionsOf = (analytics: MenuAnalytics | null | undefined, event: string) => analytics?.totals?.[event]?.sessions ?? 0;

export function funnel(analytics: MenuAnalytics) {
  const steps = [
    { key: "page_view", label: "Speisekarte besucht" },
    { key: "item_view", label: "Gericht angesehen" },
    { key: "add_to_cart", label: "In den Warenkorb" },
    { key: "checkout_start", label: "Kasse geöffnet" },
    { key: "order_placed", label: "Bestellung abgeschickt" },
  ];
  const first = sessionsOf(analytics, "page_view");
  return steps.map((step, index) => {
    const sessions = sessionsOf(analytics, step.key);
    const previous = index === 0 ? sessions : sessionsOf(analytics, steps[index - 1]!.key);
    return { ...step, sessions, ofFirst: first ? sessions / first : 0, ofPrevious: previous ? sessions / previous : 0 };
  });
}

// ---------- Formatierung ----------

export const formatEuro = (value: number) => value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
export const formatNumber = (value: number) => value.toLocaleString("de-DE");
export const formatPercent = (value: number, digits = 0) => `${(value * 100).toLocaleString("de-DE", { maximumFractionDigits: digits })} %`;
