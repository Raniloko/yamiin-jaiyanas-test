import { Link } from "@tanstack/react-router";
import {
  AlarmClock, AlertTriangle, ArrowRight, BarChart3, Bell, BellOff, Bike, Check, ChevronLeft, Clock3, CreditCard, LogOut, MapPin, Navigation, Phone,
  Printer, Store, Undo2,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { InstallHint } from "@/components/admin/install-hint";
import { OperationsButton, PauseBanner } from "@/components/admin/operations";
import { BrandMark } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminAuth } from "@/lib/admin-auth";
import { euro } from "@/lib/cart-store";
import {
  byDue, dueInfo, isKitchenOrder, itemCount, laneOf, nextStep, paymentInfo, previousStatus, splitItem, STAGE_LABEL, STAGE_TONE, urgencyOf, type Lane,
} from "@/lib/kitchen";
import { orderStore, useOrdersLive, type Order, type OrderStatus } from "@/lib/order-store";
import { cn } from "@/lib/utils";

const LANES: { key: Lane; label: string; icon: typeof Store }[] = [
  { key: "pickup", label: "Abholung", icon: Store },
  { key: "delivery", label: "Lieferung", icon: Bike },
];
const OPEN_STAGES: OrderStatus[] = ["bestaetigt", "zubereitung", "abholbereit"];

/** Statusfarben (immer mit Text): Blau = neu, Orange = in Zubereitung, Grün = fertig/unterwegs. Weiße Schrift erst ab >= 4,5:1. */
const TONE = {
  new: { stripe: "border-l-[#2a78d6]", pill: "bg-[#e8f1fc] text-[#1c4f8c]", button: "bg-[#256abf] hover:bg-[#1c5cab]", dot: "bg-[#2a78d6]" },
  cooking: { stripe: "border-l-[#eb6834]", pill: "bg-[#fdeee6] text-[#9a3a12]", button: "bg-[#c24e20] hover:bg-[#a8431b]", dot: "bg-[#eb6834]" },
  ready: { stripe: "border-l-[#0ca30c]", pill: "bg-[#e7f6e7] text-[#0a6b0a]", button: "bg-[#087508] hover:bg-[#066206]", dot: "bg-[#0ca30c]" },
  done: { stripe: "border-l-border", pill: "bg-muted text-muted-foreground", button: "bg-foreground", dot: "bg-muted-foreground" },
} as const;

function useNow(intervalMs = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

const startOfToday = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

type Chime = "new" | "soon" | "late";

/** Weiche Glockentöne (Sinus mit kurzem Anschlag und langem Ausklingen) – bewusst leise und kurz. */
const CHIMES: Record<Chime, { notes: number[]; gap: number; volume: number }> = {
  new: { notes: [659.3, 987.8], gap: 0.22, volume: 0.16 }, // E5 → H5: "Ding-Dong"
  soon: { notes: [784, 987.8, 1174.7], gap: 0.16, volume: 0.12 }, // G5 H5 D6: leiser Dreiklang
  late: { notes: [523.3, 392], gap: 0.3, volume: 0.18 }, // C5 → G4: tiefer, ernster
};
const REMINDER_MS = 5 * 60000;

function playChime(context: AudioContext, kind: Chime) {
  void context.resume();
  const { notes, gap, volume } = CHIMES[kind];
  notes.forEach((frequency, index) => {
    const start = context.currentTime + index * gap;
    for (const [type, level] of [["sine", 1], ["triangle", 0.25]] as const) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume * level, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.95);
    }
  });
}

/**
 * Hinweise der Küche: Ton + Tab-Titel bei neuen Bestellungen, einmal bei "bald fällig",
 * einmal bei "überfällig" und danach höchstens alle 5 Minuten eine leise Erinnerung.
 * Der Ton braucht einmal einen Klick (Browser-Regel) und wird pro Gerät gemerkt.
 */
function useKitchenAlerts(orders: Order[], now: number) {
  const [sound, setSound] = useState(() => {
    try {
      return localStorage.getItem("yj-kitchen-sound") === "on";
    } catch {
      return false;
    }
  });
  const known = useRef<Set<string>>(new Set());
  // Die Bestellungen kommen kurz nach dem Öffnen aus der Datenbank – in dieser Zeit nicht klingeln.
  const startedAt = useRef(Date.now());
  const audio = useRef<AudioContext | null>(null);
  const alerted = useRef(new Map<string, { soon?: boolean; late?: number }>());
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  const play = (kind: Chime) => {
    if (!sound) return;
    if (!audio.current) audio.current = new AudioContext();
    playChime(audio.current, kind);
  };

  const toggleSound = () => {
    const next = !sound;
    if (next && !audio.current) audio.current = new AudioContext();
    setSound(next);
    try {
      localStorage.setItem("yj-kitchen-sound", next ? "on" : "off");
    } catch {
      /* egal */
    }
    if (next && audio.current) playChime(audio.current, "new");
  };

  // Neue Bestellungen
  useEffect(() => {
    const ids = new Set(orders.map((order) => order.id));
    const added = orders.filter((order) => !known.current.has(order.id) && order.status === "bestaetigt").map((order) => order.id);
    known.current = ids;
    if (Date.now() - startedAt.current < 5000) return; // Anfangsbestand, keine neuen Bestellungen.
    if (added.length === 0) return;
    setFresh((current) => new Set([...current, ...added]));
    play("new");
  }, [orders]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bald fällig / überfällig – höchstens ein Ton pro Prüfung, auch wenn mehrere gleichzeitig dran sind.
  useEffect(() => {
    let chime: Chime | null = null;
    for (const order of orders) {
      const urgency = urgencyOf(order, now);
      const state = alerted.current.get(order.id) ?? {};
      if (urgency === "soon" && !state.soon) {
        state.soon = true;
        chime ??= "soon";
      }
      if (urgency === "late" && (state.late === undefined || now - state.late >= REMINDER_MS)) {
        state.late = now;
        chime = "late";
      }
      alerted.current.set(order.id, state);
    }
    if (chime && Date.now() - startedAt.current >= 5000) play(chime);
  }, [orders, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const newCount = orders.filter((order) => order.status === "bestaetigt").length;
  const lateCount = orders.filter((order) => urgencyOf(order, now) === "late").length;
  useEffect(() => {
    document.title = lateCount ? `⚠ ${lateCount} überfällig – Küche` : newCount ? `(${newCount}) Neue Bestellung – Küche` : "Küche – Yamiin & Jaiyana's";
  }, [newCount, lateCount]);

  return { sound, toggleSound, fresh };
}

export function KitchenBoard() {
  const all = useOrdersLive();
  const now = useNow();
  const today = startOfToday();
  const orders = all.filter(isKitchenOrder);
  const open = orders.filter((order) => order.status !== "abgeholt").sort(byDue);
  const doneToday = orders.filter((order) => order.status === "abgeholt" && order.createdAt >= today).sort((a, b) => b.pickupAt - a.pickupAt);
  const { sound, toggleSound, fresh } = useKitchenAlerts(open, now);
  const [lane, setLane] = useState<Lane>("pickup");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = orders.find((order) => order.id === selectedId) ?? null;
  const counts = (key: Lane) => open.filter((order) => laneOf(order) === key).length;
  const newIn = (key: Lane) => open.filter((order) => laneOf(order) === key && order.status === "bestaetigt").length;
  const urgentIn = (key: Lane, kind: "late" | "soon") => open.filter((order) => laneOf(order) === key && urgencyOf(order, now) === kind).length;
  const late = open.filter((order) => urgencyOf(order, now) === "late").length;
  const soon = open.filter((order) => urgencyOf(order, now) === "soon").length;
  const advance = (order: Order, status: OrderStatus) => orderStore.setStatus(order.id, status);
  const clock = new Date(now).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="admin-theme min-h-dvh pb-10">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[110rem] items-center gap-3 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          <BrandMark className="size-9 grayscale" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl leading-tight">Küche</h1>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 animate-pulse rounded-full bg-[#0ca30c]" aria-hidden="true" />Live · {clock} Uhr</p>
          </div>
          <OperationsButton />
          <button type="button" onClick={toggleSound} aria-pressed={sound} className={cn("flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold", sound ? "border-foreground bg-foreground text-background" : "border-border bg-card")}>
            {sound ? <Bell className="size-4" /> : <BellOff className="size-4" />}<span className="hidden sm:inline">{sound ? "Ton an" : "Ton aus"}</span>
          </button>
          <Link to="/admin" search={{ tab: "orders", range: "today" }} aria-label="Dashboard" className="flex size-10 items-center justify-center rounded-full border border-border bg-card"><BarChart3 className="size-4" /></Link>
          <button type="button" aria-label="Abmelden" onClick={() => void adminAuth.signOut()} className="flex size-10 items-center justify-center rounded-full border border-border bg-card"><LogOut className="size-4" /></button>
        </div>
        {/* Handy & Tablet: Umschalter Abholung / Lieferung */}
        <div className="mx-auto grid max-w-[110rem] grid-cols-2 gap-2 px-3 pb-3 sm:px-6 xl:hidden" role="tablist" aria-label="Bereich">
          {LANES.map((entry) => (
            <button key={entry.key} type="button" role="tab" aria-selected={lane === entry.key} onClick={() => setLane(entry.key)}
              className={cn("relative flex h-14 items-center justify-center gap-2 rounded-2xl border-2 text-base font-semibold transition-colors", lane === entry.key ? "border-foreground bg-foreground text-background" : "border-border bg-card")}>
              <entry.icon className="size-5" />{entry.label}
              <span className={cn("rounded-full px-2 py-0.5 text-sm tabular-nums", lane === entry.key ? "bg-background/20" : "bg-muted")}>{counts(entry.key)}</span>
              {urgentIn(entry.key, "late") > 0 ? (
                <span className="kitchen-pulse-late absolute -right-1 -top-1 rounded-full bg-[#d03b3b] px-2 py-0.5 text-[11px] font-bold text-white">{urgentIn(entry.key, "late")} überfällig</span>
              ) : newIn(entry.key) > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-[#256abf] px-2 py-0.5 text-[11px] font-bold text-white">{newIn(entry.key)} neu</span>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-[110rem] px-3 pt-4 sm:px-6">
        <PauseBanner className="mb-4" />
        <InstallHint app="kitchen" className="mb-4" />
        {(late > 0 || soon > 0) && (
          <div className="mb-4 flex flex-wrap gap-2" role="status" aria-live="polite">
            {late > 0 && <p className="kitchen-pulse-late flex items-center gap-2 rounded-full bg-[#d03b3b] px-4 py-2 text-sm font-bold text-white"><AlarmClock className="size-4" />{late} überfällig</p>}
            {soon > 0 && <p className="kitchen-pulse-soon flex items-center gap-2 rounded-full bg-[#fab219] px-4 py-2 text-sm font-bold text-[#3d2a00]"><Clock3 className="size-4" />{soon} bald fällig (≤ 5 Min)</p>}
          </div>
        )}
        <div className="grid gap-6 xl:grid-cols-2">
          {LANES.map((entry) => (
            <section key={entry.key} aria-label={entry.label} className={cn(lane === entry.key ? "block" : "hidden", "xl:block")}>
              <h2 className="mb-3 hidden items-center gap-2 text-2xl xl:flex"><entry.icon className="size-6" />{entry.label}<span className="rounded-full bg-muted px-2.5 py-0.5 text-base tabular-nums">{counts(entry.key)}</span></h2>
              <Lane lane={entry.key} orders={open.filter((order) => laneOf(order) === entry.key)} now={now} fresh={fresh} onOpen={setSelectedId} onAdvance={advance} />
            </section>
          ))}
        </div>

        {doneToday.length > 0 && (
          <details className="group mt-8 rounded-2xl border border-border bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold marker:hidden">
              <span className="flex items-center gap-2"><Check className="size-4" />Heute erledigt ({doneToday.length})</span>
              <span className="text-xs text-muted-foreground group-open:hidden">anzeigen</span>
            </summary>
            <ul className="divide-y divide-border border-t border-border">
              {doneToday.map((order) => (
                <li key={order.id}>
                  <button type="button" onClick={() => setSelectedId(order.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/60">
                    <span className="font-mono text-xs text-muted-foreground">#{order.id}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{order.contact.name}</span>
                    <span className="text-xs text-muted-foreground">{laneOf(order) === "delivery" ? "Lieferung" : "Abholung"} · {dueInfo(order, now).time}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </main>

      <Sheet open={selected !== null} onOpenChange={(value) => !value && setSelectedId(null)}>
        <SheetContent className="admin-theme w-full overflow-y-auto bg-background p-0 sm:max-w-xl [&>button]:hidden">
          {selected && <OrderDetail order={selected} now={now} onAdvance={(status) => advance(selected, status)} onClose={() => setSelectedId(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Lane({ lane, orders, now, fresh, onOpen, onAdvance }: { lane: Lane; orders: Order[]; now: number; fresh: Set<string>; onOpen: (id: string) => void; onAdvance: (order: Order, status: OrderStatus) => void }) {
  if (orders.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-muted-foreground">
        Keine offenen {lane === "pickup" ? "Abholungen" : "Lieferungen"}.
      </p>
    );
  }
  return (
    <div className="space-y-6">
      {OPEN_STAGES.map((stage) => {
        const list = orders.filter((order) => order.status === stage);
        if (list.length === 0) return null;
        return (
          <div key={stage}>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em]">
              <span className={cn("size-2.5 rounded-full", TONE[STAGE_TONE[stage]].dot)} aria-hidden="true" />
              {STAGE_LABEL[lane][stage]}
              <span className={cn("rounded-full px-2 text-xs tabular-nums", TONE[STAGE_TONE[stage]].pill)}>{list.length}</span>
            </h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {list.map((order) => <OrderCard key={order.id} order={order} now={now} isFresh={fresh.has(order.id)} onOpen={() => onOpen(order.id)} onAdvance={onAdvance} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DueBadge({ order, now, large }: { order: Order; now: number; large?: boolean }) {
  const due = dueInfo(order, now);
  return (
    <div className="text-right">
      <p className={cn("font-semibold leading-none tabular-nums", large ? "text-4xl" : "text-2xl")}>{due.time}</p>
      <p className={cn("mt-1 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
        due.overdue ? "bg-[#d03b3b] text-white" : due.soon ? "bg-[#fab219] text-[#3d2a00]" : "bg-muted text-muted-foreground")}>
        {due.overdue ? <AlertTriangle className="size-3" aria-hidden="true" /> : <Clock3 className="size-3" aria-hidden="true" />}{due.text}
      </p>
    </div>
  );
}

function PaymentBadge({ order, large }: { order: Order; large?: boolean }) {
  const info = paymentInfo(order);
  return info.paid ? (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-[#e7f6e7] font-semibold text-[#0a6b0a]", large ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs")}>
      <Check className="size-3.5" aria-hidden="true" />{info.label}
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border-2 border-[#c98500] bg-[#fff6e0] font-semibold text-[#6b4700]", large ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs")}>
      <CreditCard className="size-3.5" aria-hidden="true" />{euro(order.total)} {info.label}
    </span>
  );
}

function OrderCard({ order, now, isFresh, onOpen, onAdvance }: { order: Order; now: number; isFresh: boolean; onOpen: () => void; onAdvance: (order: Order, status: OrderStatus) => void }) {
  const next = nextStep(order);
  const delivery = laneOf(order) === "delivery";
  const isNew = order.status === "bestaetigt";
  const tone = TONE[STAGE_TONE[order.status]];
  const urgency = urgencyOf(order, now);
  return (
    <article className={cn("flex flex-col overflow-hidden rounded-2xl border border-l-[6px] border-border bg-card shadow-sm", tone.stripe,
      urgency === "late" ? "kitchen-pulse-late border-[#d03b3b]" : urgency === "soon" ? "kitchen-pulse-soon border-[#fab219]" : "",
      isFresh && isNew && "animate-in fade-in zoom-in-95 duration-500")}>
      {urgency && (
        <p className={cn("flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wide", urgency === "late" ? "bg-[#d03b3b] text-white" : "bg-[#fab219] text-[#3d2a00]")}>
          <AlarmClock className="size-3.5" aria-hidden="true" />{urgency === "late" ? "Überfällig – bitte zuerst" : `Bald fällig – in ${Math.max(0, dueInfo(order, now).minutes)} Min`}
        </p>
      )}
      <button type="button" onClick={onOpen} aria-label={`Details zu Bestellung ${order.id}`} className="flex flex-1 flex-col gap-3 p-4 text-left transition-colors hover:bg-muted/40">
        {/* Wer & Wann */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", tone.pill)}>{STAGE_LABEL[laneOf(order)][order.status]}</span>
              <span className="font-mono text-sm font-semibold">#{order.id}</span>
            </div>
            <p className="mt-1 truncate text-lg font-semibold leading-tight">{order.contact.name}</p>
            <p className="text-xs text-muted-foreground">{itemCount(order)} Artikel · bestellt {new Date(order.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <DueBadge order={order} now={now} />
        </div>
        {/* Wo (nur Lieferung) */}
        {delivery && order.address && (
          <p className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-medium"><MapPin className="mt-0.5 size-4 shrink-0" />{order.address.street}, {order.address.zip} {order.address.city}</p>
        )}
        {/* Was */}
        <ul className="space-y-1.5">
          {order.items.map((item) => {
            const { variant, note } = splitItem(item);
            return (
              <li key={item.id} className="text-sm leading-snug">
                <span className="mr-1.5 inline-flex min-w-7 justify-center rounded-md bg-foreground px-1.5 py-0.5 text-xs font-bold text-background tabular-nums">{item.qty}×</span>
                <strong className="font-semibold">{item.name}</strong>
                {variant && <span className="text-muted-foreground"> · {variant}</span>}
                {note && <span className="mt-0.5 block pl-9 text-xs font-semibold text-[#6b4700]">→ {note}</span>}
              </li>
            );
          })}
        </ul>
        {order.note && (
          <p className="flex items-start gap-2 rounded-xl border-2 border-[#c98500] bg-[#fff6e0] px-3 py-2 text-sm text-[#4d3300]"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span><strong>Hinweis:</strong> {order.note}</span></p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <PaymentBadge order={order} />
          <span className="text-xs text-muted-foreground">Details →</span>
        </div>
      </button>
      {next && (
        <Button onClick={() => onAdvance(order, next.status)} className={cn("h-14 rounded-none text-base font-semibold text-white", tone.button)}>
          {next.label}<ArrowRight className="size-5" />
        </Button>
      )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border px-5 py-4">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function OrderDetail({ order, now, onAdvance, onClose }: { order: Order; now: number; onAdvance: (status: OrderStatus) => void; onClose: () => void }) {
  const lane = laneOf(order);
  const delivery = lane === "delivery";
  const next = nextStep(order);
  const back = previousStatus(order.status);
  const steps: OrderStatus[] = ["bestaetigt", "zubereitung", "abholbereit", "abgeholt"];
  const current = steps.indexOf(order.status);
  const payment = paymentInfo(order);
  const mapsUrl = order.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address.street}, ${order.address.zip} ${order.address.city}`)}` : "";

  return (
    <div className="print-receipt flex min-h-full flex-col">
      <SheetHeader className="sticky top-0 z-10 flex-row items-center gap-3 space-y-0 border-b border-border bg-background/95 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-left backdrop-blur print:static">
        <button type="button" onClick={onClose} aria-label="Zurück" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card print:hidden"><ChevronLeft className="size-5" /></button>
        <div className="min-w-0 flex-1">
          <SheetTitle className="font-mono text-xl font-semibold">#{order.id}</SheetTitle>
          <SheetDescription className="flex items-center gap-1.5 text-sm">
            {delivery ? <Bike className="size-4" /> : <Store className="size-4" />}{delivery ? "Lieferung" : "Abholung"} · {STAGE_LABEL[lane][order.status]}
          </SheetDescription>
        </div>
        <Button variant="outline" size="icon" aria-label="Bon drucken" onClick={() => window.print()} className="size-10 rounded-full print:hidden"><Printer className="size-4" /></Button>
      </SheetHeader>

      {/* Fortschritt */}
      <ol className="grid grid-cols-4 gap-1 px-5 pt-4 print:hidden" aria-label="Fortschritt">
        {steps.map((step, index) => (
          <li key={step} className="text-center">
            <span className={cn("block h-1.5 rounded-full", index <= current ? TONE[STAGE_TONE[step]].dot : "bg-muted")} />
            <span className={cn("mt-1.5 block text-[11px] font-semibold", index === current ? "text-foreground" : "text-muted-foreground")}>{STAGE_LABEL[lane][step]}</span>
          </li>
        ))}
      </ol>

      <div className="flex-1">
        <Section title="Wann">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-base font-semibold">{order.pickupLabel}</p>
              <p className="text-sm text-muted-foreground">Bestellt um {new Date(order.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</p>
            </div>
            <DueBadge order={order} now={now} large />
          </div>
        </Section>

        <Section title="Wer">
          <p className="text-xl font-semibold">{order.contact.name}</p>
          <div className="mt-3 flex flex-wrap gap-2 print:hidden">
            <a href={`tel:${order.contact.phone}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background"><Phone className="size-4" />{order.contact.phone}</a>
          </div>
          <p className="mt-2 hidden text-sm print:block">Tel. {order.contact.phone}</p>
          {order.contact.email && <p className="mt-2 break-all text-sm text-muted-foreground">{order.contact.email}</p>}
        </Section>

        <Section title="Wo">
          {delivery && order.address ? (
            <>
              <p className="text-lg font-semibold leading-snug">{order.address.street}<br />{order.address.zip} {order.address.city}</p>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-11 items-center gap-2 rounded-full border border-foreground px-4 text-sm font-semibold print:hidden"><Navigation className="size-4" />Route in Google Maps</a>
            </>
          ) : (
            <p className="flex items-center gap-2 text-lg font-semibold"><Store className="size-5" />Abholung im Laden</p>
          )}
        </Section>

        <Section title={`Was · ${itemCount(order)} Artikel`}>
          <ul className="divide-y divide-border">
            {order.items.map((item) => {
              const { variant, note } = splitItem(item);
              return (
                <li key={item.id} className="flex gap-3 py-3">
                  <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-foreground px-2 text-base font-bold text-background tabular-nums">{item.qty}×</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-tight">{item.name}</p>
                    {variant && <p className="mt-0.5 text-sm text-muted-foreground">{variant}</p>}
                    {note && <p className="mt-1 rounded-lg bg-[#fff6e0] px-2 py-1 text-sm font-semibold text-[#4d3300]">→ {note}</p>}
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{euro(item.price * item.qty)}</span>
                </li>
              );
            })}
          </ul>
        </Section>

        {order.note && (
          <Section title="Hinweis an die Küche">
            <p className="flex items-start gap-2 rounded-xl border-2 border-[#c98500] bg-[#fff6e0] px-3 py-2.5 text-base font-medium text-[#4d3300]"><AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />{order.note}</p>
          </Section>
        )}

        <Section title="Zahlung">
          <div className="flex items-center justify-between gap-3">
            <PaymentBadge order={order} large />
            <p className="text-right"><span className="block text-2xl font-semibold tabular-nums">{euro(order.total)}</span>{(order.deliveryFee ?? 0) > 0 && <span className="text-xs text-muted-foreground">inkl. {euro(order.deliveryFee ?? 0)} Lieferung</span>}</p>
          </div>
          {!payment.paid && <p className="mt-2 text-sm text-muted-foreground">Noch nicht bezahlt – {delivery ? "bar oder mit Karte an der Haustür" : "bar oder mit Karte an der Theke"} kassieren.</p>}
        </Section>
      </div>

      {/* Aktionen – immer unten sichtbar */}
      <div className="sticky bottom-0 space-y-2 border-t border-border bg-background/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur print:hidden">
        {next ? (
          <Button onClick={() => onAdvance(next.status)} className={cn("h-14 w-full rounded-2xl text-base font-semibold text-white", TONE[STAGE_TONE[order.status]].button)}>{next.label}<ArrowRight className="size-5" /></Button>
        ) : (
          <p className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-muted font-semibold"><Check className="size-5" />{delivery ? "Zugestellt" : "Abgeholt"}</p>
        )}
        {back && (
          <Button variant="ghost" onClick={() => onAdvance(back)} className="h-10 w-full text-sm text-muted-foreground">
            <Undo2 className="size-4" />Zurück auf „{STAGE_LABEL[lane][back]}“
          </Button>
        )}
      </div>
    </div>
  );
}
