import { useEffect, useState } from "react";

import { guestToken, orderStore, useOrders, type Order } from "@/lib/order-store";
import { getGuestOrder } from "@/utils/orders.functions";

const POLL_MS = 10000;

/**
 * Bestellung für die Statusseite des Gastes: zeigt sofort die lokale Kopie und
 * fragt den Live-Status alle 10 Sekunden über den Server ab (mit Gast-Schlüssel).
 */
export function useGuestOrder(id: string | undefined) {
  const local = useOrders().find((order) => order.id === id);
  const [remote, setRemote] = useState<Order | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!id) return setChecked(true);
    const token = guestToken(id);
    if (!token) return setChecked(true);
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const result = await getGuestOrder({ data: { id, token } });
        if (stopped) return;
        if ("order" in result) {
          const order = { ...result.order, contact: { ...result.order.contact, phone: "", email: "" } };
          setRemote(order);
          orderStore.remember(order);
        }
        // Nach der Abholung muss nicht mehr nachgefragt werden.
        if ("order" in result && result.order.status === "abgeholt") return;
      } catch {
        /* offline – beim nächsten Versuch erneut */
      } finally {
        if (!stopped) setChecked(true);
      }
      if (!stopped) timer = setTimeout(load, POLL_MS);
    };
    void load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id]);

  return { order: remote ?? local, loading: !checked && !local };
}
