import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bike, Check, RotateCcw, ShieldCheck, Store, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { GlowCta, PageHero, RiseTitle } from "@/components/site/brand-ui";
import { cart, euro } from "@/lib/cart-store";
import { isActiveOrder, stepText } from "@/lib/order-labels";
import { forgetMyOrders, guestToken, orderStore, useMyOrders, type Order } from "@/lib/order-store";
import { getGuestOrder } from "@/utils/orders.functions";

export const Route = createFileRoute("/meine-bestellungen")({
  head: () => ({
    meta: [
      { title: "Meine Bestellungen – Yamiin & Jaiyana's" },
      { name: "description", content: "Deine letzten Bestellungen auf diesem Gerät – Status ansehen oder nochmal bestellen." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyOrdersPage,
});

const dateText = (time: number) =>
  new Date(time).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function MyOrdersPage() {
  const orders = useMyOrders();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(0);
  const [again, setAgain] = useState<string | null>(null);

  // Beim Öffnen den aktuellen Stand der letzten Bestellungen vom Server holen (mit Gast-Schlüssel).
  useEffect(() => {
    setHydrated(true);
    setNow(Date.now());
    let stopped = false;
    void (async () => {
      for (const order of orders.slice(0, 10)) {
        const token = guestToken(order.id);
        if (!token || stopped) continue;
        try {
          const result = await getGuestOrder({ data: { id: order.id, token } });
          if ("order" in result) orderStore.remember({ ...result.order, contact: { ...result.order.contact, phone: "", email: "" } });
        } catch {
          /* offline – dann bleibt der letzte bekannte Stand */
        }
      }
    })();
    return () => {
      stopped = true;
    };
  }, [orders.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Dieselben Gerichte wieder in den Warenkorb legen (Preise kommen aus der aktuellen Speisekarte). */
  const orderAgain = (order: Order) => {
    for (const item of order.items) if (item.ref) cart.add({ ...item });
    setAgain(order.id);
    setTimeout(() => void navigate({ to: "/checkout" }), 450);
  };

  return (
    <main className="min-h-screen bg-[#f8f6f0] pb-20 text-[#1f2022]">
      <PageHero compact width="max-w-3xl">
        <RiseTitle lead="Meine" accent="Bestellungen." className="text-5xl sm:text-7xl" />
        <p className="hero-rise mt-5 flex max-w-lg items-start gap-2 text-white/75" style={{ animationDelay: "300ms" }}>
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#f5c3a6]" />
          Ohne Konto: Dieses Gerät merkt sich deine Bestellungen. Nur du siehst sie hier.
        </p>
      </PageHero>

      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-8">
        {!hydrated ? (
          <div className="h-40 animate-pulse rounded-3xl bg-[#efe7dc]" aria-label="Wird geladen" />
        ) : orders.length === 0 ? (
          <div className="rounded-[2rem] border border-[#e2d8ca] bg-white px-6 py-12 text-center">
            <p className="font-display text-3xl">Noch keine Bestellungen</p>
            <p className="mx-auto mt-2 max-w-sm text-[#6f675f]">Sobald du auf diesem Gerät bestellst, findest du deine Bestellungen hier – mit Live-Status.</p>
            <div className="mt-7 flex justify-center"><GlowCta tone="dark">Zur Speisekarte</GlowCta></div>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {orders.map((order) => {
                const active = isActiveOrder(order, now);
                const { label } = stepText(order, order.status);
                const Icon = order.fulfillment === "delivery" ? Bike : Store;
                const count = order.items.reduce((sum, item) => sum + item.qty, 0);
                return (
                  <li key={order.id} className={`rounded-[1.75rem] border bg-white p-5 sm:p-6 ${active ? "border-[#c46b38]/50 shadow-lg shadow-[#1f2022]/[.06]" : "border-[#e2d8ca]"}`}>
                    <div className="flex items-start gap-4">
                      <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${active ? "bg-[#c46b38] text-white" : "bg-[#f1e8dc] text-[#6f675f]"}`}><Icon className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-mono text-xs text-[#6f675f]">#{order.id}</span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${active ? "bg-[#c46b38]/10 text-[#a85b39]" : "bg-[#f1e8dc] text-[#6f675f]"}`}>
                            {active ? <span className="size-1.5 rounded-full bg-[#c46b38]" aria-hidden="true" /> : <Check className="size-3" />}
                            {order.payment !== "onsite" && !order.paid && active ? "Zahlung wird geprüft" : label}
                          </span>
                        </div>
                        <p className="mt-1.5 font-semibold">{dateText(order.createdAt)} · {order.fulfillment === "delivery" ? "Lieferung" : "Abholung"}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-[#6f675f]">{order.items.map((item) => `${item.qty}× ${item.name}`).join(", ")}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-2xl tabular-nums">{euro(order.total)}</p>
                        <p className="text-xs text-[#6f675f]">{count} Artikel</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eee5dc] pt-4">
                      <Link to="/order-success" search={{ id: order.id }} className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${active ? "bg-[#1f2022] text-[#f8f6f0] hover:bg-[#c46b38]" : "border border-[#e2d8ca] hover:border-[#c46b38]"}`}>
                        {active ? "Live-Status ansehen" : "Details"} <ArrowRight className="size-4" />
                      </Link>
                      <button type="button" onClick={() => orderAgain(order)} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e2d8ca] px-4 text-sm font-semibold transition-colors hover:border-[#c46b38]">
                        {again === order.id ? <><Check className="size-4 text-[#c46b38]" /> Im Warenkorb</> : <><RotateCcw className="size-4" /> Nochmal bestellen</>}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Alle Bestellungen von diesem Gerät entfernen? Die Bestellungen selbst bleiben beim Laden bestehen.")) forgetMyOrders();
              }}
              className="mx-auto mt-8 flex items-center gap-2 text-sm text-[#6f675f] hover:text-[#b4432f]"
            >
              <Trash2 className="size-4" /> Liste von diesem Gerät entfernen
            </button>
          </>
        )}
      </div>
    </main>
  );
}
