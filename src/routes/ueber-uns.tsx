import { createFileRoute, Link } from "@tanstack/react-router";
import ysBowlAsset from "@/assets/menu/bowl-ys.webp.asset.json";
import falafelBowlAsset from "@/assets/menu/bowl-falafel-exotica.webp.asset.json";

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

function AboutPage() {
  return (
    <main>
      <section className="mx-auto grid max-w-[90rem] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="max-w-xl">
           <p className="text-xs font-bold uppercase">Seit 2023 in Hanau</p>
           <h1 className="mt-5 text-6xl leading-[0.9] sm:text-8xl">Schnell essen.<br /><em className="text-secondary">Gut fühlen.</em></h1>
           <p className="mt-7 text-lg leading-7">
            Yamiin &amp; Jaiyana&rsquo;s zeigt, dass Fastfood frisch, ausgewogen und voller Geschmack sein kann. Jede Bowl wird erst bei deiner Bestellung zusammengestellt.
          </p>
           <p className="mt-4 text-lg leading-7">
            Reis, Quinoa oder Bulgur treffen auf knackiges Gemüse, ausgewählte Proteine und hausgemachte Saucen. Vegane und vegetarische Optionen gehören selbstverständlich dazu.
          </p>
           <Link to="/speisekarte" className="mt-8 inline-block border-b border-secondary pb-1 font-semibold text-secondary">Zur Speisekarte</Link>
        </div>
         <div className="relative min-h-[25rem] rounded-lg bg-muted sm:min-h-[34rem]"><img src={falafelBowlAsset.url} alt="Falafel Exotica Bowl" className="absolute bottom-4 left-0 w-[55%] drop-shadow-2xl" /><img src={ysBowlAsset.url} alt="Y's Bowl" className="absolute right-0 top-3 w-[67%] drop-shadow-2xl" /></div>
      </section>
       <section className="border-y border-border bg-muted py-16">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 text-center sm:grid-cols-3 sm:px-8">
          {[['2023', 'in Hanau eröffnet'], ['4,5 ★', 'Google-Bewertung'], ['Jeden Tag', 'frisch zubereitet']].map(([value, label]) => (
             <div key={value} className="rounded-lg border border-border bg-card px-5 py-6"><p className="font-display text-4xl text-secondary">{value}</p><p className="mt-2 text-sm text-muted-foreground">{label}</p></div>
          ))}
        </div>
      </section>
    </main>
  );
}