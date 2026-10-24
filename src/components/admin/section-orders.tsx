import { AlertTriangle, Bike, CheckCircle2, Download, Mail, Phone, Search, SlidersHorizontal, Store } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AdminData } from "@/lib/admin-data";
import { customerStats, formatEuro, formatNumber, isSale, isUnpaidOnline } from "@/lib/admin-metrics";
import { ORDER_STEPS, type Order } from "@/lib/order-store";
import { PAYMENT_LABEL, scopeOrders } from "./scope";
import { Chip, EmptyState, Panel } from "./ui";

const dateTime = (time: number) => new Date(time).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
const statusLabel = (order: Order) => ORDER_STEPS.find((step) => step.key === order.status)?.label ?? order.status;

/** CSV mit Semikolon + BOM, damit Excel (deutsch) Umlaute und Spalten richtig öffnet. */
function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    const text = typeof value === "number" ? value.toLocaleString("de-DE") : value;
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

type PaymentFilter = "all" | "onsite" | "online" | "paypal" | "unpaid";

export function OrdersSection({ data }: { data: AdminData }) {
  const { current } = scopeOrders(data);
  const [status, setStatus] = useState<"all" | "open" | Order["status"]>("all");
  const [payment, setPayment] = useState<PaymentFilter>("all");
  const [kind, setKind] = useState<"all" | "pickup" | "delivery">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(40);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const q = query.trim().toLowerCase();

  const rows = current.filter((order) => {
    if (status === "open" ? order.status === "abgeholt" || !isSale(order) : status !== "all" && order.status !== status) return false;
    if (payment === "unpaid" ? !isUnpaidOnline(order) : payment !== "all" && (order.payment !== payment || !isSale(order))) return false;
    if (kind !== "all" && (order.fulfillment ?? "pickup") !== kind) return false;
    if (q && ![order.id, order.contact.name, order.contact.phone, order.contact.email].some((value) => value.toLowerCase().includes(q))) return false;
    return true;
  });
  const selected = data.orders.find((order) => order.id === selectedId) ?? null;
  const activeFilters = Number(status !== "all") + Number(payment !== "all") + Number(kind !== "all");
  const filters = (stacked: boolean) => (
    <>
      <FilterRow label="Status" stacked={stacked}>
        <Chip active={status === "all"} onClick={() => setStatus("all")}>Alle</Chip>
        <Chip active={status === "open"} onClick={() => setStatus("open")}>Offen</Chip>
        {ORDER_STEPS.map((step) => <Chip key={step.key} active={status === step.key} onClick={() => setStatus(step.key)}>{step.label}</Chip>)}
      </FilterRow>
      <FilterRow label="Zahlung" stacked={stacked}>
        {(["all", "onsite", "online", "paypal", "unpaid"] as const).map((key) => (
          <Chip key={key} active={payment === key} onClick={() => setPayment(key)}>{key === "all" ? "Alle" : key === "unpaid" ? "Zahlung offen" : PAYMENT_LABEL[key]}</Chip>
        ))}
      </FilterRow>
      <FilterRow label="Art" stacked={stacked}>
        <Chip active={kind === "all"} onClick={() => setKind("all")}>Alle</Chip>
        <Chip active={kind === "pickup"} onClick={() => setKind("pickup")}>Abholung</Chip>
        <Chip active={kind === "delivery"} onClick={() => setKind("delivery")}>Lieferung</Chip>
      </FilterRow>
    </>
  );

  const exportCsv = () =>
    downloadCsv(`bestellungen-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Nr.", "Datum", "Name", "Telefon", "E-Mail", "Art", "Adresse", "Zahlung", "Bezahlt", "Status", "Positionen", "Liefergebühr", "Gesamt"],
      rows.map((order) => [
        order.id, dateTime(order.createdAt), order.contact.name, order.contact.phone, order.contact.email,
        order.fulfillment === "delivery" ? "Lieferung" : "Abholung",
        order.address ? `${order.address.street}, ${order.address.zip} ${order.address.city}` : "",
        PAYMENT_LABEL[order.payment], isSale(order) ? (order.payment === "onsite" ? "vor Ort" : "ja") : "nein", statusLabel(order),
        order.items.map((item) => `${item.qty}× ${item.name} (${item.detail})`).join(" | "), order.deliveryFee ?? 0, order.total,
      ]));

  return (
    <div className="space-y-4">
      <Panel title={`Bestellungen (${formatNumber(rows.length)})`} subtitle="Im gewählten Zeitraum · Tippe eine Bestellung für Details" action={<Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}><Download className="size-4" /><span className="hidden sm:inline">CSV</span></Button>}>
        <div className="mb-3 flex gap-2 sm:mb-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
            <Input type="search" aria-label="Bestellungen durchsuchen" placeholder="Nr., Name, Telefon, E-Mail" value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 bg-background pl-9" />
          </div>
          {/* Handy: Filter im Blatt von unten statt drei Zeilen Chips */}
          <Button variant={activeFilters ? "default" : "outline"} className="h-10 shrink-0 rounded-full sm:hidden" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal className="size-4" />Filter{activeFilters ? ` · ${activeFilters}` : ""}
          </Button>
        </div>
        <div className="mb-4 hidden space-y-2.5 sm:block">{filters(false)}</div>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent side="bottom" className="admin-theme max-h-[85dvh] overflow-y-auto rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <SheetHeader className="text-left">
              <SheetTitle className="font-sans text-lg font-semibold">Filter</SheetTitle>
              <SheetDescription>{formatNumber(rows.length)} Bestellungen passen</SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-5">{filters(true)}</div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => { setStatus("all"); setPayment("all"); setKind("all"); }}>Zurücksetzen</Button>
              <Button className="rounded-full" onClick={() => setFiltersOpen(false)}>Anzeigen</Button>
            </div>
          </SheetContent>
        </Sheet>

        {rows.length === 0 ? <EmptyState>Keine Bestellungen für diese Auswahl.</EmptyState> : (
          <ul className="divide-y divide-border">
            {rows.slice(0, limit).map((order) => (
              <li key={order.id}>
                <button type="button" onClick={() => setSelectedId(order.id)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-1 py-3 text-left transition-colors hover:bg-muted/40 sm:grid-cols-[7rem_minmax(0,1fr)_7.5rem_12rem_5.5rem]">
                  <span className="min-w-0 truncate text-sm font-semibold sm:order-2 sm:font-medium">{order.contact.name}<span className="ml-2 text-xs font-normal text-muted-foreground">{order.items.reduce((sum, item) => sum + item.qty, 0)} Artikel</span></span>
                  <strong className="text-right tabular-nums sm:order-5">{formatEuro(order.total)}</strong>
                  <span className="col-span-2 font-mono text-[11px] text-muted-foreground sm:order-1 sm:col-span-1 sm:text-xs">#{order.id}<span className="sm:hidden"> · {dateTime(order.createdAt)}</span></span>
                  <span className="hidden text-xs text-muted-foreground sm:order-3 sm:block">{dateTime(order.createdAt)}</span>
                  <span className="col-span-2 flex flex-wrap items-center gap-1.5 sm:order-4 sm:col-span-1">
                    <StatusBadge order={order} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {rows.length > limit && <Button variant="outline" className="mt-3 w-full" onClick={() => setLimit(limit + 40)}>Weitere {Math.min(40, rows.length - limit)} anzeigen</Button>}
      </Panel>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="admin-theme w-full overflow-y-auto bg-background pt-[max(1.5rem,env(safe-area-inset-top))] sm:max-w-md [&>button]:top-[max(1rem,env(safe-area-inset-top))]">
          {selected && <OrderDetail order={selected} onStatus={(next) => void data.setStatus(selected.id, next)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterRow({ label, children, stacked }: { label: string; children: React.ReactNode; stacked: boolean }) {
  if (stacked) {
    return (
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <div className="flex flex-wrap gap-1.5">{children}</div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="-mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">{children}</div>
    </div>
  );
}

/** Status-Farben wie in der Küche: bestätigt blau, in Zubereitung gelb, abholbereit grün, abgeholt grau (immer mit Text). */
const STATUS_TONE: Record<Order["status"], string> = {
  bestaetigt: "bg-[#e8f1fc] text-[#1f62b5]",
  zubereitung: "bg-[#fdf1d6] text-[#8a5a00]",
  abholbereit: "bg-[#e5f5e5] text-[#06660a]",
  abgeholt: "bg-muted text-muted-foreground",
};

function StatusBadge({ order }: { order: Order }) {
  if (isUnpaidOnline(order)) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#fdecec] px-2 py-0.5 text-[11px] font-semibold text-[#a32b2b]"><AlertTriangle className="size-3" aria-hidden="true" />Zahlung offen</span>;
  }
  return (
    <>
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[order.status]}`}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{statusLabel(order)}</span>
      <span className="text-[11px] text-muted-foreground">{PAYMENT_LABEL[order.payment]}{order.payment !== "onsite" ? " (bezahlt)" : ""} · {order.fulfillment === "delivery" ? "Lieferung" : "Abholung"}</span>
    </>
  );
}

function OrderDetail({ order, onStatus }: { order: Order; onStatus: (status: Order["status"]) => void }) {
  const delivery = order.fulfillment === "delivery";
  return (
    <>
      <SheetHeader className="text-left">
        <SheetTitle className="font-sans text-2xl font-semibold tracking-tight">#{order.id}</SheetTitle>
        <SheetDescription>{dateTime(order.createdAt)} · {order.pickupLabel}</SheetDescription>
      </SheetHeader>
      <div className="mt-5 space-y-5 text-sm">
        <div className="flex flex-wrap gap-1.5"><StatusBadge order={order} /></div>
        {isSale(order) && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Status ändern</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ORDER_STEPS.map((step) => (
                <Button key={step.key} size="sm" variant={order.status === step.key ? "default" : "outline"} onClick={() => onStatus(step.key)} aria-pressed={order.status === step.key}>
                  {order.status === step.key && <CheckCircle2 className="size-3.5" />}{step.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        <section className="rounded-xl border border-border bg-card p-3">
          <p className="font-semibold">{order.contact.name}</p>
          <a href={`tel:${order.contact.phone}`} className="mt-1 flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline"><Phone className="size-3.5" />{order.contact.phone}</a>
          {order.contact.email && <a href={`mailto:${order.contact.email}`} className="mt-1 flex items-center gap-2 break-all text-muted-foreground hover:text-foreground hover:underline"><Mail className="size-3.5 shrink-0" />{order.contact.email}</a>}
          <p className="mt-2 flex items-start gap-2">{delivery ? <Bike className="mt-0.5 size-3.5 shrink-0" /> : <Store className="mt-0.5 size-3.5 shrink-0" />}{delivery && order.address ? `${order.address.street}, ${order.address.zip} ${order.address.city}` : "Abholung im Laden"}</p>
        </section>
        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Positionen</p>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 p-3">
                <span className="min-w-0"><strong>{item.qty}× {item.name}</strong><span className="block text-xs text-muted-foreground">{item.detail}</span></span>
                <span className="shrink-0 tabular-nums">{formatEuro(item.price * item.qty)}</span>
              </li>
            ))}
            {(order.deliveryFee ?? 0) > 0 && <li className="flex justify-between p-3 text-muted-foreground"><span>Lieferung</span><span className="tabular-nums">{formatEuro(order.deliveryFee ?? 0)}</span></li>}
            <li className="flex justify-between p-3 font-semibold"><span>Gesamt</span><span className="tabular-nums">{formatEuro(order.total)}</span></li>
          </ul>
        </section>
        {order.note && <p className="rounded-xl border border-border bg-muted p-3 text-sm"><strong>Hinweis:</strong> {order.note}</p>}
      </div>
    </>
  );
}

export function CustomersSection({ data }: { data: AdminData }) {
  const { current } = scopeOrders(data);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(30);
  const customers = customerStats(current);
  const regulars = customers.filter((customer) => customer.orders >= 2);
  const revenue = customers.reduce((sum, customer) => sum + customer.revenue, 0);
  const regularRevenue = regulars.reduce((sum, customer) => sum + customer.revenue, 0);
  const q = query.trim().toLowerCase();
  const rows = customers.filter((customer) => !q || [customer.name, customer.email, customer.phone].some((value) => value.toLowerCase().includes(q)));
  const exportCsv = () =>
    downloadCsv(`kunden-${new Date().toISOString().slice(0, 10)}.csv`, ["Name", "E-Mail", "Telefon", "Bestellungen", "Umsatz", "Erste Bestellung", "Letzte Bestellung"],
      rows.map((customer) => [customer.name, customer.email, customer.phone, customer.orders, customer.revenue, dateTime(customer.first), dateTime(customer.last)]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Kunden" value={formatNumber(customers.length)} />
        <Tile label="Stammkunden (2+ Bestellungen)" value={formatNumber(regulars.length)} />
        <Tile label="Ø Umsatz pro Kunde" value={formatEuro(customers.length ? revenue / customers.length : 0)} />
        <Tile label="Umsatz durch Stammkunden" value={revenue ? `${Math.round((regularRevenue / revenue) * 100)} %` : "–"} />
      </div>
      <Panel title="Kundenliste" subtitle="Zusammengefasst nach E-Mail bzw. Telefon · nur für Admins sichtbar" action={<Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}><Download className="size-4" /><span className="hidden sm:inline">CSV</span></Button>}>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
          <Input type="search" aria-label="Kunden suchen" placeholder="Name, E-Mail oder Telefon" value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 bg-background pl-8" />
        </div>
        {rows.length === 0 ? <EmptyState>Noch keine Kunden im Zeitraum.</EmptyState> : (
          <ul className="divide-y divide-border">
            {rows.slice(0, limit).map((customer) => (
              <li key={customer.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_6rem_7rem_8rem] sm:items-center">
                <span className="min-w-0 truncate font-medium">{customer.name}{customer.orders >= 2 && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">Stammkunde</span>}</span>
                <strong className="text-right tabular-nums sm:order-4">{formatEuro(customer.revenue)}</strong>
                <span className="min-w-0 truncate text-xs text-muted-foreground sm:order-2">{customer.email || customer.phone}</span>
                <span className="text-right text-xs text-muted-foreground sm:order-3 sm:text-sm sm:text-foreground">{customer.orders}× bestellt</span>
                <span className="col-span-2 text-xs text-muted-foreground sm:order-5 sm:col-span-1 sm:text-right">zuletzt {new Date(customer.last).toLocaleDateString("de-DE")}</span>
              </li>
            ))}
          </ul>
        )}
        {rows.length > limit && <Button variant="outline" className="mt-3 w-full" onClick={() => setLimit(limit + 30)}>Weitere anzeigen</Button>}
      </Panel>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold sm:text-3xl">{value}</p>
    </div>
  );
}
