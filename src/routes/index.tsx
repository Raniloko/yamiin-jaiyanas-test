import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bike, ShoppingBag, Sparkles } from "lucide-react";
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
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative border-b-2 border-border">
        <img src={heroBowl} alt="Frische Bowl von Yamiin und Jaiyana's" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-[90rem] flex-col justify-between px-5 pb-10 pt-9 text-background sm:px-8 sm:pb-14 sm:pt-12 lg:px-12">
          <div className="flex items-center gap-3 text-xs font-bold uppercase">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><Sparkles className="size-4" /></span>
            Healthy Fastfood · Hanau
          </div>
          <div className="mt-10 max-w-3xl lg:mt-0">
            <h1 className="font-display text-[clamp(3.4rem,8vw,8.4rem)] uppercase leading-[0.82] [text-shadow:2px_2px_0_var(--foreground)]">
              Fresh<br />hits<br /><span className="text-secondary [text-shadow:3px_3px_0_var(--foreground)]">different.</span>
            </h1>
            <p className="mt-7 max-w-md text-lg leading-7">Bowls, Egg Drop Sandwiches, Açaí und Matcha. Frisch kombiniert, schnell bei dir.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="group h-14 rounded-md border-2 border-border bg-secondary px-6 font-bold uppercase text-secondary-foreground shadow-[5px_5px_0_var(--foreground)] hover:-translate-y-1 hover:shadow-[7px_7px_0_var(--foreground)] active:translate-x-1 active:translate-y-1 active:shadow-none hover:[&_svg]:translate-x-1">
                <Link to="/speisekarte">Speisekarte <ArrowRight className="size-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-md border-2 border-border bg-background px-6 font-bold uppercase text-foreground shadow-[4px_4px_0_var(--secondary)] hover:-translate-y-1 hover:bg-secondary hover:shadow-[6px_6px_0_var(--secondary)] active:translate-x-1 active:translate-y-1 active:shadow-none">
                <a href={LIEFERANDO} target="_blank" rel="noreferrer">Jetzt bestellen</a>
              </Button>
            </div>
            <p className="mt-10 text-sm font-semibold">★ 4,5 · rund 91 Google-Bewertungen</p>
          </div>
          <div className="pointer-events-none absolute right-5 top-24 hidden rotate-6 items-center justify-center rounded-full border-2 border-border bg-secondary p-4 text-center font-display text-sm uppercase text-secondary-foreground shadow-[5px_5px_0_var(--foreground)] sm:flex sm:size-28 sm:text-sm lg:size-36 lg:text-base lg:top-32">Freshly made</div>
          <BrandMark className="absolute right-5 top-28 size-16 -rotate-6 sm:bottom-6 sm:top-auto sm:size-24 lg:bottom-14 lg:right-12 lg:size-32" />
        </div>
      </section>

      <div className="overflow-hidden border-b-2 border-border bg-secondary py-3">
        <div className="animate-ticker flex w-max whitespace-nowrap font-display text-lg uppercase sm:text-2xl">
          <span className="pr-10">Bowls • Egg Drop • Açaí • Matcha • Vegan Friendly • Fresh in Hanau • </span>
          <span className="pr-10" aria-hidden="true">Bowls • Egg Drop • Açaí • Matcha • Vegan Friendly • Fresh in Hanau • </span>
        </div>
      </div>

      <section className="mx-auto max-w-[90rem] px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase">Pick your mood</p><h2 className="mt-3 max-w-3xl font-display text-4xl uppercase leading-none sm:text-6xl">Drei Favoriten.<br />Null Langeweile.</h2></div>
          <Link to="/speisekarte" className="group inline-flex items-center gap-2 border-b-2 border-border pb-1 font-bold uppercase transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Alles ansehen <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" /></Link>
        </div>
        <div className="mt-10 grid border-2 border-border sm:grid-cols-3">
          {highlights.map((item) => (
            <Link key={item.name} to="/speisekarte" className="group border-b-2 border-border bg-card transition-[transform,box-shadow,background-color] duration-300 ease-out hover:z-10 hover:-translate-y-2 hover:bg-secondary hover:shadow-[0_8px_0_var(--foreground)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary active:translate-y-1 active:scale-[0.98] active:shadow-none last:border-b-0 sm:border-b-0 sm:border-r-2 sm:last:border-r-0">
              <div className="overflow-hidden border-b-2 border-border"><img src={item.image} alt={item.name} className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" /></div>
              <div className="grid min-h-28 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-5"><div className="min-w-0"><h3 className="font-display text-xl uppercase leading-tight">{item.name}</h3><p className="mt-1 font-semibold">{item.note}</p></div><span className="flex size-11 items-center justify-center rounded-md border-2 border-border bg-secondary transition-[transform,background-color,color] duration-300 group-hover:rotate-12 group-hover:bg-foreground group-hover:text-secondary group-active:rotate-0"><ArrowRight className="size-6 shrink-0 transition-transform group-hover:translate-x-0.5" /></span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y-2 border-border bg-foreground py-16 text-background sm:py-24">
        <div className="mx-auto grid max-w-[90rem] gap-10 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase text-secondary">Direkt zu deinem Essen</p><h2 className="mt-4 font-display text-4xl uppercase leading-none sm:text-6xl">Click.<br />Pick.<br />Enjoy.</h2><p className="mt-5 max-w-md text-lg leading-7 opacity-70">Lieferung oder Abholung direkt über deinen bevorzugten Dienst.</p></div>
          <div className="grid border-2 border-background sm:grid-cols-2">
            <a href={LIEFERANDO} target="_blank" rel="noreferrer" className="group flex min-h-52 touch-manipulation flex-col justify-between border-b-2 border-background p-6 transition-[transform,background-color,color,box-shadow] duration-300 ease-out hover:z-10 hover:-translate-y-2 hover:bg-secondary hover:text-foreground hover:shadow-[0_8px_0_var(--secondary)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary active:translate-y-1 active:scale-[0.98] active:shadow-none sm:border-b-0 sm:border-r-2"><ShoppingBag className="size-7 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" /><div><p className="text-xs font-bold uppercase opacity-60">Bestellen bei</p><p className="mt-2 flex items-center justify-between font-display text-3xl uppercase">Lieferando <ArrowRight className="size-6 transition-transform group-hover:translate-x-2" /></p></div></a>
            <a href={WOLT} target="_blank" rel="noreferrer" className="group flex min-h-52 touch-manipulation flex-col justify-between p-6 transition-[transform,background-color,color,box-shadow] duration-300 ease-out hover:z-10 hover:-translate-y-2 hover:bg-secondary hover:text-foreground hover:shadow-[0_8px_0_var(--secondary)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary active:translate-y-1 active:scale-[0.98] active:shadow-none"><Bike className="size-7 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" /><div><p className="text-xs font-bold uppercase opacity-60">Bestellen bei</p><p className="mt-2 flex items-center justify-between font-display text-3xl uppercase">Wolt <ArrowRight className="size-6 transition-transform group-hover:translate-x-2" /></p></div></a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[90rem] gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2">
        <div><p className="text-xs font-bold uppercase">Unser Anspruch</p><h2 className="mt-4 max-w-xl font-display text-4xl uppercase leading-none sm:text-6xl">Fastfood.<br /><span className="bg-secondary px-2">Aber frisch.</span></h2></div>
        <div className="self-end"><p className="max-w-xl text-lg leading-8">Seit 2023 werden unsere Bowls in Hanau erst bei deiner Bestellung zusammengestellt – mit frischem Gemüse, ausgewählten Zutaten und hausgemachten Saucen.</p><Link to="/ueber-uns" className="group mt-7 inline-flex items-center gap-2 border-b-2 border-foreground pb-1 font-bold uppercase transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Mehr über uns <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" /></Link></div>
      </section>
    </main>
  );
}
