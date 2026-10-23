import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { ArrowLeft, ArrowRight, Bike, Check, CirclePause, Clock3, CreditCard, LoaderCircle, LockKeyhole, MapPin, Minus, PackageX, Plus, ShieldCheck, ShoppingBag, Store, Trash2, UserRound, Wallet, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { GlowCta, GlowFrame, PageHero, RiseTitle } from "@/components/site/brand-ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cart as cartStore, euro, useCart } from "@/lib/cart-store";
import { DELIVERY, orderStore, type Fulfillment, type Order } from "@/lib/order-store";
import { track, trackOnce } from "@/lib/analytics";
import { blockedReason, isPaused, orderBlockMessage, untilLabel, useAvailability } from "@/lib/availability";
import { isOpenForAsap, nextSlotDay, PREP_MINUTES } from "@/lib/pickup-slots";
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
  { key: "online", title: "Karte & Wallet", text: "Visa, Mastercard, Apple Pay, Google Pay", icon: CreditCard },
  { key: "paypal", title: "PayPal", text: "Mit deinem PayPal-Konto", icon: Wallet },
  { key: "onsite", title: "Vor Ort zahlen", text: "Bar oder Karte", icon: Store },
];

/** Zubereitungs- bzw. Lieferzeit für "Schnellstmöglich" in Minuten. */
const SLOTS_COLLAPSED = 12;

type StepId = 1 | 2 | 3 | 4;
type Contact = { name: string; phone: string; email: string };
const contactErrors = (contact: Contact) => ({
  name: contact.name.trim().length < 2 ? "Bitte gib deinen Namen ein." : "",
  phone: /^\+?[0-9 ()/-]{7,}$/.test(contact.phone) ? "" : "Bitte gib eine gültige Telefonnummer ein.",
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) ? "" : "Bitte gib eine gültige E-Mail ein.",
});
const hhmm = (date: Date) => date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, count, total } = useCart();
  // Erst im Browser gesetzt, damit Server und Client dieselbe Uhrzeit nutzen.
  const [now, setNow] = useState<Date | null>(null);
  const [pickup, setPickup] = useState<"asap" | number>("asap");
  const [payment, setPayment] = useState<Order["payment"]>("onsite");
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [address, setAddress] = useState({ street: "", zip: "", city: DELIVERY.city });
  const [note, setNote] = useState("");
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState(false);
  const [allSlots, setAllSlots] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [payError, setPayError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  // Akkordeon: immer nur ein Schritt offen. "flow" = erster Durchlauf Schritt für Schritt,
  // danach (oder bei gespeicherten Daten) klappt "Ändern" nur den einen Schritt auf.
  const [openStep, setOpenStep] = useState<StepId | null>(1);
  const [flow, setFlow] = useState(true);
  // Zur Zahlung oben beginnen – sonst steht man am Handy (Button unten) vor dem Footer statt vor dem Formular.
  useEffect(() => {
    if (checkoutOrder) window.scrollTo({ top: 0 });
  }, [checkoutOrder]);
  // Pause & Ausverkauft live – die Datenbank lehnt solche Bestellungen zusätzlich selbst ab.
  const availability = useAvailability();
  const paused = isPaused(availability);
  const blocked = items.flatMap((item) => {
    const reason = blockedReason(availability, item.ref);
    return reason ? [{ item, reason }] : [];
  });

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    try {
      const saved = JSON.parse(localStorage.getItem("yj-contact") || "null") as Contact | null;
      if (saved) setContact(saved);
      // Stammgast: alles schon bekannt – Übersicht statt Schritt-für-Schritt.
      if (saved && Object.values(contactErrors(saved)).every((error) => !error)) {
        setOpenStep(null);
        setFlow(false);
      }
      const savedAddress = JSON.parse(localStorage.getItem("yj-address") || "null");
      if (savedAddress) setAddress(savedAddress);
    } catch {
      /* ignorieren */
    }
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (count > 0) trackOnce("checkout", "checkout_start", { qty: count, value: total });
  }, [count > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const errors = useMemo(() => contactErrors(contact), [contact]);
  const delivery = fulfillment === "delivery";
  const prepMinutes = PREP_MINUTES[fulfillment];
  const slotDay = useMemo(() => (now ? nextSlotDay(now) : null), [now]);
  const asapOpen = now ? isOpenForAsap(now, prepMinutes) : true;
  // Wenn "Schnellstmöglich" nicht geht (geschlossen) oder die Wunschzeit verstrichen ist, erste freie Zeit wählen.
  useEffect(() => {
    if (!now) return;
    const stillValid = pickup === "asap" ? asapOpen : slotDay?.slots.some((slot) => slot.getTime() === pickup);
    if (!stillValid) setPickup(asapOpen ? "asap" : (slotDay?.slots[0]?.getTime() ?? "asap"));
  }, [now, pickup, asapOpen, slotDay]);
  const pickupError = now && !asapOpen && !slotDay ? "Gerade sind keine Bestellungen möglich." : "";
  const addressErrors = {
    street: delivery && address.street.trim().length < 4 ? "Bitte gib Straße und Hausnummer ein." : "",
    zip: delivery && !address.zip.startsWith(DELIVERY.zipPrefix) ? `Wir liefern nur innerhalb von ${DELIVERY.city} (PLZ 63450–63457).` : "",
  };
  const deliveryFee = delivery ? DELIVERY.fee : 0;
  const belowMin = delivery && total < DELIVERY.minOrder;
  const grandTotal = total + deliveryFee;
  const valid = !errors.name && !errors.phone && !errors.email && !addressErrors.street && !addressErrors.zip && !belowMin && !pickupError && !paused && blocked.length === 0;
  const contactDone = !errors.name && !errors.phone && !errors.email && !addressErrors.street && !addressErrors.zip;
  const stepDone: Record<StepId, boolean> = { 1: !belowMin, 2: !pickupError, 3: contactDone, 4: true };
  // Im ersten Durchlauf gelten nur Schritte vor dem offenen als erledigt – so wirkt der Fortschritt ehrlich.
  const confirmed = (step: StepId) => stepDone[step] && (!flow || openStep === null || step < openStep);

  /** Schritt öffnen (oder alle zuklappen) und ihn ins Bild holen. */
  const openAt = (step: StepId | null) => {
    setOpenStep(step);
    if (!step) return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById(`step-${step}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }),
    );
  };
  /** Schritt abgeschlossen: im ersten Durchlauf weiter zum nächsten, sonst zurück zur Übersicht. */
  const finish = (step: StepId, next?: StepId | null) => {
    if (next !== undefined) return openAt(next);
    if (flow && step < 4) return openAt((step + 1) as StepId);
    setFlow(false);
    openAt(null);
  };

  const submit = async () => {
    if (placing) return;
    setTouched(true);
    setOrderError("");
    if (!valid || count === 0) {
      // Den Schritt mit der fehlenden Angabe aufklappen und zum ersten fehlerhaften Feld springen.
      const missing = ([1, 2, 3] as StepId[]).find((step) => !stepDone[step]);
      if (missing && !paused && blocked.length === 0) setOpenStep(missing);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const first = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
          first?.scrollIntoView({ behavior: "smooth", block: "center" });
          if (first instanceof HTMLInputElement) first.focus({ preventScroll: true });
        }),
      );
      return;
    }
    const pickupAt = pickup === "asap" ? Date.now() + prepMinutes * 60000 : pickup;
    if (remember) {
      localStorage.setItem("yj-contact", JSON.stringify(contact));
      if (delivery) localStorage.setItem("yj-address", JSON.stringify(address));
    } else {
      localStorage.removeItem("yj-contact");
      localStorage.removeItem("yj-address");
    }
    setPlacing(true);
    const result = await orderStore.create({
      pickupAt,
      pickupLabel: pickup === "asap" ? "Schnellstmöglich" : `${slotDay?.label ?? "Heute"} ${hhmm(new Date(pickup))} Uhr`,
      fulfillment,
      address: delivery ? address : undefined,
      deliveryFee,
      payment,
      contact,
      note,
      items,
      total: grandTotal,
    });
    setPlacing(false);
    if ("error" in result) {
      setOrderError(orderBlockMessage(result.error) ?? "Deine Bestellung konnte nicht gesendet werden. Bitte prüfe deine Internetverbindung und versuch es noch einmal.");
      requestAnimationFrame(() => document.getElementById("order-error")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    const { order } = result;
    track("order_placed", { qty: count, value: grandTotal, variant: `${payment} · ${fulfillment}` });
    if (payment === "onsite") {
      cartStore.clear();
      navigate({ to: "/order-success", search: { id: order.id } });
    } else {
      // Online-Zahlung: Bestellung ist angelegt, aber erst nach erfolgreicher
      // Zahlung für die Küche sichtbar (Webhook markiert sie als bezahlt).
      // Der Warenkorb bleibt bis zur Rückkehr von der Zahlung erhalten (geleert auf /order-success).
      setCheckoutOrder(order);
    }
  };

  if (checkoutOrder) {
    const fetchClientSecret = async (): Promise<string> => {
      const result = await createOrderCheckout({
        data: {
          orderId: checkoutOrder.id,
          // Nur Referenz + Menge – den Preis berechnet der Server aus der Speisekarte.
          items: checkoutOrder.items.flatMap((item) => (item.ref ? [{ ref: item.ref, qty: item.qty }] : [])),
          fulfillment: checkoutOrder.fulfillment ?? "pickup",
          customerEmail: checkoutOrder.contact.email,
          returnUrl: `${window.location.origin}/order-success?id=${checkoutOrder.id}&session_id={CHECKOUT_SESSION_ID}`,
          environment: getStripeEnvironment(),
        },
      });
      const message = "error" in result ? result.error : !result.clientSecret ? "Keine Zahlungs-Session erhalten." : "";
      if (message) {
        setPayError(message);
        throw new Error(message);
      }
      return (result as { clientSecret: string }).clientSecret;
    };

    return (
      <main className="min-h-screen bg-[#f8f6f0] text-[#1f2022]">
        <PaymentTestModeBanner />
        <PageHero compact width="max-w-3xl">
          <button
            type="button"
            onClick={() => {
              setPayError("");
              setCheckoutOrder(null);
            }}
            className="hero-rise mb-5 inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" /> Zurück zur Kasse
          </button>
          <p className="hero-rise text-xs font-bold uppercase tracking-[.2em] text-[#f5c3a6]">Bestellung #{checkoutOrder.id}</p>
          <RiseTitle lead="Sicher" accent="bezahlen." className="mt-3 text-5xl sm:text-7xl" />
          <div className="hero-rise mt-6 flex flex-wrap gap-2" style={{ animationDelay: "320ms" }}>
            <HeroChip icon={<LockKeyhole />}>{euro(checkoutOrder.total)} · verschlüsselt über Stripe</HeroChip>
            <HeroChip icon={<ShieldCheck />}>Erst nach der Zahlung in der Küche</HeroChip>
          </div>
        </PageHero>
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-8 sm:px-8">
          {payError && (
            <p role="alert" className="mb-6 rounded-2xl border border-[#b4432f]/30 bg-[#b4432f]/10 px-4 py-3 text-sm text-[#b4432f]">
              {payError}
            </p>
          )}
          <div className="overflow-hidden rounded-[2rem] border border-[#e2d8ca] bg-white shadow-xl shadow-[#1f2022]/5">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      </main>
    );
  }

  if (count === 0) {
    return (
      <main className="bg-[#f8f6f0] text-[#1f2022]">
        <PageHero width="max-w-3xl" className="text-center">
          <span className="hero-rise mx-auto flex size-20 items-center justify-center rounded-full bg-white/10 text-[#f5c3a6] ring-1 ring-white/15"><ShoppingBag className="size-9" /></span>
          <RiseTitle lead="Dein Warenkorb" accent="ist noch leer." className="mt-6 text-5xl sm:text-7xl" />
          <p className="hero-rise mx-auto mt-5 max-w-md text-white/75" style={{ animationDelay: "380ms" }}>Such dir zuerst etwas Leckeres aus – Bowls, Matcha, Açaí und mehr.</p>
          <div className="hero-rise mt-9 flex justify-center" style={{ animationDelay: "480ms" }}><GlowCta>Zur Speisekarte</GlowCta></div>
        </PageHero>
      </main>
    );
  }

  // Live-Übersicht der Auswahl (Kopfbereich + zugeklappte Schritte) – zeigt, was noch fehlt.
  const choices: Choice[] = [
    { icon: delivery ? <Bike /> : <Store />, label: delivery ? "Liefern lassen" : "Selbst abholen", done: confirmed(1), hint: belowMin ? `Mindestbestellwert ${euro(DELIVERY.minOrder)}` : delivery ? `${euro(DELIVERY.fee)} Liefergebühr` : "Kostenlos" },
    { icon: <Clock3 />, label: pickup === "asap" ? "Schnellstmöglich" : `${slotDay?.label ?? "Heute"} ${hhmm(new Date(pickup))} Uhr`, done: confirmed(2), hint: pickupError || (pickup === "asap" ? `ca. ${PREP_MINUTES[fulfillment]} Min` : "Wunschzeit") },
    { icon: <UserRound />, label: contactDone ? contact.name.trim() : "Kontakt", done: confirmed(3), hint: contactDone ? (delivery ? `${address.street}, ${address.zip}` : contact.phone) : "noch offen" },
    { icon: <CreditCard />, label: PAYMENTS.find((entry) => entry.key === payment)?.title ?? "", done: confirmed(4), hint: payment === "onsite" ? (delivery ? "an der Haustür" : "an der Theke") : "im nächsten Schritt" },
  ];
  const doneCount = choices.filter((entry) => entry.done).length;
  const stepProps = (step: StepId) => ({
    n: step,
    open: openStep === step,
    done: choices[step - 1]!.done,
    missing: !stepDone[step],
    upcoming: flow && openStep !== null && step > openStep,
    summary: choices[step - 1]!,
    onOpen: () => openAt(step),
  });
  const ready = valid && count > 0 && !placing;

  const field = (key: keyof typeof contact, label: string, type: string, auto: string) => (
    <label className="group block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[.14em] text-[#6f675f]">{label}</span>
      <Input
        type={type}
        autoComplete={auto}
        value={contact[key]}
        onChange={(event) => setContact({ ...contact, [key]: event.target.value })}
        aria-invalid={touched && !!errors[key]}
        className={`h-13 rounded-xl border-[#e2d8ca] bg-white px-4 text-base transition-shadow focus-visible:ring-[#c46b38] ${touched && errors[key] ? "border-[#b4432f]" : ""}`}
      />
      {touched && errors[key] && <span className="mt-1 block text-xs text-[#b4432f]">{errors[key]}</span>}
    </label>
  );

  return (
    <main className="min-h-screen bg-[#f8f6f0] pb-32 text-[#1f2022] lg:pb-16">
      <PaymentTestModeBanner />
      <PageHero compact width="max-w-6xl" aside={<ChoicesCard rows={choices} onOpen={(step) => openAt(step)} />}>
        <Link to="/speisekarte" className="hero-rise mb-5 inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition-colors hover:text-white">
          <ArrowLeft className="size-4" /> Weiter einkaufen
        </Link>
        <RiseTitle lead="Fast" accent="geschafft." className="text-6xl sm:text-7xl lg:text-8xl" />
        <div className="hero-rise mt-6 flex flex-wrap gap-2" style={{ animationDelay: "300ms" }}>
          <HeroChip icon={<ShieldCheck />}>Ohne Konto · in 30 Sekunden</HeroChip>
          <HeroChip icon={<Clock3 />}>{delivery ? `Lieferung in ca. ${PREP_MINUTES.delivery} Min` : `Abholbereit in ca. ${PREP_MINUTES.pickup} Min`}</HeroChip>
        </div>
        {/* Handy & Tablet: Fortschritt als Balken */}
        <div className="hero-rise mt-6 max-w-md lg:hidden" style={{ animationDelay: "380ms" }}>
          <div className="flex justify-between text-xs font-semibold text-white/70"><span>{openStep ? `Schritt ${openStep} von ${choices.length}` : doneCount === choices.length ? "Alles bereit" : "Fast fertig"}</span><span>{doneCount} von {choices.length}</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#f5c3a6] transition-[width] duration-700 ease-[cubic-bezier(.32,.72,0,1)]" style={{ width: `${(doneCount / choices.length) * 100}%` }} /></div>
        </div>
      </PageHero>
      <div className="mx-auto max-w-6xl px-4 sm:px-8">

        {(paused || blocked.length > 0 || orderError) && (
          <div className="mt-6 space-y-3" aria-live="polite">
            {paused && (
              <div data-invalid="true" className="flex gap-3 rounded-2xl border border-[#b4432f]/30 bg-[#b4432f]/10 px-4 py-3 text-[#8f3222]">
                <CirclePause className="mt-0.5 size-5 shrink-0" />
                <p className="text-sm"><strong className="block">Online-Bestellungen sind gerade pausiert{untilLabel(availability.pausedUntil) === "bis auf Weiteres" ? "" : ` · ${untilLabel(availability.pausedUntil)}`}.</strong>
                  {availability.pauseNote || "Die Küche ist gerade voll – bitte versuch es etwas später noch einmal. Dein Warenkorb bleibt gespeichert."}</p>
              </div>
            )}
            {blocked.length > 0 && (
              <div data-invalid="true" className="rounded-2xl border border-[#b4432f]/30 bg-[#b4432f]/10 px-4 py-3 text-[#8f3222]">
                <p className="flex items-center gap-2 text-sm font-semibold"><PackageX className="size-5 shrink-0" />Leider gerade nicht mehr da – bitte entfernen:</p>
                <ul className="mt-2 space-y-1.5">
                  {blocked.map(({ item, reason }) => (
                    <li key={item.id} className="flex items-center gap-3 text-sm">
                      <span className="min-w-0 flex-1 truncate">{item.qty}× {item.name} <span className="opacity-80">({reason})</span></span>
                      <button type="button" onClick={() => cartStore.remove(item.id)} aria-label={`${item.name} entfernen`} className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1f2022]"><Trash2 className="size-3.5" />Entfernen</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {orderError && (
              <p id="order-error" role="alert" className="rounded-2xl border border-[#b4432f]/30 bg-[#b4432f]/10 px-4 py-3 text-sm text-[#8f3222]">{orderError}</p>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="flex min-w-0 flex-col gap-5">
            <Step {...stepProps(1)} title="Abholen oder liefern?" label="Bestellart">
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { key: "pickup", title: "Selbst abholen", text: "Kostenlos · Willy-Brandt-Str. 23", icon: Store },
                  { key: "delivery", title: "Liefern lassen", text: `${euro(DELIVERY.fee)} · ab ${euro(DELIVERY.minOrder)} Bestellwert · nur ${DELIVERY.city}`, icon: Bike },
                ] as const).map(({ key, title, text, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setFulfillment(key);
                      // Unter dem Mindestbestellwert bleibt der Schritt offen (Hinweis darunter).
                      if (key === "delivery" && total < DELIVERY.minOrder) return;
                      const addressMissing = key === "delivery" && (address.street.trim().length < 4 || !address.zip.startsWith(DELIVERY.zipPrefix));
                      finish(1, !flow && addressMissing ? 3 : undefined);
                    }}
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
              {belowMin && <p data-invalid={touched} className="mt-3 text-sm text-[#b4432f]">Für die Lieferung brauchen wir einen Mindestbestellwert von {euro(DELIVERY.minOrder)}.</p>}
            </Step>

            <Step {...stepProps(2)} title={delivery ? "Wann soll geliefert werden?" : "Wann holst du ab?"} label={delivery ? "Lieferzeit" : "Abholzeit"} action={{ label: flow ? "Weiter" : "Übernehmen", onClick: () => finish(2), disabled: !!pickupError }}>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <button
                  type="button"
                  disabled={!asapOpen}
                  onClick={() => {
                    setPickup("asap");
                    finish(2);
                  }}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${pickup === "asap" ? "border-[#1f2022] bg-[#1f2022] text-[#f8f6f0] shadow-lg" : "border-[#e2d8ca] bg-white hover:border-[#c46b38] disabled:hover:border-[#e2d8ca]"}`}
                >
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${pickup === "asap" ? "bg-[#c46b38]" : "bg-[#f1e8dc] text-[#c46b38]"}`}><Zap className="size-5" /></span>
                  <span>
                    <strong className="block">Schnellstmöglich</strong>
                    <span className={`text-sm ${pickup === "asap" ? "text-[#cfc2b5]" : "text-[#6f675f]"}`}>
                      {!asapOpen ? "Gerade geschlossen – wähle eine Wunschzeit" : delivery ? "bei dir in ca. 40–50 Minuten" : "fertig in ca. 20–25 Minuten"}
                    </span>
                  </span>
                </button>
                <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[#d9cec0] px-4 py-3 text-sm text-[#6f675f]">
                  <MapPin className="size-4 shrink-0 text-[#c46b38]" /> {delivery ? "Lieferung nach Hanau" : "Willy-Brandt-Str. 23, Hanau"}
                </div>
              </div>
              <p className="mb-2 mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#6f675f]">
                <Clock3 className="size-3.5" /> {asapOpen ? "Oder Wunschzeit" : "Wunschzeit"} {slotDay ? slotDay.label.toLowerCase() : "heute"}
              </p>
              {pickupError && <p data-invalid={touched} className="text-sm text-[#b4432f]">{pickupError}</p>}
              <div className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                {(slotDay?.slots ?? []).map((slot, index) => {
                  const active = pickup === slot.getTime();
                  // Ab Tablet erst die nächsten 12 Zeiten, der Rest per "Weitere Zeiten" (gewählte Zeit bleibt sichtbar).
                  const collapsed = !allSlots && index >= SLOTS_COLLAPSED && !active;
                  return (
                    <button
                      key={slot.getTime()}
                      type="button"
                      onClick={() => {
                        setPickup(slot.getTime());
                        finish(2);
                      }}
                      className={`${collapsed ? "sm:hidden" : ""} shrink-0 snap-start rounded-full border px-4 py-2.5 text-sm font-semibold tabular-nums transition-all duration-200 active:scale-95 ${active ? "border-[#c46b38] bg-[#c46b38] text-white shadow-md" : "border-[#e2d8ca] bg-white hover:border-[#c46b38]"}`}
                    >
                      {hhmm(slot)}
                    </button>
                  );
                })}
                {!allSlots && (slotDay?.slots.length ?? 0) > SLOTS_COLLAPSED && (
                  <button
                    type="button"
                    onClick={() => setAllSlots(true)}
                    className="hidden shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold text-[#c46b38] underline-offset-4 hover:underline sm:inline-flex"
                  >
                    Weitere Zeiten
                  </button>
                )}
              </div>
            </Step>

            <Step {...stepProps(3)} title={delivery ? "Wohin und an wen?" : "Wer holt ab?"} label="Kontakt" action={{
              label: flow ? "Weiter zur Zahlung" : "Übernehmen",
              onClick: () => {
                if (contactDone) return finish(3);
                setTouched(true);
                requestAnimationFrame(() => document.querySelector<HTMLInputElement>('#step-3 [aria-invalid="true"]')?.focus());
              },
            }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">{field("name", "Name", "text", "name")}</div>
                {delivery && (
                  <>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[.14em] text-[#6f675f]">Straße & Hausnummer</span>
                      <Input autoComplete="street-address" aria-invalid={touched && !!addressErrors.street} value={address.street} onChange={(event) => setAddress({ ...address, street: event.target.value })} className={`h-13 rounded-xl border-[#e2d8ca] bg-white px-4 text-base ${touched && addressErrors.street ? "border-[#b4432f]" : ""}`} />
                      {touched && addressErrors.street && <span className="mt-1 block text-xs text-[#b4432f]">{addressErrors.street}</span>}
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[.14em] text-[#6f675f]">PLZ</span>
                      <Input inputMode="numeric" maxLength={5} autoComplete="postal-code" aria-invalid={touched && !!addressErrors.zip} value={address.zip} onChange={(event) => setAddress({ ...address, zip: event.target.value.replace(/\D/g, "") })} className={`h-13 rounded-xl border-[#e2d8ca] bg-white px-4 text-base ${touched && addressErrors.zip ? "border-[#b4432f]" : ""}`} />
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
                <summary className="cursor-pointer list-none text-sm font-semibold text-[#6f675f] marker:hidden">+ Hinweis an die Küche <span className="font-normal">(z. B. Allergien)</span></summary>
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="z. B. Sesam-Allergie" className="mt-3 border-[#e2d8ca] bg-white" />
              </details>
              <button type="button" onClick={() => setRemember(!remember)} className="mt-4 flex items-center gap-3 text-sm text-[#6f675f]">
                <span className={`flex size-5 items-center justify-center rounded-md border-2 transition-colors ${remember ? "border-[#c46b38] bg-[#c46b38] text-white" : "border-[#d9cec0] bg-white"}`}>{remember && <Check className="size-3.5" />}</span>
                Daten auf diesem Gerät merken
              </button>
            </Step>

            <Step {...stepProps(4)} title="Wie möchtest du zahlen?" label="Zahlung">
              <div className="grid gap-3 sm:grid-cols-3">
                {PAYMENTS.map(({ key, title, text, icon: Icon }) => {
                  const active = payment === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setPayment(key);
                        finish(4);
                      }}
                      className={`relative flex items-center gap-3 rounded-2xl border-2 p-4 pr-10 text-left sm:flex-col sm:items-start sm:pr-4 transition-all duration-200 active:scale-[.98] ${active ? "border-[#c46b38] bg-[#fff7f1] shadow-md" : "border-[#e2d8ca] bg-white hover:border-[#c46b38]/60"}`}
                    >
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-[#c46b38] text-white" : "bg-[#f1e8dc] text-[#1f2022]"}`}><Icon className="size-5" /></span>
                      <span className="min-w-0">
                        <strong className="block text-sm leading-tight">{title}</strong>
                        <span className="mt-0.5 block text-xs leading-snug text-[#6f675f]">{key === "onsite" ? `${text} ${delivery ? "an der Haustür" : "an der Theke"}` : text}</span>
                      </span>
                      {active && <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-[#c46b38] text-white animate-in zoom-in-50"><Check className="size-3" /></span>}
                    </button>
                  );
                })}
              </div>
              {payment !== "onsite" && <p className="mt-3 text-xs text-[#6f675f]">Du wirst im nächsten Schritt sicher zur Zahlung weitergeleitet – erst dann geht die Bestellung in die Küche.</p>}
            </Step>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-28 lg:h-fit">
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#1f2022] text-[#f8f6f0] shadow-2xl shadow-[#1f2022]/20">
              <div className="absolute -right-32 -top-32 -z-10 size-[24rem] rounded-full bg-[radial-gradient(circle,rgba(196,107,56,.4),transparent_65%)]" aria-hidden="true" />
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
                      {blockedReason(availability, item.ref) && <p className="text-xs font-semibold text-[#f0a48f]">{blockedReason(availability, item.ref)}</p>}
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
                {/* Leuchtet, sobald alles ausgefüllt ist */}
                <GlowFrame active={ready} className="mt-5 hidden w-full lg:flex">
                  <button type="button" onClick={() => void submit()} disabled={placing} aria-disabled={paused || undefined} className={`glow-cta-face group relative flex h-14 w-full items-center justify-center gap-2 rounded-full font-bold text-white transition-all duration-200 active:scale-[.98] disabled:opacity-70 ${paused ? "bg-white/20" : "bg-[#c46b38] hover:bg-[#d9946d]"}`}>
                    {placing ? <><LoaderCircle className="size-4 animate-spin" /> Wird gesendet …</> : paused ? <><CirclePause className="size-4" /> Gerade pausiert</> : <>{payment === "onsite" ? "Jetzt bestellen" : "Zahlungspflichtig bestellen"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></>}
                  </button>
                </GlowFrame>
                {payment !== "onsite" && <p className="mt-3 hidden items-center justify-center gap-1.5 text-xs text-[#cfc2b5] lg:flex"><LockKeyhole className="size-3.5" />Sichere Zahlung über Stripe</p>}
                {touched && !valid && <p className="mt-3 hidden text-center text-xs text-[#f0a48f] lg:block">Bitte prüfe deine Angaben.</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile: feste Bestellleiste */}
      <div className="fixed inset-x-3 bottom-3 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <GlowFrame active={ready} radius="1rem" className="w-full">
        <button type="button" onClick={() => void submit()} disabled={placing} aria-disabled={paused || undefined} className="glow-cta-face relative flex h-16 w-full items-center justify-between rounded-2xl bg-[#1f2022] pl-5 pr-2 text-[#f8f6f0] shadow-2xl shadow-[#1f2022]/30 active:scale-[.98] disabled:opacity-80">
          <span className="text-left">
            <span className="block text-xs text-[#cfc2b5]">{paused ? "Bestellungen pausiert" : blocked.length > 0 ? "Ausverkauftes entfernen" : touched && !valid ? "Bitte Angaben prüfen" : `${count} Artikel · inkl. MwSt.`}</span>
            <span className="block font-display text-xl tabular-nums">{euro(grandTotal)}</span>
          </span>
          <span className={`flex h-12 items-center gap-2 rounded-xl px-5 font-bold text-white ${paused ? "bg-white/20" : "bg-[#c46b38]"}`}>
            {placing ? <LoaderCircle className="size-4 animate-spin" /> : paused ? <CirclePause className="size-4" /> : null}
            {placing ? "Sendet …" : paused ? "Pausiert" : <>Bestellen <ArrowRight className="size-4" /></>}
          </span>
        </button>
        </GlowFrame>
      </div>
    </main>
  );
}

type StepAction = { label: string; onClick: () => void; disabled?: boolean };

/** Ein Schritt der Kasse: offen mit Inhalt, sonst eine Zeile mit der Auswahl und "Ändern". */
function Step({ n, title, label, open, done, missing, upcoming, summary, onOpen, action, children }: {
  n: number; title: string; label: string; open: boolean; done: boolean; missing: boolean; upcoming: boolean;
  summary: Choice; onOpen: () => void; action?: StepAction; children: React.ReactNode;
}) {
  const badge = (
    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full font-display text-base transition-colors duration-300 ${done ? "bg-[#c46b38] text-white" : open ? "bg-[#1f2022] text-[#f8f6f0]" : "bg-[#f1e8dc] text-[#6f675f]"}`} aria-hidden="true">
      {done ? <Check className="size-4 animate-in zoom-in-50" /> : n}
    </span>
  );
  return (
    <section id={`step-${n}`} className={`scroll-mt-24 rounded-[1.75rem] border bg-[#fdfbf7] shadow-sm shadow-[#1f2022]/[.03] transition-[border-color,box-shadow,opacity] duration-300 ${open ? "border-[#c46b38]/50 p-5 shadow-lg shadow-[#1f2022]/[.06] sm:p-7" : "border-[#e2d8ca] p-4 sm:px-6"} ${upcoming ? "opacity-60" : ""}`}>
      {open ? (
        <>
          <div className="mb-5 flex items-center gap-3">
            {badge}
            <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
          </div>
          <div className="animate-in fade-in slide-in-from-top-1 duration-300">{children}</div>
          {action && (
            <button type="button" onClick={action.onClick} disabled={action.disabled} className="group mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#1f2022] px-6 font-semibold text-[#f8f6f0] transition-colors hover:bg-[#c46b38] disabled:opacity-50">
              {action.label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </>
      ) : (
        <button type="button" onClick={onOpen} aria-expanded={false} className="flex w-full items-center gap-4 text-left">
          {badge}
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-[.14em] text-[#6f675f]">{label}</span>
            <span className="block truncate font-semibold">{summary.label}</span>
            <span className={`block truncate text-sm ${missing ? "font-semibold text-[#c46b38]" : "text-[#6f675f]"}`}>{summary.hint}</span>
          </span>
          <span className="shrink-0 rounded-full border border-[#e2d8ca] bg-white px-3.5 py-1.5 text-sm font-semibold transition-colors hover:border-[#c46b38]">{missing ? "Ausfüllen" : "Ändern"}</span>
        </button>
      )}
    </section>
  );
}

type Choice = { icon: React.ReactNode; label: string; hint: string; done: boolean };

function HeroChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-[#f5f0e8] backdrop-blur-md sm:text-sm [&_svg]:size-4 [&_svg]:text-[#f5c3a6]">{icon}{children}</span>;
}

/** Desktop: was gewählt ist und was noch fehlt – aktualisiert sich beim Ausfüllen. */
function ChoicesCard({ rows, onOpen }: { rows: Choice[]; onOpen: (step: StepId) => void }) {
  const done = rows.filter((row) => row.done).length;
  return (
    <div className="hero-rise hidden lg:block" style={{ animationDelay: "420ms" }}>
      <div className="ml-auto max-w-sm rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[#f5c3a6]"><span>Deine Auswahl</span><span className="tabular-nums">{done}/{rows.length}</span></div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#f5c3a6] transition-[width] duration-700 ease-[cubic-bezier(.32,.72,0,1)]" style={{ width: `${(done / rows.length) * 100}%` }} /></div>
        <ul className="mt-5 space-y-3">
          {rows.map((row, index) => (
            <li key={index}>
              <button type="button" onClick={() => onOpen((index + 1) as StepId)} className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-2xl px-2 py-1 text-left transition-colors hover:bg-white/10">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 [&_svg]:size-4 ${row.done ? "bg-[#c46b38] text-white" : "bg-white/10 text-white/60"}`}>{row.done ? <Check /> : row.icon}</span>
                <span className="min-w-0"><strong className="block truncate text-sm">{row.label}</strong><span className={`block truncate text-xs ${row.done ? "text-white/60" : "text-[#f5c3a6]"}`}>{row.hint}</span></span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
