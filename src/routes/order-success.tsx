import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, Check, ChefHat, Clock3, CreditCard, MapPin, Navigation, Phone, RefreshCw, ShoppingBag, Sparkles, Store } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { GlowCta, PageHero, RiseTitle } from "@/components/site/brand-ui";
import { stepText } from "@/lib/order-labels";
import { cart, euro } from "@/lib/cart-store";
import { ORDER_STEPS, guestToken, rememberGuestToken, type Order, type OrderStatus } from "@/lib/order-store";
import { SITE } from "@/lib/site-info";
import { useGuestOrder } from "@/lib/use-guest-order";
import { sendOrderConfirmation } from "@/utils/email.functions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/order-success")({
  validateSearch: (search: Record<string, unknown>): { id: string | undefined; t?: string } => ({
    id: typeof search["id"] === "string" ? search["id"] : undefined,
    // Gast-Schlüssel aus dem Link der Bestätigungsmail (wird gemerkt und dann aus der Adresse entfernt).
    ...(typeof search["t"] === "string" && UUID.test(search["t"]) ? { t: search["t"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Bestellstatus live – Yamiin & Jaiyana's" },
      { name: "description", content: "Verfolge live, ob deine Bestellung bestätigt, in Zubereitung oder abholbereit ist." },
      { property: "og:title", content: "Bestellstatus live – Yamiin & Jaiyana's" },
      { property: "og:description", content: "Live-Status deiner Bestellung in Hanau." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatusPage,
});

const ICONS = [Check, ChefHat, ShoppingBag, Sparkles];

function StatusPage() {
  const { id, t } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { order, loading } = useGuestOrder(id, t);
  useEffect(() => {
    if (!id || !t) return;
    rememberGuestToken(id, t);
    void navigate({ search: { id }, replace: true });
  }, [id, t]); // eslint-disable-line react-hooks/exhaustive-deps
  // Rückkehr von der Online-Zahlung: Bestätigung anstoßen, falls der Webhook sie noch nicht geschickt hat (der Server sendet nie doppelt).
  const confirmed = useRef(false);
  useEffect(() => {
    if (confirmed.current || !order || order.payment === "onsite" || !order.paid) return;
    const token = t ?? guestToken(order.id);
    if (!token) return;
    confirmed.current = true;
    void sendOrderConfirmation({ data: { id: order.id, token } }).catch(() => undefined);
  }, [order, t]);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // Nach Rückkehr von der Online-Zahlung ist die Bestellung abgeschickt – Warenkorb leeren.
    cart.clear();
    setHydrated(true);
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (!hydrated || loading) {
    return (
      <main className="min-h-[70vh] bg-background">
        <PageHero compact width="max-w-3xl"><div className="h-48 animate-pulse rounded-3xl bg-white/5" aria-label="Bestellung wird geladen" /></PageHero>
      </main>
    );
  }
  if (!order) {
    return (
      <main className="bg-background text-foreground">
        <PageHero width="max-w-3xl" className="text-center">
          <RiseTitle lead="Bestellung" accent="nicht gefunden." plain className="text-5xl sm:text-7xl" />
          <p className="hero-rise mx-auto mt-5 max-w-md text-white/75" style={{ animationDelay: "300ms" }}>
            Wir konnten keine Bestellung mit dieser Nummer finden. Den Live-Status siehst du auf dem Gerät, mit dem du bestellt hast.
          </p>
          <div className="hero-rise mt-9 flex flex-wrap justify-center gap-4" style={{ animationDelay: "420ms" }}>
            <GlowCta icon={false}>Zur Speisekarte</GlowCta>
            <a href={SITE.phoneHref} className="inline-flex h-14 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 font-semibold text-primary-foreground backdrop-blur-md hover:bg-white/20 sm:h-16"><Phone className="size-4 text-peach" />Anrufen</a>
          </div>
        </PageHero>
      </main>
    );
  }

  const delivery = order.fulfillment === "delivery";
  const current = Math.max(0, ORDER_STEPS.findIndex((step) => step.key === order.status));
  const awaitingPayment = order.payment !== "onsite" && !order.paid;
  const text = awaitingPayment && order.status === "bestaetigt"
    ? { label: "Zahlung wird geprüft", hint: "Sobald die Zahlung bestätigt ist, geht deine Bestellung direkt in die Küche." }
    : stepText(order, order.status);
  const firstName = order.contact.name.trim().split(/\s+/)[0];
  const progress = (current / (ORDER_STEPS.length - 1)) * 100;

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <PageHero compact width="max-w-3xl">
        <div className="hero-rise flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
            <span className="relative flex size-2"><span className="live-ping absolute inset-0 rounded-full bg-live" /><span className="relative size-2 rounded-full bg-live" /></span>
            Live
          </span>
          <span className="font-mono text-sm text-primary-foreground/75">#{order.id}</span>
        </div>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5">
          <div key={`${order.status}-${awaitingPayment}`} className="min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="flex items-center gap-2 font-semibold text-peach">
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><circle cx="12" cy="12" r="11" className="fill-clay" /><path d="M7 12.5l3.2 3.2L17 9" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="draw-check stroke-primary-foreground" /></svg>
              {firstName ? `Danke, ${firstName}!` : "Danke für deine Bestellung!"}
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[0.95] sm:text-6xl">{text.label}</h1>
            <p className="mt-3 max-w-md text-white/75">{text.hint}</p>
          </div>
          <CountdownRing order={order} now={now} />
        </div>

        <div className="mt-9">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-linear-90 from-clay to-peach transition-[width] duration-700 ease-[cubic-bezier(.32,.72,0,1)]" style={{ width: `${progress}%` }} />
          </div>
          <ol className="mt-4 grid grid-cols-4 gap-2">
            {ORDER_STEPS.map((item, index) => {
              const Icon = ICONS[index] ?? Check;
              const done = index <= current;
              return (
                <li key={item.key} className="flex flex-col items-center gap-2 text-center">
                  <span className={`flex size-10 items-center justify-center rounded-full transition-all duration-500 sm:size-11 ${index === current ? "scale-110 bg-clay text-white shadow-lg shadow-clay/40 ring-4 ring-clay/25" : done ? "bg-background text-foreground" : "bg-white/10 text-primary-foreground/50"}`}>
                    <Icon className="size-4" />
                  </span>
                  <span className={`text-[11px] font-semibold leading-tight sm:text-xs ${done ? "text-primary-foreground" : "text-primary-foreground/50"}`}>{stepText(order, item.key).label}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="mt-6 flex items-center gap-2 text-xs text-white/55"><RefreshCw className="size-3.5" />Diese Seite aktualisiert sich automatisch.</p>
      </PageHero>

      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-8">
        <div className="grid divide-y divide-muted overflow-hidden rounded-3xl border border-border bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <InfoCard icon={<Clock3 />} label={delivery ? "Lieferung" : "Abholung"}>
            <p className="font-display text-3xl tabular-nums">{new Date(order.pickupAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</p>
            <p className="text-xs text-muted-foreground">{order.pickupLabel}</p>
          </InfoCard>
          {delivery && order.address ? (
            <InfoCard icon={<Bike />} label="Lieferadresse">
              <p className="font-semibold leading-tight">{order.address.street}</p>
              <p className="text-xs text-muted-foreground">{order.address.zip} {order.address.city}</p>
            </InfoCard>
          ) : (
            <a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className="group p-5 transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clay">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Store className="size-4 text-clay" />Abholort</p>
              <p className="mt-1 font-semibold leading-tight">{SITE.street}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-clay underline-offset-4 group-hover:underline"><Navigation className="size-3.5" />Route öffnen<span className="sr-only"> (öffnet in neuem Tab)</span></p>
            </a>
          )}
          <InfoCard icon={<CreditCard />} label="Zahlung">
            <p className="font-semibold leading-tight">{order.payment === "onsite" ? (delivery ? "Bei Übergabe" : "An der Theke") : order.payment === "paypal" ? "PayPal" : "Karte & Wallet"}</p>
            <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${order.payment === "onsite" ? "bg-muted text-muted-foreground" : order.paid ? "bg-success/15 text-success" : "bg-clay/10 text-secondary"}`}>
              {order.payment === "onsite" ? "Bar oder Karte vor Ort" : order.paid ? <><Check className="size-3" />Bezahlt</> : "Wird geprüft …"}
            </span>
          </InfoCard>
        </div>

        <section className="mt-4 rounded-[1.75rem] border border-border bg-white p-5 sm:p-7">
          <h2 className="font-display text-3xl">Deine Bestellung</h2>
          <ul className="mt-3 divide-y divide-muted">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <img src={item.image} alt="" className="size-14 rounded-xl bg-muted object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.qty}× {item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{euro(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-end justify-between border-t border-muted pt-4">
            <span className="text-sm text-muted-foreground">Gesamt{order.deliveryFee ? ` (inkl. ${euro(order.deliveryFee)} Lieferung)` : ""}</span>
            <span className="font-display text-3xl tabular-nums">{euro(order.total)}</span>
          </div>
        </section>

        <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a href={SITE.phoneHref} className="flex h-14 items-center justify-center gap-2 rounded-full border border-border bg-white px-6 font-semibold transition-colors hover:border-clay"><Phone className="size-4 text-clay" /> Fragen? {SITE.phone}</a>
          <div className="flex justify-center"><GlowCta tone="dark" icon={false}>Neue Bestellung</GlowCta></div>
        </div>
        <p className="mt-6 text-center text-sm"><Link to="/meine-bestellungen" className="font-semibold text-clay underline-offset-4 hover:underline">Alle meine Bestellungen auf diesem Gerät</Link></p>
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"><MapPin className="size-3.5" />{SITE.name}, {SITE.street}, {SITE.zipCity}</p>
      </div>
    </main>
  );
}

/** Ring mit der verbleibenden Zeit bis zur Abholung bzw. Lieferung. */
function CountdownRing({ order, now }: { order: Order; now: number }) {
  const total = Math.max(1, order.pickupAt - order.createdAt);
  const left = Math.max(0, order.pickupAt - now);
  const ready = order.status === "abholbereit" || order.status === "abgeholt";
  // Voll bei der Bestellung, läuft bis zur Abhol- bzw. Lieferzeit leer – wie eine Sanduhr.
  const share = ready ? 1 : Math.min(1, Math.max(0.04, left / total));
  const minutes = Math.round(left / 60000);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative size-28 shrink-0 sm:size-36" role="img" aria-label={ready ? "Fertig" : minutes > 0 ? `Noch etwa ${minutes} Minuten` : "Gleich fertig"}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" className="stroke-primary-foreground/10" strokeWidth="7" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="url(#ring)" strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - share)} className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(.32,.72,0,1)]" />
        <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" style={{ stopColor: "var(--clay)" }} /><stop offset="100%" style={{ stopColor: "var(--peach)" }} /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
        {ready ? (
          <><Check className="size-7 text-peach sm:size-9" /><span className="mt-1 text-[11px] font-semibold text-white/70">fertig</span></>
        ) : (
          <><span className="font-display text-3xl leading-none tabular-nums sm:text-4xl">{minutes > 0 ? minutes : "–"}</span><span className="mt-1 text-[11px] font-semibold text-white/70">{minutes > 0 ? "Min" : "gleich"}</span></>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="p-5">
      <p className="flex items-center gap-2 text-sm text-muted-foreground [&_svg]:size-4 [&_svg]:text-clay">{icon}{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
