import { createFileRoute } from "@tanstack/react-router";
import { Bike, Phone, Store } from "lucide-react";

import { euro } from "@/lib/cart-store";
import { ORDER_STEPS, orderStore, useOrdersLive } from "@/lib/order-store";

export const Route = createFileRoute("/kitchen")({
  head: () => ({ meta: [{ title: "Bestellungen – Intern" }, { name: "robots", content: "noindex" }] }),
  component: KitchenPage,
});

const PAYMENT_LABEL = { online: "Online bezahlt", paypal: "PayPal", onsite: "Zahlt vor Ort" } as const;

function KitchenPage() {
  const orders = useOrdersLive();
  const open = orders.filter((order) => order.status !== "abgeholt");

  return (
    <main className="min-h-screen bg-[#f3eee6] px-5 py-8 text-[#292725] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#a85b39]">Yamiin & Jaiyana&apos;s · Intern</p>
            <h1 className="mt-2 font-display text-5xl">Bestellungen</h1>
            <p className="mt-3 text-[#6f675f]">{open.length} offene Bestellung{open.length === 1 ? "" : "en"}</p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-[#e0d5c7] bg-[#fffaf4] px-4 py-2 text-sm">
            <span className="size-2 animate-pulse rounded-full bg-[#6f9b62]" />
            Live-Eingang aktiv
          </div>
        </header>

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          {ORDER_STEPS.map((step) => (
            <div key={step.key} className="rounded-2xl border border-[#e0d5c7] bg-[#fffaf4] p-4">
              <p className="text-xs text-[#6f675f]">{step.label}</p>
              <p className="mt-1 font-display text-3xl">{orders.filter((order) => order.status === step.key).length}</p>
            </div>
          ))}
        </div>

        {orders.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-[#d9cec0] p-8 text-center text-[#6f675f]">Noch keine Bestellungen.</p>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {orders.map((order) => {
              const delivery = order.fulfillment === "delivery";
              return (
                <article key={order.id} className={`rounded-2xl p-5 ${order.status === "bestaetigt" ? "bg-[#292725] text-[#f8f6f0] ring-2 ring-[#c46b38]" : "bg-[#292725]/90 text-[#f8f6f0]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl">#{order.id}</p>
                      <p className="text-sm">{order.contact.name}</p>
                      <a href={`tel:${order.contact.phone}`} className="mt-0.5 flex items-center gap-1 text-sm text-[#cfc2b5]"><Phone className="size-3" />{order.contact.phone}</a>
                    </div>
                    <div className="text-right text-sm">
                      <p className="flex items-center justify-end gap-1 font-semibold">{delivery ? <Bike className="size-4" /> : <Store className="size-4" />}{delivery ? "Lieferung" : "Abholung"}</p>
                      <p>{order.pickupLabel}</p>
                      <p className="text-[#cfc2b5]">{euro(order.total)} · {PAYMENT_LABEL[order.payment]}</p>
                    </div>
                  </div>
                  {delivery && order.address && (
                    <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">{order.address.street}, {order.address.zip} {order.address.city}</p>
                  )}
                  <ul className="mt-3 text-sm text-[#e8ddd2]">
                    {order.items.map((item) => (
                      <li key={item.id}>{item.qty}× {item.name} <span className="text-[#cfc2b5]">· {item.detail}</span></li>
                    ))}
                  </ul>
                  {order.note && <p className="mt-2 rounded-lg bg-[#c46b38]/20 px-3 py-2 text-xs">Hinweis: {order.note}</p>}
                  <div className="mt-4 grid grid-cols-4 gap-1.5">
                    {ORDER_STEPS.map((step) => (
                      <button key={step.key} type="button" onClick={() => orderStore.setStatus(order.id, step.key)} className={`rounded-lg px-2 py-2 text-[11px] font-bold transition-colors ${order.status === step.key ? "bg-[#c46b38] text-white" : "bg-white/10 hover:bg-white/20"}`}>
                        {step.label}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
