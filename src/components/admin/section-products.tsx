import { ArrowDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { AdminData } from "@/lib/admin-data";
import { formatEuro, formatNumber, formatPercent, productStats, variantStats, type ProductStat } from "@/lib/admin-metrics";
import { menuCategories } from "@/lib/menu-data";
import { scopeOrders } from "./scope";
import { Chip, EmptyState, MeterRow, Panel, SERIES } from "./ui";

type SortKey = "revenue" | "sold" | "views" | "addRate" | "name";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "revenue", label: "Umsatz" },
  { key: "sold", label: "Verkauft" },
  { key: "views", label: "Aufrufe" },
  { key: "addRate", label: "Warenkorb-Quote" },
  { key: "name", label: "Name" },
];

const compare = (key: SortKey) => (a: ProductStat, b: ProductStat) =>
  key === "name" ? a.name.localeCompare(b.name, "de") : key === "addRate" ? (b.addRate ?? -1) - (a.addRate ?? -1) : b[key] - a[key];

export function ProductsSection({ data }: { data: AdminData }) {
  const { current } = scopeOrders(data);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("revenue");
  const [query, setQuery] = useState("");
  const [allMobile, setAllMobile] = useState(false);
  const stats = useMemo(() => productStats(current, data.analytics.items), [current, data.analytics.items]);
  const categories = menuCategories.filter((entry) => entry.id !== "create" && stats.some((stat) => stat.category === entry.id));
  const q = query.trim().toLocaleLowerCase("de");
  const rows = stats
    .filter((stat) => (category === "all" || stat.category === category) && (!q || stat.name.toLocaleLowerCase("de").includes(q)))
    .sort(compare(sort));
  const totals = rows.reduce((sum, stat) => ({ sold: sum.sold + stat.sold, revenue: sum.revenue + stat.revenue }), { sold: 0, revenue: 0 });
  const variants = variantStats(current);
  const neverSold = stats.filter((stat) => stat.sold === 0 && stat.category !== "other").length;
  // Oft geöffnet, aber selten in den Warenkorb – Kandidaten für bessere Fotos/Beschreibung oder Preis.
  const hesitant = stats.filter((stat) => stat.views >= 5 && (stat.addRate ?? 0) < 0.2).sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Gerichte auf der Karte" value={formatNumber(stats.filter((stat) => stat.category !== "other").length)} />
        <Kpi label="Verkauft (Stück)" value={formatNumber(stats.reduce((sum, stat) => sum + stat.sold, 0))} />
        <Kpi label="Ohne Verkauf im Zeitraum" value={formatNumber(neverSold)} />
        <Kpi label="Ø Warenkorb-Quote" value={averageRate(stats)} />
      </div>

      <Panel title="Alle Produkte" subtitle="Aufrufe & Warenkorb aus der Speisekarte, Verkäufe aus bezahlten Bestellungen">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            <Chip active={category === "all"} onClick={() => setCategory("all")}>Alle</Chip>
            {categories.map((entry) => <Chip key={entry.id} active={category === entry.id} onClick={() => setCategory(entry.id)}>{entry.label}</Chip>)}
            {stats.some((stat) => stat.category === "other") && <Chip active={category === "other"} onClick={() => setCategory("other")}>Nicht mehr auf der Karte</Chip>}
          </div>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1 lg:w-56 lg:flex-none">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
              <Input type="search" aria-label="Produkte suchen" placeholder="Suchen" value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 bg-background pl-8" />
            </div>
            <label className="sr-only" htmlFor="product-sort">Sortieren nach</label>
            <select id="product-sort" value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              {SORTS.map((entry) => <option key={entry.key} value={entry.key}>↓ {entry.label}</option>)}
            </select>
          </div>
        </div>

        {rows.length === 0 ? <EmptyState>Keine Produkte gefunden.</EmptyState> : (
          <>
            {/* Tablet & Desktop: Tabelle */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Produkt</th>
                    <Th label="Aufrufe" active={sort === "views"} onClick={() => setSort("views")} />
                    <th className="px-3 py-2 text-right font-medium">Warenkorb</th>
                    <Th label="Quote" active={sort === "addRate"} onClick={() => setSort("addRate")} />
                    <Th label="Verkauft" active={sort === "sold"} onClick={() => setSort("sold")} />
                    <Th label="Umsatz" active={sort === "revenue"} onClick={() => setSort("revenue")} />
                    <th className="w-32 py-2 pl-3 font-medium"><span className="sr-only">Anteil</span></th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {rows.map((stat) => (
                    <tr key={stat.name} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="py-2.5 pr-3"><p className="font-medium">{stat.name}</p><p className="text-xs text-muted-foreground">{stat.categoryLabel}</p></td>
                      <td className="px-3 text-right">{formatNumber(stat.views)}</td>
                      <td className="px-3 text-right">{formatNumber(stat.added)}{stat.removed > 0 && <span className="ml-1 text-xs text-muted-foreground">−{stat.removed}</span>}</td>
                      <td className="px-3 text-right">{stat.addRate === null ? "–" : formatPercent(stat.addRate)}</td>
                      <td className="px-3 text-right font-semibold">{formatNumber(stat.sold)}</td>
                      <td className="px-3 text-right font-semibold">{formatEuro(stat.revenue)}</td>
                      <td className="py-2.5 pl-3">
                        <span className="block h-1.5 overflow-hidden rounded-full bg-muted" title={`${totals.revenue ? Math.round((stat.revenue / totals.revenue) * 100) : 0} % vom Umsatz`}>
                          <span className="block h-full rounded-full" style={{ width: `${totals.revenue ? (stat.revenue / totals.revenue) * 100 : 0}%`, backgroundColor: SERIES[0] }} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border text-sm font-semibold tabular-nums">
                    <td className="py-2.5 pr-3">Summe ({rows.length})</td>
                    <td colSpan={3} />
                    <td className="px-3 text-right">{formatNumber(totals.sold)}</td>
                    <td className="px-3 text-right">{formatEuro(totals.revenue)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            {/* Handy: Karten */}
            <ul className="space-y-2 md:hidden">
              {(allMobile ? rows : rows.slice(0, 10)).map((stat) => (
                <li key={stat.name} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate font-medium">{stat.name}</p><p className="text-xs text-muted-foreground">{stat.categoryLabel}</p></div>
                    <p className="text-right"><strong className="block tabular-nums">{formatEuro(stat.revenue)}</strong><span className="text-xs text-muted-foreground">{formatNumber(stat.sold)} verkauft</span></p>
                  </div>
                  <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div><dt className="text-muted-foreground">Aufrufe</dt><dd className="font-semibold tabular-nums">{formatNumber(stat.views)}</dd></div>
                    <div><dt className="text-muted-foreground">Warenkorb</dt><dd className="font-semibold tabular-nums">{formatNumber(stat.added)}</dd></div>
                    <div><dt className="text-muted-foreground">Quote</dt><dd className="font-semibold tabular-nums">{stat.addRate === null ? "–" : formatPercent(stat.addRate)}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>
            {!allMobile && rows.length > 10 && (
              <button type="button" onClick={() => setAllMobile(true)} className="mt-3 w-full rounded-xl border border-border py-2.5 text-sm font-semibold md:hidden">Alle {rows.length} Produkte anzeigen</button>
            )}
          </>
        )}
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Beliebte Varianten" subtitle="Verkaufte Stück je Auswahl">
          {variants.length === 0 ? <EmptyState>Noch keine Verkäufe mit Varianten.</EmptyState> : (
            <div className="grid gap-5 sm:grid-cols-2">
              {variants.map((group) => (
                <div key={group.group}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{group.group}</p>
                  <ol className="space-y-2.5">{group.values.map((value) => <MeterRow key={value.label} label={value.label} value={value.qty} max={group.values[0]!.qty} display={`${formatNumber(value.qty)}×`} />)}</ol>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Oft angesehen, selten gewählt" subtitle="Ab 5 Aufrufen, weniger als 20 % in den Warenkorb">
          {hesitant.length === 0 ? <EmptyState>Keine Auffälligkeiten – oder noch zu wenige Aufrufe.</EmptyState> : (
            <ol className="space-y-3">{hesitant.map((stat) => <MeterRow key={stat.name} label={stat.name} sub={`${formatNumber(stat.views)} Aufrufe`} value={stat.addRate ?? 0} max={1} display={formatPercent(stat.addRate ?? 0)} color={SERIES[1]} />)}</ol>
          )}
        </Panel>
      </div>
    </div>
  );
}

function averageRate(stats: ProductStat[]) {
  const rated = stats.filter((stat) => stat.addRate !== null);
  if (rated.length === 0) return "–";
  return formatPercent(rated.reduce((sum, stat) => sum + (stat.addRate ?? 0), 0) / rated.length);
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold sm:text-3xl">{value}</p>
    </div>
  );
}

function Th({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <th className="px-3 py-2 text-right font-medium" aria-sort={active ? "descending" : "none"}>
      <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""}`}>
        {label}{active && <ArrowDown className="size-3" aria-hidden="true" />}
      </button>
    </th>
  );
}
