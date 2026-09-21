import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/speisekarte")({
  head: () => ({
    meta: [
      { title: "Speisekarte | Yamiin & Jaiyana's Healthy Fastfood" },
      { name: "description", content: "Bowls, Egg Drop Sandwiches, Açaí und Getränke von Yamiin & Jaiyana's in Hanau." },
      { property: "og:title", content: "Speisekarte | Yamiin & Jaiyana's" },
      { property: "og:description", content: "Entdecke Bowls, Snacks und Drinks – frisch zubereitet in Hanau." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuPage,
});

const categories = [
  {
    id: "bowls",
    title: "Bowls",
    intro: "Frisch kombiniert mit Reis, Quinoa oder Bulgur.",
    items: [
      ["Y's Bowl", "Signature Bowl mit knusprigem Chicken, Gemüse und hausgemachter Sauce.", "14,90 €"],
      ["J's Bowl", "Herzhaft, cremig und ausgewogen – für den großen Hunger.", "15,40 €"],
      ["Bulgur Blizz Bowl", "Bulgur, viel Grün, Kräuter und ein frisches Dressing.", "14,90 €"],
      ["Midori Ebi Bowl", "Garnelen, Avocado und knackiges Gemüse auf Reis.", "14,50 €"],
      ["Falafel Exotica Bowl", "Falafel, Hummus, eingelegtes Gemüse und Granatapfel.", "13,90 €"],
      ["Mykonos", "Mediterrane Bowl mit frischem Gemüse und cremigem Finish.", "15,90 €"],
      ["Aloha Bowl", "Mango, Edamame und ein Hauch tropischer Süße.", "15,00 €"],
    ],
  },
  {
    id: "snacks",
    title: "Egg Drop & Snacks",
    intro: "Warm, fluffig und frisch für dich zubereitet.",
    items: [
      ["Egg Drop Sandwich", "Fluffiges Rührei, Brioche und cremige Sauce.", "Preis vor Ort"],
      ["Desserts", "Wechselnde süße Auswahl für danach.", "Preis vor Ort"],
    ],
  },
  {
    id: "drinks",
    title: "Açaí & Drinks",
    intro: "Fruchtig, erfrischend oder cremig.",
    items: [
      ["Açaí Bowl", "Açaí, frische Früchte, Granola und Toppings.", "Preis vor Ort"],
      ["Matcha Latte", "Cremiger Matcha – warm oder kalt.", "Preis vor Ort"],
      ["Fritz-Limo", "Verschiedene Sorten.", "ab 3,17 €"],
      ["Elephant Bay", "Verschiedene Sorten.", "ab 3,45 €"],
    ],
  },
];

function MenuPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b-2 border-border bg-secondary px-5 pb-12 pt-16 sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-[90rem]">
        <p className="text-xs font-bold uppercase">Frisch in Hanau</p>
        <h1 className="mt-5 max-w-5xl font-display text-5xl uppercase leading-[0.9] sm:text-8xl">Unsere<br />Speisekarte</h1>
        <p className="mt-6 max-w-xl text-lg leading-7">
          Klar ausgewählt, frisch kombiniert. Vegane und vegetarische Optionen sind verfügbar.
        </p>
        <nav className="mt-9 flex flex-wrap gap-2" aria-label="Speisekarten-Kategorien">
          {categories.map((category) => (
            <a key={category.id} href={`#${category.id}`} className="border-2 border-border bg-background px-4 py-2 text-sm font-bold uppercase shadow-[3px_3px_0_var(--foreground)]">
              {category.title}
            </a>
          ))}
        </nav>
        </div>
      </section>

      <div className="mx-auto max-w-[90rem] px-5 pb-24 sm:px-8">
        {categories.map((category) => (
          <section key={category.id} id={category.id} className="scroll-mt-28 border-b-2 border-border py-12 sm:grid sm:grid-cols-[18rem_1fr] sm:gap-12 sm:py-16">
            <div>
              <h2 className="font-display text-3xl uppercase leading-none">{category.title}</h2>
              <p className="mt-3 text-base leading-6">{category.intro}</p>
            </div>
            <div className="mt-8 divide-y-2 divide-border sm:mt-0">
              {category.items.map(([name, description, price]) => (
                <article key={name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-5 py-5 first:pt-0">
                  <div className="min-w-0">
                    <h3 className="font-display text-base uppercase">{name}</h3>
                    <p className="mt-1 text-sm leading-6 opacity-70">{description}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{price}</span>
                </article>
              ))}
            </div>
          </section>
        ))}
        <p className="border-t border-border pt-6 text-xs leading-5 text-muted-foreground">
          Preise und Verfügbarkeit können sich ändern. Die aktuelle Auswahl findest du beim jeweiligen Lieferdienst.
        </p>
      </div>
    </main>
  );
}