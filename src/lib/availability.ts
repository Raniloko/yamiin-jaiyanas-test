// Ausverkauft & Bestellpause – live aus der Datenbank (public.shop_status, public.menu_availability).
// Die Anzeige hier ist nur Komfort: neue Bestellungen prüft ein Trigger in der Datenbank
// (supabase/sql/0003_availability.sql), damit niemand an der Oberfläche vorbei bestellen kann.
import { useSyncExternalStore } from "react";

import { supabase } from "@/integrations/supabase/client";
import { acaiOptions, bowlSteps, coffeeExtra, milkOptions } from "@/lib/menu-data";
import type { MenuRef } from "@/lib/menu-pricing";

export const itemKey = (name: string) => `item:${name}`;
export const optionKey = (value: string) => `option:${value}`;

/** Auswahlmöglichkeiten, die einzeln ausgehen können (Basis, Zutaten der eigenen Bowl, Milch, Topping, Extra). */
export const OPTION_GROUPS: { label: string; values: readonly string[] }[] = [
  { label: "Bowl-Basis", values: bowlSteps[0]?.items ?? [] },
  ...bowlSteps.slice(1).map((step) => ({ label: `Eigene Bowl: ${step.title}`, values: step.items })),
  { label: "Milch", values: milkOptions },
  { label: "Açaí-Topping", values: acaiOptions },
  { label: "Coffee", values: [coffeeExtra.name] },
];

/** "Bis auf Weiteres" speichern wir als weit entferntes Datum. */
const FOREVER = "9999-12-31T00:00:00Z";
const isForever = (until: number) => until - Date.now() > 365 * 86400000;

export type AvailabilityState = {
  loaded: boolean;
  /** Zeitpunkt der letzten Auswertung – abgelaufene Einträge zählen ab dann nicht mehr. */
  now: number;
  pausedUntil: number | null;
  pauseNote: string;
  /** key → bis wann (null = bis auf Weiteres) */
  soldOut: Map<string, number | null>;
};

const EMPTY: AvailabilityState = { loaded: false, now: 0, pausedUntil: null, pauseNote: "", soldOut: new Map() };
let state = EMPTY;
const listeners = new Set<() => void>();
let stop: (() => void) | null = null;

function set(next: Partial<AvailabilityState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

async function refresh() {
  const [status, items] = await Promise.all([
    supabase.from("shop_status").select("paused_until, pause_note").eq("id", 1).maybeSingle(),
    supabase.from("menu_availability").select("key, until"),
  ]);
  if (status.error || items.error) {
    console.error("Verfügbarkeit konnte nicht geladen werden:", (status.error ?? items.error)?.message);
    // Ohne Daten nicht blockieren – die Datenbank prüft beim Bestellen ohnehin.
    set({ loaded: true, now: Date.now() });
    return;
  }
  set({
    loaded: true,
    now: Date.now(),
    pausedUntil: status.data?.paused_until ? Date.parse(status.data.paused_until) : null,
    pauseNote: status.data?.pause_note ?? "",
    soldOut: new Map((items.data ?? []).map((row) => [row.key, row.until ? Date.parse(row.until) : null])),
  });
}

function start() {
  void refresh();
  const channel = supabase
    .channel("yj-availability")
    .on("postgres_changes", { event: "*", schema: "public", table: "shop_status" }, () => void refresh())
    .on("postgres_changes", { event: "*", schema: "public", table: "menu_availability" }, () => void refresh())
    .subscribe();
  // Zeitbasierte Einträge ("für 30 Min", "heute") laufen ohne Datenbank-Änderung ab.
  const tick = setInterval(() => set({ now: Date.now() }), 30000);
  const onFocus = () => document.visibilityState === "visible" && void refresh();
  document.addEventListener("visibilitychange", onFocus);
  return () => {
    clearInterval(tick);
    document.removeEventListener("visibilitychange", onFocus);
    void supabase.removeChannel(channel);
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stop) stop = start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && stop) {
      stop();
      stop = null;
    }
  };
}

// ============= Abfragen =============

export const isPaused = (s: AvailabilityState) => s.pausedUntil !== null && s.pausedUntil > s.now;

export function isSoldOut(s: AvailabilityState, key: string) {
  if (!s.soldOut.has(key)) return false;
  const until = s.soldOut.get(key);
  return until === null || until === undefined || until > s.now;
}

/** Warum eine Warenkorb-Position gerade nicht bestellbar ist – null, wenn alles da ist. */
export function blockedReason(s: AvailabilityState, ref: MenuRef | undefined): string | null {
  if (!ref) return null;
  if (isSoldOut(s, itemKey(ref.name))) return "ausverkauft";
  if (ref.kind === "custom") {
    const out = [ref.base, ...Object.values(ref.picks).flat()].filter((value) => isSoldOut(s, optionKey(value)));
    return out.length ? `${out.join(", ")} ausverkauft` : null;
  }
  const option = ref.kind === "bowl" ? ref.base : ref.option;
  if (option && isSoldOut(s, optionKey(option))) return `${option} ausverkauft`;
  return null;
}

/** "bis 14:30 Uhr", "bis heute Abend", "bis auf Weiteres" */
export function untilLabel(until: number | null) {
  if (until === null || isForever(until)) return "bis auf Weiteres";
  const date = new Date(until);
  if (date.getHours() === 23 && date.getMinutes() === 59) return "für heute";
  return `bis ${date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr`;
}

export function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 0);
  return date;
}

export function useAvailability() {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

/** Fehlermeldung der Datenbank beim Bestellen in verständlichen Text übersetzen. */
export function orderBlockMessage(message: string): string | null {
  if (message.includes("ORDERS_PAUSED")) return "Wir nehmen gerade keine Online-Bestellungen an. Bitte versuch es etwas später noch einmal.";
  const soldOut = /SOLD_OUT:(.+)/.exec(message);
  if (soldOut) return `Leider gerade ausverkauft: ${soldOut[1]}. Bitte entferne es aus dem Warenkorb.`;
  return null;
}

// ============= Ändern (nur Admins – die Datenbank prüft das) =============

export const availability = {
  async pause(until: Date | "forever" | null, note = "") {
    const pausedUntil = until === null ? null : until === "forever" ? FOREVER : until.toISOString();
    set({ pausedUntil: pausedUntil ? Date.parse(pausedUntil) : null, pauseNote: note, now: Date.now() });
    const { error } = await supabase
      .from("shop_status")
      .update({ paused_until: pausedUntil, pause_note: note.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) await refresh();
    return error?.message ?? null;
  },
  /** until: Date = bis dann, null = bis auf Weiteres, false = wieder verfügbar */
  async setSoldOut(key: string, until: Date | null | false) {
    const soldOut = new Map(state.soldOut);
    if (until === false) soldOut.delete(key);
    else soldOut.set(key, until ? until.getTime() : null);
    set({ soldOut, now: Date.now() });
    const { error } =
      until === false
        ? await supabase.from("menu_availability").delete().eq("key", key)
        : await supabase.from("menu_availability").upsert({ key, until: until ? until.toISOString() : null, created_at: new Date().toISOString() });
    if (error) await refresh();
    return error?.message ?? null;
  },
};
