import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bike, Check, ChefHat, Clock3, MapPin, Phone, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { cart, euro } from "@/lib/cart-store";
import { ORDER_STEPS } from "@/lib/order-store";
import { useGuestOrder } from "@/lib/use-guest-order";

export const Route = createFileRoute("/order-success")({
  validateSearch: (search: Record<string, unknown>) => ({ id: typeof search["id"] === "string" ? search["id"] : undefined }),
  head: () => ({
    meta: [
      { title: "Bestellstatus live – Yamiin & Jaiyana's" },
      { name: "description", content: "Verfolge live, ob deine Bestellung bestätigt, in Zubereitung oder abholbereit ist." },
      { property: "og:title", content: "Bestellstatus live – Yamiin & Jaiyana's" },
      { property: "og:description", content: "Live-Status deiner Abholbestellung in Hanau." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatusPage,
});

const ICONS = [Check, ChefHat, ShoppingBag, Sparkles];

function StatusPage() {
  const { id } = Route.useSearch();
  const { order, loading } = useGuestOrder(id);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // Nach Rückkehr von der Online-Zahlung ist die Bestellung abgeschickt – Warenkorb leeren.
    cart.clear();
    setHydrated(true);
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (!hydrated || loading) return <main className="min-h-[70vh] bg-[#f8f6f0]" />;
  if (!order) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[#f8f6f0] px-6 text-center text-[#1f2022]">
        <h1 className="font-display text-4xl">Bestellung nicht gefunden</h1>
        <p className="max-w-sm text-[#6f675f]">Wir konnten keine Bestellung mit dieser Nummer finden.</p>
        <Link to="/speisekarte" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1f2022] px-6 font-semibold text-[#f8f6f0] hover:bg-[#c46b38]">Zur Speisekarte <ArrowRight className="size-4" /></Link>
      </main>
    );
  }

  const delivery = order.fulfillment === "delivery";
  const current = ORDER_STEPS.findIndex((step) => step.key === order.status);
  const step = ORDER_STEPS[current] ?? ORDER_STEPS[0]!;
  const minutes = Math.max(0, Math.round((order.pickupAt - now) / 60000));
  const pickupTime = new Date(order.pickupAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const progress = (current / (ORDER_STEPS.length - 1)) * 100;

  return (
    <main className="min-h-screen bg-[#f8f6f0] px-4 pb-16 pt-8 text-[#1f2022] sm:px-8">
      <div className="mx-auto max-w-2xl">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#1f2022] px-6 pb-7 pt-6 text-[#f8f6f0] shadow-2xl shadow-[#1f2022]/20 sm:px-8">
          <div className="absolute -right-16 -top-20 size-56 rounded-full bg-[#c46b38]/30 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#d9946d] opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-[#d9946d]" /></span>
              Live
            </span>
            <span className="font-mono text-sm text-[#cfc2b5]">#{order.id}</span>
          </div>
          <div key={order.status} className="relative mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#d9946d]">Status</p>
            <h1 className="mt-2 font-display text-5xl leading-none sm:text-6xl">{step.label}</h1>
            <p className="mt-3 text-[#cfc2b5]">{delivery && order.status === "abholbereit" ? "Dein Essen ist auf dem Weg zu dir." : step.hint}</p>
          </div>

          <div className="relative mt-8">
            <div className="h-1.5 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#c46b38] transition-[width] duration-700 ease-[cubic-bezier(.32,.72,0,1)]" style={{ width: `${progress}%` }} />
            </div>
            <ol className="mt-4 grid grid-cols-4 gap-2">
              {ORDER_STEPS.map((item, index) => {
                const Icon = ICONS[index] ?? Check;
                const done = index <= current;
                return (
                  <li key={item.key} className="flex flex-col items-center gap-2 text-center">
                    <span className={`flex size-10 items-center justify-center rounded-full transition-all duration-500 ${index === current ? "scale-110 bg-[#c46b38] text-white shadow-lg shadow-[#c46b38]/40" : done ? "bg-[#f8f6f0] text-[#1f2022]" : "bg-white/10 text-[#8f877f]"}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className={`text-[11px] font-semibold leading-tight ${done ? "text-[#f8f6f0]" : "text-[#8f877f]"}`}>{item.label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#e2d8ca] bg-white p-5">
            <Clock3 className="size-5 text-[#c46b38]" />
            <p className="mt-3 text-xs text-[#6f675f]">{delivery ? "Lieferung" : "Abholung"}</p>
            <p className="font-display text-3xl tabular-nums">{pickupTime}</p>
            <p className="text-xs text-[#6f675f]">{order.status === "abholbereit" ? (delivery ? "Fahrer ist unterwegs" : "Jetzt abholbereit") : minutes > 0 ? `in ca. ${minutes} Min.` : "gleich fertig"}</p>
          </div>
          {delivery && order.address ? (
            <div className="rounded-2xl border border-[#e2d8ca] bg-white p-5">
              <Bike className="size-5 text-[#c46b38]" />
              <p className="mt-3 text-xs text-[#6f675f]">Lieferadresse</p>
              <p className="font-semibold leading-tight">{order.address.street}</p>
              <p className="text-xs text-[#6f675f]">{order.address.zip} {order.address.city}</p>
            </div>
          ) : (
  <a href="https://maps.google.com/?q=Willy-Brandt-Stra%C3%9Fe+23,+63450+Hanau" target="_blank" rel="noreferrer" className="group rounded-2xl border border-[#e2d8ca] bg-white p-5 transition-colors hover:border-[#c46b38]">
              <MapPin className="size-5 text-[#c46b38]" />
              <p className="mt-3 text-xs text-[#6f675f]">Abholort</p>
              <p className="font-semibold leading-tight">Willy-Brandt-Str. 23</p>
              <p className="text-xs text-[#6f675f] group-hover:text-[#c46b38]">Route öffnen →</p>
            </a>
          )}
        </div>

        <section className="mt-4 rounded-2xl border border-[#e2d8ca] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Deine Bestellung</h2>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${order.payment === "onsite" ? "bg-[#f1e8dc] text-[#6f675f]" : order.paid ? "bg-[#6f9b62]/15 text-[#4c7442]" : "bg-[#c46b38]/10 text-[#a85b39]"}`}>
              {order.payment === "onsite" ? "Zahlung vor Ort" : order.paid ? "✓ Bezahlt" : "Zahlung wird geprüft …"}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-[#eee5dc]">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <img src={item.image} alt="" className="size-12 rounded-lg bg-[#f1e8dc] object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.qty}× {item.name}</p>
                  <p className="truncate text-xs text-[#6f675f]">{item.detail}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{euro(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-[#eee5dc] pt-3 font-bold"><span>Gesamt{order.deliveryFee ? ` (inkl. ${euro(order.deliveryFee)} Lieferung)` : ""}</span><span className="tabular-nums">{euro(order.total)}</span></div>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href="tel:061814187419" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#e2d8ca] bg-white font-semibold transition-colors hover:border-[#c46b38]"><Phone className="size-4" /> Anrufen</a>
          <Link to="/speisekarte" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#1f2022] font-semibold text-[#f8f6f0] transition-colors hover:bg-[#c46b38]">Neue Bestellung <ArrowRight className="size-4" /></Link>
        </div>
      </div>
    </main>
  );
}
