import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";

import { formatEuro, formatNumber } from "@/lib/admin-metrics";
import { AXIS, GRID, INK } from "./ui";

type Row = Record<string, string | number>;

function ChartTooltip({ active, payload, label, rows }: TooltipProps<number, string> & { rows: { key: string; name: string; format: (value: number) => string }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as Row | undefined;
  if (!point) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-muted-foreground">{label}</p>
      {rows.map((row) => (
        <p key={row.key} className="flex items-center gap-2">
          <strong className="text-sm tabular-nums">{row.format(Number(point[row.key] ?? 0))}</strong>
          <span className="text-muted-foreground">{row.name}</span>
        </p>
      ))}
    </div>
  );
}

const axisProps = { stroke: AXIS, fontSize: 11, tickLine: false, axisLine: false } as const;
const compactEuro = (value: number) => (value >= 1000 ? `${(value / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })}k €` : `${Math.round(value)} €`);

/** Umsatz pro Tag/Stunde (Säulen, eine Reihe) – Tooltip zeigt Umsatz und Bestellungen. */
export function RevenueChart({ data }: { data: { label: string; revenue: number; orders: number }[] }) {
  return (
    <div className="-ml-2 h-44 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={18} />
          <YAxis {...axisProps} width={48} tickFormatter={compactEuro} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(17,17,17,0.05)" }} content={<ChartTooltip rows={[{ key: "revenue", name: "Umsatz", format: formatEuro }, { key: "orders", name: "Bestellungen", format: formatNumber }]} />} />
          <Bar dataKey="revenue" name="Umsatz" fill={INK} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Bestellungen nach Uhrzeit (Stoßzeiten). */
export function HourChart({ data }: { data: { label: string; orders: number }[] }) {
  return (
    <div className="-ml-2 h-44 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" {...axisProps} tickFormatter={(value: string) => `${value} h`} />
          <YAxis {...axisProps} width={28} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(17,17,17,0.05)" }} content={<ChartTooltip rows={[{ key: "orders", name: "Bestellungen", format: formatNumber }]} />} labelFormatter={(value) => `${value}:00 – ${Number(value) + 1}:00 Uhr`} />
          <Bar dataKey="orders" fill={INK} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Besucher der Speisekarte pro Tag (eine Linie). */
export function VisitorsChart({ data }: { data: { label: string; visitors: number; orders: number }[] }) {
  return (
    <div className="-ml-2 h-44 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={18} />
          <YAxis {...axisProps} width={28} allowDecimals={false} />
          <Tooltip cursor={{ stroke: AXIS, strokeWidth: 1 }} content={<ChartTooltip rows={[{ key: "visitors", name: "Besucher", format: formatNumber }, { key: "orders", name: "mit Bestellung", format: formatNumber }]} />} />
          <Line type="monotone" dataKey="visitors" stroke={INK} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#ffffff", strokeWidth: 2 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
