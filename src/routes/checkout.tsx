import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { ArrowLeft, ArrowRight, Bike, Check, Clock3, CreditCard, MapPin, Minus, Plus, ShieldCheck, Store, Wallet, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cart as cartStore, euro, useCart } from "@/lib/cart-store";
import { DELIVERY, orderStore, type Fulfillment, type Order } from "@/lib/order-store";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createOrderCheckout } from "@/utils/payments.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Kasse – Yamiin & Jaiyana's Healthy Fastfood" },
      { name: "description", content: "Bestellung abschließen und frisch in Hanau abholen." },
      { property: "og:title", content: "Kasse – Yamiin & Jaiyana's" },
      { property: "og:description", content: "Abholen oder liefern lassen in Hanau – in wenigen Sekunden bestellt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const PAYMENTS: { key: Order["payment"]; title: string; text: string; icon: typeof CreditCard }[] = [
  { key: "online", title: "Karte · Apple Pay · Google Pay", text: "Sofort sicher online bezahlen", icon: CreditCard },
  { key: "paypal", title: "PayPal", text: "Mit deinem PayPal-Konto", icon: Wallet },
  { key: "onsite", title: "Vor Ort zahlen", text: "Bar oder Karte bei Abholung/Lieferung", icon: Store },
];

function timeSlots() {
  const now = new Date();
  const start = new Date(now.getTime() + 30 * 60000);
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  return Array.from({ length: 8 }, (_, index) => new Date(start.getTime() + index * 15 * 60000));
}
const hhmm = (date: Date) => date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, count, total } = useCart();
  const [slots, setSlots] = useState<Date[]>([]);
  const [pickup, setPickup] = useState<"asap" | number>("asap");
  const [payment, setPayment] = useState<Order["payment"]>("onsite");
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [address, setAddress] = useState({ street: "", zip: "", city: DELIVERY.city });
  const [note, setNote] = useState("");
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);

  useEffect(() => {
    setSlots(timeSlots());
    try {
      const saved = JSON.parse(localStorage.getItem("yj-contact") || "null");
      if (saved) setContact(saved);
      const savedAddress = JSON.parse(localStorage.getItem("yj-address") || "null");
      if (savedAddress) setAddress(savedAddress);
    } catch {
      /* ignorieren */
    }
  }, []);

  const errors = useMemo(
    () => ({
      name: contact.name.trim().length < 2 ? "Bitte gib deinen Namen ein." : "",
      phone: /^\+?[0-9 ()/-]{7,}$/.test(contact.phone) ? "" : "Bitte gib eine gültige Telefonnummer ein.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) ? "" : "Bitte gib eine gültige E-Mail ein.",
    }),
    [contact],
  );
  const delivery = fulfillment === "delivery";
  const addressErrors = {
    street: delivery && address.street.trim().length < 4 ? "Bitte gib Straße und Hausnummer ein." : "",
    zip: delivery && !address.zip.startsWith(DELIVERY.zipPrefix) ? `Wir liefern nur innerhalb von ${DELIVERY.city} (PLZ 63450–63457).` : "",
  };
  const deliveryFee = delivery ? DELIVERY.fee : 0;
  const belowMin = delivery && total < DELIVERY.minOrder;
  const grandTotal = total + deliveryFee;
  const valid = !errors.name && !errors.phone && !errors.email && !addressErrors.street && !addressErrors.zip && !belowMin;

  const submit = () => {
    setTouched(true);
    if (!valid || count === 0) return;
    const pickupAt = pickup === "asap" ? Date.now() + 25 * 60000 : pickup;
    if (remember) {
      localStorage.setItem("yj-contact", JSON.stringify(contact));
      if (delivery) localStorage.setItem("yj-address", JSON.stringify(address));
    } else {
      localStorage.removeItem("yj-contact");
      localStorage.removeItem("yj-address");
    }
    const order = orderStore.create({
      pickupAt,
      pickupLabel: pickup === "asap" ? "Schnellstmöglich" : `Heute ${hhmm(new Date(pickup))} Uhr`,
      fulfillment,
      address: delivery ? address : undefined,
      deliveryFee,
      payment,
      contact,
      note,
      items,
      total: grandTotal,
    });
    cartStore.clear();
    if (payment === "onsite") {
      navigate({ to: "/order-success", search: { id: order.id } });
    } else {
      // Online-Zahlung: Bestellung ist angelegt, aber erst nach erfolgreicher
      // Zahlung für die Küche sichtbar (Webhook markiert sie als bezahlt).
      setCheckoutOrder(order);
    }
  };

  if (count === 0) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[#f8f6f0] px-6 text-center text-[#1f2022]">
        <h1 className="font-display text-4xl">Dein Warenkorb ist leer</h1>
        <p className="text-[#6f675f]">Such dir zuerst etwas Leckeres aus.</p>
        <Link to="/speisekarte" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1f2022] px-6 font-semibold text-[#f8f6f0] transition-colors hover:bg-[#c46b38]">
          Zur Speisekarte <ArrowRight className="size-4" />
        </Link>
      </main>
    );
  }

  const field = (key: keyof typeof contact, label: string, type: string, auto: string) => (
    <label className="group block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[.14em] text-[#6f675f]">{label}</span>
      <Input
        type={type}
        autoComplete={auto}
        value={contact[key]}
        onChange={(event) => setContact({ ...contact, [key]: event.target.value })}
        className={`h-13 rounded-xl border-[#e2d8ca] bg-white px-4 text-base transition-shadow focus-visible:ring-[#c46b38] ${touched && errors[key] ? "border-[#b4432f]" : ""}`}
      />
      {touched && errors[key] && <span className="mt-1 block text-xs text-[#b4432f]">{errors[key]}</span>}
    </label>
  );

  return (
    <main className="min-h-screen bg-[#f8f6f0] pb-32 text-[#1f2022] lg:pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8 sm:pt-10">
        <Link to="/speisekarte" className="inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-semibold text-[#6f675f] transition-colors hover:text-[#c46b38]">
          <ArrowLeft className="size-4" /> Weiter einkaufen
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#c46b38]">Abholung & Lieferung · Hanau</p>
            <h1 className="mt-2 font-display text-5xl leading-[.95] sm:text-6xl">Fast geschafft<span className="text-[#c46b38]">.</span></h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e2d8ca] bg-white/70 px-4 py-2 text-xs font-semibold text-[#6f675f]">
            <ShieldCheck className="size-4 text-[#c46b38]" /> Ohne Konto · in 30 Sekunden
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
          <div className="flex flex-col gap-10">
            <Step n={1} title="Abholen oder liefern?">
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { key: "pickup", title: "Selbst abholen", text: "Kostenlos · Willy-Brandt-Str. 23", icon: Store },
                  { key: "delivery", title: "Liefern lassen", text: `${euro(DELIVERY.fee)} · ab ${euro(DELIVERY.minOrder)} Bestellwert · nur ${DELIVERY.city}`, icon: Bike },
                ] as const).map(({ key, title, text, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFulfillment(key)}
                    className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 active:scale-[.98] ${fulfillment === key ? "border-[#c46b38] bg-[#fff7f1] shadow-md" : "border-[#e2d8ca] bg-white hover:border-[#c46b38]/50"}`}
                  >
                    <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${fulfillment === key ? "bg-[#c46b38] text-white" : "bg-[#f1e8dc] text-[#1f2022]"}`}><Icon className="size-5" /></span>
                    <span>
                      <strong className="block">{title}</strong>
                      <span className="text-sm text-[#6f675f]">{text}</span>
                    </span>
                  </button>
                ))}
              </div>
              {belowMin && <p className="mt-3 text-sm text-[#b4432f]">Für die Lieferung brauchen wir einen Mindestbestellwert von {euro(DELIVERY.minOrder)}.</p>}
            </Step>

            <Step n={2} title={delivery ? "Wann soll geliefert werden?" : "Wann holst du ab?"}>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <button
                  type="button"
                  onClick={() => setPickup("asap")}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 active:scale-[.98] ${pickup === "asap" ? "border-[#1f2022] bg-[#1f2022] text-[#f8f6f0] shadow-lg" : "border-[#e2d8ca] bg-white hover:border-[#c46b38]"}`}
                >
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${pickup === "asap" ? "bg-[#c46b38]" : "bg-[#f1e8dc] text-[#c46b38]"}`}><Zap className="size-5" /></span>
                  <span>
                    <strong className="block">Schnellstmöglich</strong>
                    <span className={`text-sm ${pickup === "asap" ? "text-[#cfc2b5]" : "text-[#6f675f]"}`}>fertig in ca. 20–25 Minuten</span>
                  </span>
                </button>
                <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[#d9cec0] px-4 py-3 text-sm text-[#6f675f]">
                  <MapPin className="size-4 shrink-0 text-[#c46b38]" /> {delivery ? "Lieferung nach Hanau" : "Willy-Brandt-Str. 23, Hanau"}
                </div>
              </div>
              <p className="mb-2 mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#6f675f]"><Clock3 className="size-3.5" /> Oder Wunschzeit heute</p>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                {slots.map((slot) => {
                  const active = pickup === slot.getTime();
                  return (
                    <button
                      key={slot.getTime()}
                      type="button"
                      onClick={() => setPickup(slot.getTime())}
                      className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold tabular-nums transition-all duration-200 active:scale-95 ${active ? "border-[#c46b38] bg-[#c46b38] text-white shadow-md" : "border-[#e2d8ca] bg-white hover:border-[#c46b38]"}`}
                    >
                      {hhmm(slot)}
                    </button>
                  );
                })}
              </div>
            </Step>

            <Step n={3} title={delivery ? "Wohin und an wen?" : "Wer holt ab?"}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">{field("name", "Name", "text", "name")}</div>
                {delivery && (
                  <>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[.14em] text-[#6f675f]">Straße & Hausnummer</span>
                      <Input autoComplete="street-address" value={address.street} onChange={(event) => setAddress({ ...address, street: event.target.value })} className={`h-13 rounded-xl border-[#e2d8ca] bg-white px-4 text-base ${touched && addressErrors.street ? "border-[#b4432f]" : ""}`} />
                      {touched && addressErrors.street && <span className="mt-1 block text-xs text-[#b4432f]">{addressErrors.street}</span>}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[.14em] text-[#6f675f]">PLZ</span>
                      <Input inputMode="numeric" maxLength={5} autoComplete="postal-code" value={address.zip} onChange={(event) => setAddress({ ...address, zip: event.target.value.replace(/\D/g, "") })} className={`h-13 rounded-xl border-[#e2d8ca] bg-white px-4 text-base ${touched && addressErrors.zip ? "border-[#b4432f]" : ""}`} />
                      {touched && addressErrors.zip && <span className="mt-1 block text-xs text-[#b4432f]">{addressErrors.zip}</span>}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[.14em] text-[#6f675f]">Ort</span>
                      <Input autoComplete="address-level2" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} className="h-13 rounded-xl border-[#e2d8ca] bg-white px-4 text-base" />
                    </label>
                  </>
                )}
                {field("phone", "Telefon", "tel", "tel")}
                {field("email", "E-Mail für den Beleg", "email", "email")}
              </div>
              <details className="group mt-4 rounded-xl border border-[#e2d8ca] bg-white/60 px-4 py-3 open:bg-white">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[#6f675f] marker:hidden">+ Hinweis an die Küche (Allergien, ohne Zwiebeln …)</summary>
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="z. B. Sesam-Allergie" className="mt-3 border-[#e2d8ca] bg-white" />
              </details>
              <button type="button" onClick={() => setRemember(!remember)} className="mt-4 flex items-center gap-3 text-sm text-[#6f675f]">
                <span className={`flex size-5 items-center justify-center rounded-md border-2 transition-colors ${remember ? "border-[#c46b38] bg-[#c46b38] text-white" : "border-[#d9cec0] bg-white"}`}>{remember && <Check className="size-3.5" />}</span>
                Daten auf diesem Gerät merken
              </button>
            </Step>

            <Step n={4} title="Wie möchtest du zahlen?">
              <div className="grid gap-3 sm:grid-cols-3">
                {PAYMENTS.map(({ key, title, text, icon: Icon }) => {
                  const active = payment === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPayment(key)}
                      className={`relative flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200 active:scale-[.98] ${active ? "border-[#c46b38] bg-[#fff7f1] shadow-md" : "border-[#e2d8ca] bg-white hover:border-[#c46b38]/60"}`}
                    >
                      <span className={`flex size-10 items-center justify-center rounded-xl ${active ? "bg-[#c46b38] text-white" : "bg-[#f1e8dc] text-[#1f2022]"}`}><Icon className="size-5" /></span>
                      <span>
                        <strong className="block text-sm leading-tight">{title}</strong>
                        <span className="text-xs text-[#6f675f]">{text}</span>
                      </span>
                      {active && <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-[#c46b38] text-white animate-in zoom-in-50"><Check className="size-3" /></span>}
                    </button>
                  );
                })}
              </div>
              {payment !== "onsite" && <p className="mt-3 text-xs text-[#6f675f]">Die Online-Zahlung wird im nächsten Schritt angebunden – aktuell wird die Bestellung ohne Abbuchung angelegt.</p>}
            </Step>
          </div>

          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="overflow-hidden rounded-3xl bg-[#1f2022] text-[#f8f6f0] shadow-2xl shadow-[#1f2022]/20">
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="font-display text-2xl">Deine Bestellung</h2>
                <span className="rounded-full bg-[#c46b38] px-3 py-1 text-xs font-bold">{count} Artikel</span>
              </div>
              <ul className="max-h-80 divide-y divide-white/10 overflow-y-auto px-6 py-2">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <img src={item.image} alt="" className="size-14 shrink-0 rounded-xl bg-[#f8f6f0] object-contain p-1" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="truncate text-xs text-[#cfc2b5]">{item.detail}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center rounded-full bg-white/10">
                          <button type="button" onClick={() => cartStore.change(item.id, -1)} aria-label="Weniger" className="flex size-7 items-center justify-center rounded-full hover:bg-white/15"><Minus className="size-3" /></button>
                          <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                          <button type="button" onClick={() => cartStore.change(item.id, 1)} aria-label="Mehr" className="flex size-7 items-center justify-center rounded-full hover:bg-white/15"><Plus className="size-3" /></button>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">{euro(item.price * item.qty)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-white/10 bg-white/5 px-6 py-5">
                <div className="flex justify-between text-sm text-[#cfc2b5]"><span>{delivery ? "Lieferung" : "Abholung"}</span><span>{delivery ? euro(deliveryFee) : "kostenlos"}</span></div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-sm text-[#cfc2b5]">Gesamt <span className="text-xs">inkl. MwSt.</span></span>
                  <span className="font-display text-3xl tabular-nums">{euro(grandTotal)}</span>
                </div>
                <button type="button" onClick={submit} className="group mt-5 hidden h-14 w-full items-center justify-center gap-2 rounded-full bg-[#c46b38] font-bold text-white transition-all duration-200 hover:bg-[#d9946d] active:scale-[.98] lg:flex">
                  {payment === "onsite" ? "Jetzt bestellen" : "Zahlungspflichtig bestellen"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>
                {touched && !valid && <p className="mt-3 hidden text-center text-xs text-[#f0a48f] lg:block">Bitte prüfe deine Angaben.</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile: feste Bestellleiste */}
      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
        <button type="button" onClick={submit} className="flex h-16 w-full items-center justify-between rounded-2xl bg-[#1f2022] pl-5 pr-2 text-[#f8f6f0] shadow-2xl shadow-[#1f2022]/30 active:scale-[.98]">
          <span className="text-left">
            <span className="block text-xs text-[#cfc2b5]">{touched && !valid ? "Bitte Angaben prüfen" : `${count} Artikel · inkl. MwSt.`}</span>
            <span className="block font-display text-xl tabular-nums">{euro(grandTotal)}</span>
          </span>
          <span className="flex h-12 items-center gap-2 rounded-xl bg-[#c46b38] px-5 font-bold text-white">Bestellen <ArrowRight className="size-4" /></span>
        </button>
      </div>
    </main>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#1f2022] font-display text-sm text-[#f8f6f0]">{n}</span>
        <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}
