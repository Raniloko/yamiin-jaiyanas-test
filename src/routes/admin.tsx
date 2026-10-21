import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChefHat, ExternalLink, LayoutDashboard, LogOut, MousePointerClick, Receipt, RefreshCw, Users, UtensilsCrossed, type LucideIcon } from "lucide-react";

import { AdminGate } from "@/components/admin/admin-gate";
import { InstallHint } from "@/components/admin/install-hint";
import { OperationsButton, PauseBanner } from "@/components/admin/operations";
import { CustomersSection, OrdersSection } from "@/components/admin/section-orders";
import { MenuSection, OverviewSection } from "@/components/admin/section-overview";
import { ProductsSection } from "@/components/admin/section-products";
import { BrandMark } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { adminAuth } from "@/lib/admin-auth";
import { useAdminData } from "@/lib/admin-data";
import { appHead } from "@/lib/app-install";
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
  head: () => {
    const app = appHead("admin");
    return { meta: [{ title: "Admin-Dashboard – Yamiin & Jaiyana's" }, { name: "robots", content: "noindex, nofollow" }, ...app.meta], links: app.links };
  },
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

  // Beim Wechsel des Bereichs oben beginnen (wichtig auf dem Handy mit unterer Navigation).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  const updated = data.updatedAt ? `Live · ${data.updatedAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr` : "Lädt …";
  const rangePicker = (
    <div role="radiogroup" aria-label="Zeitraum" className="grid min-w-0 flex-1 grid-cols-5 rounded-full bg-muted p-1 sm:flex sm:flex-none sm:border sm:border-border sm:bg-card">
      {RANGES.map((entry) => (
        <button key={entry.key} type="button" role="radio" aria-checked={entry.key === range} onClick={() => go({ range: entry.key })} title={entry.label}
          className={cn("h-8 min-w-0 rounded-full px-1.5 text-xs font-semibold transition-colors sm:px-3", entry.key === range ? "bg-foreground text-background shadow-sm" : "text-foreground/60 hover:text-foreground")}>
          <span className="sm:hidden">{entry.short}</span><span className="hidden sm:inline">{entry.label.replace("Letzte ", "")}</span>
        </button>
      ))}
    </div>
  );
  const refreshButton = (
    <Button variant="outline" size="icon" aria-label="Aktualisieren" onClick={data.refresh} className="size-10 shrink-0 rounded-full bg-card">
      <RefreshCw className={cn("size-4", data.refreshing && "animate-spin")} />
    </Button>
  );

  return (
    <div className="admin-theme min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:bg-[linear-gradient(to_right,var(--card)_15rem,var(--background)_15rem)]">
      {/* Desktop: Seitenleiste */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-card px-4 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:flex">
        <div className="flex items-center gap-3 px-2">
          <BrandMark className="size-10 grayscale" />
          <span className="leading-tight"><span className="block text-sm font-bold uppercase">Yamiin &amp; Jaiyana&rsquo;s</span><span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin</span></span>
        </div>
        <nav aria-label="Dashboard" className="mt-8 space-y-1">
          {TABS.map((entry) => (
            <button key={entry.key} type="button" onClick={() => go({ tab: entry.key })} aria-current={entry.key === tab ? "page" : undefined}
              className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors", entry.key === tab ? "bg-foreground text-background" : "text-foreground/70 hover:bg-muted hover:text-foreground")}>
              <entry.icon className="size-4" aria-hidden="true" />{entry.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-border pt-4 text-sm">
          <OperationsButton variant="nav" />
          <Link to="/kitchen" className="flex items-center gap-3 rounded-xl px-3 py-2 text-foreground/70 hover:bg-muted hover:text-foreground"><ChefHat className="size-4" />Küche</Link>
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-foreground/70 hover:bg-muted hover:text-foreground"><ExternalLink className="size-4" />Website</a>
          <p className="truncate px-3 pt-3 text-xs text-muted-foreground" title={email}>{email}</p>
          <button type="button" onClick={() => void adminAuth.signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-foreground/70 hover:bg-muted hover:text-foreground"><LogOut className="size-4" />Abmelden</button>
        </div>
      </aside>

      <div className="min-w-0 pb-28 md:pb-10">
        {/* Handy & Tablet: feste Kopfzeile mit Titel, Zeitraum und Aktualisieren */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
            <BrandMark className="size-8 grayscale" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg leading-tight">{active.title}</h1>
              <p className="truncate text-[11px] text-muted-foreground" aria-live="polite">{updated}</p>
            </div>
            <OperationsButton />
            <Link to="/kitchen" aria-label="Küche" className="flex size-10 items-center justify-center rounded-full border border-border bg-card"><ChefHat className="size-4" /></Link>
            <button type="button" aria-label="Abmelden" onClick={() => void adminAuth.signOut()} className="flex size-10 items-center justify-center rounded-full border border-border bg-card"><LogOut className="size-4" /></button>
          </div>
          <div className="flex items-center gap-2 px-4 pb-3 sm:px-6">
            {rangePicker}
            {refreshButton}
          </div>
          {/* Tablet: Reiter */}
          <nav aria-label="Dashboard" className="hidden gap-1 overflow-x-auto px-6 pb-3 md:flex">
            {TABS.map((entry) => (
              <button key={entry.key} type="button" onClick={() => go({ tab: entry.key })} aria-current={entry.key === tab ? "page" : undefined}
                className={cn("flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors", entry.key === tab ? "bg-foreground text-background" : "text-foreground/60 hover:bg-muted hover:text-foreground")}>
                <entry.icon className="size-4" aria-hidden="true" />{entry.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8 lg:pt-8">
          {/* Desktop: Titelzeile */}
          <div className="mb-6 hidden items-end justify-between gap-4 lg:flex">
            <div>
              <h1 className="text-3xl">{active.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{active.text} <span className="ml-1 text-xs" aria-live="polite">{updated}</span></p>
            </div>
            <div className="flex items-center gap-2">{rangePicker}{refreshButton}</div>
          </div>
          <PauseBanner className="mb-4" />
          <InstallHint app="admin" className="mb-4" />
          <p className="mb-3 px-1 text-xs text-muted-foreground lg:hidden">{active.text}</p>
          {data.error && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{data.error}</p>}

          {data.loading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted sm:h-28" />)}
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
      <nav aria-label="Dashboard" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5 px-1 pt-1.5">
          {TABS.map((entry) => {
            const isActive = entry.key === tab;
            return (
              <button key={entry.key} type="button" onClick={() => go({ tab: entry.key })} aria-current={isActive ? "page" : undefined}
                className={cn("flex flex-col items-center gap-1 pb-2 text-[10px] font-semibold transition-colors", isActive ? "text-foreground" : "text-muted-foreground")}>
                <span className={cn("flex h-8 w-12 items-center justify-center rounded-full transition-colors", isActive ? "bg-foreground text-background" : "")}>
                  <entry.icon className="size-[18px]" aria-hidden="true" />
                </span>
                {entry.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
