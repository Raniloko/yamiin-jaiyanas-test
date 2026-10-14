import { useSyncExternalStore } from "react";

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
};

export type Fulfillment = "pickup" | "delivery";

// Liefer-Einstellungen – hier zentral anpassen.
export const DELIVERY = {
  fee: 2.5,
  minOrder: 15,
  /** Liefergebiet: Hanau (PLZ 63450–63457) */
  zipPrefix: "6345",
  city: "Hanau",
};

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
  localStorage.setItem(KEY, JSON.stringify(next));
  read();
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

export const orderStore = {
  create(order: Omit<Order, "id" | "createdAt" | "status">) {
    const id = `YJ-${Math.floor(1000 + Math.random() * 9000)}`;
    const full: Order = { ...order, id, createdAt: Date.now(), status: "bestaetigt" };
    write([full, ...read()].slice(0, 30));
    return full;
  },
  setStatus(id: string, status: OrderStatus) {
    write(read().map((order) => (order.id === id ? { ...order, status } : order)));
  },
};

export function useOrders() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useOrder(id: string | undefined) {
  return useOrders().find((order) => order.id === id);
}
