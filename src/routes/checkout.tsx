import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { ArrowLeft, ArrowRight, Bike, Check, CirclePause, CircleCheck, Clock3, CreditCard, LoaderCircle, LockKeyhole, Minus, PackageX, Plus, ShieldCheck, ShoppingBag, Store, Trash2, UserRound, Wallet, Zap, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { GlowCta, GlowFrame, PageHero, RiseTitle } from "@/components/site/brand-ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cart as cartStore, euro, useCart, type CartItem } from "@/lib/cart-store";
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
/** Schritte wie bei einer Tisch-Reservierung: ein Schritt pro Ansicht, am Ende die Übersicht. */
const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: "Bestellart", icon: Store },
  { label: "Zeit", icon: Clock3 },
  { label: "Kontakt", icon: UserRound },
  { label: "Zahlung", icon: CreditCard },
  { label: "Übersicht", icon: CircleCheck },
];
/** Wunschzeiten nach Tageszeit gruppiert (Minuten ab Mitternacht). */
const DAYPARTS = [
  { key: "mittag", label: "Bis 14 Uhr", from: 0, to: 14 * 60 },
  { key: "nachmittag", label: "14 – 17 Uhr", from: 14 * 60, to: 17 * 60 },
  { key: "abend", label: "Ab 17 Uhr", from: 17 * 60, to: 24 * 60 },
] as const;
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
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [payError, setPayError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  // Aktueller Schritt (0–4) und der weiteste bisher erreichte – nur bis dorthin darf man springen.
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [daypart, setDaypart] = useState<(typeof DAYPARTS)[number]["key"] | null>(null);
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
      // Stammgast: alles schon bekannt – direkt zur Übersicht, dort lässt sich jeder Schritt ändern.
      if (saved && Object.values(contactErrors(saved)).every((error) => !error)) {
        setStep(4);
        setReached(4);
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
    zip: !delivery ? "" : !address.zip ? "Bitte gib deine PLZ ein." : !address.zip.startsWith(DELIVERY.zipPrefix) || address.zip.length !== 5 ? `Wir liefern nur innerhalb von ${DELIVERY.city} (PLZ 63450–63457).` : "",
  };
  const deliveryFee = delivery ? DELIVERY.fee : 0;
  const belowMin = delivery && total < DELIVERY.minOrder;
  const grandTotal = total + deliveryFee;
  const valid = !errors.name && !errors.phone && !errors.email && !addressErrors.street && !addressErrors.zip && !belowMin && !pickupError && !paused && blocked.length === 0;
  const contactDone = !errors.name && !errors.phone && !errors.email && !addressErrors.street && !addressErrors.zip;
  /** Darf man von diesem Schritt weiter? */
  const stepOk = [!belowMin, !pickupError, contactDone, true, valid];
  const timeLabel = pickup === "asap" ? `Schnellstmöglich · ca. ${prepMinutes} Min` : `${slotDay?.label ?? "Heute"} um ${hhmm(new Date(pickup))} Uhr`;

  /** Zu einem Schritt wechseln und die Karte oben ins Bild holen. */
  const goTo = (next: number) => {
    setStep(next);
    setReached((current) => Math.max(current, next));
    requestAnimationFrame(() => {
      const card = document.getElementById("checkout-card");
      if (card && card.getBoundingClientRect().top < 72) card.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
  };
  const next = () => {
    if (!stepOk[step]) {
      setTouched(true);
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('#checkout-card [aria-invalid="true"]')?.focus());
      return;
    }
    // Wer aus der Übersicht etwas ändert, springt danach direkt zurück zur Übersicht.
    goTo(reached === 4 ? 4 : step + 1);
  };

  const submit = async () => {
    if (placing) return;
    setTouched(true);
    setOrderError("");
    if (!valid || count === 0) {
      // Zum ersten Schritt mit fehlender Angabe springen (Pause/Ausverkauft stehen oben über der Karte).
      const missing = stepOk.slice(0, 3).findIndex((ok) => !ok);
      if (missing >= 0 && !paused && blocked.length === 0) goTo(missing);
      else requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-invalid="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" }));
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

  const field = (key: keyof typeof contact, label: string, type: string, auto: string, placeholder: string) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label} *</span>
      <Input
        type={type}
        autoComplete={auto}
        placeholder={placeholder}
        value={contact[key]}
        onChange={(event) => setContact({ ...contact, [key]: event.target.value })}
        onKeyDown={(event) => event.key === "Enter" && next()}
        aria-invalid={touched && !!errors[key]}
        className={`h-12 rounded-xl border-[#e2d8ca] bg-white px-4 text-base focus-visible:ring-[#c46b38] ${touched && errors[key] ? "border-[#b4432f]" : ""}`}
      />
      {touched && errors[key] && <span className="mt-1 block text-xs text-[#b4432f]">{errors[key]}</span>}
    </label>
  );
  const option = (active: boolean) =>
    `relative flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 active:scale-[.99] ${active ? "border-[#c46b38] bg-[#fff7f1] shadow-md" : "border-[#e2d8ca] bg-white hover:border-[#c46b38]/50"}`;
  const activeCheck = <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-[#c46b38] text-white animate-in zoom-in-50"><Check className="size-3" /></span>;
  const slots = slotDay?.slots ?? [];
  const minutesOf = (slot: Date) => slot.getHours() * 60 + slot.getMinutes();
  const parts = DAYPARTS.filter((part) => slots.some((slot) => minutesOf(slot) >= part.from && minutesOf(slot) < part.to));
  const selectedPart = pickup === "asap" ? null : DAYPARTS.find((part) => minutesOf(new Date(pickup)) >= part.from && minutesOf(new Date(pickup)) < part.to)?.key;
  const shownPart = daypart && parts.some((part) => part.key === daypart) ? daypart : (selectedPart ?? parts[0]?.key);
  const isLast = step === STEPS.length - 1;

  const titles = ["Abholen oder liefern?", delivery ? "Wann soll geliefert werden?" : "Wann holst du ab?", delivery ? "Wohin und an wen?" : "Deine Kontaktdaten", "Wie möchtest du zahlen?", "Alles richtig?"];

  return (
    <main className="min-h-screen bg-[#f8f6f0] pb-16 text-[#1f2022]">
      <PaymentTestModeBanner />
      <PageHero compact width="max-w-6xl" className="text-center">
        <Link to="/speisekarte" className="hero-rise mb-5 inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition-colors hover:text-white">
          <ArrowLeft className="size-4" /> Weiter einkaufen
        </Link>
        <h1 className="hero-rise font-display text-5xl leading-none sm:text-7xl">Bestellen bei <em className="text-[#f5c3a6]">Yamiin &amp; Jaiyana&rsquo;s</em></h1>
        <p className="hero-rise mx-auto mt-4 max-w-lg text-white/75" style={{ animationDelay: "200ms" }}>In fünf kurzen Schritten – ohne Konto. {delivery ? `Lieferung in ${DELIVERY.city}` : `Abholbereit in ca. ${PREP_MINUTES.pickup} Min`}.</p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-8">
        {(paused || blocked.length > 0 || orderError) && (
          <div className="mb-6 space-y-3" aria-live="polite">
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
            {orderError && <p id="order-error" role="alert" className="rounded-2xl border border-[#b4432f]/30 bg-[#b4432f]/10 px-4 py-3 text-sm text-[#8f3222]">{orderError}</p>}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section id="checkout-card" aria-label="Bestellung abschließen" className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-[#e2d8ca] bg-[#fdfbf7] shadow-xl shadow-[#1f2022]/[.05]">
            {/* Kopf: Schrittleiste (Desktop) bzw. Schritt + Balken (Handy) */}
            <div className="border-b border-[#eee5dc] px-5 pb-4 pt-5 sm:px-8">
              <ol className="hidden items-center justify-between gap-2 md:flex">
                {STEPS.map((entry, index) => {
                  const Icon = entry.icon;
                  const current = index === step;
                  const canJump = index <= reached && !current;
                  return (
                    <li key={entry.label}>
                      <button type="button" disabled={!canJump} onClick={() => goTo(index)} aria-current={current ? "step" : undefined}
                        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${current ? "bg-[#1f2022] text-[#f8f6f0]" : index < reached || (index <= reached && index < step) ? "text-[#c46b38] hover:bg-[#c46b38]/10" : "text-[#a39a91]"} disabled:cursor-default`}>
                        {index < step || (index <= reached && !current && stepOk[index]) ? <Check className="size-4" /> : <Icon className="size-4" />}
                        {entry.label}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="md:hidden">
                <div className="flex items-center justify-between text-sm"><span className="font-semibold text-[#c46b38]">{STEPS[step]!.label}</span><span className="text-[#6f675f]">Schritt {step + 1} von {STEPS.length}</span></div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eee5dc] md:mt-4">
                <div className="h-full rounded-full bg-[#c46b38] transition-[width] duration-500 ease-[cubic-bezier(.32,.72,0,1)]" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
              </div>
            </div>

            {/* Inhalt des Schritts */}
            <div key={step} className="px-5 py-6 animate-in fade-in slide-in-from-right-4 duration-300 sm:px-8 sm:py-8">
              <h2 className="font-display text-3xl leading-tight sm:text-4xl">{titles[step]}</h2>

              {step === 0 && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {([
                    { key: "pickup", title: "Selbst abholen", text: "Kostenlos · Willy-Brandt-Str. 23", icon: Store },
                    { key: "delivery", title: "Liefern lassen", text: `${euro(DELIVERY.fee)} · ab ${euro(DELIVERY.minOrder)} · nur ${DELIVERY.city}`, icon: Bike },
                  ] as const).map(({ key, title, text, icon: Icon }) => (
                    <button key={key} type="button" onClick={() => setFulfillment(key)} aria-pressed={fulfillment === key} className={option(fulfillment === key)}>
                      <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${fulfillment === key ? "bg-[#c46b38] text-white" : "bg-[#f1e8dc]"}`}><Icon className="size-5" /></span>
                      <span className="pr-6"><strong className="block">{title}</strong><span className="text-sm text-[#6f675f]">{text}</span></span>
                      {fulfillment === key && activeCheck}
                    </button>
                  ))}
                  {belowMin && <p data-invalid="true" className="text-sm text-[#b4432f] sm:col-span-2">Für die Lieferung brauchen wir einen Mindestbestellwert von {euro(DELIVERY.minOrder)} – es fehlen noch {euro(DELIVERY.minOrder - total)}.</p>}
                </div>
              )}

              {step === 1 && (
                <div className="mt-6">
                  <div className="rounded-xl border border-[#e2d8ca] bg-white px-4 py-3 text-sm text-[#6f675f]">
                    {delivery ? "Lieferung" : "Abholung"} <strong className="text-[#1f2022]">{timeLabel}</strong>{!delivery && <> · {SITE_STREET}</>}
                  </div>
                  {pickupError && <p data-invalid="true" className="mt-3 text-sm text-[#b4432f]">{pickupError}</p>}
                  <button type="button" disabled={!asapOpen} onClick={() => setPickup("asap")} aria-pressed={pickup === "asap"} className={`mt-4 ${option(pickup === "asap")} disabled:cursor-not-allowed disabled:opacity-50`}>
                    <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${pickup === "asap" ? "bg-[#c46b38] text-white" : "bg-[#f1e8dc] text-[#c46b38]"}`}><Zap className="size-5" /></span>
                    <span className="pr-6"><strong className="block">Schnellstmöglich</strong><span className="text-sm text-[#6f675f]">{!asapOpen ? "Gerade geschlossen – wähle eine Wunschzeit" : delivery ? `bei dir in ca. ${PREP_MINUTES.delivery} Minuten` : `fertig in ca. ${PREP_MINUTES.pickup} Minuten`}</span></span>
                    {pickup === "asap" && activeCheck}
                  </button>
                  {slots.length > 0 && (
                    <>
                      <p className="mb-3 mt-6 text-sm font-semibold">Oder Wunschzeit {slotDay?.label.toLowerCase()}</p>
                      {parts.length > 1 && (
                        <div role="tablist" aria-label="Tageszeit" className="mb-3 grid grid-cols-3 rounded-xl bg-[#f1e8dc] p-1 text-sm font-semibold">
                          {parts.map((part) => (
                            <button key={part.key} type="button" role="tab" aria-selected={shownPart === part.key} onClick={() => setDaypart(part.key)} className={`rounded-lg py-2 transition-colors ${shownPart === part.key ? "bg-white shadow-sm" : "text-[#6f675f]"}`}>{part.label}</button>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {slots.filter((slot) => { const part = DAYPARTS.find((entry) => entry.key === shownPart); return !part || (minutesOf(slot) >= part.from && minutesOf(slot) < part.to); }).map((slot) => {
                          const active = pickup === slot.getTime();
                          return <button key={slot.getTime()} type="button" onClick={() => setPickup(slot.getTime())} aria-pressed={active} className={`rounded-xl border py-2.5 text-sm font-semibold tabular-nums transition-all duration-200 active:scale-95 ${active ? "border-[#c46b38] bg-[#c46b38] text-white shadow-md" : "border-[#e2d8ca] bg-white hover:border-[#c46b38]"}`}>{hhmm(slot)}</button>;
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">{field("name", "Name", "text", "name", "Dein Name")}</div>
                  {delivery && (
                    <>
                      <label className="block sm:col-span-2">
                        <span className="mb-1.5 block text-sm font-semibold">Straße & Hausnummer *</span>
                        <Input autoComplete="street-address" placeholder="z. B. Nürnberger Str. 14" aria-invalid={touched && !!addressErrors.street} value={address.street} onChange={(event) => setAddress({ ...address, street: event.target.value })} onKeyDown={(event) => event.key === "Enter" && next()} className={`h-12 rounded-xl border-[#e2d8ca] bg-white px-4 text-base ${touched && addressErrors.street ? "border-[#b4432f]" : ""}`} />
                        {touched && addressErrors.street && <span className="mt-1 block text-xs text-[#b4432f]">{addressErrors.street}</span>}
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold">PLZ *</span>
                        <Input inputMode="numeric" maxLength={5} autoComplete="postal-code" placeholder="z. B. 63450" aria-invalid={touched && !!addressErrors.zip} value={address.zip} onChange={(event) => setAddress({ ...address, zip: event.target.value.replace(/\D/g, "") })} className={`h-12 rounded-xl border-[#e2d8ca] bg-white px-4 text-base ${touched && addressErrors.zip ? "border-[#b4432f]" : ""}`} />
                        {touched && addressErrors.zip && <span className="mt-1 block text-xs text-[#b4432f]">{addressErrors.zip}</span>}
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold">Ort</span>
                        <Input autoComplete="address-level2" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} className="h-12 rounded-xl border-[#e2d8ca] bg-white px-4 text-base" />
                      </label>
                    </>
                  )}
                  {field("email", "E-Mail", "email", "email", "deine@email.de")}
                  {field("phone", "Telefon", "tel", "tel", "0176 …")}
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold">Hinweis an die Küche <span className="font-normal text-[#6f675f]">(optional)</span></span>
                    <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="z. B. Sesam-Allergie, bitte klingeln bei Müller" className="min-h-20 rounded-xl border-[#e2d8ca] bg-white" />
                  </label>
                  <button type="button" onClick={() => setRemember(!remember)} aria-pressed={remember} className="flex items-center gap-3 text-sm text-[#6f675f] sm:col-span-2">
                    <span className={`flex size-5 items-center justify-center rounded-md border-2 transition-colors ${remember ? "border-[#c46b38] bg-[#c46b38] text-white" : "border-[#d9cec0] bg-white"}`}>{remember && <Check className="size-3.5" />}</span>
                    Daten auf diesem Gerät für die nächste Bestellung merken
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {PAYMENTS.map(({ key, title, text, icon: Icon }) => (
                    <button key={key} type="button" onClick={() => setPayment(key)} aria-pressed={payment === key} className={`${option(payment === key)} sm:flex-col sm:items-start`}>
                      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${payment === key ? "bg-[#c46b38] text-white" : "bg-[#f1e8dc]"}`}><Icon className="size-5" /></span>
                      <span className="min-w-0 pr-6"><strong className="block text-sm leading-tight">{title}</strong><span className="mt-0.5 block text-xs leading-snug text-[#6f675f]">{key === "onsite" ? `${text} ${delivery ? "an der Haustür" : "an der Theke"}` : text}</span></span>
                      {payment === key && activeCheck}
                    </button>
                  ))}
                  {payment !== "onsite" && <p className="text-xs text-[#6f675f] sm:col-span-3">Nach „Bestellen“ zahlst du sicher über Stripe – erst dann geht die Bestellung in die Küche.</p>}
                </div>
              )}

              {step === 4 && (
                <div className="mt-6 space-y-3">
                  <SummaryRow icon={delivery ? <Bike /> : <Store />} label="Bestellart" value={delivery ? "Liefern lassen" : "Selbst abholen"} hint={delivery ? `${euro(DELIVERY.fee)} Liefergebühr` : "Kostenlos"} onEdit={() => goTo(0)} warn={belowMin} />
                  <SummaryRow icon={<Clock3 />} label={delivery ? "Lieferzeit" : "Abholzeit"} value={timeLabel} onEdit={() => goTo(1)} warn={!!pickupError} />
                  <SummaryRow icon={<UserRound />} label="Kontakt" value={contactDone ? contact.name : "Noch nicht vollständig"} hint={contactDone ? [delivery ? `${address.street}, ${address.zip} ${address.city}` : "", contact.phone, contact.email].filter(Boolean).join(" · ") : undefined} onEdit={() => goTo(2)} warn={!contactDone} />
                  <SummaryRow icon={<CreditCard />} label="Zahlung" value={PAYMENTS.find((entry) => entry.key === payment)?.title ?? ""} hint={payment === "onsite" ? (delivery ? "Bar oder Karte an der Haustür" : "Bar oder Karte an der Theke") : "Im nächsten Schritt über Stripe"} onEdit={() => goTo(3)} />
                  {note.trim() && <p className="rounded-xl border border-[#e2d8ca] bg-white px-4 py-3 text-sm"><span className="text-[#6f675f]">Hinweis an die Küche: </span>{note}</p>}
                  {/* Handy: Positionen hier, am Desktop rechts */}
                  <div className="rounded-2xl border border-[#e2d8ca] bg-white px-4 lg:hidden">
                    <ItemList items={items} blocked={(item) => blockedReason(availability, item.ref)} light />
                    <div className="flex items-end justify-between border-t border-[#eee5dc] py-3"><span className="text-sm text-[#6f675f]">Gesamt inkl. MwSt.{deliveryFee ? ` (inkl. ${euro(deliveryFee)} Lieferung)` : ""}</span><span className="font-display text-2xl tabular-nums">{euro(grandTotal)}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Fuß: Zurück + Weiter/Bestellen – am Handy unten angeheftet */}
            <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-[#eee5dc] bg-[#fdfbf7]/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-8">
              <button type="button" onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0} aria-label="Zurück" className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e2d8ca] bg-white px-4 font-semibold transition-colors hover:border-[#c46b38] disabled:opacity-40">
                <ArrowLeft className="size-4" /><span className="hidden sm:inline">Zurück</span>
              </button>
              {isLast ? (
                <GlowFrame active={valid && !placing} radius="0.75rem" className="min-w-0 flex-1">
                  <button type="button" onClick={() => void submit()} disabled={placing} aria-disabled={!valid || undefined} className={`glow-cta-face group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl font-bold text-white transition-colors ${valid ? "bg-[#c46b38] hover:bg-[#b05e30]" : "bg-[#c46b38]/50"}`}>
                    {placing ? <><LoaderCircle className="size-4 animate-spin" /> Wird gesendet …</> : paused ? <><CirclePause className="size-4" /> Gerade pausiert</> : <>{payment === "onsite" ? "Jetzt bestellen" : "Zahlungspflichtig bestellen"} · {euro(grandTotal)}</>}
                  </button>
                </GlowFrame>
              ) : (
                <button type="button" onClick={next} className={`group flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl font-bold transition-colors ${stepOk[step] ? "bg-[#1f2022] text-[#f8f6f0] hover:bg-[#c46b38]" : "bg-[#1f2022]/40 text-[#f8f6f0]"}`}>
                  {reached === 4 ? "Übernehmen" : "Weiter"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>
          </section>

          {/* Desktop: Warenkorb immer sichtbar */}
          <aside className="hidden lg:sticky lg:top-28 lg:block">
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#1f2022] text-[#f8f6f0] shadow-2xl shadow-[#1f2022]/20">
              <div className="absolute -right-32 -top-32 -z-10 size-[24rem] rounded-full bg-[radial-gradient(circle,rgba(196,107,56,.4),transparent_65%)]" aria-hidden="true" />
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="font-display text-2xl">Dein Warenkorb</h2>
                <span className="rounded-full bg-[#c46b38] px-3 py-1 text-xs font-bold">{count} Artikel</span>
              </div>
              <div className="max-h-96 overflow-y-auto px-6 py-2"><ItemList items={items} blocked={(item) => blockedReason(availability, item.ref)} /></div>
              <div className="border-t border-white/10 bg-white/5 px-6 py-5">
                <div className="flex justify-between text-sm text-[#cfc2b5]"><span>{delivery ? "Lieferung" : "Abholung"}</span><span>{delivery ? euro(deliveryFee) : "kostenlos"}</span></div>
                <div className="mt-2 flex items-end justify-between"><span className="text-sm text-[#cfc2b5]">Gesamt <span className="text-xs">inkl. MwSt.</span></span><span className="font-display text-3xl tabular-nums">{euro(grandTotal)}</span></div>
                {payment !== "onsite" && <p className="mt-3 flex items-center gap-1.5 text-xs text-[#cfc2b5]"><LockKeyhole className="size-3.5" />Sichere Zahlung über Stripe</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

const SITE_STREET = "Willy-Brandt-Str. 23, Hanau";

function SummaryRow({ icon, label, value, hint, onEdit, warn }: { icon: React.ReactNode; label: string; value: string; hint?: string | undefined; onEdit: () => void; warn?: boolean | undefined }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border bg-white px-4 py-3 ${warn ? "border-[#b4432f]/40" : "border-[#e2d8ca]"}`}>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-5 ${warn ? "bg-[#b4432f]/10 text-[#b4432f]" : "bg-[#f1e8dc] text-[#c46b38]"}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-[.14em] text-[#6f675f]">{label}</span>
        <span className={`block font-semibold leading-snug ${warn ? "text-[#b4432f]" : ""}`}>{value}</span>
        {hint && <span className="line-clamp-2 block text-sm text-[#6f675f]">{hint}</span>}
      </span>
      <button type="button" onClick={onEdit} className="shrink-0 rounded-full border border-[#e2d8ca] px-3.5 py-1.5 text-sm font-semibold transition-colors hover:border-[#c46b38]">Ändern</button>
    </div>
  );
}

function ItemList({ items, blocked, light }: { items: CartItem[]; blocked: (item: CartItem) => string | null; light?: boolean }) {
  return (
    <ul className={`divide-y ${light ? "divide-[#eee5dc]" : "divide-white/10"}`}>
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3">
          <img src={item.image} alt="" className={`size-14 shrink-0 rounded-xl object-contain p-1 ${light ? "bg-[#f1e8dc]" : "bg-[#f8f6f0]"}`} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{item.name}</p>
            <p className={`truncate text-xs ${light ? "text-[#6f675f]" : "text-[#cfc2b5]"}`}>{item.detail}</p>
            {blocked(item) && <p className="text-xs font-semibold text-[#e07a5f]">{blocked(item)}</p>}
            <div className="mt-1.5 flex items-center justify-between">
              <div className={`flex items-center rounded-full ${light ? "bg-[#f1e8dc]" : "bg-white/10"}`}>
                <button type="button" onClick={() => cartStore.change(item.id, -1)} aria-label={`${item.name}: weniger`} className="flex size-7 items-center justify-center rounded-full"><Minus className="size-3" /></button>
                <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                <button type="button" onClick={() => cartStore.change(item.id, 1)} aria-label={`${item.name}: mehr`} className="flex size-7 items-center justify-center rounded-full"><Plus className="size-3" /></button>
              </div>
              <span className="text-sm font-semibold tabular-nums">{euro(item.price * item.qty)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function HeroChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-[#f5f0e8] backdrop-blur-md sm:text-sm [&_svg]:size-4 [&_svg]:text-[#f5c3a6]">{icon}{children}</span>;
}
