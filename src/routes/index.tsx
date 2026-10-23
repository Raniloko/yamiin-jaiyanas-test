import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bike, Clock3, Flame, Leaf, MapPin, Salad, ShoppingBag, Sparkles, Store, Wallet } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import heroBowlImage from "@/assets/hero-bowl.jpg";
import { euro } from "@/lib/cart-store";
import { acais, bowls, coffees, iceBurgerImage, matchas, parseMenuPrice } from "@/lib/menu-data";
import { DELIVERY } from "@/lib/menu-pricing";
import { openStatus, PREP_MINUTES } from "@/lib/pickup-slots";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yamiin & Jaiyana's – Healthy Fastfood in Hanau" },
      { name: "description", content: "Signature Bowls, Matcha, Açaí, Coffee und Wraps – frisch zubereitet bei Yamiin & Jaiyana's in Hanau. Online bestellen zur Abholung oder Lieferung." },
      { property: "og:title", content: "Yamiin & Jaiyana's – Where good people eat well" },
      { property: "og:description", content: "Frische Bowls, Matcha und Açaí in Hanau. Online bestellen, abholen oder liefern lassen." },
      { property: "og:type", content: "restaurant.restaurant" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const featured = bowls[0];
const maxProtein = String(Math.max(...bowls.map((bowl) => bowl.nutrition.large.p))).replace(".", ",");
const fromPrice = euro(Math.min(...bowls.map((bowl) => parseMenuPrice(bowl.small))));
const TICKER = ["Signature Bowls", "Iced Matcha", "Açaí Specials", "High Protein", "Vegane Bowls", "Frisch zubereitet", "Made in Hanau"];

function Home() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      <Hero />
      <Ticker />
      <Steps />
      <BowlShowcase />
      <MoreThanBowls />
      <OrderWays />
      <Story />
      <FinalCta />
    </main>
  );
}

/** Haupt-Button mit umlaufendem Licht (siehe .glow-cta in styles.css). */
function GlowCta({ children, hash = "bowls", tone = "light" }: { children: ReactNode; hash?: string; tone?: "light" | "dark" }) {
  return (
    <span className="glow-cta">
      <span className="glow-cta-halo" aria-hidden="true"><span /></span>
      <Link
        to="/speisekarte"
        hash={hash}
        className={`glow-cta-face group inline-flex h-14 items-center gap-2.5 rounded-full px-7 text-base font-semibold shadow-xl transition-[background-color,transform] duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c3a6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#292725] sm:h-16 sm:px-8 sm:text-lg ${tone === "light" ? "bg-[#f5f0e8] text-[#292725] shadow-black/30 hover:bg-white" : "bg-[#292725] text-[#f5f0e8] shadow-[#292725]/25 hover:bg-[#1f1d1b]"}`}
      >
        {children}
        <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </span>
  );
}

/** "Jetzt geöffnet" – erst im Browser berechnet, damit Server und Gerät dieselbe Uhrzeit nutzen. */
function OpenBadge() {
  const [status, setStatus] = useState<ReturnType<typeof openStatus> | null>(null);
  useEffect(() => {
    const update = () => setStatus(openStatus(new Date()));
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <p className="hero-rise mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-[#f5f0e8] backdrop-blur-md sm:text-sm">
      <span className="relative flex size-2.5" aria-hidden="true">
        {status?.open && <span className="live-ping absolute inset-0 rounded-full bg-[#5fd068]" />}
        <span className={`relative size-2.5 rounded-full ${status ? (status.open ? "bg-[#5fd068]" : "bg-[#f5c3a6]") : "bg-white/40"}`} />
      </span>
      {status ? status.text : "Willy-Brandt-Straße 23 · Hanau"}
    </p>
  );
}

function Hero() {
  const words = [
    { text: "Where", delay: 80 },
    { text: "good", delay: 160 },
  ];
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-[#292725] text-[#f5f0e8]">
      <img src={heroBowlImage} alt="" aria-hidden="true" className="hero-drift absolute inset-0 -z-20 size-full object-cover object-center opacity-80" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(30,28,25,.95)_0%,rgba(30,28,25,.72)_48%,rgba(30,28,25,.2)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(30,28,25,.55)_0%,rgba(30,28,25,.85)_55%,rgba(30,28,25,.96)_100%)]" />
      <div className="absolute -left-40 top-1/3 -z-10 size-[34rem] rounded-full bg-[#c46b38]/25 blur-3xl" aria-hidden="true" />

      <div className="mx-auto grid min-h-[44rem] max-w-[90rem] items-center gap-12 px-5 pb-16 pt-16 sm:min-h-[50rem] sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:py-24">
        <div className="relative z-10 max-w-3xl">
          <OpenBadge />
          <h1 className="text-[3.6rem] leading-[0.9] sm:text-8xl lg:text-[7.4rem]">
            {words.map((word) => <span key={word.text} className="hero-rise mr-[0.22em] inline-block" style={{ animationDelay: `${word.delay}ms` }}>{word.text}</span>)}
            <br />
            <span className="hero-rise mr-[0.22em] inline-block" style={{ animationDelay: "240ms" }}>people</span>
            <em className="hero-rise inline-block text-[#f5c3a6]" style={{ animationDelay: "340ms" }}>eat well.</em>
          </h1>
          <p className="hero-rise mt-7 max-w-lg text-base leading-7 text-white/80 sm:text-lg" style={{ animationDelay: "480ms" }}>
            Frische Bowls, Matcha und Açaí aus Hanau – mit allen Nährwerten im Blick. Online bestellen, abholen oder liefern lassen.
          </p>

          <div className="hero-rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ animationDelay: "600ms" }}>
            <GlowCta>Jetzt Bowl bestellen</GlowCta>
            <Link to="/speisekarte" hash="create" className="inline-flex h-12 items-center gap-2 rounded-full px-2 text-sm font-semibold text-[#f5f0e8]/85 underline-offset-4 transition-colors hover:text-white hover:underline sm:text-base">
              <Sparkles className="size-4 text-[#f5c3a6]" /> oder Bowl selbst bauen
            </Link>
          </div>

          <ul className="hero-rise mt-10 grid max-w-2xl gap-3 text-sm text-white/80 sm:grid-cols-3" style={{ animationDelay: "720ms" }}>
            <HeroFact icon={<Clock3 />}>Abholbereit in ca. {PREP_MINUTES.pickup} Min</HeroFact>
            <HeroFact icon={<Bike />}>Lieferung in {DELIVERY.city}</HeroFact>
            <HeroFact icon={<Wallet />}>Vor Ort oder online zahlen</HeroFact>
          </ul>
        </div>

        {/* Schwebende Karten – nur auf großen Bildschirmen, damit es am Handy aufgeräumt bleibt */}
        {featured && (
          <div className="relative hidden h-[34rem] lg:block" aria-hidden="true">
            <div className="float-bob absolute right-4 top-6 w-80 rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-[#f5f0e8]">
                <img src={featured.image} alt="" className="absolute inset-0 m-auto size-[85%] object-contain drop-shadow-2xl" />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f5c3a6]">{featured.tag}</p>
                  <p className="mt-1 font-display text-3xl leading-none">{featured.name}</p>
                </div>
                <p className="shrink-0 text-right text-sm text-white/70">ab <strong className="block text-xl text-white">{featured.small}</strong></p>
              </div>
            </div>
            <div className="float-bob absolute left-0 top-[52%] flex items-center gap-3 rounded-2xl border border-white/15 bg-[#f5f0e8] px-4 py-3 text-[#292725] shadow-2xl shadow-black/40" style={{ animationDelay: "-2s" }}>
              <span className="flex size-10 items-center justify-center rounded-full bg-[#c46b38] text-white"><Flame className="size-5" /></span>
              <span><strong className="block font-display text-2xl leading-none">bis {maxProtein} g</strong><span className="text-xs text-[#6f675f]">Protein pro Bowl</span></span>
            </div>
            <div className="float-bob absolute bottom-6 right-16 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl" style={{ animationDelay: "-4s" }}>
              <span className="flex size-10 items-center justify-center rounded-full bg-[#5fd068]/20 text-[#9be39f]"><Leaf className="size-5" /></span>
              <span><strong className="block text-sm">Vegan & Fisch</strong><span className="text-xs text-white/70">für jeden Geschmack</span></span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function HeroFact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#f5c3a6] [&_svg]:size-4">{icon}</span>
      {children}
    </li>
  );
}

function Ticker() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {TICKER.map((word) => (
        <li key={word} className="flex items-center gap-8 pr-8 font-display text-2xl italic sm:text-3xl">
          {word}<span className="text-base not-italic text-[#f5c3a6]" aria-hidden="true">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden bg-[#c46b38] py-4 text-[#fff7f1] sm:py-5">
      <div className="animate-ticker flex w-max">{row(false)}{row(true)}</div>
    </div>
  );
}

function SectionHead({ eyebrow, title, accent, children }: { eyebrow: string; title: string; accent: string; children?: ReactNode }) {
  return (
    <div className="reveal grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
        <h2 className="mt-4 text-5xl leading-[0.95] sm:text-7xl">{title}<br /><em className="text-secondary">{accent}</em></h2>
      </div>
      {children && <div className="max-w-xl text-lg leading-8 text-muted-foreground lg:justify-self-end">{children}</div>}
    </div>
  );
}

function Steps() {
  const steps = [
    { icon: <Salad />, title: "Aussuchen", text: "Signature Bowl wählen oder selbst bauen – Größe, Base und Notiz an die Küche inklusive." },
    { icon: <Store />, title: "Abholen oder liefern", text: `Abholung kostenlos in der Willy-Brandt-Straße, Lieferung in ${DELIVERY.city} für ${euro(DELIVERY.fee)}.` },
    { icon: <Wallet />, title: "Bezahlen & genießen", text: "Bar oder Karte vor Ort – oder direkt online. Den Status deiner Bestellung siehst du live." },
  ];
  return (
    <section className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 sm:py-28">
      <SectionHead eyebrow="So einfach geht's" title="In 3 Schritten" accent="zu deiner Bowl.">
        Ohne Konto, ohne App, in unter einer Minute bestellt. Wir fangen an, sobald deine Bestellung da ist.
      </SectionHead>
      <ol className="mt-12 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="reveal group relative overflow-hidden rounded-3xl border border-border bg-card p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <span className="pointer-events-none absolute -right-3 -top-6 font-display text-[8rem] leading-none text-muted transition-colors duration-300 group-hover:text-[#f5c3a6]/50" aria-hidden="true">{index + 1}</span>
            <span className="relative flex size-12 items-center justify-center rounded-2xl bg-[#292725] text-[#f5c3a6] [&_svg]:size-6">{step.icon}</span>
            <h3 className="relative mt-6 text-3xl">{step.title}</h3>
            <p className="relative mt-3 leading-7 text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function BowlShowcase() {
  return (
    <section className="border-y border-border bg-muted py-20 sm:py-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8">
        <SectionHead eyebrow="Signature Bowls" title="Jede Bowl" accent="ein Highlight.">
          Klein ab {fromPrice}, groß für den richtigen Hunger. Mit Bulgur, Somalireis oder Salat als Base.
        </SectionHead>
      </div>
      {/* Handy: wischen, ab Tablet: Raster */}
      <ul className="mx-auto mt-12 flex max-w-[90rem] snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:px-8 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {bowls.map((bowl) => (
          <li key={bowl.name} className="reveal w-[82%] shrink-0 snap-center sm:w-[60%] md:w-auto">
            <Link to="/speisekarte" hash="bowls" className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card outline-none transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-ring">
              <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_50%_60%,#fff_0%,#f1e8dc_70%)]">
                <span className="absolute left-4 top-4 z-10 rounded-full bg-[#292725] px-3 py-1 text-xs font-semibold text-[#f5f0e8]">{bowl.tag}</span>
                <img src={bowl.image} alt={bowl.name} loading="lazy" className="absolute inset-0 m-auto size-[82%] object-contain drop-shadow-xl transition duration-500 group-hover:-rotate-3 group-hover:scale-110" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-3xl leading-tight">{bowl.name}</h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">{bowl.description.replace(/^Base \+ /, "")}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="text-sm leading-tight"><span className="text-muted-foreground">ab </span><strong className="text-lg">{bowl.small}</strong><span className="block text-xs text-muted-foreground">bis {String(bowl.nutrition.large.p).replace(".", ",")} g Protein</span></p>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#292725] text-[#f5f0e8] transition-colors duration-300 group-hover:bg-[#c46b38]"><ArrowRight className="size-4" /></span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex justify-center px-5">
        <GlowCta tone="dark">Alle Bowls & bestellen</GlowCta>
      </div>
    </section>
  );
}

function MoreThanBowls() {
  const tiles = [
    { label: "Taste the Matcha", note: `${matchas.length} Sorten · Milch nach Wahl`, image: matchas.at(0)?.image ?? heroBowlImage, hash: "matcha" },
    { label: "Açaí Specials", note: `Jedes Special ${acais.at(0)?.price ?? ""}`, image: acais.at(0)?.image ?? heroBowlImage, hash: "acai" },
    { label: "Coffee & mehr", note: `${coffees.length} Hot Drinks · Ice Burger · Wraps`, image: iceBurgerImage, hash: "coffee" },
  ];
  return (
    <section className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 sm:py-28">
      <SectionHead eyebrow="Mehr als Bowls" title="Dein Geschmack," accent="deine Wahl.">
        Matcha in vielen Sorten, Açaí Specials, die genauso gut aussehen, wie sie schmecken – und Coffee für zwischendurch.
      </SectionHead>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {tiles.map((item) => (
          <Link key={item.label} to="/speisekarte" hash={item.hash} className="reveal group overflow-hidden rounded-3xl border border-border bg-card outline-none transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring">
            <div className="overflow-hidden bg-muted"><img src={item.image} alt={item.label} loading="lazy" className="aspect-[4/3] w-full object-contain p-6 transition duration-500 group-hover:scale-105" /></div>
            <div className="flex items-end justify-between gap-4 p-6"><div><h3 className="text-2xl">{item.label}</h3><p className="mt-2 text-sm text-muted-foreground">{item.note}</p></div><ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" /></div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function OrderWays() {
  return (
    <section className="border-y border-border bg-muted py-20 sm:py-24">
      <div className="mx-auto grid max-w-[90rem] gap-6 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <div className="reveal relative isolate overflow-hidden rounded-[2rem] bg-[#292725] p-7 text-[#f5f0e8] sm:p-10">
          <div className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-[#c46b38]/35 blur-3xl" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f5c3a6]">Direkt bei uns bestellen</p>
          <h2 className="mt-4 text-5xl leading-none sm:text-6xl">Pick it.<br /><em className="text-[#f5c3a6]">Enjoy it.</em></h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <OrderFact icon={<Store />} title="Selbst abholen" text={`Kostenlos · fertig in ca. ${PREP_MINUTES.pickup} Min`} />
            <OrderFact icon={<Bike />} title="Liefern lassen" text={`${euro(DELIVERY.fee)} · ab ${euro(DELIVERY.minOrder)} · nur ${DELIVERY.city}`} />
          </div>
          <div className="mt-9"><GlowCta>Jetzt bestellen</GlowCta></div>
        </div>
        <div className="reveal flex flex-col gap-4">
          <p className="px-1 text-sm text-muted-foreground">Lieber über eine App?</p>
          <OrderLink href={SITE.lieferando} icon={<ShoppingBag />} label="Lieferando" />
          <OrderLink href={SITE.wolt} icon={<Bike />} label="Wolt" />
        </div>
      </div>
    </section>
  );
}

function OrderFact({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#c46b38] text-white [&_svg]:size-5">{icon}</span>
      <span><strong className="block">{title}</strong><span className="text-sm text-white/70">{text}</span></span>
    </div>
  );
}

function OrderLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="group flex flex-1 items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-secondary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex items-center gap-4"><span className="text-secondary [&_svg]:size-6">{icon}</span><span><span className="block text-xs text-muted-foreground">Bestellen bei</span><span className="text-2xl font-semibold">{label}</span></span></span><ArrowRight className="size-5 transition-transform group-hover:translate-x-1" /></a>;
}

function Story() {
  return (
    <section className="mx-auto grid max-w-[90rem] gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center">
      <div className="reveal"><p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Seit 2023 in Hanau</p><h2 className="mt-4 text-5xl leading-none sm:text-7xl">Fastfood,<br /><em className="text-secondary">aber frisch.</em></h2></div>
      <div className="reveal"><p className="max-w-xl text-lg leading-8 text-muted-foreground">Jede Bowl wird erst bei deiner Bestellung zusammengestellt – mit frischem Gemüse, ausgewählten Proteinen und Saucen, die alles zusammenbringen.</p><div className="mt-7 flex flex-wrap gap-5"><Link to="/ueber-uns" className="inline-flex items-center gap-2 font-semibold text-secondary hover:underline">Mehr über uns <ArrowRight className="size-4" /></Link><Link to="/kontakt" className="inline-flex items-center gap-2 font-semibold hover:text-secondary"><MapPin className="size-4" /> Besuch uns in Hanau</Link></div></div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 pb-24 sm:px-8 sm:pb-28">
      <div className="reveal relative isolate mx-auto max-w-[90rem] overflow-hidden rounded-[2.5rem] bg-[#292725] px-6 py-16 text-center text-[#f5f0e8] sm:px-10 sm:py-24">
        <img src={heroBowlImage} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover opacity-25" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(196,107,56,.55),transparent_60%)]" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5c3a6]">Hunger bekommen?</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-5xl leading-[0.95] sm:text-7xl">Deine Bowl ist in <em className="text-[#f5c3a6]">ca. {PREP_MINUTES.pickup} Minuten</em> fertig.</h2>
        <div className="mt-10 flex justify-center"><GlowCta>Jetzt Bowl bestellen</GlowCta></div>
        <p className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/70">
          <span className="inline-flex items-center gap-2"><MapPin className="size-4" />{SITE.street}, {SITE.zipCity}</span>
          {SITE.hours.map((entry) => <span key={entry.days}>{entry.days}: {entry.time}</span>)}
        </p>
      </div>
    </section>
  );
}
