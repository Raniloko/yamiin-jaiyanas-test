import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Diagrammfarben: Kupfer (Marke) · Blau · Türkis – mit dem Palette-Validator geprüft (alle Paare, auch bei
 * Farbsehschwäche unterscheidbar). Türkis liegt knapp unter 3:1 auf Weiß, darum tragen Legende mit Werten
 * und 2px-Lücken immer mit. Reihenfolge fest, nie rotieren.
 */
export const SERIES = ["#c46b38", "#2a78d6", "#1baf7a"] as const;
/** Geld (Umsatz) in Kupfer, Anzahlen (Bestellungen, Besucher) in Blau – in jedem Diagramm gleich. */
export const MONEY = SERIES[0];
export const COUNT = SERIES[1];
export const GRID = "#efe7dc";
export const AXIS = "#8f857b";

/** Kennzahl-Kacheln: Farbe kennzeichnet nur die Kachel (Symbol), die Zahl bleibt in Textfarbe. */
export const TONES = {
  copper: "bg-[#c46b38]/12 text-[#a9542a]",
  blue: "bg-[#2a78d6]/12 text-[#1f62b5]",
  green: "bg-[#1baf7a]/14 text-[#11805a]",
  violet: "bg-[#6250d6]/12 text-[#5141bd]",
  amber: "bg-[#eda100]/16 text-[#8a5a00]",
  rose: "bg-[#e87ba4]/16 text-[#b03f6b]",
} as const;
export type Tone = keyof typeof TONES;

export function Panel({ title, subtitle, action, children, className }: { title: string; subtitle?: string | undefined; action?: ReactNode; children: ReactNode; className?: string | undefined }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(31_32_34/0.04)] sm:p-5", className)}>
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
 * Veränderung zum Vorzeitraum: Richtung per Pfeil + Vorzeichen, besser = grün, schlechter = rot
 * (Farbe nie allein – Pfeil, Vorzeichen und Screenreader-Text tragen mit).
 */
export function Delta({ value, goodWhenUp = true, inverted }: { value: number | null; goodWhenUp?: boolean | undefined; inverted?: boolean | undefined }) {
  if (value === null) return <span className={cn("text-xs", inverted ? "text-white/80" : "text-muted-foreground")}>kein Vergleich</span>;
  const rounded = Math.round(value);
  const up = rounded > 0;
  const flat = rounded === 0;
  const good = flat ? null : up === goodWhenUp;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
      inverted ? (good === false ? "bg-black/20 text-white ring-1 ring-white/50" : "bg-white text-[#06660a]") : flat ? "bg-muted text-muted-foreground" : good === false ? "bg-[#fdecec] text-[#a32b2b]" : "bg-[#e5f5e5] text-[#06660a]")}>
      <Icon className="size-3" aria-hidden="true" />
      {up ? "+" : ""}
      {rounded.toLocaleString("de-DE")} %<span className="sr-only">{good === null ? "" : good ? " (besser)" : " (schlechter)"}</span>
    </span>
  );
}

export function StatTile({ label, value, delta, hint, goodWhenUp, emphasis, icon: Icon, tone = "copper" }: { label: string; value: string; delta?: number | null | undefined; hint?: string | undefined; goodWhenUp?: boolean | undefined; emphasis?: boolean | undefined; icon?: LucideIcon | undefined; tone?: Tone | undefined }) {
  return (
    <div className={cn("relative min-w-0 overflow-hidden rounded-2xl border p-3.5 sm:p-4",
      emphasis ? "border-transparent bg-[linear-gradient(135deg,#a9542a_0%,#c46b38_55%,#de8a55_100%)] text-white shadow-lg shadow-[#c46b38]/25" : "border-border bg-card shadow-[0_1px_2px_rgb(31_32_34/0.04)]")}>
      {emphasis && <span className="pointer-events-none absolute -right-10 -top-16 size-44 rounded-full bg-[radial-gradient(circle,rgb(245_195_166/0.55),transparent_70%)]" aria-hidden="true" />}
      <div className="relative flex min-h-8 items-start justify-between gap-2">
        <p className={cn("line-clamp-2 text-[11px] font-medium uppercase leading-snug tracking-[0.08em]", emphasis ? "text-white/80" : "text-muted-foreground")}>{label}</p>
        {Icon && <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8", emphasis ? "bg-white/20 text-white" : TONES[tone])} aria-hidden="true"><Icon className="size-4" /></span>}
      </div>
      <p className={cn("relative mt-1.5 truncate font-semibold leading-none tracking-tight", emphasis ? "text-[2rem] sm:text-5xl" : "text-[1.4rem] sm:text-3xl")}>{value}</p>
      <div className="relative mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-0.5">
        {delta !== undefined && <Delta value={delta} goodWhenUp={goodWhenUp} inverted={emphasis} />}
        {hint && <span className={cn("truncate text-[11px]", emphasis ? "text-white/75" : "text-muted-foreground")}>{hint}</span>}
      </div>
    </div>
  );
}

/** Eine Zeile mit Balken: Name · Wert, darunter der Balken. Für Ranglisten. */
export function MeterRow({ label, value, max, display, sub, color = MONEY }: { label: string; value: number; max: number; display: string; sub?: string | undefined; color?: string | undefined }) {
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
    <button type="button" aria-pressed={active} onClick={onClick} className={cn("h-8 shrink-0 rounded-full border px-3 text-xs font-semibold transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/80 hover:border-primary/50")}>
      {children}
    </button>
  );
}

/** Kleine Kennzahl ohne Vergleich (Produkte, Kunden). */
export function MiniStat({ label, value, icon: Icon, tone = "copper" }: { label: string; value: string; icon?: LucideIcon | undefined; tone?: Tone | undefined }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-3.5 shadow-[0_1px_2px_rgb(31_32_34/0.04)] sm:p-4">
      <div className="flex min-h-8 items-start justify-between gap-2">
        <p className="line-clamp-2 text-[11px] font-medium uppercase leading-snug tracking-[0.08em] text-muted-foreground">{label}</p>
        {Icon && <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8", TONES[tone])} aria-hidden="true"><Icon className="size-4" /></span>}
      </div>
      <p className="mt-1.5 truncate text-[1.4rem] font-semibold leading-none tracking-tight sm:text-3xl">{value}</p>
    </div>
  );
}
