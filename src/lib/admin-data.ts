import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { EMPTY_ANALYTICS, rangeBounds, type Bounds, type MenuAnalytics, type RangeKey } from "@/lib/admin-metrics";
import { fromRow, type Order, type OrderRow, type OrderStatus } from "@/lib/order-store";

const PAGE = 1000;

/** Alle Bestellungen (nur für Admins lesbar), seitenweise wegen des Abfrage-Limits. */
async function loadOrders(): Promise<Order[]> {
  const all: Order[] = [];
  for (let page = 0; page < 50; page++) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw new Error(error.message);
    all.push(...(data as unknown as OrderRow[]).map(fromRow));
    if (data.length < PAGE) break;
  }
  return all;
}

async function loadAnalytics(from: Date, to: Date): Promise<MenuAnalytics> {
  const { data, error } = await supabase.rpc("admin_menu_analytics", { p_from: from.toISOString(), p_to: to.toISOString() });
  if (error) throw new Error(error.message);
  return { ...EMPTY_ANALYTICS, ...(data as Partial<MenuAnalytics> | null) };
}

export type AdminData = {
  orders: Order[];
  analytics: MenuAnalytics;
  previousAnalytics: MenuAnalytics | null;
  bounds: Bounds;
  loading: boolean;
  refreshing: boolean;
  error: string;
  updatedAt: Date | null;
  refresh: () => void;
  setStatus: (id: string, status: OrderStatus) => Promise<void>;
};

/** `stats`: Speisekarten-Auswertung nur laden, wenn die Person das Statistik-Recht hat (sonst lehnt die Datenbank ab). */
export function useAdminData(range: RangeKey, stats = true): AdminData {
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<MenuAnalytics>(EMPTY_ANALYTICS);
  const [previousAnalytics, setPrevious] = useState<MenuAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const ordersRef = useRef<Order[]>([]);

  const earliest = orders.length ? new Date(Math.min(...orders.map((order) => order.createdAt))) : undefined;
  const bounds = rangeBounds(range, new Date(), earliest);

  useEffect(() => {
    let active = true;
    setRefreshing(true);
    const run = async () => {
      try {
        const nextOrders = await loadOrders();
        const first = nextOrders.length ? new Date(Math.min(...nextOrders.map((order) => order.createdAt))) : undefined;
        const current = rangeBounds(range, new Date(), first);
        const [now, before] = stats
          ? await Promise.all([
              loadAnalytics(current.from, current.to),
              current.prevFrom && current.prevTo ? loadAnalytics(current.prevFrom, current.prevTo) : Promise.resolve(null),
            ])
          : [EMPTY_ANALYTICS, null];
        if (!active) return;
        ordersRef.current = nextOrders;
        setOrders(nextOrders);
        setAnalytics(now);
        setPrevious(before);
        setError("");
        setUpdatedAt(new Date());
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Daten konnten nicht geladen werden.");
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [range, tick, stats]);

  // Live: neue/geänderte Bestellungen sofort, Speisekarten-Statistik jede Minute.
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel("yj-admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => setTick((value) => value + 1), 800);
      })
      .subscribe();
    const interval = setInterval(() => setTick((value) => value + 1), 60000);
    return () => {
      clearTimeout(debounce);
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, []);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const setStatus = useCallback(async (id: string, status: OrderStatus) => {
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
    const { error: updateError } = await supabase.from("orders").update({ status }).eq("id", id);
    if (updateError) {
      setError(`Status konnte nicht gespeichert werden: ${updateError.message}`);
      setOrders(ordersRef.current);
    }
  }, []);

  return { orders, analytics, previousAnalytics, bounds, loading, refreshing, error, updatedAt, refresh, setStatus };
}
