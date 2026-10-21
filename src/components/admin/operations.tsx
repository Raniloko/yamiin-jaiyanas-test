import { CirclePause, CirclePlay, LoaderCircle, PackageX, Search, Store } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  availability,
  endOfToday,
  isPaused,
  isSoldOut,
  itemKey,
  OPTION_GROUPS,
  optionKey,
  untilLabel,
  useAvailability,
  type AvailabilityState,
} from "@/lib/availability";
import { acais, bowls, coffees, iceBurgers, matchas, wraps } from "@/lib/menu-data";
import { cn } from "@/lib/utils";

// Farben wie in der Küche: Grün = läuft, Rot = gestoppt – immer zusammen mit Text und Icon.
const OPEN = "#087508";
const STOPPED = "#d03b3b";

const MENU_GROUPS: { label: string; names: string[] }[] = [
  { label: "Bowls", names: bowls.map((bowl) => bowl.name) },
  { label: "Matcha", names: matchas.map((item) => item.name) },
  { label: "Coffee", names: coffees.map(([name]) => name ?? "").filter(Boolean) },
  { label: "Açaí", names: acais.map((item) => item.name) },
  { label: "Ice Burger", names: iceBurgers.map((item) => item.name) },
  { label: "Wraps", names: wraps.map((item) => item.name) },
];

const PAUSES: { label: string; until: () => Date | "forever" }[] = [
  { label: "15 Min", until: () => new Date(Date.now() + 15 * 60000) },
  { label: "30 Min", until: () => new Date(Date.now() + 30 * 60000) },
  { label: "1 Std", until: () => new Date(Date.now() + 60 * 60000) },
  { label: "Für heute", until: endOfToday },
  { label: "Bis auf Weiteres", until: () => "forever" },
];

const soldOutCount = (s: AvailabilityState) => [...s.soldOut.keys()].filter((key) => isSoldOut(s, key)).length;

/** Knopf "Betrieb" mit Status-Punkt; öffnet Pause & Ausverkauft. */
export function OperationsButton({ variant = "icon" }: { variant?: "icon" | "nav" }) {
  const state = useAvailability();
  const [open, setOpen] = useState(false);
  const paused = isPaused(state);
  const count = soldOutCount(state);
  const status = paused ? "Bestellungen pausiert" : "Bestellungen offen";
  const label = `Betrieb: ${status}${count ? `, ${count} ausverkauft` : ""}`;

  return (
    <>
      {variant === "icon" ? (
        <button type="button" onClick={() => setOpen(true)} aria-label={label} title={label}
          className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card">
          <Store className="size-4" />
          <span className="absolute right-1 top-1 size-2.5 rounded-full ring-2 ring-card" style={{ backgroundColor: paused ? STOPPED : OPEN }} aria-hidden="true" />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} aria-label={label}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-foreground/70 hover:bg-muted hover:text-foreground">
          <Store className="size-4" />
          <span className="flex-1 text-left">Betrieb</span>
          <span className="size-2 rounded-full" style={{ backgroundColor: paused ? STOPPED : OPEN }} aria-hidden="true" />
          {count > 0 && <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-foreground">{count}</span>}
        </button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="admin-theme w-full overflow-y-auto bg-background p-0 sm:max-w-lg [&>button]:top-[max(1rem,env(safe-area-inset-top))]">
          <SheetHeader className="border-b border-border px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-left">
            <SheetTitle className="text-2xl">Betrieb</SheetTitle>
            <SheetDescription>Online-Bestellungen pausieren und Ausverkauftes ausblenden. Gilt sofort für alle Gäste.</SheetDescription>
          </SheetHeader>
          <div className="space-y-8 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5">
            <PauseControls state={state} />
            <SoldOutControls state={state} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Auffälliger Hinweis in Küche und Dashboard, solange pausiert ist – damit niemand das Wiederöffnen vergisst. */
export function PauseBanner({ className }: { className?: string }) {
  const state = useAvailability();
  const [busy, setBusy] = useState(false);
  if (!isPaused(state)) return null;
  const resume = async () => {
    setBusy(true);
    await availability.pause(null);
    setBusy(false);
  };
  return (
    <div role="status" className={cn("flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-white", className)} style={{ backgroundColor: STOPPED }}>
      <CirclePause className="size-5 shrink-0" />
      <p className="min-w-0 flex-1 text-sm">
        <strong className="block">Online-Bestellungen pausiert · {untilLabel(state.pausedUntil)}</strong>
        {state.pauseNote && <span className="opacity-90">„{state.pauseNote}“</span>}
      </p>
      <button type="button" onClick={() => void resume()} disabled={busy} className="flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#1f1f1f] disabled:opacity-60">
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <CirclePlay className="size-4" />} Wieder öffnen
      </button>
    </div>
  );
}

function PauseControls({ state }: { state: AvailabilityState }) {
  const paused = isPaused(state);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (until: Date | "forever" | null) => {
    setBusy(true);
    setError("");
    const message = await availability.pause(until, until ? note : "");
    if (message) setError(`Konnte nicht gespeichert werden: ${message}`);
    setBusy(false);
  };

  return (
    <section aria-labelledby="ops-pause">
      <h3 id="ops-pause" className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Online-Bestellungen</h3>
      <div className="rounded-2xl border-2 p-4" style={{ borderColor: paused ? STOPPED : OPEN }}>
        <p className="flex items-center gap-2 text-lg font-semibold" style={{ color: paused ? STOPPED : OPEN }}>
          {paused ? <CirclePause className="size-5" /> : <CirclePlay className="size-5" />}
          {paused ? `Pausiert · ${untilLabel(state.pausedUntil)}` : "Offen – Gäste können bestellen"}
        </p>
        {paused ? (
          <>
            {state.pauseNote && <p className="mt-1 text-sm text-muted-foreground">„{state.pauseNote}“</p>}
            <Button onClick={() => void run(null)} disabled={busy} className="mt-4 h-11 w-full rounded-full text-white hover:opacity-90" style={{ backgroundColor: OPEN }}>
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <CirclePlay className="size-4" />} Wieder öffnen
            </Button>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Pausieren, wenn die Küche voll ist. Laufende Bestellungen bleiben, neue gehen erst danach wieder.</p>
            <Input value={note} onChange={(event) => setNote(event.target.value.slice(0, 160))} placeholder="Hinweis für Gäste (optional), z. B. „Gleich wieder da“" aria-label="Hinweis für Gäste" className="mt-3 h-10 bg-background" />
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {PAUSES.map((entry) => (
                <button key={entry.label} type="button" disabled={busy} onClick={() => void run(entry.until())}
                  className="h-11 rounded-xl border border-border bg-card px-2 text-sm font-semibold transition-colors hover:border-foreground disabled:opacity-60">
                  {entry.label}
                </button>
              ))}
            </div>
          </>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </div>
    </section>
  );
}

function SoldOutControls({ state }: { state: AvailabilityState }) {
  const [scope, setScope] = useState<"today" | "forever">("today");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const q = query.trim().toLocaleLowerCase("de");
  const current = [...state.soldOut.entries()].filter(([key]) => isSoldOut(state, key));

  const toggle = async (key: string, available: boolean) => {
    setError("");
    const message = await availability.setSoldOut(key, available ? false : scope === "today" ? endOfToday() : null);
    if (message) setError(`Konnte nicht gespeichert werden: ${message}`);
  };
  const row = (key: string, name: string) => {
    const out = isSoldOut(state, key);
    return (
      <li key={key} className="flex items-center gap-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-medium", out && "text-muted-foreground line-through")}>{name}</p>
          {out && <p className="text-xs font-semibold" style={{ color: STOPPED }}>Ausverkauft · {untilLabel(state.soldOut.get(key) ?? null)}</p>}
        </div>
        <Switch checked={!out} onCheckedChange={(checked) => void toggle(key, checked)} aria-label={`${name} verfügbar`} />
      </li>
    );
  };
  const groups = [
    ...MENU_GROUPS.map((group) => ({ label: group.label, rows: group.names.map((name) => ({ key: itemKey(name), name })) })),
    ...OPTION_GROUPS.map((group) => ({ label: `Zutat · ${group.label}`, rows: group.values.map((value) => ({ key: optionKey(value), name: value })) })),
  ]
    .map((group) => ({ ...group, rows: group.rows.filter((entry) => !q || entry.name.toLocaleLowerCase("de").includes(q)) }))
    .filter((group) => group.rows.length > 0);

  return (
    <section aria-labelledby="ops-soldout">
      <h3 id="ops-soldout" className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Ausverkauft</h3>

      {current.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><PackageX className="size-4" style={{ color: STOPPED }} />Gerade ausverkauft ({current.length})</p>
          <ul className="flex flex-wrap gap-2">
            {current.map(([key, until]) => (
              <li key={key}>
                <button type="button" onClick={() => void toggle(key, true)} className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-foreground" title={untilLabel(until)}>
                  {key.replace(/^(item|option):/, "")} <span className="text-muted-foreground">· wieder da</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div role="radiogroup" aria-label="Ausverkauft gilt" className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold">
        {(["today", "forever"] as const).map((value) => (
          <button key={value} type="button" role="radio" aria-checked={scope === value} onClick={() => setScope(value)}
            className={cn("h-9 rounded-full transition-colors", scope === value ? "bg-foreground text-background shadow-sm" : "text-foreground/60")}>
            {value === "today" ? "Für heute" : "Bis auf Weiteres"}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {scope === "today" ? "Ab morgen automatisch wieder verfügbar." : "Bleibt aus, bis ihr es wieder einschaltet."} Schalter aus = ausverkauft.
      </p>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-2.5 top-3 size-4 text-muted-foreground" aria-hidden="true" />
        <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Gericht oder Zutat suchen" aria-label="Gericht oder Zutat suchen" className="h-10 bg-background pl-8" />
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-2 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{group.label}</p>
            <ul className="divide-y divide-border">{group.rows.map((entry) => row(entry.key, entry.name))}</ul>
          </div>
        ))}
        {groups.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nichts gefunden.</p>}
      </div>
    </section>
  );
}
