import { createFileRoute, Link } from "@tanstack/react-router";
import { ChefHat, ExternalLink, LayoutDashboard, LogOut, MousePointerClick, Receipt, RefreshCw, Users, UtensilsCrossed, type LucideIcon } from "lucide-react";

import { AdminGate } from "@/components/admin/admin-gate";
import { CustomersSection, OrdersSection } from "@/components/admin/section-orders";
import { MenuSection, OverviewSection } from "@/components/admin/section-overview";
import { ProductsSection } from "@/components/admin/section-products";
import { BrandMark } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { adminAuth } from "@/lib/admin-auth";
import { useAdminData } from "@/lib/admin-data";
import { RANGES, type RangeKey } from "@/lib/admin-metrics";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Übersicht", icon: LayoutDashboard, title: "Übersicht", text: "Umsatz, Bestellungen und Trends auf einen Blick." },
  { key: "products", label: "Produkte", icon: UtensilsCrossed, title: "Produkte", text: "Jedes Gericht: Aufrufe, Warenkorb, Verkäufe und Varianten." },
  { key: "menu", label: "Speisekarte", icon: MousePointerClick, title: "Speisekarte", text: "Wie Gäste die Speisekarte nutzen – anonym erfasst." },
  { key: "orders", label: "Bestellungen", icon: Receipt, title: "Bestellungen", text: "Alle Bestellungen mit Filtern, Details und Export." },
  { key: "customers", label: "Kunden", icon: Users, title: "Kunden", text: "Wer bestellt – und wer wiederkommt." },
] as const satisfies readonly { key: string; label: string; icon: LucideIcon; title: string; text: string }[];
type TabKey = (typeof TABS)[number]["key"];

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): { tab: TabKey; range: RangeKey } => ({
    tab: TABS.some((tab) => tab.key === search["tab"]) ? (search["tab"] as TabKey) : "overview",
    range: RANGES.some((range) => range.key === search["range"]) ? (search["range"] as RangeKey) : "30d",
  }),
  head: () => ({ meta: [{ title: "Admin-Dashboard – Yamiin & Jaiyana's" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <AdminGate title="Admin-Dashboard">
      {(state) => <Dashboard email={state.session.user.email ?? ""} />}
    </AdminGate>
  );
}

function Dashboard({ email }: { email: string }) {
  const { tab, range } = Route.useSearch();
  const navigate = Route.useNavigate();
  const data = useAdminData(range);
  const active = TABS.find((entry) => entry.key === tab) ?? TABS[0];
  const go = (next: Partial<{ tab: TabKey; range: RangeKey }>) => void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });

  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:bg-[linear-gradient(to_right,var(--color-card)_15rem,var(--color-background)_15rem)]">
      {/* Desktop: Seitenleiste */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-card px-4 py-5 lg:flex">
        <Link to="/" className="flex items-center gap-3 px-2">
          <BrandMark className="size-10" />
          <span className="leading-tight"><span className="block text-sm font-bold uppercase">Yamiin &amp; Jaiyana&rsquo;s</span><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin</span></span>
        </Link>
        <nav aria-label="Dashboard" className="mt-8 space-y-1">
          {TABS.map((entry) => (
            <button key={entry.key} type="button" onClick={() => go({ tab: entry.key })} aria-current={entry.key === tab ? "page" : undefined}
              className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors", entry.key === tab ? "bg-foreground text-background" : "text-foreground/75 hover:bg-muted hover:text-foreground")}>
              <entry.icon className="size-4" aria-hidden="true" />{entry.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-border pt-4 text-sm">
          <Link to="/kitchen" className="flex items-center gap-3 rounded-xl px-3 py-2 text-foreground/75 hover:bg-muted hover:text-foreground"><ChefHat className="size-4" />Küche</Link>
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-foreground/75 hover:bg-muted hover:text-foreground"><ExternalLink className="size-4" />Website</a>
          <p className="truncate px-3 pt-3 text-xs text-muted-foreground" title={email}>{email}</p>
          <button type="button" onClick={() => void adminAuth.signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-foreground/75 hover:bg-muted hover:text-foreground"><LogOut className="size-4" />Abmelden</button>
        </div>
      </aside>

      <div className="min-w-0 pb-24 md:pb-10">
        {/* Handy & Tablet: Kopfzeile */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <BrandMark className="size-9" />
            <p className="min-w-0 flex-1 truncate text-sm font-bold uppercase">Admin</p>
            <Link to="/kitchen" aria-label="Küche" className="flex size-9 items-center justify-center rounded-full border border-border bg-card"><ChefHat className="size-4" /></Link>
            <button type="button" aria-label="Abmelden" onClick={() => void adminAuth.signOut()} className="flex size-9 items-center justify-center rounded-full border border-border bg-card"><LogOut className="size-4" /></button>
          </div>
          {/* Tablet: Reiter */}
          <nav aria-label="Dashboard" className="hidden gap-1 overflow-x-auto px-6 pb-2 md:flex">
            {TABS.map((entry) => (
              <button key={entry.key} type="button" onClick={() => go({ tab: entry.key })} aria-current={entry.key === tab ? "page" : undefined}
                className={cn("flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors", entry.key === tab ? "bg-foreground text-background" : "text-foreground/70 hover:bg-muted")}>
                <entry.icon className="size-4" aria-hidden="true" />{entry.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl">{active.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{active.text}</p>
            </div>
            {/* Zeitraum gilt für alle Zahlen darunter */}
            <div className="flex items-center gap-2">
              <div role="radiogroup" aria-label="Zeitraum" className="flex min-w-0 flex-1 overflow-x-auto rounded-full border border-border bg-card p-1 [scrollbar-width:none] sm:flex-none">
                {RANGES.map((entry) => (
                  <button key={entry.key} type="button" role="radio" aria-checked={entry.key === range} onClick={() => go({ range: entry.key })} title={entry.label}
                    className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", entry.key === range ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground")}>
                    <span className="sm:hidden">{entry.short}</span><span className="hidden sm:inline">{entry.label.replace("Letzte ", "")}</span>
                  </button>
                ))}
              </div>
              <Button variant="outline" size="icon" aria-label="Aktualisieren" onClick={data.refresh} className="shrink-0 rounded-full">
                <RefreshCw className={cn("size-4", data.refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
          <p className="-mt-3 mb-4 text-xs text-muted-foreground" aria-live="polite">
            {data.updatedAt ? `Live · aktualisiert ${data.updatedAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr` : "Lädt …"}
          </p>
          {data.error && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{data.error}</p>}

          {data.loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          ) : (
            // Beim Nachladen bleibt die Ansicht stehen (leicht abgeblendet) statt zu springen.
            <div className={cn("transition-opacity", data.refreshing && "opacity-70")}>
              {tab === "overview" && <OverviewSection data={data} />}
              {tab === "products" && <ProductsSection data={data} />}
              {tab === "menu" && <MenuSection data={data} />}
              {tab === "orders" && <OrdersSection data={data} />}
              {tab === "customers" && <CustomersSection data={data} />}
            </div>
          )}
        </main>
      </div>

      {/* Handy: Navigation unten */}
      <nav aria-label="Dashboard" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {TABS.map((entry) => (
          <button key={entry.key} type="button" onClick={() => go({ tab: entry.key })} aria-current={entry.key === tab ? "page" : undefined}
            className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold", entry.key === tab ? "text-secondary" : "text-muted-foreground")}>
            <entry.icon className="size-5" aria-hidden="true" />{entry.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
