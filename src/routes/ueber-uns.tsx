import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Leaf, MapPin, Salad } from "lucide-react";
import type { ReactNode } from "react";

import falafelBowlAsset from "@/assets/menu/bowl-falafel-exotica.webp.asset.json";
import ysBowlAsset from "@/assets/menu/bowl-ys.webp.asset.json";
import falafelImage from "@/assets/brand/bowl-falafel.webp";
import bowl7Image from "@/assets/brand/bowl-7.webp";
import matchaImage from "@/assets/brand/matcha-1.webp";
import { CtaBanner, GlowCta, PageHero, RiseTitle, SectionHead, Ticker } from "@/components/site/brand-ui";
import { bowls, bowlSteps, matchas } from "@/lib/menu-data";

export const Route = createFileRoute("/ueber-uns")({
  head: () => ({
    meta: [
      { title: "Über uns | Yamiin & Jaiyana's Healthy Fastfood" },
      { name: "description", content: "Lerne Yamiin & Jaiyana's Healthy Fastfood und das frische Bowl-Konzept in Hanau kennen." },
      { property: "og:title", content: "Über Yamiin & Jaiyana's" },
      { property: "og:description", content: "Healthy Fastfood aus Hanau – frisch, unkompliziert und mit Liebe kombiniert." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

// Alles aus der Speisekarte abgeleitet, damit Texte und Zahlen nie veralten.
const bases = bowlSteps[0]?.items ?? [];
const baseText = bases.length > 1 ? `${bases.slice(0, -1).join(", ")} oder ${bases.at(-1)}` : (bases[0] ?? "");
const proteins = bowlSteps[1]?.items ?? [];
const veganBowls = bowls.filter((bowl) => bowl.filters.includes("Vegan")).length;

function AboutPage() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      <PageHero aside={<HeroBowls />}>
        <p className="hero-rise mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-[#f5c3a6] backdrop-blur-md sm:text-sm">Seit 2023 in Hanau</p>
        <RiseTitle lead="Schnell essen." accent="Gut fühlen." plain />
        <p className="hero-rise mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg" style={{ animationDelay: "380ms" }}>
          Yamiin &amp; Jaiyana&rsquo;s zeigt, dass Fastfood frisch, ausgewogen und voller Geschmack sein kann. Jede Bowl wird erst bei deiner Bestellung zusammengestellt.
        </p>
        <div className="hero-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ animationDelay: "480ms" }}>
          <GlowCta icon={false}>Zur Speisekarte</GlowCta>
          <Link to="/kontakt" className="inline-flex h-12 items-center gap-2 px-2 text-sm font-semibold text-[#f5f0e8]/85 underline-offset-4 hover:text-white hover:underline sm:text-base"><MapPin className="size-4 text-[#f5c3a6]" />Besuch uns</Link>
        </div>
      </PageHero>

      <Ticker words={["Frisch bei Bestellung", "Ausgewogen", "Voller Geschmack", "Vegan & mit Fleisch", "Made in Hanau"]} />

      <section className="mx-auto grid max-w-[90rem] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-center">
        <div className="reveal">
          <h2 className="text-5xl leading-[0.95] sm:text-7xl">Fastfood,<br />aber frisch.</h2>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
            {baseText} treffen auf knackiges Gemüse, ausgewählte Proteine und Saucen, die alles zusammenbringen. Vegane Optionen gehören selbstverständlich dazu.
          </p>
          <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
            Dazu Matcha in {matchas.length} Sorten, Açaí Specials und Coffee – für die Mittagspause genauso wie für den süßen Moment zwischendurch.
          </p>
        </div>
        <div className="reveal relative min-h-[24rem] overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_50%_55%,#fff_0%,#f1e8dc_70%)] sm:min-h-[32rem]">
          <img src={falafelBowlAsset.url} alt="Falafel Exotica Bowl" loading="lazy" className="absolute bottom-6 left-2 w-[52%] drop-shadow-2xl" />
          <img src={ysBowlAsset.url} alt="Y's Bowl" loading="lazy" className="absolute right-2 top-6 w-[62%] drop-shadow-2xl" />
        </div>
      </section>

      <section className="border-y border-border bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-[90rem] px-5 sm:px-8">
          <SectionHead title="Wofür wir stehen">
            Kein Kompromiss zwischen schnell und gut – darum geht es uns jeden Tag, an dem wir geöffnet haben.
          </SectionHead>
          <ul className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            <Value icon={<Salad />} title="Frisch bei Bestellung">Jede Bowl wird erst zusammengestellt, wenn du bestellst – mit deiner Wahl an Base, Protein und Sauce.</Value>
            <Value icon={<Flame />} title="Nährwerte im Blick">Zu jeder Bowl findest du Kalorien, Protein, Kohlenhydrate, Fett, Zucker und Ballaststoffe.</Value>
            <Value icon={<Leaf />} title="Für jeden Geschmack">{proteins.length} Proteine zur Wahl, {veganBowls > 0 ? `${veganBowls === 1 ? "eine vegane Signature Bowl" : `${veganBowls} vegane Signature Bowls`} ` : ""}und Bowls mit Fisch &amp; Garnelen.</Value>
            <Value icon={<MapPin />} title="Aus Hanau">Du findest uns in der Willy-Brandt-Straße – zum Abholen, Liefern oder direkt vor Ort. Bei Google mit 4,5 von 5 Sternen bewertet.</Value>
          </ul>
        </div>
      </section>

      <CtaBanner
        images={[bowl7Image, matchaImage, falafelImage]}
        className="pt-20 sm:pt-24"
        title={<>Probier dich durch die Bowls.</>}
        cta={<GlowCta icon={false}>Jetzt Bowl bestellen</GlowCta>}
      >
        <Link to="/kontakt" className="font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline">Öffnungszeiten &amp; Anfahrt</Link>
      </CtaBanner>
    </main>
  );
}

function HeroBowls() {
  return (
    <div className="relative hidden h-[26rem] lg:block" aria-hidden="true">
      <div className="absolute right-8 top-0 size-72 rounded-full bg-[radial-gradient(circle_at_50%_40%,#fff_0%,#f1e8dc_72%)] p-6 shadow-2xl shadow-black/40 ring-1 ring-white/20">
        <img src={ysBowlAsset.url} alt="" className="size-full object-contain drop-shadow-xl" />
      </div>
      <div className="absolute bottom-0 left-6 size-52 rounded-full bg-[radial-gradient(circle_at_50%_40%,#fff_0%,#f1e8dc_72%)] p-5 shadow-2xl shadow-black/40 ring-1 ring-white/20">
        <img src={falafelBowlAsset.url} alt="" className="size-full object-contain drop-shadow-xl" />
      </div>
    </div>
  );
}

function Value({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="reveal border-t-2 border-foreground pt-6">
      <h3 className="flex items-center gap-2.5 text-2xl"><span className="text-secondary [&_svg]:size-5" aria-hidden="true">{icon}</span>{title}</h3>
      <p className="mt-3 leading-7 text-muted-foreground">{children}</p>
    </li>
  );
}
