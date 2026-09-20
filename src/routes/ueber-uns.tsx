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
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Seit 2023 in Hanau</p>
          <h1 className="mt-5 font-display text-4xl font-medium leading-tight sm:text-6xl">Schnell essen. Gut fühlen.</h1>
          <p className="mt-7 leading-7 text-muted-foreground">
            Yamiin &amp; Jaiyana&rsquo;s zeigt, dass Fastfood frisch, ausgewogen und voller Geschmack sein kann. Jede Bowl wird erst bei deiner Bestellung zusammengestellt.
          </p>
          <p className="mt-4 leading-7 text-muted-foreground">
            Reis, Quinoa oder Bulgur treffen auf knackiges Gemüse, ausgewählte Proteine und hausgemachte Saucen. Vegane und vegetarische Optionen gehören selbstverständlich dazu.
          </p>
          <Link to="/speisekarte" className="mt-8 inline-block border-b border-foreground pb-1 text-sm font-semibold">Zur Speisekarte</Link>
        </div>
        <img src={bowlVeggie} alt="Frisch zubereitete Bowl" className="aspect-[4/3] w-full object-cover" />
      </section>
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 text-center sm:grid-cols-3 sm:px-8">
          {[['2023', 'in Hanau eröffnet'], ['4,5 ★', 'Google-Bewertung'], ['Jeden Tag', 'frisch zubereitet']].map(([value, label]) => (
            <div key={value}><p className="font-display text-3xl">{value}</p><p className="mt-2 text-sm opacity-70">{label}</p></div>
          ))}
        </div>
      </section>
    </main>
  );
}