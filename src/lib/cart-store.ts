import { useSyncExternalStore } from "react";

export type CartItem = { id: string; name: string; detail: string; price: number; image: string; qty: number };

const KEY = "yj-cart";
const EMPTY: CartItem[] = [];
let items: CartItem[] = EMPTY;
let drawerOpen = false;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    items = EMPTY;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function setItems(next: CartItem[]) {
  items = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      loaded = false;
      load();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const cart = {
  add(item: CartItem) {
    load();
    const exists = items.some((entry) => entry.id === item.id);
    setItems(exists ? items.map((entry) => (entry.id === item.id ? { ...entry, qty: entry.qty + item.qty } : entry)) : [...items, item]);
  },
  change(id: string, amount: number) {
    load();
    setItems(items.map((entry) => (entry.id === id ? { ...entry, qty: entry.qty + amount } : entry)).filter((entry) => entry.qty > 0));
  },
  remove(id: string) {
    load();
    setItems(items.filter((entry) => entry.id !== id));
  },
  clear() {
    setItems(EMPTY);
  },
  openDrawer(open = true) {
    drawerOpen = open;
    emit();
  },
};

export function useCart() {
  const list = useSyncExternalStore(subscribe, () => (load(), items), () => EMPTY);
  const open = useSyncExternalStore(subscribe, () => drawerOpen, () => false);
  const count = list.reduce((sum, item) => sum + item.qty, 0);
  const total = list.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { items: list, count, total, drawerOpen: open };
}

export const euro = (value: number) => `${value.toFixed(2).replace(".", ",")} €`;
