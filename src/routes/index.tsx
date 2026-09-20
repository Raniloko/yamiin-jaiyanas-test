import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bike, ShoppingBag } from "lucide-react";
import heroBowl from "@/assets/hero-bowl.jpg";
import acai from "@/assets/acai.jpg";
import sandwich from "@/assets/sandwich.jpg";
import bowlSalat from "@/assets/bowl-salat.jpg";
import logoAsset from "@/assets/yj-logo.jpeg.asset.json";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yamiin & Jaiyana's Healthy Fastfood – Bowls in Hanau" },
      {
        name: "description",
        content:
          "Frische Bowls, Egg Drop Sandwiches, Açaí und Matcha in Hanau. Yamiin & Jaiyana's Healthy Fastfood – Willy-Brandt-Straße 23. Abholung & Lieferung.",
      },
      { property: "og:title", content: "Yamiin & Jaiyana's Healthy Fastfood – Bowls in Hanau" },
      {
        property: "og:description",
        content:
          "Bowls mit Reis, Quinoa oder Bulgur, Egg Drop Sandwiches, Açaí und Matcha – frisch gemacht in Hanau.",
      },
      { property: "og:type", content: "restaurant.restaurant" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const LIEFERANDO = "https://www.lieferando.de/speisekarte/yamiin-jaiyanas-healthy-fastfood";
const WOLT = "https://wolt.com/de/deu/hanau/restaurant/yamiin-jaiyanas-healthy-fastfood";

const highlights = [
  { name: "Bowls", note: "Frisch kombiniert", image: bowlSalat },
  { name: "Egg Drop & Snacks", note: "Warm & fluffig", image: sandwich },
  { name: "Açaí & Matcha", note: "Fruchtig & cremig", image: acai },
];

function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-5 sm:px-8 sm:pb-20">
        <div className="grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[22rem] overflow-hidden bg-card sm:min-h-[32rem] lg:min-h-[39rem]">
            <img src={heroBowl} alt="Frische Bowl von Yamiin und Jaiyana's" className="absolute inset-0 size-full object-cover" />
            <div className="absolute bottom-0 left-0 bg-card px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em]">Hanau · seit 2023</div>
          </div>
          <div className="flex min-w-0 flex-col items-center justify-center bg-background px-6 py-14 text-center sm:px-12 lg:py-16">
            <img src={logoAsset.url} alt="YJ Logo" className="size-24 rounded-full object-cover grayscale sm:size-32" />
            <h1 className="mt-7 font-display text-4xl font-medium leading-tight sm:text-5xl">Yamiin &amp; Jaiyana&rsquo;s</h1>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Healthy Fastfood</p>
            <div className="my-7 h-px w-12 bg-border" />
            <p className="max-w-md leading-7 text-muted-foreground">Frische Bowls, Egg Drop Sandwiches, Açaí und Matcha – unkompliziert, ausgewogen und mitten in Hanau.</p>
            <Button asChild size="lg" className="mt-8 h-12 rounded-sm px-7">
              <Link to="/speisekarte">Speisekarte ansehen <ArrowRight className="size-4" /></Link>
            </Button>
            <p className="mt-5 text-xs text-muted-foreground">★ 4,5 bei rund 91 Google-Bewertungen</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Kleine Vorschau</p><h2 className="mt-3 font-display text-3xl font-medium sm:text-4xl">Was darf es sein?</h2></div>
          <Link to="/speisekarte" className="inline-flex items-center gap-2 text-sm font-semibold">Alles ansehen <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-9 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
          {highlights.map((item) => (
            <Link key={item.name} to="/speisekarte" className="group bg-card">
              <div className="overflow-hidden"><img src={item.image} alt={item.name} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-5"><div className="min-w-0"><h3 className="truncate font-display text-lg font-semibold">{item.name}</h3><p className="mt-1 text-sm text-muted-foreground">{item.note}</p></div><ArrowRight className="size-4 shrink-0" /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">Deine Wahl</p><h2 className="mt-4 font-display text-3xl font-medium sm:text-4xl">Abholen oder liefern lassen.</h2><p className="mt-4 max-w-md leading-7 opacity-70">Bestelle direkt über deinen bevorzugten Lieferdienst. Schnell ausgewählt, frisch für dich zubereitet.</p></div>
          <div className="grid gap-px bg-primary-foreground/20 sm:grid-cols-2">
            <a href={LIEFERANDO} target="_blank" rel="noreferrer" className="group flex min-h-44 flex-col justify-between bg-primary p-6 transition-colors hover:bg-primary-foreground/10"><ShoppingBag className="size-6" strokeWidth={1.5} /><div><p className="text-xs uppercase tracking-[0.16em] opacity-60">Bestellen bei</p><p className="mt-2 flex items-center justify-between font-display text-2xl">Lieferando <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" /></p></div></a>
            <a href={WOLT} target="_blank" rel="noreferrer" className="group flex min-h-44 flex-col justify-between bg-primary p-6 transition-colors hover:bg-primary-foreground/10"><Bike className="size-6" strokeWidth={1.5} /><div><p className="text-xs uppercase tracking-[0.16em] opacity-60">Bestellen bei</p><p className="mt-2 flex items-center justify-between font-display text-2xl">Wolt <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" /></p></div></a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Unser Anspruch</p><h2 className="mt-4 max-w-md font-display text-3xl font-medium leading-tight sm:text-4xl">Fastfood, das sich nach frisch anfühlt.</h2></div>
        <div><p className="leading-7 text-muted-foreground">Seit 2023 werden unsere Bowls in Hanau erst bei deiner Bestellung zusammengestellt – mit frischem Gemüse, ausgewählten Zutaten und hausgemachten Saucen.</p><Link to="/ueber-uns" className="mt-7 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-semibold">Mehr über uns <ArrowRight className="size-4" /></Link></div>
      </section>
    </main>
  );
}
