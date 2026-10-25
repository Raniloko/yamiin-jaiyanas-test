// Anonyme Speisekarten-Statistik für das Admin-Dashboard.
// Keine Cookies, keine IP, keine Namen: nur eine zufällige Besuchs-ID und was auf der Speisekarte
// angesehen/bestellt wurde. Die ID liegt nur im Arbeitsspeicher der Seite und wird nicht auf dem
// Gerät gespeichert (§ 25 TDDDG) – neues Laden der Seite ergibt eine neue ID.
import { supabase } from "@/integrations/supabase/client";

export type MenuEvent =
  | "page_view"
  | "category_view"
  | "item_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "search"
  | "checkout_start"
  | "order_placed";

type EventData = {
  item?: string;
  category?: string;
  variant?: string;
  query?: string;
  qty?: number;
  value?: number;
};

// Alle Spalten immer gesetzt (null statt fehlend), damit gebündelte Zeilen dieselben Spalten haben.
type Row = {
  event: MenuEvent;
  session_id: string;
  device: string;
  item: string | null;
  category: string | null;
  variant: string | null;
  query: string | null;
  qty: number | null;
  value: number | null;
};

const FLUSH_MS = 4000;
let queue: Row[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
const once = new Set<string>();

let visitId: string | undefined;

function sessionId() {
  visitId ??= crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  return visitId;
}

function device() {
  const width = window.innerWidth;
  return width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
}

const clip = (value: string | undefined, max: number) => (value ? value.slice(0, max) : null);

function flush() {
  timer = undefined;
  if (queue.length === 0) return;
  const rows = queue;
  queue = [];
  // Statistik darf nie den Bestellablauf stören – Fehler werden still verworfen.
  void supabase
    .from("menu_events")
    .insert(rows)
    .then(({ error }) => error && console.warn("Statistik nicht gespeichert:", error.message));
}

/** Ereignis vormerken; wird gebündelt gesendet. */
export function track(event: MenuEvent, data: EventData = {}) {
  if (typeof window === "undefined") return;
  // Interne Seiten nicht mitzählen.
  if (/^\/(admin|kitchen)/.test(window.location.pathname)) return;
  queue.push({
    event,
    session_id: sessionId(),
    device: device(),
    item: clip(data.item, 100),
    category: clip(data.category, 40),
    variant: clip(data.variant, 120),
    query: clip(data.query?.trim().toLowerCase(), 60),
    qty: data.qty === undefined ? null : Math.max(0, Math.min(100, Math.round(data.qty))),
    value: data.value === undefined ? null : Math.max(0, Math.min(2000, Math.round(data.value * 100) / 100)),
  });
  if (!timer) timer = setTimeout(flush, FLUSH_MS);
}

/** Wie track(), aber höchstens einmal pro Seitenaufruf und Schlüssel (z. B. Kategorie gesehen). */
export function trackOnce(key: string, event: MenuEvent, data: EventData = {}) {
  if (once.has(key)) return;
  once.add(key);
  track(event, data);
}

if (typeof window !== "undefined") {
  // Beim Verlassen/Wechseln des Tabs sofort senden.
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
}
