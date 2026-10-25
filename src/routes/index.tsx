import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, Clock3, MapPin, ShoppingBag, Sparkles, Store, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import heroBowlImage from "@/assets/hero-bowl.jpg";
import { CtaBanner, GlowCta, OpenBadge, SectionHead, Ticker } from "@/components/site/brand-ui";
import { euro } from "@/lib/cart-store";
import { acais, bowls, coffees, iceBurgerImage, matchas, parseMenuPrice } from "@/lib/menu-data";
import { DELIVERY } from "@/lib/menu-pricing";
import { PREP_MINUTES } from "@/lib/pickup-slots";
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
const fromPrice = euro(Math.min(...bowls.map((bowl) => parseMenuPrice(bowl.small))));
const TICKER = ["Signature Bowls", "Iced Matcha", "Açaí Specials", "High Protein", "Vegane Bowls", "Frisch zubereitet", "Made in Hanau"];

function Home() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      <Hero />
      <Ticker words={TICKER} />
      <Steps />
      <BowlShowcase />
      <MoreThanBowls />
      <OrderWays />
      <Story />
      <FinalCta />
    </main>
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

      <div className="mx-auto grid min-h-[44rem] max-w-[90rem] items-center gap-12 px-5 pb-16 pt-16 sm:min-h-[50rem] sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:py-24">
        <div className="relative z-10 max-w-3xl">
          <OpenBadge className="mb-7" />
          <h1 className="text-[3.6rem] leading-[0.9] sm:text-8xl lg:text-[7.4rem]">
            {words.map((word, index) => <span key={word.text}>{index > 0 && " "}<span className="hero-rise inline-block" style={{ animationDelay: `${word.delay}ms` }}>{word.text}</span></span>)}
            <br />
            <span className="hero-rise inline-block" style={{ animationDelay: "240ms" }}>people</span>{" "}
            <span className="hero-rise inline-block" style={{ animationDelay: "340ms" }}>eat well.</span>
          </h1>
          <p className="hero-rise mt-7 max-w-lg text-base leading-7 text-white/80 sm:text-lg" style={{ animationDelay: "480ms" }}>
            Frische Bowls, Matcha und Açaí aus Hanau – mit allen Nährwerten im Blick. Online bestellen, abholen oder liefern lassen.
          </p>

          <div className="hero-rise mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ animationDelay: "600ms" }}>
            <GlowCta icon={false}>Jetzt Bowl bestellen</GlowCta>
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

        {/* Die Bowl selbst steht im Mittelpunkt – nur auf großen Bildschirmen, damit es am Handy aufgeräumt bleibt */}
        {featured && (
          <div className="hidden justify-center lg:flex" aria-hidden="true">
            <div className="w-80 rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl xl:w-96">
              <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-[#f5f0e8]">
                <img src={featured.image} alt="" className="absolute inset-0 m-auto size-[85%] object-contain drop-shadow-2xl" />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-white/70">{featured.tag}</p>
                  <p className="mt-1 font-display text-3xl leading-none">{featured.name}</p>
                </div>
                <p className="shrink-0 text-right text-sm text-white/70">ab <strong className="block text-xl text-white">{featured.small}</strong></p>
              </div>
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

function Steps() {
  const steps = [
    { title: "Aussuchen", text: "Signature Bowl wählen oder selbst bauen – Größe, Base und Notiz an die Küche inklusive." },
    { title: "Abholen oder liefern", text: `Abholung kostenlos in der Willy-Brandt-Straße, Lieferung in ${DELIVERY.city} für ${euro(DELIVERY.fee)}.` },
    { title: "Bezahlen & genießen", text: "Bar oder Karte vor Ort – oder direkt online. Den Status deiner Bestellung siehst du live." },
  ];
  return (
    <section className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 sm:py-28">
      <SectionHead title="So bestellst du">
        Ohne Konto, ohne App, in unter einer Minute bestellt. Wir fangen an, sobald deine Bestellung da ist.
      </SectionHead>
      <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        {steps.map((step, index) => (
          <li key={step.title} className="reveal border-t-2 border-foreground pt-6">
            <p className="text-sm font-semibold text-secondary">Schritt {index + 1}</p>
            <h3 className="mt-2 text-3xl">{step.title}</h3>
            <p className="mt-3 max-w-sm leading-7 text-muted-foreground">{step.text}</p>
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
        <SectionHead title="Unsere Signature Bowls">
          Klein ab {fromPrice}, groß für den richtigen Hunger. Mit Bulgur, Somalireis oder Salat als Base.
        </SectionHead>
      </div>
      {/* Handy: wischen, ab Tablet: Raster */}
      <ul className="mx-auto mt-12 flex max-w-[90rem] snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:px-8 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {bowls.map((bowl) => (
          <li key={bowl.name} className="reveal w-[82%] shrink-0 snap-center sm:w-[60%] md:w-auto">
            <Link to="/speisekarte" hash="bowls" className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card outline-none transition-colors hover:border-secondary focus-visible:ring-2 focus-visible:ring-ring">
              <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_50%_60%,#fff_0%,#f1e8dc_70%)]">
                <span className="absolute left-4 top-4 z-10 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{bowl.tag}</span>
                <img src={bowl.image} alt={bowl.name} loading="lazy" className="absolute inset-0 m-auto size-[82%] object-contain drop-shadow-xl transition duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-3xl leading-tight">{bowl.name}</h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">{bowl.description.replace(/^Base \+ /, "")}</p>
                <p className="mt-5 flex items-baseline justify-between gap-3 border-t border-border pt-4 text-sm">
                  <span><span className="text-muted-foreground">ab </span><strong className="text-lg">{bowl.small}</strong></span>
                  <span className="text-muted-foreground">bis {String(bowl.nutrition.large.p).replace(".", ",")} g Protein</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex justify-center px-5">
        <GlowCta tone="dark" icon={false}>Zur Speisekarte</GlowCta>
      </div>
    </section>
  );
}

function MoreThanBowls() {
  const tiles = [
    { label: "Matcha", note: `${matchas.length} Sorten, Milch nach Wahl`, image: matchas.at(0)?.image ?? heroBowlImage, hash: "matcha" },
    { label: "Açaí Specials", note: `Jedes Special ${acais.at(0)?.price ?? ""}`, image: acais.at(0)?.image ?? heroBowlImage, hash: "acai" },
    { label: "Coffee & mehr", note: `${coffees.length} Kaffeegetränke, dazu Ice Burger und Wraps`, image: iceBurgerImage, hash: "coffee" },
  ];
  return (
    <section className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 sm:py-28">
      <SectionHead title="Mehr als Bowls">
        Matcha in vielen Sorten, Açaí Specials, die genauso gut aussehen, wie sie schmecken – und Coffee für zwischendurch.
      </SectionHead>
      <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
        {tiles.map((item) => (
          <Link key={item.label} to="/speisekarte" hash={item.hash} className="reveal group rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background">
            <div className="overflow-hidden rounded-3xl bg-muted"><img src={item.image} alt={item.label} loading="lazy" className="aspect-[4/3] w-full object-contain p-6 transition duration-500 group-hover:scale-105" /></div>
            <h3 className="mt-5 text-2xl underline-offset-4 group-hover:underline">{item.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
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
        <div className="reveal rounded-[2rem] bg-primary p-7 text-primary-foreground sm:p-10">
          <h2 className="text-5xl leading-none sm:text-6xl">Direkt bei uns bestellen</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <OrderFact icon={<Store />} title="Selbst abholen" text={`Kostenlos, fertig in ca. ${PREP_MINUTES.pickup} Min`} />
            <OrderFact icon={<Bike />} title="Liefern lassen" text={`${euro(DELIVERY.fee)} Liefergebühr, ab ${euro(DELIVERY.minOrder)} Bestellwert, nur in ${DELIVERY.city}`} />
          </div>
          <div className="mt-9"><GlowCta icon={false}>Jetzt bestellen</GlowCta></div>
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
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground [&_svg]:size-5">{icon}</span>
      <span><strong className="block">{title}</strong><span className="text-sm text-white/70">{text}</span></span>
    </div>
  );
}

function OrderLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="flex flex-1 items-center gap-4 rounded-3xl border border-border bg-card p-6 transition-colors hover:border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="text-secondary [&_svg]:size-6">{icon}</span><span><span className="block text-xs text-muted-foreground">Bestellen bei</span><span className="text-2xl font-semibold">{label}</span><span className="sr-only"> (öffnet in neuem Tab)</span></span></a>;
}

function Story() {
  return (
    <section className="mx-auto grid max-w-[90rem] gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center">
      <div className="reveal"><h2 className="text-5xl leading-none sm:text-7xl">Fastfood,<br />aber frisch.</h2></div>
      <div className="reveal"><p className="max-w-xl text-lg leading-8 text-muted-foreground">Seit 2023 in Hanau. Jede Bowl wird erst bei deiner Bestellung zusammengestellt – mit frischem Gemüse, ausgewählten Proteinen und Saucen, die alles zusammenbringen.</p><div className="mt-7 flex flex-wrap gap-5"><Link to="/ueber-uns" className="font-semibold text-secondary underline-offset-4 hover:underline">Mehr über uns</Link><Link to="/kontakt" className="inline-flex items-center gap-2 font-semibold hover:text-secondary"><MapPin className="size-4" /> Besuch uns in Hanau</Link></div></div>
    </section>
  );
}

function FinalCta() {
  return (
    <CtaBanner
      title={<>Deine Bowl ist in ca. {PREP_MINUTES.pickup} Minuten fertig.</>}
      cta={<GlowCta icon={false}>Jetzt Bowl bestellen</GlowCta>}
    >
      <span className="inline-flex items-center gap-2"><MapPin className="size-4" />{SITE.street}, {SITE.zipCity}</span>
      {SITE.hours.map((entry) => <span key={entry.days}>{entry.days}: {entry.time}</span>)}
    </CtaBanner>
  );
}
