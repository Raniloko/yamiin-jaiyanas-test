import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "@/lib/cart-store";
import { isActiveOrder, stepText } from "@/lib/order-labels";
import { useMyOrders } from "@/lib/order-store";
import { useGuestOrder } from "@/lib/use-guest-order";

const HIDDEN_ON = /^\/(checkout|order-success|meine-bestellungen|admin|kitchen)/;

/**
 * Laufende Bestellung auf jeder Seite: "Deine Bestellung · In Zubereitung · noch ca. 12 Min".
 * Das Gerät kennt seine Bestellungen (Gast-Schlüssel) – kein Konto nötig.
 */
export function ActiveOrderPill() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { count } = useCart();
  const mine = useMyOrders();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const candidate = now === null ? undefined : mine.find((order) => isActiveOrder(order, now));
  // Fragt den Live-Status ab (alle 10 s) und aktualisiert die Gerätekopie – die Leiste folgt automatisch.
  const { order } = useGuestOrder(candidate?.id);
  const active = order && now !== null && isActiveOrder(order, now) ? order : undefined;
  if (!active || HIDDEN_ON.test(pathname)) return null;

  const { label } = stepText(active, active.status);
  const minutes = Math.max(0, Math.round((active.pickupAt - (now ?? Date.now())) / 60000));
  const ready = active.status === "abholbereit";
  const unpaid = active.payment !== "onsite" && !active.paid;
  const detail = unpaid ? "Zahlung wird geprüft" : ready ? (active.fulfillment === "delivery" ? "ist unterwegs" : "jetzt abholbereit") : minutes > 0 ? `noch ca. ${minutes} Min` : "gleich fertig";
  // Platz für den Warenkorb-Knopf rechts bzw. die breite Warenkorb-Leiste auf der Speisekarte lassen.
  const lift = count > 0 && pathname === "/speisekarte" ? "bottom-24" : "bottom-3";
  const roomRight = count > 0 && pathname !== "/speisekarte" ? "right-[5.5rem]" : "right-3";

  return (
    <Link
      to="/order-success"
      search={{ id: active.id }}
      aria-label={`Deine Bestellung ${active.id}: ${label}, ${detail}. Status öffnen`}
      className={`fixed left-3 z-40 flex items-center gap-3 rounded-2xl border border-white/10 bg-primary/95 px-4 py-3 text-primary-foreground shadow-2xl shadow-primary/30 backdrop-blur-md transition-transform animate-in slide-in-from-bottom-4 hover:-translate-y-0.5 md:bottom-6 md:left-6 md:right-auto md:w-[22rem] ${lift} ${roomRight}`}
    >
      <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
        <span className="live-ping absolute inset-0 rounded-full bg-live" />
        <span className={`relative size-2.5 rounded-full ${ready ? "bg-live" : "bg-peach"}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-primary-foreground/75">Deine Bestellung #{active.id}</span>
        <span className="block truncate text-sm font-semibold">{label} · {detail}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-peach" />
    </Link>
  );
}
