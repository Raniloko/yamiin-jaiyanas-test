import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChefHat } from "lucide-react";

import type { AdminData } from "@/lib/admin-data";
import {
  dayKey, delta, formatEuro, formatNumber, formatPercent, funnel, isSale, kpis, ordersByHour,
  productStats, revenueSeries, sessionsOf, split,
} from "@/lib/admin-metrics";
import { menuCategories } from "@/lib/menu-data";
import { HourChart, RevenueChart, VisitorsChart } from "./charts";
import { PAYMENT_LABEL, scopeOrders } from "./scope";
import { EmptyState, MeterRow, Panel, SERIES, ShareBar, StatTile } from "./ui";

export function OverviewSection({ data }: { data: AdminData }) {
  const { current, previous } = scopeOrders(data);
  const now = kpis(current);
  const before = previous ? kpis(previous) : null;
  const visitors = sessionsOf(data.analytics, "page_view");
  const prevVisitors = data.previousAnalytics ? sessionsOf(data.previousAnalytics, "page_view") : null;
  const conversion = visitors ? sessionsOf(data.analytics, "order_placed") / visitors : 0;
  const open = data.orders.filter((order) => isSale(order) && order.status !== "abgeholt");
  const top = productStats(current, []).filter((stat) => stat.sold > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const series = revenueSeries(data.orders, data.bounds);
  const payments = split(current, (order) => order.payment, ["onsite", "online", "paypal"] as const);
  const fulfillment = split(current, (order) => order.fulfillment ?? "pickup", ["pickup", "delivery"] as const);

  return (
    <div className="space-y-4">
      {open.length > 0 && (
        <Link to="/kitchen" className="flex items-center gap-3 rounded-2xl border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm transition-colors hover:bg-secondary/15">
          <ChefHat className="size-5 shrink-0 text-secondary" />
          <span className="min-w-0 flex-1"><strong>{open.length} offene Bestellung{open.length === 1 ? "" : "en"}</strong> – jetzt in der Küche ansehen</span>
          <span aria-hidden="true">→</span>
        </Link>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <div className="col-span-2"><StatTile emphasis label="Umsatz" value={formatEuro(now.revenue)} delta={before ? delta(now.revenue, before.revenue) : null} hint={before && delta(now.revenue, before.revenue) !== null ? "vs. Vorzeitraum" : undefined} /></div>
        <StatTile label="Bestellungen" value={formatNumber(now.orders)} delta={before ? delta(now.orders, before.orders) : null} />
        <StatTile label="Ø Bestellwert" value={formatEuro(now.average)} delta={before ? delta(now.average, before.average) : null} />
        <StatTile label="Verkaufte Artikel" value={formatNumber(now.items)} delta={before ? delta(now.items, before.items) : null} />
        <StatTile label="Besuche Speisekarte" value={formatNumber(visitors)} delta={delta(visitors, prevVisitors)} hint={`${formatPercent(conversion, 1)} bestellen`} />
      </div>
      {now.unpaidOnline > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-[#fab219]/60 bg-[#fab219]/10 px-3 py-2 text-xs">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#a86f00]" aria-hidden="true" />
          <span><strong>Hinweis:</strong> {now.unpaidOnline} Online-Bestellung{now.unpaidOnline === 1 ? "" : "en"} ohne bestätigte Zahlung (abgebrochen oder offen) – nicht im Umsatz enthalten.</span>
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title={data.bounds.bucket === "hour" ? "Umsatz nach Stunde" : "Umsatz pro Tag"} subtitle="Nur bezahlte bzw. vor Ort zu zahlende Bestellungen">
          {now.orders === 0 ? <EmptyState>Im gewählten Zeitraum gibt es noch keine Verkäufe.</EmptyState> : <RevenueChart data={series} />}
        </Panel>
        <Panel title="Bestseller" subtitle="Nach Umsatz">
          {top.length === 0 ? <EmptyState>Noch keine Verkäufe.</EmptyState> : (
            <ol className="space-y-3">{top.map((stat) => <MeterRow key={stat.name} label={stat.name} sub={`${stat.sold}×`} value={stat.revenue} max={top[0]!.revenue} display={formatEuro(stat.revenue)} />)}</ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Panel title="Stoßzeiten" subtitle="Bestellungen nach Uhrzeit">
          {now.orders === 0 ? <EmptyState>Noch keine Daten.</EmptyState> : <HourChart data={ordersByHour(current)} />}
        </Panel>
        <Panel title="Zahlungsarten" subtitle="Anteil am Umsatz">
          <ShareBar parts={payments.map((part) => ({ label: PAYMENT_LABEL[part.key], value: part.revenue }))} format={formatEuro} />
        </Panel>
        <Panel title="Abholung & Lieferung" subtitle="Anzahl Bestellungen">
          <ShareBar parts={fulfillment.map((part) => ({ label: part.key === "pickup" ? "Abholung" : "Lieferung", value: part.orders }))} format={formatNumber} />
        </Panel>
      </div>
    </div>
  );
}

const CATEGORY_LABEL = Object.fromEntries(menuCategories.map((category) => [category.id, category.label])) as Record<string, string>;
const DEVICE_LABEL: Record<string, string> = { mobile: "Handy", tablet: "Tablet", desktop: "Computer" };

export function MenuSection({ data }: { data: AdminData }) {
  const { analytics, previousAnalytics, bounds } = data;
  const steps = funnel(analytics);
  const events = (source: typeof analytics | null, event: string) => (source ? source.totals?.[event]?.events ?? 0 : null);
  const categories = [...analytics.categories].sort((a, b) => b.s - a.s);
  const viewed = analytics.items.filter((row) => row.event === "item_view").sort((a, b) => b.s - a.s).slice(0, 8);
  const removed = analytics.items.filter((row) => row.event === "remove_from_cart").sort((a, b) => b.qty - a.qty).slice(0, 5);
  const devices = ["mobile", "tablet", "desktop"].map((device) => ({ label: DEVICE_LABEL[device]!, value: analytics.devices.find((row) => row.device === device)?.s ?? 0 }));

  // Besucher pro Tag (lückenlos über den Zeitraum)
  const perDay = new Map<string, { visitors: number; orders: number }>();
  for (const row of analytics.daily) {
    const entry = perDay.get(row.day) ?? { visitors: 0, orders: 0 };
    if (row.event === "page_view") entry.visitors = row.s;
    if (row.event === "order_placed") entry.orders = row.s;
    perDay.set(row.day, entry);
  }
  const days: { label: string; visitors: number; orders: number }[] = [];
  for (let day = new Date(bounds.from); day < bounds.to; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
    const entry = perDay.get(dayKey(day)) ?? { visitors: 0, orders: 0 };
    days.push({ label: day.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }), ...entry });
  }
  const noData = analytics.sessions === 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Besuche" value={formatNumber(sessionsOf(analytics, "page_view"))} delta={delta(sessionsOf(analytics, "page_view"), previousAnalytics ? sessionsOf(previousAnalytics, "page_view") : null)} />
        <StatTile label="Gerichte angesehen" value={formatNumber(events(analytics, "item_view") ?? 0)} delta={delta(events(analytics, "item_view") ?? 0, events(previousAnalytics, "item_view"))} />
        <StatTile label="In den Warenkorb" value={formatNumber(events(analytics, "add_to_cart") ?? 0)} delta={delta(events(analytics, "add_to_cart") ?? 0, events(previousAnalytics, "add_to_cart"))} />
        <StatTile label="Suchen" value={formatNumber(events(analytics, "search") ?? 0)} delta={delta(events(analytics, "search") ?? 0, events(previousAnalytics, "search"))} />
      </div>
      {noData && <EmptyState>Noch keine Interaktionen im Zeitraum. Die Erfassung startet, sobald diese Version live ist – sie zählt anonym, ohne Cookies und ohne persönliche Daten.</EmptyState>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Vom Besuch zur Bestellung" subtitle="Besucher je Schritt · Anteil vom Start · Übergang zum vorherigen Schritt">
          <ol className="space-y-3.5">
            {steps.map((step, index) => (
              <li key={step.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                <span className="min-w-0 truncate text-sm"><span className="mr-2 text-xs tabular-nums text-muted-foreground">{index + 1}</span>{step.label}</span>
                <span className="text-sm tabular-nums"><strong>{formatNumber(step.sessions)}</strong><span className="ml-2 text-xs text-muted-foreground">{formatPercent(step.ofFirst)}</span></span>
                <span className="col-span-2 flex items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true"><span className="block h-full rounded-full" style={{ width: `${step.ofFirst * 100}%`, backgroundColor: SERIES[0] }} /></span>
                  {index > 0 && <span className="w-24 text-right text-xs text-muted-foreground">{formatPercent(step.ofPrevious)} weiter</span>}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Geräte" subtitle="Besucher nach Gerät">
          <ShareBar parts={devices} format={formatNumber} />
        </Panel>
      </div>

      {bounds.bucket === "day" && (
        <Panel title="Besucher pro Tag" subtitle="Sitzungen auf der Speisekarte">
          {noData ? <EmptyState>Noch keine Daten.</EmptyState> : <VisitorsChart data={days} />}
        </Panel>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Panel title="Meistgesehene Gerichte" subtitle="Besucher, die das Gericht geöffnet haben">
          {viewed.length === 0 ? <EmptyState>Noch keine Daten.</EmptyState> : <ol className="space-y-3">{viewed.map((row) => <MeterRow key={row.item} label={row.item} value={row.s} max={viewed[0]!.s} display={formatNumber(row.s)} color={SERIES[1]} />)}</ol>}
        </Panel>
        <Panel title="Kategorien" subtitle="Besucher, die die Kategorie gesehen haben">
          {categories.length === 0 ? <EmptyState>Noch keine Daten.</EmptyState> : <ol className="space-y-3">{categories.map((row) => <MeterRow key={row.category} label={CATEGORY_LABEL[row.category] ?? row.category} value={row.s} max={categories[0]!.s} display={formatNumber(row.s)} color={SERIES[1]} />)}</ol>}
        </Panel>
        <Panel title="Beliebte Suchen" subtitle="Was Gäste in die Suche tippen">
          {analytics.searches.length === 0 ? <EmptyState>Noch keine Suchen.</EmptyState> : <ol className="space-y-3">{analytics.searches.slice(0, 8).map((row) => <MeterRow key={row.query} label={`„${row.query}“`} value={row.n} max={analytics.searches[0]!.n} display={`${formatNumber(row.n)}×`} color={SERIES[1]} />)}</ol>}
        </Panel>
      </div>
      {removed.length > 0 && (
        <Panel title="Oft wieder entfernt" subtitle="Aus dem Warenkorb genommen (Stück)">
          <ol className="grid gap-3 sm:grid-cols-2">{removed.map((row) => <MeterRow key={row.item} label={row.item} value={row.qty} max={removed[0]!.qty} display={`${formatNumber(row.qty)}×`} color={SERIES[1]} />)}</ol>
        </Panel>
      )}
    </div>
  );
}

