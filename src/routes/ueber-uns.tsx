import { createFileRoute, Link } from "@tanstack/react-router";
import bowlVeggie from "@/assets/bowl-veggie.jpg";

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
      <section className="mx-auto grid max-w-[90rem] gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="max-w-xl">
           <p className="text-xs font-bold uppercase">Seit 2023 in Hanau</p>
           <h1 className="mt-5 font-display text-5xl uppercase leading-[0.9] sm:text-7xl">Schnell essen.<br /><span className="bg-secondary px-1">Gut fühlen.</span></h1>
           <p className="mt-7 text-lg leading-7">
            Yamiin &amp; Jaiyana&rsquo;s zeigt, dass Fastfood frisch, ausgewogen und voller Geschmack sein kann. Jede Bowl wird erst bei deiner Bestellung zusammengestellt.
          </p>
           <p className="mt-4 text-lg leading-7">
            Reis, Quinoa oder Bulgur treffen auf knackiges Gemüse, ausgewählte Proteine und hausgemachte Saucen. Vegane und vegetarische Optionen gehören selbstverständlich dazu.
          </p>
           <Link to="/speisekarte" className="mt-8 inline-block border-b-2 border-foreground pb-1 font-bold uppercase">Zur Speisekarte</Link>
        </div>
         <img src={bowlVeggie} alt="Frisch zubereitete Bowl" className="aspect-[4/3] w-full border-2 border-border object-cover shadow-[8px_8px_0_var(--secondary)]" />
      </section>
       <section className="border-y-2 border-border bg-secondary py-16 text-secondary-foreground">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 text-center sm:grid-cols-3 sm:px-8">
          {[['2023', 'in Hanau eröffnet'], ['4,5 ★', 'Google-Bewertung'], ['Jeden Tag', 'frisch zubereitet']].map(([value, label]) => (
             <div key={value}><p className="font-display text-4xl uppercase">{value}</p><p className="mt-2 font-semibold">{label}</p></div>
          ))}
        </div>
      </section>
    </main>
  );
}