import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bike, MapPin, ShoppingBag } from "lucide-react";

import heroBowlImage from "@/assets/hero-bowl.jpg";
import { Button } from "@/components/ui/button";
import { acais, matchas } from "@/lib/menu-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yamiin & Jaiyana's – Healthy Fastfood in Hanau" },
      { name: "description", content: "Signature Bowls, Matcha, Açaí, Coffee und Wraps – frisch zubereitet bei Yamiin & Jaiyana's in Hanau." },
      { property: "og:title", content: "Yamiin & Jaiyana's – Where good people eat well" },
      { property: "og:description", content: "Frische Bowls, Matcha und Açaí in Hanau. Entdecke unsere vollständige Speisekarte." },
      { property: "og:type", content: "restaurant.restaurant" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const LIEFERANDO = "https://www.lieferando.de/speisekarte/yamiin-jaiyanas-healthy-fastfood";
const WOLT = "https://wolt.com/de/deu/hanau/restaurant/yamiin-jaiyanas-healthy-fastfood";

function Home() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      <section className="relative isolate min-h-[42rem] overflow-hidden border-b border-border bg-[#292725] text-[#f5f0e8] sm:min-h-[48rem]">
        <img src={heroBowlImage} alt="Frische Signature Bowl von Yamiin & Jaiyana's" className="absolute inset-0 -z-20 size-full object-cover object-center opacity-80 transition duration-1000 hover:scale-[1.03]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(30,28,25,.94)_0%,rgba(30,28,25,.68)_46%,rgba(30,28,25,.18)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(217,148,109,.26),transparent_32%)]" />
        <div className="mx-auto flex min-h-[42rem] max-w-[90rem] items-center px-5 py-20 sm:min-h-[48rem] sm:px-8 lg:py-24">
          <div className="relative z-10 max-w-3xl">
            <p className="mb-7 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-[#f5c3a6] backdrop-blur-md">Bowls · Açaí · Matcha · Coffee</p>
            <h1 className="text-6xl leading-[0.88] sm:text-8xl lg:text-[7.6rem]">Where good<br />people <em className="text-[#f5c3a6]">eat well.</em></h1>
            <p className="mt-7 max-w-md text-base leading-7 text-white/75 sm:text-lg">Frisch zubereitet, liebevoll angerichtet – und alle Nährwerte immer im Blick.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="hero-glow-button rounded-full p-px">
                <Button asChild size="lg" className="h-12 rounded-full bg-[#f5f0e8] px-6 text-[#292725] shadow-none hover:bg-[#f5c3a6]"><Link to="/speisekarte">Zu den Bowls <ArrowRight /></Link></Button>
              </div>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/35 bg-white/10 px-6 text-[#f5f0e8] shadow-none backdrop-blur-sm hover:bg-white/20"><Link to="/speisekarte" hash="create">Bowl selbst bauen</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-[0.6fr_1.4fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase text-secondary">Frisch. Farbenfroh. Für dich.</p>
            <h2 className="mt-4 text-5xl leading-[0.95] sm:text-7xl">Dein Geschmack,<br /><em className="text-secondary">deine Wahl.</em></h2>
          </div>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground lg:justify-self-end">Signature Bowls für jeden Hunger, Matcha in fünf Sorten und Açaí Specials, die genauso gut aussehen, wie sie schmecken.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { label: "Signature Bowls", note: "Klein oder groß", image: heroBowlImage, hash: "bowls" },
            { label: "Taste the Matcha", note: "Cremig & fruchtig", image: matchas.at(0)?.image ?? heroBowlImage, hash: "matcha" },
            { label: "Açaí Specials", note: "Jedes Special 11,90 €", image: acais.at(0)?.image ?? heroBowlImage, hash: "acai" },
          ].map((item) => (
            <Link key={item.label} to="/speisekarte" hash={item.hash} className="group overflow-hidden rounded-lg border border-border bg-card outline-none transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring">
              <div className="overflow-hidden bg-muted"><img src={item.image} alt={item.label} className="aspect-[4/3] w-full object-contain p-4 transition duration-500 group-hover:scale-105" /></div>
              <div className="flex items-end justify-between gap-4 p-6"><div><h3 className="text-2xl">{item.label}</h3><p className="mt-2 text-sm text-muted-foreground">{item.note}</p></div><ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted py-20 sm:py-24">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-5 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase text-secondary">Direkt zu deinem Essen</p><h2 className="mt-4 text-5xl leading-none sm:text-7xl">Pick it.<br /><em className="text-secondary">Enjoy it.</em></h2><p className="mt-5 max-w-md leading-7 text-muted-foreground">Lieferung oder Abholung über deinen bevorzugten Dienst.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <OrderLink href={LIEFERANDO} icon={<ShoppingBag />} label="Lieferando" />
            <OrderLink href={WOLT} icon={<Bike />} label="Wolt" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[90rem] gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center">
        <div><p className="text-xs font-bold uppercase text-secondary">Seit 2023 in Hanau</p><h2 className="mt-4 text-5xl leading-none sm:text-7xl">Fastfood,<br /><em className="text-secondary">aber frisch.</em></h2></div>
        <div><p className="max-w-xl text-lg leading-8 text-muted-foreground">Jede Bowl wird erst bei deiner Bestellung zusammengestellt – mit frischem Gemüse, ausgewählten Proteinen und Saucen, die alles zusammenbringen.</p><div className="mt-7 flex flex-wrap gap-5"><Link to="/ueber-uns" className="inline-flex items-center gap-2 font-semibold text-secondary hover:underline">Mehr über uns <ArrowRight className="size-4" /></Link><Link to="/kontakt" className="inline-flex items-center gap-2 font-semibold hover:text-secondary"><MapPin className="size-4" /> Besuch uns in Hanau</Link></div></div>
      </section>
    </main>
  );
}

function OrderLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="group flex min-h-40 flex-col justify-between rounded-lg border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-secondary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="text-secondary [&_svg]:size-6">{icon}</span><span><span className="text-xs text-muted-foreground">Bestellen bei</span><span className="mt-1 flex items-center justify-between text-2xl font-semibold">{label}<ArrowRight className="size-5 transition-transform group-hover:translate-x-1" /></span></span></a>;
}
