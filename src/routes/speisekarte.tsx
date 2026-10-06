import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Leaf, Milk } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { acais, bowlSteps, bowls, coffees, iceBurgerImage, matchas, wrapImage, type Bowl, type BowlFilter } from "@/lib/menu-data";

export const Route = createFileRoute("/speisekarte")({
  head: () => ({
    meta: [
      { title: "Speisekarte | Yamiin & Jaiyana's Healthy Fastfood" },
      { name: "description", content: "Alle Signature Bowls, Create your Bowl, Matcha, Kaffee, Açaí Specials, Ice Burger und Wraps von Yamiin & Jaiyana's." },
      { property: "og:title", content: "Speisekarte | Yamiin & Jaiyana's" },
      { property: "og:description", content: "Alle Zutaten, Größen, Preise und Nährwerte auf einen Blick." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MenuPage,
});

const navItems = [["bowls", "Bowls"], ["create", "Create your Bowl"], ["matcha", "Matcha"], ["coffee", "Coffee"], ["acai", "Açaí"], ["ice-burger", "Ice Burger"], ["wrap", "Wrap"]];
const filters: BowlFilter[] = ["Alle", "High Protein", "Chicken", "Fisch & Garnelen", "Vegan"];

function MenuPage() {
  const [filter, setFilter] = useState<BowlFilter>("Alle");
  const visibleBowls = bowls.filter((bowl) => bowl.filters.includes(filter));
  return (
    <main className="bg-background">
      <div className="sticky top-18 z-30 overflow-x-auto border-b border-border bg-background/95 px-5 py-3 backdrop-blur sm:top-20 sm:px-8">
        <nav aria-label="Speisekarten-Kategorien" className="mx-auto flex w-max min-w-full max-w-[90rem] gap-2">
          {navItems.map(([id, label], index) => <a key={id} href={`#${id}`} className={`rounded-full border px-4 py-2 text-xs font-semibold transition hover:border-secondary hover:text-secondary ${index === 0 ? "border-foreground bg-foreground text-background" : "border-border bg-card"}`}>{label}</a>)}
        </nav>
      </div>

      <section className="mx-auto max-w-[90rem] px-5 pb-14 pt-16 sm:px-8 sm:pt-20">
        <p className="text-xs font-bold uppercase text-secondary">Bowls · Açaí · Matcha · Coffee</p>
        <h1 className="mt-5 max-w-5xl text-6xl leading-[0.9] sm:text-8xl">Alles, was gut tut.<br /><em className="text-secondary">An einem Ort.</em></h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">Frisch zubereitet, liebevoll angerichtet – mit allen Zutaten, Preisen und Nährwerten im Blick.</p>
      </section>

      <section id="bowls" className="scroll-mt-36 border-t border-border px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[90rem]">
          <SectionTitle eyebrow="Signature Bowls" title={<>Wähle deine <em className="text-secondary">Bowl</em></>} description="Tippe auf eine Bowl für Zutaten und Proteingehalt – in Klein oder Groß." />
          <div className="mt-8 flex items-center gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-3 text-sm"><span>🍚</span><span>Jede Bowl mit Base nach Wahl: <strong>Bulgur, Somalireis oder Salat</strong></span></div>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Bowls filtern">
            {filters.map((item) => <Button key={item} type="button" variant={filter === item ? "default" : "outline"} aria-pressed={filter === item} onClick={() => setFilter(item)} className="rounded-full border-border px-4 shadow-none">{item}</Button>)}
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleBowls.map((bowl) => <BowlCard key={bowl.name} bowl={bowl} />)}
          </div>
        </div>
      </section>

      <section id="create" className="scroll-mt-36 border-y border-border bg-muted px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[90rem]">
          <SectionTitle eyebrow="Taste the Bowl-volution" title={<>Create your <em className="text-secondary">Bowl</em></>} description="In 6 Schritten zu deiner Lieblings-Bowl. Einfach an der Theke Schritt für Schritt auswählen." />
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 xl:grid-cols-3">
            {bowlSteps.map((step) => <article key={step.number} className="bg-card p-6 sm:p-8"><span className="flex size-10 items-center justify-center rounded-full bg-secondary font-display text-xl text-secondary-foreground">{step.number}</span><h3 className="mt-5 text-3xl">{step.title}</h3><p className="mt-1 text-xs font-semibold text-secondary">{step.note}</p><div className="mt-5 flex flex-wrap gap-2">{step.items.map((item) => <span key={item} className="rounded-full bg-muted px-3 py-1.5 text-sm">{item}</span>)}</div></article>)}
          </div>
        </div>
      </section>

      <section id="matcha" className="scroll-mt-36 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[90rem]">
          <SectionTitle eyebrow="Iced Matcha · 0,3 l" title={<>Taste the <em className="text-secondary">Matcha</em></>} description="Cremiger Matcha, fruchtig geschichtet – oder als Signature mit Lotus & Pistazie." />
          <div className="mt-7 flex items-center gap-2 text-sm text-muted-foreground"><Milk className="size-4 text-secondary" /> Milch, Oat Milk oder Coconut Milk</div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{matchas.map((item) => <ProductCard key={item.name} {...item} />)}</div>
          <div className="mt-5 rounded-lg border border-border bg-card p-6 sm:flex sm:items-center sm:justify-between"><div><h3 className="text-2xl">Hot Matcha</h3><p className="mt-1 text-sm text-muted-foreground">Create your own – dein Matcha, jetzt auch heiß</p></div><p className="mt-4 font-semibold sm:mt-0">5,50 € · heiß</p></div>
        </div>
      </section>

      <section id="coffee" className="scroll-mt-36 border-y border-border bg-foreground px-5 py-16 text-background sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-[90rem] gap-10 lg:grid-cols-[0.65fr_1.35fr]">
          <SectionTitle eyebrow="Hot Drinks" title={<>Coffee</>} description="Klassiker für deinen Moment – auf Wunsch mit Extra Flavor." />
          <div className="grid content-start sm:grid-cols-2">{coffees.map(([name, price]) => <div key={name} className="flex justify-between gap-6 border-b border-background/20 py-4 sm:odd:mr-5 sm:even:ml-5"><span>{name}</span><strong>{price}</strong></div>)}</div>
        </div>
      </section>

      <section id="acai" className="scroll-mt-36 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[90rem]">
          <SectionTitle eyebrow="Healthy & Fresh" title={<>Our Açaí <em className="text-secondary">Specials</em></>} description="Stell dir deine Açaí Bowl selbst zusammen oder lass dich von unseren Empfehlungen inspirieren." />
          <div className="mt-7 inline-flex rounded-full bg-muted px-4 py-2 text-sm"><Leaf className="mr-2 size-4 text-secondary" /> Jedes Special 11,90 € · Wahlweise mit Chia oder Granola</div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{acais.map((item) => <ProductCard key={item.name} {...item} price="11,90 €" size="Special" />)}</div>
        </div>
      </section>

      <section id="ice-burger" className="scroll-mt-36 border-y border-border bg-muted px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-[90rem] gap-10 lg:grid-cols-2 lg:items-center">
          <img src={iceBurgerImage} alt="Peeka Ice Burger" className="mx-auto max-h-[38rem] w-full max-w-lg object-contain" />
          <div><SectionTitle eyebrow="Sweet Treats" title={<>Peeka <em className="text-secondary">Ice Burger</em></>} description="Gefüllt mit Ice Cream – der perfekte Abschluss." /><div className="mt-8 divide-y divide-border border-y border-border">{["Peeka Pistachio", "Peeka Lotus", "Peeka Bueno"].map((name) => <div key={name} className="flex items-center justify-between gap-4 py-4"><div><h3 className="text-xl">{name}</h3><p className="text-sm text-muted-foreground">Gefüllt mit Ice Cream</p></div><strong>4,00 €</strong></div>)}</div></div>
        </div>
      </section>

      <section id="wrap" className="scroll-mt-36 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-[90rem] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div><SectionTitle eyebrow="Jetzt neu" title={<>Wrap it <em className="text-secondary">up!</em></>} description="Zartes Chicken, frisches Gemüse, knackige Salate und leckere Saucen – du entscheidest, was reinkommt." /><p className="mt-8 text-3xl font-semibold">8,90 € <span className="ml-2 text-sm font-normal text-muted-foreground">Chicken Wrap</span></p></div>
          <img src={wrapImage} alt="Chicken Wrap" className="aspect-[8/7] w-full rounded-lg bg-muted object-contain p-6" />
        </div>
      </section>

      <p className="border-t border-border px-5 py-8 text-center text-xs leading-5 text-muted-foreground">Alle Preise in Euro inkl. MwSt. · Nährwertangaben sind Richtwerte. Fragen zu Zutaten oder Allergenen? Sprich uns gerne an.</p>
    </main>
  );
}

function BowlCard({ bowl }: { bowl: Bowl }) {
  const [open, setOpen] = useState(false);
  return <article className="overflow-hidden rounded-lg border border-border bg-card transition duration-300 hover:-translate-y-1 hover:shadow-xl"><div className="relative bg-muted"><span className="absolute left-4 top-4 z-10 rounded-full bg-card px-3 py-1 text-xs font-semibold">{bowl.tag}</span><img src={bowl.image} alt={bowl.name} className="aspect-square w-full object-contain p-5" /></div><div className="p-6"><h3 className="text-2xl">{bowl.name}</h3><p className="mt-3 min-h-16 text-sm leading-6 text-muted-foreground">{bowl.description}</p><div className="mt-5 flex items-center justify-between border-y border-border py-3 text-xs"><span>Protein klein / groß</span><strong>{bowl.protein}</strong></div><div className="mt-5 grid grid-cols-[1fr_1fr_auto] items-end gap-3"><div><span className="text-xs text-muted-foreground">Klein</span><p className="font-display text-xl">{bowl.small}</p></div><div><span className="text-xs text-muted-foreground">Groß</span><p className="font-display text-xl">{bowl.large}</p></div><Button type="button" variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="rounded-full border-border shadow-none">Details <ChevronDown className={open ? "rotate-180" : ""} /></Button></div>{open && <div className="mt-5 rounded-md bg-muted p-4 text-sm leading-6"><p><strong>Base:</strong> Bulgur, Somalireis oder Salat</p><p className="mt-1"><strong>Protein:</strong> {bowl.protein} (klein / groß)</p><p className="mt-1 text-muted-foreground">Bei Allergien oder Unverträglichkeiten bitte unser Team ansprechen.</p></div>}</div></article>;
}

function ProductCard({ name, description, price, size, image, signature }: { name: string; description: string; price: string; size: string; image: string; signature?: boolean }) {
  return <article className="overflow-hidden rounded-lg border border-border bg-card transition duration-300 hover:-translate-y-1 hover:shadow-xl"><div className="relative bg-muted">{signature && <span className="absolute left-3 top-3 z-10 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">Signature</span>}<img src={image} alt={name} className="aspect-square w-full object-contain p-3" /></div><div className="p-5"><h3 className="text-xl leading-tight">{name}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{description}</p><div className="mt-4 flex items-end justify-between"><strong>{price}</strong><span className="text-xs text-muted-foreground">{size}</span></div></div></article>;
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description: string }) {
  return <div><p className="text-xs font-bold uppercase text-secondary">{eyebrow}</p><h2 className="mt-3 text-5xl leading-none sm:text-7xl">{title}</h2><p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{description}</p></div>;
}