import { createFileRoute } from "@tanstack/react-router";
import { CirclePause, Clock3, Coffee, Flame, Leaf, Minus, Plus, Search, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OpenBadge, PageHero, RiseTitle } from "@/components/site/brand-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { acais, bowlFilters, bowls, bowlSteps, coffeeExtra, coffees, iceBurgers, matchas, menuCategories, menuNotes, wraps, type Bowl, type BowlFilter, type MenuProduct } from "@/lib/menu-data";
import { COFFEE_OPTIONS, priceOf, type CoffeeOption, type MenuRef } from "@/lib/menu-pricing";
import { track, trackOnce } from "@/lib/analytics";
import { blockedReason, isPaused, isSoldOut, itemKey, optionKey, untilLabel, useAvailability } from "@/lib/availability";
import { cart, euro, useCart } from "@/lib/cart-store";
import { PREP_MINUTES } from "@/lib/pickup-slots";

export const Route = createFileRoute("/speisekarte")({
  head: () => ({ meta: [
    { title: "Speisekarte – Bowls, Matcha & Açaí | Yamiin & Jaiyana's" },
    { name: "description", content: "Die vollständige Speisekarte von Yamiin & Jaiyana's in Hanau: Bowls mit Nährwerten, Bowl-Baukasten, Matcha, Coffee, Açaí, Ice Burger und Wraps." },
    { property: "og:title", content: "Speisekarte | Yamiin & Jaiyana's Hanau" },
    { property: "og:description", content: "Alle Gerichte, Originalbilder, Zutaten und Preise – entdecke deine Lieblings-Bowl und bestelle zur Abholung." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: OrderPage,
});

type Selection = ({ kind: "bowl"; item: Bowl } | { kind: "product"; item: MenuProduct; coffee?: boolean }) & { category: string };
type CategoryId = (typeof menuCategories)[number]["id"];

const productSections: { id: CategoryId; title: string; text: string; items: MenuProduct[] }[] = [
  { id: "matcha", title: "Matcha", text: "Iced Matcha (0,3 l) und Hot Matcha. Milch nach Wahl: Milk, Oat Milk oder Coconut Milk.", items: matchas },
  { id: "acai", title: "Açaí Specials", text: "Jedes Special 11,90 €. Stell dir deine Açaí Bowl selbst zusammen oder lass dich von unseren Empfehlungen inspirieren. Wahlweise mit Chia oder Granola.", items: acais },
  { id: "ice", title: "Peeka Ice Burger", text: "Gefüllt mit Ice Cream – der perfekte Abschluss.", items: iceBurgers },
  { id: "wrap", title: "Wraps", text: "Dein Chicken Wrap – ganz nach deinem Geschmack.", items: wraps },
];

const EASE = "duration-500 ease-[cubic-bezier(.32,.72,0,1)]";
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Abstand von oben, unter dem eine Kategorie als "aktiv" gilt: Header + Kategorieleiste. */
function stickyOffset() {
  const nav = document.querySelector<HTMLElement>("nav[aria-label='Kategorien']");
  return nav ? parseFloat(getComputedStyle(nav).top) + nav.offsetHeight : 0;
}

function OrderPage() {
  const { count } = useCart();
  const availability = useAvailability();
  const soldOut = (name: string) => isSoldOut(availability, itemKey(name));
  const [active, setActive] = useState<CategoryId>("bowls");
  const [filter, setFilter] = useState<BowlFilter>("Alle");
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  // Während des Scrollens nach einem Klick bleibt die Markierung beim Ziel (kein Flackern über Zwischenbereiche).
  const lockUntil = useRef(0);

  const q = query.trim().toLocaleLowerCase("de");
  const matches = (item: { name: string; description: string }) => !q || `${item.name} ${item.description}`.toLocaleLowerCase("de").includes(q);
  const visibleBowls = bowls.filter(item => item.filters.includes(filter) && matches(item));
  const visibleCoffees = coffees.filter(([name]) => matches({ name: name ?? "", description: "Coffee Kaffee Heißgetränk Hot Drink" }));
  const visibleProducts = Object.fromEntries(productSections.map(section => [section.id, section.items.filter(matches)])) as Record<string, MenuProduct[]>;
  const hasItems: Record<CategoryId, boolean> = {
    bowls: visibleBowls.length > 0 || (!q && filter !== "Alle"),
    create: !q,
    coffee: visibleCoffees.length > 0,
    matcha: (visibleProducts["matcha"]?.length ?? 0) > 0,
    acai: (visibleProducts["acai"]?.length ?? 0) > 0,
    ice: (visibleProducts["ice"]?.length ?? 0) > 0,
    wrap: (visibleProducts["wrap"]?.length ?? 0) > 0,
  };
  const categories = menuCategories.filter(item => hasItems[item.id]);
  const categoryKey = categories.map(item => item.id).join();

  const scrollToCategory = (id: CategoryId, smooth = true) => {
    const section = document.getElementById(id);
    if (!section) return;
    setActive(id);
    lockUntil.current = Date.now() + 900;
    const top = section.getBoundingClientRect().top + window.scrollY - stickyOffset() - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto" });
    window.history.replaceState(null, "", `#${id}`);
  };

  // Anonyme Statistik fürs Admin-Dashboard.
  useEffect(() => { track("page_view"); }, []);
  useEffect(() => { trackOnce(`category:${active}`, "category_view", { category: active }); }, [active]);
  useEffect(() => { if (selection) track("item_view", { item: selection.item.name, category: selection.category }); }, [selection]);
  const resultCount = visibleBowls.length + visibleCoffees.length + Object.values(visibleProducts).reduce((sum, list) => sum + list.length, 0);
  useEffect(() => {
    if (q.length < 2) return;
    const timeout = setTimeout(() => track("search", { query: q, qty: resultCount }), 1200);
    return () => clearTimeout(timeout);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sprunglinks (#matcha …) von der Startseite und aus der Adresszeile.
  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.slice(1);
      if (menuCategories.some(item => item.id === hash)) requestAnimationFrame(() => scrollToCategory(hash as CategoryId, false));
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  // Scroll-Spy: welche Kategorie liegt gerade oben unter der Leiste?
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (Date.now() < lockUntil.current) return;
      const line = stickyOffset() + 48;
      let current: CategoryId | null = null;
      for (const item of menuCategories) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= line) current = item.id;
      }
      // Ganz unten angekommen: letzte Kategorie markieren, auch wenn sie kurz ist.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        const last = [...menuCategories].reverse().find(item => document.getElementById(item.id));
        if (last) current = last.id;
      }
      const first = menuCategories.find(item => document.getElementById(item.id));
      setActive(current ?? first?.id ?? "bowls");
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, [categoryKey]);

  // Markierung unter den aktiven Button schieben und Leiste mitscrollen (Handy).
  useEffect(() => {
    const rail = railRef.current;
    const button = rail?.querySelector<HTMLElement>(`[data-category="${active}"]`);
    if (!rail || !button) { setIndicator(null); return; }
    setIndicator({ left: button.offsetLeft, width: button.offsetWidth });
    const target = button.offsetLeft - (rail.clientWidth - button.offsetWidth) / 2;
    rail.scrollTo({ left: Math.max(0, target), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [active, categoryKey]);
  useEffect(() => {
    const onResize = () => {
      const button = railRef.current?.querySelector<HTMLElement>(`[data-category="${active}"]`);
      if (button) setIndicator({ left: button.offsetLeft, width: button.offsetWidth });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  const productCard = (item: MenuProduct, id: CategoryId) => <article key={item.name} className={`${CARD} ${soldOut(item.name) ? SOLD_OUT_CARD : ""}`}><div className={CARD_MEDIA}><ProductImage item={item} />{soldOut(item.name) && <SoldOutBadge />}</div><div className={CARD_BODY}><h3 className={CARD_TITLE}>{item.name}</h3>{item.signature && <span className="mt-1 text-xs font-semibold text-secondary sm:mt-2">Signature</span>}<p className={CARD_TEXT}>{item.description}</p><div className={CARD_FOOT}><div className="text-sm"><strong>{item.price}</strong>{item.size && <p className="mt-0.5 text-xs text-muted-foreground">{item.size}</p>}</div>{soldOut(item.name) ? <Button size="sm" variant="outline" disabled className="rounded-full sm:h-10 sm:px-4">Ausverkauft</Button> : <Button size="sm" className="rounded-full transition-colors group-hover:bg-[#c46b38] sm:h-10 sm:px-5" onClick={() => setSelection({ kind: "product", item, category: id })}>{item.options || item.ingredients || id === "wrap" ? "Auswählen" : "Hinzufügen"}<Plus className="size-4" /></Button>}</div></div></article>;

  const sections: Record<CategoryId, () => React.ReactNode> = {
    bowls: () => <><SectionTitle title="Wähle deine Bowl" /><p className="mt-3 text-muted-foreground">Jede Bowl mit Base nach Wahl: Bulgur, Somalireis oder Salat.</p><div className="my-6 flex flex-wrap gap-2" aria-label="Bowl-Filter">{bowlFilters.map(item => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} aria-pressed={filter === item} onClick={() => setFilter(item)} className="h-9 rounded-full px-4">{item}</Button>)}</div><div className="grid gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">{visibleBowls.map(item => <article key={item.name} className={`${CARD} ${soldOut(item.name) ? SOLD_OUT_CARD : ""}`}><div className={CARD_MEDIA}><Badge className="absolute left-2 top-2 z-10 rounded-full bg-[#292725] px-2 text-[10px] text-[#f5f0e8] hover:bg-[#292725] sm:left-4 sm:top-4 sm:px-3 sm:text-xs">{item.tag}</Badge><img loading="lazy" src={item.image} alt={item.name} className={CARD_IMG} />{soldOut(item.name) && <SoldOutBadge />}</div><div className={CARD_BODY}><h3 className={CARD_TITLE}>{item.name}</h3><p className={CARD_TEXT}>{item.description}</p><p className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#f5c3a6]/35 px-2.5 py-1 text-xs font-semibold text-[#8a4a22] sm:mt-4"><Flame className="size-3.5" />Protein {item.protein}</p><div className={CARD_FOOT}><div className="text-sm"><p className="sm:hidden">ab <strong>{item.small}</strong></p><div className="hidden sm:block"><p>Klein <strong>{item.small}</strong></p><p className="mt-1">Groß <strong>{item.large}</strong></p></div></div>{soldOut(item.name) ? <Button size="sm" variant="outline" disabled className="rounded-full sm:h-10 sm:px-4">Ausverkauft</Button> : <Button size="sm" className="rounded-full transition-colors group-hover:bg-[#c46b38] sm:h-10 sm:px-5" onClick={() => setSelection({ kind: "bowl", item, category: "bowls" })}>Auswählen</Button>}</div></div></article>)}</div>{visibleBowls.length === 0 && <EmptySearch />}</>,
    create: () => <div className="rounded-[2rem] bg-primary p-6 text-primary-foreground sm:p-10">
      <div><h2 className="text-5xl leading-[0.95] sm:text-6xl">Bowl selbst bauen</h2></div>
      <p className="mt-4 max-w-2xl leading-7 text-white/75">{menuNotes.create}</p>
      <ol className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">{bowlSteps.map(step => <li key={step.number} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors duration-300 hover:border-[#f5c3a6]/40 hover:bg-white/10"><div className="flex items-baseline gap-3"><span className="font-display text-4xl text-[#f5c3a6]">{step.number}</span><h3 className="text-2xl">{step.title}</h3></div><p className="mt-1 text-sm text-white/60">{step.note}</p><ul className="mt-4 flex flex-wrap gap-1.5">{step.items.map(item => <li key={item} className="rounded-full bg-white/10 px-3 py-1 text-sm">{item}</li>)}</ul></li>)}</ol>
    </div>,
    coffee: () => <><SectionTitle title="Coffee" /><div className="mt-8 max-w-3xl divide-y divide-border rounded-3xl border border-border bg-card px-4 sm:px-7">{visibleCoffees.map(([name, price]) => <div key={name} className="flex items-center gap-3 py-4 sm:py-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f5c3a6]/35 text-[#8a4a22]"><Coffee className="size-5" /></span><h3 className={`min-w-0 flex-1 text-xl ${soldOut(name ?? "") ? "text-muted-foreground line-through" : ""}`}>{name}</h3>{soldOut(name ?? "") && <span className={SOLD_OUT_PILL}>Ausverkauft</span>}<strong className="shrink-0 text-sm">{price}</strong><Button variant="outline" size="icon" className="rounded-full hover:border-[#c46b38] hover:bg-[#c46b38] hover:text-white" disabled={soldOut(name ?? "")} aria-label={soldOut(name ?? "") ? `${name} ausverkauft` : `${name} hinzufügen`} onClick={() => setSelection({ kind: "product", coffee: true, category: "coffee", item: { name: name ?? "", description: "Heißgetränk", price: price ?? "", image: "", options: COFFEE_OPTIONS, optionLabel: "Geschmack" } })}><Plus className="size-4" /></Button></div>)}</div><p className="mt-5 text-sm font-medium text-secondary">+ {coffeeExtra.name} für deinen Kaffee: {coffeeExtra.price}</p></>,
    matcha: () => null, acai: () => null, ice: () => null, wrap: () => null,
  };
  for (const section of productSections) {
    sections[section.id] = () => <><SectionTitle title={section.title} /><p className="mt-3 text-muted-foreground">{section.text}</p><div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">{(visibleProducts[section.id] ?? []).map(item => productCard(item, section.id))}</div></>;
  }

  const pausedBanner = isPaused(availability) && <p role="status" className="hero-rise mt-6 flex max-w-2xl gap-3 rounded-2xl bg-[#fbe9e4] px-4 py-3 text-sm text-[#8f3222]"><CirclePause className="mt-0.5 size-5 shrink-0" /><span><strong className="block">Online-Bestellungen sind gerade pausiert{untilLabel(availability.pausedUntil) === "bis auf Weiteres" ? "" : ` ${untilLabel(availability.pausedUntil)}`}.</strong>{availability.pauseNote || "Du kannst dir trotzdem schon etwas aussuchen – bestellen geht, sobald wir wieder öffnen."}</span></p>;

  return <main className="min-h-screen bg-background text-foreground">
    <PageHero aside={<HeroBowls />}>
      <OpenBadge className="mb-6" />
      <RiseTitle lead="Unsere" accent="Speisekarte." plain className="text-6xl sm:text-7xl lg:text-8xl" />
      <p className="hero-rise mt-5 max-w-lg text-base leading-7 text-white/80 sm:text-lg" style={{ animationDelay: "380ms" }}>Bowls, Matcha, Coffee, Açaí und Süßes – frisch zubereitet, mit Nährwerten zu jeder Bowl.</p>
      {pausedBanner}
      <div className="hero-rise mt-7 flex max-w-xl flex-wrap items-center gap-3" style={{ animationDelay: "480ms" }}>
        <div className="relative min-w-0 flex-1 basis-64"><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/60" /><Input type="search" aria-label="Gerichte suchen" placeholder="Ganze Speisekarte durchsuchen" value={query} onChange={event => setQuery(event.target.value)} className="h-12 rounded-full border-white/20 bg-white/10 pl-11 text-base text-white backdrop-blur-md placeholder:text-white/55 focus-visible:ring-[#f5c3a6]" /></div>
        <Button variant="outline" onClick={() => cart.openDrawer()} className="h-12 gap-2 rounded-full border-white/20 bg-white/10 px-5 text-[#f5f0e8] backdrop-blur-md hover:bg-white/20 hover:text-white"><ShoppingBag className="size-4" />Warenkorb <span className="rounded-full bg-[#c46b38] px-2 py-0.5 text-xs font-bold text-white">{count}</span></Button>
      </div>
      <ul className="hero-rise mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75" style={{ animationDelay: "580ms" }}>
        <li className="flex items-center gap-2"><Clock3 className="size-4 text-[#f5c3a6]" />Abholbereit in ca. {PREP_MINUTES.pickup} Min</li>
        <li className="flex items-center gap-2"><Flame className="size-4 text-[#f5c3a6]" />Nährwerte zu jeder Bowl</li>
        <li className="flex items-center gap-2"><Leaf className="size-4 text-[#f5c3a6]" />Vegane Optionen</li>
      </ul>
    </PageHero>
    <nav aria-label="Kategorien" className="sticky top-[4.5rem] z-30 border-y border-border bg-background/95 backdrop-blur-md sm:top-20">
      <div ref={railRef} className="relative mx-auto flex max-w-[90rem] gap-1 overflow-x-auto px-5 py-3 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
        {/* Gleitende Markierung der aktiven Kategorie */}
        <span aria-hidden="true" className={`pointer-events-none absolute bottom-3 left-0 top-3 rounded-full bg-foreground shadow-sm transition-[transform,width,opacity] ${EASE} ${indicator ? "opacity-100" : "opacity-0"}`} style={indicator ? { width: indicator.width, transform: `translateX(${indicator.left}px)` } : undefined} />
        {categories.map(item => {
          const isActive = active === item.id;
          return <button key={item.id} type="button" data-category={item.id} aria-current={isActive ? "true" : undefined} onClick={() => scrollToCategory(item.id)} className={`relative z-10 h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "text-background" : "text-foreground/70 hover:bg-muted hover:text-foreground"}`}>{item.label}</button>;
        })}
      </div>
    </nav>
    <div className="mx-auto max-w-[90rem] px-5 pb-36 sm:px-8">
      {categories.map((item, index) => <section key={item.id} id={item.id} aria-label={item.label} className={`scroll-mt-40 ${index === 0 ? "pt-10" : "mt-16 border-t border-border pt-12 sm:mt-24 sm:pt-16"}`}>{sections[item.id]()}</section>)}
      {categories.length === 0 && <div className="pt-10"><EmptySearch /><Button variant="outline" onClick={() => setQuery("")}>Suche zurücksetzen</Button></div>}
      <div className="mt-16 rounded-3xl border border-border bg-muted px-5 py-5 text-xs leading-6 text-muted-foreground sm:px-7"><p>{menuNotes.pricing} {menuNotes.nutrition}</p><p>{menuNotes.allergens}</p></div>
    </div>
    {selection && <ItemDialog key={selection.item.name} selection={selection} onClose={() => setSelection(null)} />}
  </main>;
}
function SectionTitle({ title, id }: { title: string; id?: string }) { return <div><h2 id={id} className="text-5xl leading-[0.95] sm:text-6xl">{title}</h2></div>; }
/** Bowls neben der Überschrift (nur große Bildschirme). */
function HeroBowls() {
  const [main, left, right] = [bowls[0], bowls[4], bowls[3]];
  return <div className="relative hidden h-[24rem] lg:block" aria-hidden="true">
    {main && <div className="absolute right-12 top-0 size-72 rounded-full bg-[radial-gradient(circle_at_50%_40%,#fff_0%,#f1e8dc_72%)] p-6 shadow-2xl shadow-black/40 ring-1 ring-white/20"><img src={main.image} alt="" className="size-full object-contain drop-shadow-xl" /><span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#292725] px-4 py-2 text-sm font-semibold text-[#f5f0e8] ring-1 ring-white/15">{main.name}, ab {main.small}</span></div>}
    {left && <div className="absolute bottom-0 left-4 size-44 rounded-full bg-[radial-gradient(circle_at_50%_40%,#fff_0%,#f1e8dc_72%)] p-4 shadow-2xl shadow-black/40 ring-1 ring-white/20"><img src={left.image} alt="" className="size-full object-contain drop-shadow-xl" /></div>}
    {right && <div className="absolute left-20 top-2 size-32 rounded-full bg-[radial-gradient(circle_at_50%_40%,#fff_0%,#f1e8dc_72%)] p-3 shadow-2xl shadow-black/40 ring-1 ring-white/20"><img src={right.image} alt="" className="size-full object-contain drop-shadow-xl" /></div>}
  </div>;
}
function SoldOutBadge() { return <span className={`absolute bottom-2 left-2 sm:bottom-4 sm:left-4 ${SOLD_OUT_PILL}`}>Ausverkauft</span>; }
function EmptySearch() { return <p className="py-10 text-muted-foreground">Keine passenden Gerichte gefunden.</p>; }
function ProductImage({ item }: { item: MenuProduct }) { return item.image ? <img loading="lazy" src={item.image} alt={item.name} className={CARD_IMG} /> : <div className="flex h-full min-h-28 items-center justify-center sm:aspect-[4/3]" aria-hidden="true"><Coffee className="size-10 text-secondary sm:size-16" strokeWidth={1} /></div>; }
// Gerichtskarten: auf dem Handy kompakt mit Bild links, ab Tablet als hohe Karte.
const CARD = "group grid grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-secondary sm:flex sm:flex-col";
const CARD_MEDIA = "relative overflow-hidden bg-[radial-gradient(circle_at_50%_60%,#fff_0%,#f1e8dc_78%)]";
const SOLD_OUT_CARD = "opacity-60 hover:border-border [&_img]:grayscale";
const SOLD_OUT_PILL = "shrink-0 rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background";
const CARD_IMG = "h-full w-full object-contain p-2 drop-shadow-lg transition duration-500 group-hover:scale-105 sm:aspect-[4/3] sm:h-auto sm:p-5";
const CARD_BODY = "flex min-w-0 flex-1 flex-col p-4 sm:p-5";
const CARD_TITLE = "text-xl leading-tight sm:text-3xl";
const CARD_TEXT = "mt-1.5 line-clamp-2 flex-1 text-sm leading-5 text-muted-foreground sm:mt-3 sm:line-clamp-none sm:leading-6";
const CARD_FOOT = "mt-3 flex items-center justify-between gap-2 sm:mt-4 sm:border-t sm:border-border sm:pt-4";
function ItemDialog({ selection, onClose }: { selection: Selection; onClose: () => void }) {
  const availability = useAvailability();
  const optionOut = (value: string) => isSoldOut(availability, optionKey(value));
  const [size, setSize] = useState<"small" | "large">("small");
  const bases = bowlSteps[0]?.items ?? ["Bulgur"];
  // Vorauswahl: erste Basis/Option, die gerade nicht ausverkauft ist.
  const [base, setBase] = useState(() => bases.find(value => !optionOut(value)) ?? bases[0] ?? "Bulgur");
  const [option, setOption] = useState(() => selection.kind === "product" ? selection.item.options?.find(value => !optionOut(value)) ?? selection.item.options?.[0] ?? "" : "");
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);
  const item = selection.item;
  const ref: MenuRef = selection.kind === "bowl"
    ? { kind: "bowl", name: item.name, size, base }
    : selection.coffee
      ? { kind: "coffee", name: item.name, option: option as CoffeeOption }
      : { kind: "product", name: item.name, ...(option ? { option } : {}) };
  // Derselbe Rechenweg wie auf dem Server (menu-pricing.ts) – Anzeige und Abbuchung stimmen überein.
  const price = (priceOf(ref) ?? 0) / 100;
  const nutrition = selection.kind === "bowl" ? selection.item.nutrition[size] : null;
  const blocked = blockedReason(availability, ref);
  const detail = selection.kind === "bowl" ? `${size === "small" ? "Klein" : "Groß"} · ${base}` : option || "Standard";
  const add = () => {
    if (blocked) return;
    const trimmed = note.trim();
    track("add_to_cart", { item: item.name, category: selection.category, variant: detail, qty, value: price * qty });
    cart.add({ id: `${item.name}-${detail}-${trimmed}`, name: item.name, detail: `${detail}${trimmed ? ` · ${trimmed}` : ""}`, price, qty, image: item.image, ref, ...(trimmed ? { note: trimmed } : {}) });
    onClose();
  };
  const chip = (active: boolean) => `rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 disabled:line-through disabled:active:scale-100 ${active ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-secondary"}`;
  const legend = "mb-2.5 text-sm font-semibold";

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
            {selection.kind === "product" && selection.item.price && <p className="text-sm font-semibold text-secondary">{selection.item.price}{selection.item.size ? <span className="ml-2 font-normal text-muted-foreground">{selection.item.size}</span> : null}</p>}
          </DialogHeader>

          {selection.kind === "bowl" && <>
            <fieldset><legend className={legend}>Größe</legend><div className="grid grid-cols-2 gap-2">{(["small", "large"] as const).map(value => <button key={value} type="button" aria-pressed={size === value} onClick={() => setSize(value)} className={`flex flex-col items-start rounded-2xl border-2 px-4 py-3 text-left transition-all duration-200 active:scale-[.98] ${size === value ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-secondary/50"}`}><span className="text-sm font-semibold">{value === "small" ? "Klein" : "Groß"}</span><span className="text-sm text-muted-foreground">{selection.item[value]}</span></button>)}</div></fieldset>
            <fieldset><legend className={legend}>Basis</legend><div className="flex flex-wrap gap-2">{bases.map(value => <button key={value} type="button" aria-pressed={base === value} disabled={optionOut(value)} onClick={() => setBase(value)} className={chip(base === value)}>{value}{optionOut(value) && " (ausverkauft)"}</button>)}</div></fieldset>
          </>}

          {selection.kind === "product" && selection.item.ingredients && <div><p className={legend}>Zutaten</p><ul className="flex flex-wrap gap-2">{selection.item.ingredients.map(ingredient => <li key={ingredient} className="rounded-full bg-muted px-3 py-1.5 text-sm">{ingredient}</li>)}</ul></div>}
          {selection.kind === "product" && selection.item.options && <fieldset><legend className={legend}>{selection.item.optionLabel}</legend><div className="flex flex-wrap gap-2">{selection.item.options.map(value => <button key={value} type="button" aria-pressed={option === value} disabled={optionOut(value)} onClick={() => setOption(value)} className={chip(option === value)}>{value}{value === "Extra Flavor" ? ` + ${coffeeExtra.price}` : ""}{optionOut(value) && " (ausverkauft)"}</button>)}</div></fieldset>}

          {nutrition && <details className="group rounded-2xl border border-border bg-card px-4 py-3 open:pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold marker:hidden">Nährwerte ({size === "small" ? "Klein" : "Groß"})<span className="text-muted-foreground">{nutrition.k} kcal, {String(nutrition.p).replace(".", ",")} g Protein</span></summary>
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
        {blocked ? <Button disabled className="h-12 min-w-0 flex-1 rounded-full text-base font-semibold first-letter:uppercase">{blocked === "ausverkauft" ? "Ausverkauft" : blocked}</Button> : <Button className="h-12 min-w-0 flex-1 justify-between rounded-full bg-secondary px-5 text-base font-semibold text-secondary-foreground hover:bg-secondary/90" aria-label={`In den Warenkorb, ${euro(price * qty)}`} onClick={add}>
          <span className="truncate"><span className="sm:hidden">Hinzufügen</span><span className="hidden sm:inline">In den Warenkorb</span></span><span className="shrink-0 tabular-nums">{euro(price * qty)}</span>
        </Button>}
      </div>
    </DialogContent>
  </Dialog>;
}
export default OrderPage;
