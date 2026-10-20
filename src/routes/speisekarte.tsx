import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Coffee, Minus, Plus, Search, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { acais, bowlFilters, bowls, bowlSteps, coffeeExtra, coffees, iceBurgers, matchas, menuCategories, menuNotes, parseMenuPrice, wraps, type Bowl, type BowlFilter, type MenuProduct } from "@/lib/menu-data";
import { cart, euro, useCart } from "@/lib/cart-store";

export const Route = createFileRoute("/speisekarte")({
  head: () => ({ meta: [
    { title: "Speisekarte – Bowls, Matcha & Açaí | Yamiin & Jaiyana's" },
    { name: "description", content: "Die vollständige Speisekarte von Yamiin & Jaiyana's in Hanau: Bowls mit Nährwerten, Bowl-Baukasten, Matcha, Coffee, Açaí, Ice Burger und Wraps." },
    { property: "og:title", content: "Speisekarte | Yamiin & Jaiyana's Hanau" },
    { property: "og:description", content: "Alle Gerichte, Originalbilder, Zutaten und Preise – entdecke deine Lieblings-Bowl und bestelle zur Abholung." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: OrderPage,
});

type Selection = { kind: "bowl"; item: Bowl } | { kind: "product"; item: MenuProduct };
function OrderPage() {
  const { count } = useCart();
  const [category, setCategory] = useState("bowls");
  const [filter, setFilter] = useState<BowlFilter>("Alle");
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const chooseCategory = (id: string) => {
    setCategory(id); setQuery(""); window.history.replaceState(null, "", `#${id}`);
    // Wer weiter unten war, landet sonst mitten in einer kürzeren Kategorie (oder im Footer).
    // Erst nach dem Rendern scrollen, sonst bricht die kürzere Seite das Scrollen ab.
    requestAnimationFrame(() => {
      const content = contentRef.current;
      const nav = document.querySelector<HTMLElement>("nav[aria-label='Kategorien']");
      if (!content) return;
      // Feste Werte statt aktueller Position: Sticky-Abstand (Header-Höhe) + Höhe der Leiste.
      const offset = nav ? parseFloat(getComputedStyle(nav).top) + nav.offsetHeight + 8 : 0;
      const top = content.getBoundingClientRect().top + window.scrollY - offset;
      if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
    });
  };
  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.slice(1);
      if (menuCategories.some(item => item.id === hash)) setCategory(hash);
    };
    readHash(); window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);
  const matches = (item: { name: string; description: string }) => `${item.name} ${item.description}`.toLocaleLowerCase("de").includes(query.toLocaleLowerCase("de"));
  const visibleBowls = bowls.filter(item => item.filters.includes(filter) && matches(item));
  const products = category === "matcha" ? matchas : category === "acai" ? acais : category === "ice" ? iceBurgers : category === "wrap" ? wraps : [];
  const title = category === "matcha" ? "Taste the Matcha" : category === "acai" ? "Our Açaí Specials" : category === "ice" ? "Peeka Ice Burger" : "Wrap it up!";
  return <main className="min-h-screen bg-background text-foreground">
    <header className="mx-auto max-w-7xl px-5 pb-8 pt-10 sm:px-8 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs font-bold uppercase tracking-widest text-secondary">Yamiin & Jaiyana&apos;s · Hanau</p><h1 className="mt-3 text-5xl sm:text-6xl">Unsere <em className="text-secondary">Speisekarte.</em></h1><p className="mt-4 text-muted-foreground">Bowls · Matcha · Coffee · Açaí · Sweet Treats</p></div>
        <Button variant="outline" onClick={() => cart.openDrawer()} className="gap-2"><ShoppingBag className="size-4" />Warenkorb <Badge>{count}</Badge></Button>
      </div>
    </header>
    <nav aria-label="Kategorien" className="sticky top-[4.5rem] z-30 sm:top-20 border-y border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-8">{menuCategories.map(item => <Button key={item.id} variant={category === item.id ? "default" : "outline"} aria-pressed={category === item.id} onClick={() => chooseCategory(item.id)} className="shrink-0">{item.label}</Button>)}</div>
    </nav>
    <div ref={contentRef} className="mx-auto max-w-7xl px-5 pb-36 pt-8 sm:px-8">
      {category !== "create" && <div className="relative mb-8 max-w-md"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Gerichte suchen" placeholder="Gerichte oder Zutaten suchen" value={query} onChange={event => setQuery(event.target.value)} className="bg-card pl-10" /></div>}
      {category === "bowls" && <section id="bowls" aria-labelledby="bowls-title"><SectionTitle id="bowls-title" eyebrow="Signature Bowls" title="Wähle deine Bowl" /><p className="mt-3 text-muted-foreground">Jede Bowl mit Base nach Wahl: Bulgur, Somalireis oder Salat.</p><div className="my-6 flex flex-wrap gap-2" aria-label="Bowl-Filter">{bowlFilters.map(item => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</Button>)}</div><div className="grid gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">{visibleBowls.map(item => <article key={item.name} className={CARD}><div className={CARD_MEDIA}><Badge className="absolute left-2 top-2 px-1.5 text-[10px] sm:left-4 sm:top-4 sm:px-2.5 sm:text-xs">{item.tag}</Badge><img loading="lazy" src={item.image} alt={item.name} className={CARD_IMG} /></div><div className={CARD_BODY}><h3 className={CARD_TITLE}>{item.name}</h3><p className={CARD_TEXT}>{item.description}</p><p className="mt-2 text-xs font-semibold text-secondary sm:mt-4">Protein · {item.protein}</p><div className={CARD_FOOT}><div className="text-sm"><p className="sm:hidden">ab <strong>{item.small}</strong></p><div className="hidden sm:block"><p>Klein <strong>{item.small}</strong></p><p className="mt-1">Groß <strong>{item.large}</strong></p></div></div><Button size="sm" className="sm:h-9 sm:px-4" onClick={() => setSelection({ kind: "bowl", item })}>Auswählen <ArrowRight className="size-4" /></Button></div></div></article>)}</div>{visibleBowls.length === 0 && <EmptySearch />}</section>}
      {category === "create" && <section id="create"><SectionTitle eyebrow="Taste the Bowl-volution" title="Create your Bowl" /><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{menuNotes.create}</p><div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">{bowlSteps.map(step => <div key={step.number} className="border-t border-border pt-5"><div className="flex items-baseline gap-3"><span className="font-display text-4xl text-secondary">{step.number.padStart(2, "0")}</span><h3 className="text-2xl">{step.title}</h3></div><p className="mt-2 text-sm text-muted-foreground">{step.note}</p><ul className="mt-4 space-y-2 text-sm">{step.items.map(item => <li key={item}>{item}</li>)}</ul></div>)}</div></section>}
      {category === "coffee" && <section id="coffee"><SectionTitle eyebrow="Hot Drinks" title="Coffee" /><div className="mt-8 max-w-3xl divide-y divide-border">{coffees.filter(([name]) => name?.toLowerCase().includes(query.toLowerCase())).map(([name, price]) => <div key={name} className="flex items-center gap-3 py-5"><Coffee className="size-5 shrink-0 text-secondary" /><h3 className="min-w-0 flex-1 text-xl">{name}</h3><strong className="shrink-0 text-sm">{price}</strong><Button variant="outline" size="icon" aria-label={`${name} hinzufügen`} onClick={() => setSelection({ kind: "product", item: { name: name ?? "", description: "Hot Drink", price: price ?? "", image: "", options: ["Ohne Extra", "Extra Flavor"], optionLabel: "Flavor" } })}><Plus className="size-4" /></Button></div>)}</div><p className="mt-5 text-sm font-medium text-secondary">+ {coffeeExtra.name} für deinen Kaffee · {coffeeExtra.price}</p></section>}
      {products.length > 0 && <section id={category}><SectionTitle eyebrow={category === "matcha" ? "Iced Matcha · 0,3 l & Hot Matcha" : category === "acai" ? "Healthy & Fresh · Jedes Special 11,90 €" : "Frisch für dich"} title={title} /><p className="mt-3 text-muted-foreground">{category === "matcha" ? "Milch nach Wahl: Milk, Oat Milk oder Coconut Milk." : category === "acai" ? "Stell dir deine Açaí Bowl selbst zusammen oder lass dich von unseren Empfehlungen inspirieren. Wahlweise mit Chia oder Granola." : category === "wrap" ? "Dein Chicken Wrap – ganz nach deinem Geschmack." : "Gefüllt mit Ice Cream – der perfekte Abschluss."}</p><div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">{products.filter(matches).map(item => <article key={item.name} className={CARD}><div className={CARD_MEDIA}><ProductImage item={item} /></div><div className={CARD_BODY}><h3 className={CARD_TITLE}>{item.name}</h3>{item.signature && <span className="mt-1 text-xs font-semibold text-secondary sm:mt-2">Signature</span>}<p className={CARD_TEXT}>{item.description}</p><div className={CARD_FOOT}><div className="text-sm"><strong>{item.price}</strong>{item.size && <p className="mt-0.5 text-xs text-muted-foreground">{item.size}</p>}</div><Button size="sm" className="sm:h-9 sm:px-4" onClick={() => setSelection({ kind: "product", item })}>{item.options || item.ingredients || category === "wrap" ? "Auswählen" : "Hinzufügen"}<Plus className="size-4" /></Button></div></div></article>)}</div>{products.filter(matches).length === 0 && <EmptySearch />}</section>}
      <div className="mt-12 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"><p>{menuNotes.pricing} · {menuNotes.nutrition}</p><p>{menuNotes.allergens}</p></div>
    </div>
    {selection && <ItemDialog key={selection.item.name} selection={selection} onClose={() => setSelection(null)} />}
  </main>;
}
function SectionTitle({ eyebrow, title, id }: { eyebrow: string; title: string; id?: string }) { return <div><p className="text-xs font-bold uppercase tracking-widest text-secondary">{eyebrow}</p><h2 id={id} className="mt-2 text-4xl">{title}</h2></div>; }
function EmptySearch() { return <p className="py-10 text-muted-foreground">Keine passenden Gerichte gefunden.</p>; }
function ProductImage({ item }: { item: MenuProduct }) { return item.image ? <img loading="lazy" src={item.image} alt={item.name} className={CARD_IMG} /> : <div className="flex h-full min-h-28 items-center justify-center sm:aspect-[4/3]" aria-hidden="true"><Coffee className="size-10 text-secondary sm:size-16" strokeWidth={1} /></div>; }
// Gerichtskarten: auf dem Handy kompakt mit Bild links, ab Tablet als hohe Karte.
const CARD = "grid grid-cols-[7rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md sm:flex sm:flex-col sm:rounded-lg";
const CARD_MEDIA = "relative bg-muted/50";
const CARD_IMG = "h-full w-full object-contain p-2 sm:aspect-[4/3] sm:h-auto sm:p-5";
const CARD_BODY = "flex min-w-0 flex-1 flex-col p-4 sm:p-5";
const CARD_TITLE = "text-xl leading-tight sm:text-2xl";
const CARD_TEXT = "mt-1.5 line-clamp-2 flex-1 text-sm leading-5 text-muted-foreground sm:mt-3 sm:line-clamp-none sm:leading-6";
const CARD_FOOT = "mt-3 flex items-center justify-between gap-2 sm:mt-4 sm:border-t sm:border-border sm:pt-4";
function ItemDialog({ selection, onClose }: { selection: Selection; onClose: () => void }) {
  const [size, setSize] = useState<"small" | "large">("small");
  const bases = bowlSteps[0]?.items ?? ["Bulgur"];
  const [base, setBase] = useState(bases[0] ?? "Bulgur");
  const [option, setOption] = useState(selection.kind === "product" ? selection.item.options?.[0] ?? "" : "");
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);
  const item = selection.item;
  const price = selection.kind === "bowl" ? parseMenuPrice(selection.item[size]) : parseMenuPrice(selection.item.price) + (option === "Extra Flavor" ? parseMenuPrice(coffeeExtra.price) : 0);
  const nutrition = selection.kind === "bowl" ? selection.item.nutrition[size] : null;
  const detail = selection.kind === "bowl" ? `${size === "small" ? "Klein" : "Groß"} · ${base}` : option || "Standard";
  const add = () => {
    cart.add({ id: `${item.name}-${detail}-${note}`, name: item.name, detail: `${detail}${note ? ` · ${note}` : ""}`, price, qty, image: item.image });
    onClose();
  };
  const chip = (active: boolean) => `rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-secondary"}`;
  const legend = "mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground";

  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="bottom-0 top-auto flex max-h-[92dvh] w-full max-w-none translate-y-0 flex-col gap-0 overflow-hidden rounded-t-3xl border-0 p-0 max-sm:data-[state=open]:slide-in-from-bottom-1/2 sm:bottom-auto sm:top-[50%] sm:max-h-[88vh] sm:max-w-3xl sm:translate-y-[-50%] sm:rounded-2xl [&>button]:z-10 [&>button]:flex [&>button]:size-9 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-card/90 [&>button]:opacity-100 [&>button]:shadow-sm">
      <div className="min-h-0 flex-1 overflow-y-auto sm:grid sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:overflow-hidden">
        {/* Bild */}
        <div className="relative flex items-center justify-center bg-muted/60 px-8 pb-4 pt-10 sm:h-full sm:p-8">
          {item.image ? <img src={item.image} alt={item.name} className="h-44 w-full object-contain drop-shadow-xl sm:h-auto sm:max-h-80" /> : <Coffee className="size-24 text-secondary" strokeWidth={1} aria-hidden="true" />}
          {selection.kind === "bowl" && <Badge className="absolute left-5 top-5">{selection.item.tag}</Badge>}
        </div>
        {/* Auswahl */}
        <div className="flex flex-col gap-6 px-5 pb-6 pt-5 sm:overflow-y-auto sm:px-7 sm:pt-7">
          <DialogHeader className="space-y-2 text-left sm:pr-8">
            <DialogTitle className="font-display text-3xl font-normal leading-tight sm:text-4xl">{item.name}</DialogTitle>
            <DialogDescription className="text-sm leading-6">{item.description}</DialogDescription>
            {selection.kind === "product" && selection.item.price && <p className="text-sm font-semibold text-secondary">{selection.item.price}{selection.item.size ? ` · ${selection.item.size}` : ""}</p>}
          </DialogHeader>

          {selection.kind === "bowl" && <>
            <fieldset><legend className={legend}>Größe</legend><div className="grid grid-cols-2 gap-2">{(["small", "large"] as const).map(value => <button key={value} type="button" aria-pressed={size === value} onClick={() => setSize(value)} className={`flex flex-col items-start rounded-2xl border-2 px-4 py-3 text-left transition-all duration-200 active:scale-[.98] ${size === value ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-secondary/50"}`}><span className="text-sm font-semibold">{value === "small" ? "Klein" : "Groß"}</span><span className="text-sm text-muted-foreground">{selection.item[value]}</span></button>)}</div></fieldset>
            <fieldset><legend className={legend}>Basis</legend><div className="flex flex-wrap gap-2">{bases.map(value => <button key={value} type="button" aria-pressed={base === value} onClick={() => setBase(value)} className={chip(base === value)}>{value}</button>)}</div></fieldset>
          </>}

          {selection.kind === "product" && selection.item.ingredients && <div><p className={legend}>Zutaten</p><ul className="flex flex-wrap gap-2">{selection.item.ingredients.map(ingredient => <li key={ingredient} className="rounded-full bg-muted px-3 py-1.5 text-sm">{ingredient}</li>)}</ul></div>}
          {selection.kind === "product" && selection.item.options && <fieldset><legend className={legend}>{selection.item.optionLabel}</legend><div className="flex flex-wrap gap-2">{selection.item.options.map(value => <button key={value} type="button" aria-pressed={option === value} onClick={() => setOption(value)} className={chip(option === value)}>{value}{value === "Extra Flavor" ? ` + ${coffeeExtra.price}` : ""}</button>)}</div></fieldset>}

          {nutrition && <details className="group rounded-2xl border border-border bg-card px-4 py-3 open:pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold marker:hidden">Nährwerte · {size === "small" ? "Klein" : "Groß"}<span className="text-muted-foreground">{nutrition.k} kcal · {String(nutrition.p).replace(".", ",")} g Protein</span></summary>
            <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-3">{([["Energie", nutrition.k, "kcal"], ["Protein", nutrition.p, "g"], ["Kohlenhydr.", nutrition.c, "g"], ["Fett", nutrition.f, "g"], ["Zucker", nutrition.z, "g"], ["Ballastst.", nutrition.b, "g"]] as const).map(([label, value, unit]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{String(value).replace(".", ",")} {unit}</dd></div>)}</dl>
            <p className="mt-3 text-xs text-muted-foreground">{menuNotes.nutrition}</p>
          </details>}

          <div><Label htmlFor="menu-note" className={legend}>Notiz an die Küche</Label><Textarea id="menu-note" className="mt-2.5 min-h-16 bg-card" placeholder={selection.kind === "bowl" ? "z. B. ohne Zwiebeln" : "z. B. wenig Eis"} value={note} onChange={event => setNote(event.target.value)} /></div>
        </div>
      </div>
      {/* Immer sichtbare Aktionsleiste */}
      <div className="flex items-center gap-3 border-t border-border bg-background/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-7">
        <div className="flex shrink-0 items-center rounded-full border border-border bg-card">
          <button type="button" aria-label="Weniger" disabled={qty === 1} onClick={() => setQty(current => Math.max(1, current - 1))} className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-40"><Minus className="size-4" /></button>
          <span className="w-6 text-center font-semibold tabular-nums" aria-live="polite">{qty}</span>
          <button type="button" aria-label="Mehr" disabled={qty >= 20} onClick={() => setQty(current => Math.min(20, current + 1))} className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-40"><Plus className="size-4" /></button>
        </div>
        <Button className="h-12 min-w-0 flex-1 justify-between rounded-full bg-secondary px-5 text-base font-semibold text-secondary-foreground hover:bg-secondary/90" aria-label={`In den Warenkorb, ${euro(price * qty)}`} onClick={add}>
          <span className="truncate"><span className="sm:hidden">Hinzufügen</span><span className="hidden sm:inline">In den Warenkorb</span></span><span className="shrink-0 tabular-nums">{euro(price * qty)}</span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>;
}
export default OrderPage;
