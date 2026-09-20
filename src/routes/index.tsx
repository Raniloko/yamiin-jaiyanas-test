import { createFileRoute } from "@tanstack/react-router";
import heroBowl from "@/assets/hero-bowl.jpg";
import bowlSalat from "@/assets/bowl-salat.jpg";
import bowlVeggie from "@/assets/bowl-veggie.jpg";
import bowlPoke from "@/assets/bowl-poke.jpg";
import bowlFalafel from "@/assets/bowl-falafel.jpg";
import acai from "@/assets/acai.jpg";
import sandwich from "@/assets/sandwich.jpg";
import matcha from "@/assets/matcha.jpg";

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

const bowls = [
  {
    name: "Y's Bowl",
    price: "14,90 €",
    desc: "Unsere Signature Bowl mit knusprigem Chicken, frischem Gemüse und hausgemachter Sauce.",
    img: bowlSalat,
  },
  {
    name: "J's Bowl",
    price: "15,40 €",
    desc: "Herzhaft, cremig, ausgewogen – die Lieblingsbowl für den großen Hunger.",
    img: bowlVeggie,
  },
  {
    name: "Bulgur Blizz Bowl",
    price: "14,90 €",
    desc: "Bulgur als Basis, dazu viel Grün, Kräuter und ein frischer Dressing-Kick.",
    img: bowlFalafel,
  },
  {
    name: "Midori Ebi Bowl",
    price: "14,50 €",
    desc: "Garnelen, Avocado und knackiges Gemüse auf lockerem Reis.",
    img: bowlPoke,
  },
  {
    name: "Falafel Exotica Bowl",
    price: "13,90 €",
    desc: "Vegan: goldene Falafel, Hummus, eingelegtes Gemüse und Granatapfel.",
    img: bowlFalafel,
  },
  {
    name: "Aloha Bowl",
    price: "15,00 €",
    desc: "Tropisch frisch mit Mango, Edamame und einem Hauch Süße.",
    img: bowlPoke,
  },
];

const extras = [
  { name: "Egg Drop Sandwich", desc: "Fluffiges Rührei, Brioche, cremige Sauce – unser Frühstücks-Star.", img: sandwich },
  { name: "Açaí Bowl", desc: "Açaí, frische Früchte, Granola und Toppings nach Wahl.", img: acai },
  { name: "Matcha & Drinks", desc: "Matcha Latte, Fritz-Limo ab 3,17 € und Elephant Bay ab 3,45 €.", img: matcha },
];

const steps = [
  { n: "1", t: "Basis wählen", d: "Reis, Quinoa oder Bulgur – du entscheidest." },
  { n: "2", t: "Topping wählen", d: "Chicken, Garnelen, Falafel oder Veggie." },
  { n: "3", t: "Gemüse dazu", d: "Frisch geschnitten, jeden Tag neu." },
  { n: "4", t: "Sauce drauf", d: "Hausgemacht – mild, würzig oder scharf." },
];

const reviews = [
  { text: "Super frische Bowls, alles schmeckt wirklich hausgemacht. Immer wieder gern!", author: "Google-Bewertung" },
  { text: "Endlich gesundes Fastfood in Hanau. Freundliches Team und faire Preise.", author: "Google-Bewertung" },
  { text: "Das Egg Drop Sandwich ist ein Traum – und der Matcha erst!", author: "Google-Bewertung" },
];

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="#top" className="font-display text-lg font-bold leading-tight tracking-tight text-primary">
            Yamiin &amp; Jaiyana&rsquo;s
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Healthy Fastfood
            </span>
          </a>
          <div className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="#speisekarte" className="transition-colors hover:text-primary">Speisekarte</a>
            <a href="#bowl-bauen" className="transition-colors hover:text-primary">Bowl bauen</a>
            <a href="#bewertungen" className="transition-colors hover:text-primary">Bewertungen</a>
            <a href="#kontakt" className="transition-colors hover:text-primary">Besuch uns</a>
          </div>
          <a
            href={LIEFERANDO}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.03]"
          >
            Jetzt bestellen
          </a>
        </nav>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 md:pt-16">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                Hanau · seit 2023
              </span>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
                Gesundes Fastfood,
                <span className="block text-primary">frisch in deine Bowl.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                Bowls mit Reis, Quinoa oder Bulgur, Egg Drop Sandwiches, Açaí und Matcha – jeden Tag frisch zubereitet
                in der Willy-Brandt-Straße 23.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={LIEFERANDO}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.03]"
                >
                  Bei Lieferando bestellen
                </a>
                <a
                  href={WOLT}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-primary/25 bg-card px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
                >
                  Bei Wolt bestellen
                </a>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                <span className="font-semibold text-accent">★ 4,5</span> bei rund 91 Google-Bewertungen
              </p>
            </div>
            <div className="relative">
              <img
                src={heroBowl}
                alt="Frisch zubereitete Bowls von Yamiin & Jaiyana's Healthy Fastfood"
                className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl"
              />
              <div className="absolute -bottom-5 left-5 rounded-2xl bg-card px-5 py-3 text-sm font-semibold shadow-lg">
                Abholung &amp; Lieferung
              </div>
            </div>
          </div>
        </section>

        {/* Über uns */}
        <section className="bg-secondary/50 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Über uns</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Seit November 2023 zeigen wir in Hanau, dass schnelles Essen auch richtig gut tun kann. Bei Yamiin &amp;
                Jaiyana&rsquo;s wird jede Bowl frisch zusammengestellt – mit knackigem Gemüse, selbst gemachten Saucen
                und Zutaten, die wir auch unserer Familie servieren würden.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Vegane und vegetarische Varianten gibt es bei uns nicht als Kompromiss, sondern als eigene Lieblinge auf
                der Karte.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { k: "2023", v: "eröffnet" },
                { k: "4,5★", v: "Google" },
                { k: "100%", v: "frisch" },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl bg-card p-5 text-center shadow-sm">
                  <div className="font-display text-2xl font-bold text-primary">{s.k}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Speisekarte */}
        <section id="speisekarte" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Unsere Bowls</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Alle Bowls gibt es mit Reis, Quinoa oder Bulgur – auf Wunsch auch vegan.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bowls.map((b) => (
              <article key={b.name} className="overflow-hidden rounded-[1.75rem] bg-card shadow-sm transition-shadow hover:shadow-lg">
                <img src={b.img} alt={b.name} className="aspect-[4/3] w-full object-cover" />
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-lg font-bold">{b.name}</h3>
                    <span className="whitespace-nowrap font-semibold text-accent">{b.price}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
                </div>
              </article>
            ))}
          </div>

          <h2 className="mt-16 font-display text-3xl font-bold tracking-tight md:text-4xl">Mehr als Bowls</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {extras.map((e) => (
              <article key={e.name} className="overflow-hidden rounded-[1.75rem] bg-secondary/60 shadow-sm">
                <img src={e.img} alt={e.name} className="aspect-[4/3] w-full object-cover" />
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold">{e.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Bowl bauen */}
        <section id="bowl-bauen" className="bg-primary py-16 text-primary-foreground">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">So baust du deine Bowl</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <div key={s.n} className="rounded-[1.5rem] bg-primary-foreground/10 p-6">
                  <div className="font-display text-3xl font-extrabold text-accent">{s.n}</div>
                  <h3 className="mt-3 font-display text-lg font-bold">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed opacity-85">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bewertungen */}
        <section id="bewertungen" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Das sagen unsere Gäste</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <blockquote key={r.text} className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-sm">
                <div className="text-accent">★★★★★</div>
                <p className="mt-3 leading-relaxed">{r.text}</p>
                <footer className="mt-4 text-sm text-muted-foreground">{r.author}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* Kontakt */}
        <section id="kontakt" className="bg-secondary/50 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Besuch uns</h2>
              <address className="mt-5 space-y-2 text-base not-italic leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">Yamiin &amp; Jaiyana&rsquo;s Healthy Fastfood</p>
                <p>Willy-Brandt-Straße 23<br />63450 Hanau</p>
                <p>
                  Telefon:{" "}
                  <a href="tel:+4961814187419" className="font-medium text-primary hover:underline">
                    06181 4187419
                  </a>
                </p>
                <p>
                  E-Mail:{" "}
                  <a href="mailto:info@jaiyanas.de" className="font-medium text-primary hover:underline">
                    info@jaiyanas.de
                  </a>
                </p>
              </address>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={LIEFERANDO}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Lieferando
                </a>
                <a
                  href={WOLT}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-primary/25 bg-card px-6 py-3 text-sm font-semibold text-primary"
                >
                  Wolt
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-[1.75rem] shadow-sm">
              <iframe
                title="Karte: Willy-Brandt-Straße 23, Hanau"
                src="https://www.openstreetmap.org/export/embed.html?bbox=8.910%2C50.126%2C8.936%2C50.140&layer=mapnik&marker=50.1330%2C8.9230"
                className="h-72 w-full border-0 md:h-full"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-card py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p className="font-display text-base font-bold text-primary">Yamiin &amp; Jaiyana&rsquo;s Healthy Fastfood</p>
          <p>Willy-Brandt-Straße 23, 63450 Hanau · Vertreten durch Samira Hussein</p>
          <p>© {new Date().getFullYear()} Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}
