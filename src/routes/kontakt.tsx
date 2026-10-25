import { createFileRoute } from "@tanstack/react-router";
import { Bike, Clock3, Mail, MapPin, Phone, Store } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import acaiImage from "@/assets/brand/acai-1.webp";
import ebiBowlImage from "@/assets/brand/bowl-ebi.webp";
import matchaImage from "@/assets/brand/matcha-5.webp";
import shopPhoto from "@/assets/brand/shop-lotus.webp";
import { CtaBanner, GlowCta, OpenBadge, PageHero, RiseTitle, SectionHead } from "@/components/site/brand-ui";
import { euro } from "@/lib/cart-store";
import { DELIVERY } from "@/lib/menu-pricing";
import { PREP_MINUTES, weekHours } from "@/lib/pickup-slots";
import { SITE } from "@/lib/site-info";
import { useOpenStatus } from "@/lib/use-open-status";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Besuch & Kontakt | Yamiin & Jaiyana's Hanau" },
      { name: "description", content: "Adresse, Öffnungszeiten und Kontakt von Yamiin & Jaiyana's in der Willy-Brandt-Straße 23 in Hanau." },
      { property: "og:title", content: "Besuch Yamiin & Jaiyana's in Hanau" },
      { property: "og:description", content: "Öffnungszeiten, Anfahrt und direkter Kontakt zum Healthy-Fastfood-Laden in Hanau." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const WEEK = weekHours();

function ContactPage() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      <PageHero aside={<TodayCard />}>
        <OpenBadge className="mb-6" />
        <RiseTitle lead="Komm" accent="vorbei." plain />
        <p className="hero-rise mt-6 max-w-lg text-base leading-7 text-white/80 sm:text-lg" style={{ animationDelay: "320ms" }}>
          Mitten in Hanau: frisch vor Ort genießen, abholen oder in {DELIVERY.city} liefern lassen.
        </p>
        <div className="hero-rise mt-8 flex flex-wrap items-center gap-x-5 gap-y-4" style={{ animationDelay: "440ms" }}>
          <GlowCta href={SITE.mapsUrl} icon={false}>Route planen</GlowCta>
          <a href={SITE.phoneHref} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-[#f5f0e8] backdrop-blur-md transition-colors hover:bg-white/20 sm:text-base">
            <Phone className="size-4 text-[#f5c3a6]" /> Anrufen
          </a>
        </div>
      </PageHero>

      <section className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 sm:py-28">
        <SectionHead title="So erreichst du uns">
          Fragen zu Allergenen, größeren Bestellungen oder einfach Hunger? Schreib uns oder ruf an.
        </SectionHead>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          <ContactCard icon={<MapPin />} label="Adresse" href={SITE.mapsUrl} external action="In Google Maps öffnen">
            {SITE.street}<br />{SITE.zipCity}
          </ContactCard>
          <ContactCard icon={<Phone />} label="Telefon" href={SITE.phoneHref} action="Jetzt anrufen">{SITE.phone}</ContactCard>
          <ContactCard icon={<Mail />} label="E-Mail" href={`mailto:${SITE.email}`} action="E-Mail schreiben">{SITE.email}</ContactCard>
        </div>
      </section>

      <section className="border-y border-border bg-muted py-20 sm:py-24">
        <div className="mx-auto grid max-w-[90rem] gap-6 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <OpeningHours />
          <div className="reveal flex flex-col rounded-[2rem] bg-primary p-7 text-primary-foreground sm:p-10">
            <h2 className="text-5xl leading-none sm:text-6xl">Vorab bestellen</h2>
            <p className="mt-4 max-w-md text-white/70">Keine Zeit zu warten? Bestell online und hol deine Bowl fertig ab.</p>
            <ul className="mt-8 space-y-3">
              <Fact icon={<Store />} title="Selbst abholen" text={`Kostenlos, fertig in ca. ${PREP_MINUTES.pickup} Min`} />
              <Fact icon={<Bike />} title="Liefern lassen" text={`${euro(DELIVERY.fee)} Liefergebühr, ab ${euro(DELIVERY.minOrder)} Bestellwert, nur in ${DELIVERY.city}`} />
            </ul>
            <div className="mt-auto pt-9"><GlowCta icon={false}>Zur Speisekarte</GlowCta></div>
          </div>
        </div>
      </section>

      <CtaBanner
        images={[acaiImage, matchaImage, ebiBowlImage]}
        className="pt-20 sm:pt-24"
        title={<>Bis gleich in Hanau.</>}
        cta={<GlowCta href={SITE.mapsUrl} icon={false}>Route planen</GlowCta>}
      >
        <span className="inline-flex items-center gap-2"><MapPin className="size-4" />{SITE.street}, {SITE.zipCity}</span>
      </CtaBanner>
    </main>
  );
}

/** Heutiger Tag – erst im Browser bestimmt, damit Server und Gerät dieselbe Uhrzeit nutzen. */
function useToday() {
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setToday(new Date().getDay());
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  return today;
}

function TodayCard() {
  const status = useOpenStatus();
  const today = useToday();
  const row = WEEK.find((entry) => entry.day === today);
  return (
    <div className="hero-rise relative hidden lg:block" style={{ animationDelay: "520ms" }}>
      {/* Echtes Foto aus dem Laden, auf Querformat zugeschnitten */}
      <img src={shopPhoto} alt="Lotus Ice Burger und Latte bei Yamiin & Jaiyana's" className="ml-auto aspect-[4/3] w-[88%] rounded-[2rem] object-cover object-[50%_60%] shadow-2xl shadow-black/50 ring-1 ring-white/10" />
      <div className="absolute -bottom-8 left-0 max-w-xs rounded-[2rem] border border-white/15 bg-[#1f1d1b]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#f5c3a6]"><Clock3 className="size-4" />Heute{row ? `, ${row.label}` : ""}</p>
        <p className="mt-3 whitespace-nowrap font-display text-4xl leading-none">{row ? (row.hours?.replace(" Uhr", "") ?? "Ruhetag") : "–"}</p>
        <p className="mt-3 text-sm text-white/70">{status?.text ?? "Öffnungszeiten werden geladen …"}</p>
        <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/80">
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-[#f5c3a6]" />{SITE.street}, {SITE.zipCity}</p>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ icon, label, href, action, external, children }: { icon: ReactNode; label: string; href: string; action: string; external?: boolean; children: ReactNode }) {
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className="reveal group flex flex-col border-t-2 border-foreground pt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background">
      <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><span className="text-secondary [&_svg]:size-4" aria-hidden="true">{icon}</span>{label}</span>
      <span className="mt-3 break-words text-2xl font-semibold leading-snug">{children}</span>
      <span className="mt-4 text-sm font-semibold text-secondary underline-offset-4 group-hover:underline">{action}{external && <span className="sr-only"> (öffnet in neuem Tab)</span>}</span>
    </a>
  );
}

function OpeningHours() {
  const today = useToday();
  const status = useOpenStatus();
  return (
    <div className="reveal rounded-[2rem] border border-border bg-card p-7 sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-5xl leading-none sm:text-6xl">Öffnungs&shy;zeiten</h2>
        {status && (
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${status.open ? "bg-[#5fd068]/15 text-[#1f6b26]" : "bg-muted text-muted-foreground"}`}>
            <span className={`size-2 rounded-full ${status.open ? "bg-[#2f9e3a]" : "bg-muted-foreground"}`} aria-hidden="true" />{status.open ? "Jetzt geöffnet" : "Gerade geschlossen"}
          </span>
        )}
      </div>
      <dl className="mt-8 divide-y divide-border">
        {WEEK.map((entry) => {
          const isToday = entry.day === today;
          return (
            <div key={entry.day} className={`-mx-3 flex items-center justify-between gap-6 rounded-xl px-3 py-3.5 ${isToday ? "bg-[#f5c3a6]/30 font-semibold" : ""}`}>
              <dt className="flex items-center gap-2">{entry.label}{isToday && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Heute</span>}</dt>
              <dd className={entry.hours ? "tabular-nums" : "text-muted-foreground"}>{entry.hours ?? "Ruhetag"}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

function Fact({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground [&_svg]:size-5">{icon}</span>
      <span><strong className="block">{title}</strong><span className="text-sm text-white/70">{text}</span></span>
    </li>
  );
}
