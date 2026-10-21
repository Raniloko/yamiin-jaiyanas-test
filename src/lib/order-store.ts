import { useEffect, useSyncExternalStore } from "react";

import { supabase } from "@/integrations/supabase/client";

import type { CartItem } from "@/lib/cart-store";

export type OrderStatus = "bestaetigt" | "zubereitung" | "abholbereit" | "abgeholt";
export const ORDER_STEPS: { key: OrderStatus; label: string; hint: string }[] = [
  { key: "bestaetigt", label: "Bestätigt", hint: "Wir haben deine Bestellung erhalten." },
  { key: "zubereitung", label: "In Zubereitung", hint: "Deine Bestellung wird gerade frisch zubereitet." },
  { key: "abholbereit", label: "Abholbereit", hint: "Komm vorbei – sie wartet an der Theke." },
  { key: "abgeholt", label: "Abgeholt", hint: "Guten Appetit!" },
];

export type Order = {
  id: string;
  createdAt: number;
  pickupAt: number;
  pickupLabel: string;
  payment: "online" | "paypal" | "onsite";
  contact: { name: string; phone: string; email: string };
  note: string;
  items: CartItem[];
  /** Gesamtbetrag inkl. Liefergebühr */
  total: number;
  /** Fehlt bei älteren Bestellungen – dann Abholung. */
  fulfillment?: Fulfillment;
  address?: { street: string; zip: string; city: string } | undefined;
  deliveryFee?: number;
  status: OrderStatus;
  /** true, sobald die Online-Zahlung bestätigt ist (Vor-Ort-Zahlung bleibt false). */
  paid?: boolean;
};

export type Fulfillment = "pickup" | "delivery";

// Liefer-Einstellungen liegen in menu-pricing.ts, damit auch der Server sie nutzen kann.
export { DELIVERY } from "@/lib/menu-pricing";

const KEY = "yj-orders";
const EMPTY: Order[] = [];
let orders: Order[] = EMPTY;
let raw = "";
const listeners = new Set<() => void>();

function read() {
  if (typeof window === "undefined") return EMPTY;
  const next = localStorage.getItem(KEY) || "[]";
  if (next !== raw) {
    raw = next;
    try {
      const parsed = JSON.parse(next);
      orders = Array.isArray(parsed) ? parsed : EMPTY;
    } catch {
      orders = EMPTY;
    }
  }
  return orders;
}

function write(next: Order[]) {
  orders = next;
  raw = JSON.stringify(next);
  if (typeof window !== "undefined") localStorage.setItem(KEY, raw);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // "storage" feuert in anderen Tabs – so sieht der Gast Änderungen der Theke live.
  const onStorage = (event: StorageEvent) => event.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// ============= Gast-Schlüssel (Statusseite ohne Login) =============

const TOKENS_KEY = "yj-order-tokens";

function rememberGuestToken(id: string, token: string) {
  try {
    const tokens = JSON.parse(localStorage.getItem(TOKENS_KEY) || "{}") as Record<string, string>;
    tokens[id] = token;
    // Nur die letzten 20 Bestellungen merken.
    const recent = Object.fromEntries(Object.entries(tokens).slice(-20));
    localStorage.setItem(TOKENS_KEY, JSON.stringify(recent));
  } catch {
    /* ohne Speicher keine Statusabfrage – Bestellung klappt trotzdem */
  }
}

export function guestToken(id: string): string | undefined {
  try {
    return (JSON.parse(localStorage.getItem(TOKENS_KEY) || "{}") as Record<string, string>)[id];
  } catch {
    return undefined;
  }
}

// ============= Cloud-Sync (Lovable Cloud) =============

export type OrderRow = {
  id: string;
  created_at: string;
  pickup_at: string;
  pickup_label: string;
  fulfillment: string | null;
  address: Order["address"] | null;
  delivery_fee: number | string | null;
  payment: Order["payment"];
  contact: Order["contact"];
  note: string | null;
  items: CartItem[] | null;
  total: number | string;
  status: OrderStatus;
  paid: boolean | null;
};

function toRow(order: Order) {
  return {
    id: order.id,
    created_at: new Date(order.createdAt).toISOString(),
    pickup_at: new Date(order.pickupAt).toISOString(),
    pickup_label: order.pickupLabel,
    fulfillment: order.fulfillment ?? "pickup",
    address: order.address ?? null,
    delivery_fee: order.deliveryFee ?? 0,
    payment: order.payment,
    contact: order.contact,
    note: order.note,
    items: order.items,
    total: order.total,
    status: order.status,
    paid: order.paid ?? false,
  };
}

export function fromRow(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    pickupAt: Date.parse(row.pickup_at),
    pickupLabel: row.pickup_label,
    payment: row.payment,
    contact: row.contact,
    note: row.note ?? "",
    items: row.items ?? [],
    total: Number(row.total),
    fulfillment: (row.fulfillment as Fulfillment | null) ?? "pickup",
    address: row.address ?? undefined,
    deliveryFee: row.delivery_fee == null ? 0 : Number(row.delivery_fee),
    status: row.status,
    paid: row.paid ?? false,
  };
}

export async function refreshOrdersFromCloud() {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Bestellungen konnten nicht geladen werden:", error.message);
    return;
  }
  const cloud = (data as unknown as OrderRow[]).map(fromRow);
  // Cloud gewinnt bei Konflikten – lokal bleiben Bestellungen, die noch nicht gespeichert sind.
  const merged = new Map(read().map((order) => [order.id, order]));
  for (const order of cloud) merged.set(order.id, order);
  write([...merged.values()].sort((a, b) => b.createdAt - a.createdAt));
}

/** Live-Updates: jede Änderung an der Theke erreicht Gast und Küche sofort. */
export function subscribeToOrderChanges(onChange?: () => void): () => void {
  const channel = supabase
    .channel("yj-orders-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
      void refreshOrdersFromCloud().then(() => onChange?.());
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export const orderStore = {
  /** Speichert die Bestellung – erst danach gilt sie. Lehnt die Datenbank ab (pausiert, ausverkauft), kommt die Meldung zurück. */
  async create(order: Omit<Order, "id" | "createdAt" | "status">): Promise<{ order: Order } | { error: string }> {
    // 6 Ziffern: bei 4 Ziffern wären doppelte Nummern schon nach ~100 Bestellungen wahrscheinlich.
    const id = `YJ-${Math.floor(100000 + Math.random() * 900000)}`;
    const full: Order = { ...order, id, createdAt: Date.now(), status: "bestaetigt" };
    // Geheimer Gast-Schlüssel: nur dieses Gerät darf den Status ohne Login abfragen.
    const accessToken = crypto.randomUUID();
    const { error } = await supabase.from("orders").insert({ ...toRow(full), access_token: accessToken });
    if (error) {
      console.error("Bestellung konnte nicht gespeichert werden:", error.message);
      return { error: error.message };
    }
    rememberGuestToken(id, accessToken);
    write([full, ...read()].slice(0, 30));
    return { order: full };
  },
  setStatus(id: string, status: OrderStatus) {
    write(read().map((order) => (order.id === id ? { ...order, status } : order)));
    void supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .then(({ error }) => error && console.error("Status konnte nicht gespeichert werden:", error.message));
  },
};

export function useOrdersLive() {
  const local = useSyncExternalStore(subscribe, read, () => EMPTY);
  useEffect(() => {
    void refreshOrdersFromCloud();
    return subscribeToOrderChanges();
  }, []);
  return local;
}

export function useOrders() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

// Gäste: siehe useGuestOrder (src/lib/use-guest-order.ts) – Bestellungen sind nur für Admins lesbar.
