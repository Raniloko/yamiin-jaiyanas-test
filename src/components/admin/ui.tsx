import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Diagrammfarben in Graustufen (geprüft: monotone Helligkeit, Kontrast >= 2,5:1 auf Weiß).
 * Weil Grautöne sich schwächer unterscheiden als Farben, tragen Legende, Werte und 2px-Lücken immer mit.
 */
export const SERIES = ["#111111", "#6b6b6b", "#a3a3a3"] as const;
export const INK = "#111111";
export const GRID = "#ececec";
export const AXIS = "#8a8a8a";

export function Panel({ title, subtitle, action, children, className }: { title: string; subtitle?: string | undefined; action?: ReactNode; children: ReactNode; className?: string | undefined }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5", className)}>
      <header className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="text-[15px] leading-tight sm:text-base">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/**
 * Veränderung zum Vorzeitraum: Richtung per Pfeil + Vorzeichen.
 * Besser = gefüllt, schlechter = nur Umriss (Bewertung zusätzlich als Text für Screenreader).
 */
export function Delta({ value, goodWhenUp = true, inverted }: { value: number | null; goodWhenUp?: boolean | undefined; inverted?: boolean | undefined }) {
  if (value === null) return <span className={cn("text-xs", inverted ? "text-white/50" : "text-muted-foreground")}>kein Vergleich</span>;
  const rounded = Math.round(value);
  const up = rounded > 0;
  const flat = rounded === 0;
  const good = flat ? null : up === goodWhenUp;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
      inverted ? (good === false ? "border border-white/60 text-white" : "bg-white text-foreground") : flat ? "bg-muted text-muted-foreground" : good === false ? "border border-foreground text-foreground" : "bg-foreground text-background")}>
      <Icon className="size-3" aria-hidden="true" />
      {up ? "+" : ""}
      {rounded.toLocaleString("de-DE")} %<span className="sr-only">{good === null ? "" : good ? " (besser)" : " (schlechter)"}</span>
    </span>
  );
}

export function StatTile({ label, value, delta, hint, goodWhenUp, emphasis }: { label: string; value: string; delta?: number | null | undefined; hint?: string | undefined; goodWhenUp?: boolean | undefined; emphasis?: boolean | undefined }) {
  return (
    <div className={cn("min-w-0 rounded-2xl border p-3.5 sm:p-4", emphasis ? "border-foreground bg-foreground text-white" : "border-border bg-card")}>
      <p className={cn("truncate text-[11px] font-medium uppercase tracking-[0.08em]", emphasis ? "text-white/60" : "text-muted-foreground")}>{label}</p>
      <p className={cn("mt-1.5 truncate font-semibold leading-none tracking-tight", emphasis ? "text-[2rem] sm:text-5xl" : "text-[1.4rem] sm:text-3xl")}>{value}</p>
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-0.5">
        {delta !== undefined && <Delta value={delta} goodWhenUp={goodWhenUp} inverted={emphasis} />}
        {hint && <span className={cn("truncate text-[11px]", emphasis ? "text-white/50" : "text-muted-foreground")}>{hint}</span>}
      </div>
    </div>
  );
}

/** Eine Zeile mit Balken: Name · Wert, darunter der Balken. Für Ranglisten. */
export function MeterRow({ label, value, max, display, sub, color = INK }: { label: string; value: number; max: number; display: string; sub?: string | undefined; color?: string | undefined }) {
  const width = max > 0 ? Math.max(value > 0 ? 2 : 0, (value / max) * 100) : 0;
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
      <span className="min-w-0 truncate text-sm">
        {label}
        {sub && <span className="ml-1.5 text-xs text-muted-foreground">{sub}</span>}
      </span>
      <span className="text-sm font-semibold tabular-nums">{display}</span>
      <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${width}%`, backgroundColor: color }} />
      </span>
    </li>
  );
}

/** Anteile als ein gestapelter Balken mit Legende (höchstens 3 Teile, mit Werten und Prozent). */
export function ShareBar({ parts, format }: { parts: { label: string; value: number }[]; format: (value: number) => string }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  return (
    <div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={parts.map((part) => `${part.label}: ${format(part.value)}`).join(", ")}>
        {total > 0 && parts.map((part, index) => part.value > 0 && (
          <span key={part.label} title={`${part.label}: ${format(part.value)}`} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(part.value / total) * 100}%`, backgroundColor: SERIES[index] }} />
        ))}
      </div>
      <ul className="mt-3 space-y-2">
        {parts.map((part, index) => (
          <li key={part.label} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: SERIES[index] }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{part.label}</span>
            <span className="font-semibold tabular-nums">{format(part.value)}</span>
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{total ? Math.round((part.value / total) * 100) : 0} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cn("h-8 shrink-0 rounded-full border px-3 text-xs font-semibold transition-colors", active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground/80 hover:border-foreground/40")}>
      {children}
    </button>
  );
}

/** Kleine Kennzahl ohne Vergleich (Produkte, Kunden). */
export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-3.5 sm:p-4">
      <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1.5 truncate text-[1.4rem] font-semibold leading-none tracking-tight sm:text-3xl">{value}</p>
    </div>
  );
}
