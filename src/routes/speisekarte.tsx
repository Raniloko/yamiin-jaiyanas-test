import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Coffee, Minus, Plus, Search, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
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
    <nav aria-label="Kategorien" className="sticky top-[4.5rem] z-30 border-y border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-8">{menuCategories.map(item => <Button key={item.id} variant={category === item.id ? "default" : "outline"} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setQuery(""); window.history.replaceState(null, "", `#${item.id}`); }} className="shrink-0">{item.label}</Button>)}</div>
    </nav>
    <div className="mx-auto max-w-7xl px-5 pb-36 pt-8 sm:px-8">
      {category !== "create" && <div className="relative mb-8 max-w-md"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Gerichte suchen" placeholder="Gerichte oder Zutaten suchen" value={query} onChange={event => setQuery(event.target.value)} className="bg-card pl-10" /></div>}
      {category === "bowls" && <section id="bowls" aria-labelledby="bowls-title"><SectionTitle id="bowls-title" eyebrow="Signature Bowls" title="Wähle deine Bowl" /><p className="mt-3 text-muted-foreground">Jede Bowl mit Base nach Wahl: Bulgur, Somalireis oder Salat.</p><div className="my-6 flex flex-wrap gap-2" aria-label="Bowl-Filter">{bowlFilters.map(item => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</Button>)}</div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visibleBowls.map(item => <article key={item.name} className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"><div className="relative bg-muted/50"><Badge className="absolute left-4 top-4">{item.tag}</Badge><img loading="lazy" src={item.image} alt={item.name} className="aspect-[4/3] w-full object-contain p-5" /></div><div className="flex flex-1 flex-col p-5"><h3 className="text-2xl">{item.name}</h3><p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{item.description}</p><p className="mt-4 text-xs font-semibold text-secondary">Protein · {item.protein}</p><div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4"><div className="text-sm"><p>Klein <strong>{item.small}</strong></p><p className="mt-1">Groß <strong>{item.large}</strong></p></div><Button onClick={() => setSelection({ kind: "bowl", item })}>Auswählen <ArrowRight className="size-4" /></Button></div></div></article>)}</div>{visibleBowls.length === 0 && <EmptySearch />}</section>}
      {category === "create" && <section id="create"><SectionTitle eyebrow="Taste the Bowl-volution" title="Create your Bowl" /><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{menuNotes.create}</p><div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">{bowlSteps.map(step => <div key={step.number} className="border-t border-border pt-5"><div className="flex items-baseline gap-3"><span className="font-display text-4xl text-secondary">{step.number.padStart(2, "0")}</span><h3 className="text-2xl">{step.title}</h3></div><p className="mt-2 text-sm text-muted-foreground">{step.note}</p><ul className="mt-4 space-y-2 text-sm">{step.items.map(item => <li key={item}>{item}</li>)}</ul></div>)}</div></section>}
      {category === "coffee" && <section id="coffee"><SectionTitle eyebrow="Hot Drinks" title="Coffee" /><div className="mt-8 max-w-3xl divide-y divide-border">{coffees.filter(([name]) => name?.toLowerCase().includes(query.toLowerCase())).map(([name, price]) => <div key={name} className="flex items-center gap-3 py-5"><Coffee className="size-5 shrink-0 text-secondary" /><h3 className="min-w-0 flex-1 text-xl">{name}</h3><strong className="shrink-0 text-sm">{price}</strong><Button variant="outline" size="icon" aria-label={`${name} hinzufügen`} onClick={() => setSelection({ kind: "product", item: { name: name ?? "", description: "Hot Drink", price: price ?? "", image: "", options: ["Ohne Extra", "Extra Flavor"], optionLabel: "Flavor" } })}><Plus className="size-4" /></Button></div>)}</div><p className="mt-5 text-sm font-medium text-secondary">+ {coffeeExtra.name} für deinen Kaffee · {coffeeExtra.price}</p></section>}
      {products.length > 0 && <section id={category}><SectionTitle eyebrow={category === "matcha" ? "Iced Matcha · 0,3 l & Hot Matcha" : category === "acai" ? "Healthy & Fresh · Jedes Special 11,90 €" : "Frisch für dich"} title={title} /><p className="mt-3 text-muted-foreground">{category === "matcha" ? "Milch nach Wahl: Milk, Oat Milk oder Coconut Milk." : category === "acai" ? "Stell dir deine Açaí Bowl selbst zusammen oder lass dich von unseren Empfehlungen inspirieren. Wahlweise mit Chia oder Granola." : category === "wrap" ? "Dein Chicken Wrap – ganz nach deinem Geschmack." : "Gefüllt mit Ice Cream – der perfekte Abschluss."}</p><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.filter(matches).map(item => <article key={item.name} className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"><ProductImage item={item} /><div className="flex flex-1 flex-col p-5"><h3 className="text-2xl">{item.name}</h3>{item.signature && <span className="mt-2 text-xs font-semibold text-secondary">Signature</span>}<p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{item.description}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4"><div><strong>{item.price}</strong>{item.size && <p className="mt-1 text-xs text-muted-foreground">{item.size}</p>}</div><Button onClick={() => setSelection({ kind: "product", item })}>{item.options || item.ingredients || category === "wrap" ? "Auswählen" : "Hinzufügen"}<Plus className="size-4" /></Button></div></div></article>)}</div>{products.filter(matches).length === 0 && <EmptySearch />}</section>}
      <div className="mt-12 border-t border-border pt-6 text-xs leading-6 text-muted-foreground"><p>{menuNotes.pricing} · {menuNotes.nutrition}</p><p>{menuNotes.allergens}</p></div>
    </div>
    {selection && <ItemDialog key={selection.item.name} selection={selection} onClose={() => setSelection(null)} />}
  </main>;
}
function SectionTitle({ eyebrow, title, id }: { eyebrow: string; title: string; id?: string }) { return <div><p className="text-xs font-bold uppercase tracking-widest text-secondary">{eyebrow}</p><h2 id={id} className="mt-2 text-4xl">{title}</h2></div>; }
function EmptySearch() { return <p className="py-10 text-muted-foreground">Keine passenden Gerichte gefunden.</p>; }
function ProductImage({ item }: { item: MenuProduct }) { return item.image ? <img loading="lazy" src={item.image} alt={item.name} className="aspect-[4/3] w-full bg-muted/50 object-contain p-5" /> : <div className="flex aspect-[4/3] items-center justify-center bg-muted/50" aria-hidden="true"><Coffee className="size-16 text-secondary" strokeWidth={1} /></div>; }
function ItemDialog({ selection, onClose }: { selection: Selection; onClose: () => void }) {
  const [size, setSize] = useState<"small" | "large">("small");
  const [base, setBase] = useState(bowlSteps[0]?.items[0] ?? "Bulgur");
  const [option, setOption] = useState(selection.kind === "product" ? selection.item.options?.[0] ?? "" : "");
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);
  const item = selection.item;
  const price = selection.kind === "bowl" ? parseMenuPrice(selection.item[size]) : parseMenuPrice(selection.item.price) + (option === "Extra Flavor" ? parseMenuPrice(coffeeExtra.price) : 0);
  const nutrition = selection.kind === "bowl" ? selection.item.nutrition[size] : null;
  const detail = selection.kind === "bowl" ? `${size === "small" ? "Klein" : "Groß"} · ${base}` : option || "Standard";
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle className="font-display text-3xl">{item.name}</DialogTitle><DialogDescription>{item.description}</DialogDescription></DialogHeader>{item.image && <img src={item.image} alt={item.name} className="mx-auto h-44 w-full bg-muted/40 object-contain" />}
    {selection.kind === "bowl" && <><fieldset><legend className="mb-2 text-sm font-semibold">Größe</legend><div className="grid grid-cols-2 gap-2">{(["small", "large"] as const).map(value => <Button key={value} variant={size === value ? "default" : "outline"} aria-pressed={size === value} onClick={() => setSize(value)}>{value === "small" ? "Klein" : "Groß"} · {selection.item[value]}</Button>)}</div></fieldset><div><Label htmlFor="bowl-base">Basis</Label><select id="bowl-base" value={base} onChange={event => setBase(event.target.value)} className="mt-2 w-full rounded-md border border-input bg-background p-3">{bowlSteps[0]?.items.map(value => <option key={value}>{value}</option>)}</select></div></>}
    {selection.kind === "product" && selection.item.ingredients && <div><h3 className="text-xl">Zutaten</h3><ul className="mt-3 flex flex-wrap gap-2">{selection.item.ingredients.map(ingredient => <li key={ingredient} className="rounded-md bg-muted px-3 py-1.5 text-sm">{ingredient}</li>)}</ul></div>}
    {selection.kind === "product" && selection.item.options && <fieldset><legend className="mb-2 text-sm font-semibold">{selection.item.optionLabel}</legend><div className="flex flex-wrap gap-2">{selection.item.options.map(value => <Button key={value} variant={option === value ? "default" : "outline"} aria-pressed={option === value} onClick={() => setOption(value)}>{value}{value === "Extra Flavor" ? ` + ${coffeeExtra.price}` : ""}</Button>)}</div></fieldset>}
    {nutrition && <div className="border-y border-border py-4"><h3 className="text-xl">Nährwerte · {size === "small" ? "Klein" : "Groß"}</h3><dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{([["Energie", nutrition.k, "kcal"], ["Protein", nutrition.p, "g"], ["Kohlenhydrate", nutrition.c, "g"], ["Fett", nutrition.f, "g"], ["davon Zucker", nutrition.z, "g"], ["Ballaststoffe", nutrition.b, "g"]] as const).map(([label, value, unit]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{String(value).replace(".", ",")} {unit}</dd></div>)}</dl><p className="mt-3 text-xs text-muted-foreground">{menuNotes.nutrition}</p></div>}
    <div><Label htmlFor="menu-note">Notiz an die Küche</Label><Textarea id="menu-note" className="mt-2" placeholder="z. B. ohne Zwiebeln" value={note} onChange={event => setNote(event.target.value)} /></div><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Button variant="outline" size="icon" aria-label="Weniger" disabled={qty === 1} onClick={() => setQty(current => Math.max(1, current - 1))}><Minus className="size-4" /></Button><span className="w-6 text-center tabular-nums">{qty}</span><Button variant="outline" size="icon" aria-label="Mehr" onClick={() => setQty(current => current + 1)}><Plus className="size-4" /></Button></div><Button className="min-w-0 bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => { cart.add({ id: `${item.name}-${detail}-${note}`, name: item.name, detail: `${detail}${note ? ` · ${note}` : ""}`, price, qty, image: item.image }); onClose(); }}>In den Warenkorb · {euro(price * qty)}</Button></div>
  </DialogContent></Dialog>;
}
export default OrderPage;
