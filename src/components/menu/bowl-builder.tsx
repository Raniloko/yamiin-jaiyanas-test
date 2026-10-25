// "Bowl selbst bauen": eigene Bowl Schritt für Schritt zusammenstellen und in den Warenkorb legen.
// Preis und Prüfung kommen aus menu-pricing.ts – derselbe Rechenweg läuft beim Bezahlen auf dem Server.
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics";
import { blockedReason, isSoldOut, itemKey, optionKey, useAvailability } from "@/lib/availability";
import { cart, euro } from "@/lib/cart-store";
import { bowlSteps, customBowl, parseMenuPrice } from "@/lib/menu-data";
import { CUSTOM_STEPS, customDetail, priceOf, type CustomPicks, type MenuRef } from "@/lib/menu-pricing";

const legend = "text-sm font-semibold";
const chip = (active: boolean) =>
  `rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 disabled:line-through disabled:active:scale-100 ${active ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-secondary"}`;

/** "1 inklusive, jedes weitere 3,50 €" */
function stepRule(included: number | null, extraPrice: string | null) {
  const free = included ? `${included} inklusive` : "";
  const extra = extraPrice ? `jedes weitere ${extraPrice}` : "";
  return [free, extra].filter(Boolean).join(", ");
}

/** "2 von 3 inklusive" bzw. "3 inklusive + 1 extra (+0,80 €)" */
function stepCount(count: number, included: number | null, extraPrice: string | null) {
  const free = included ?? 0;
  if (count <= free) return `${count} von ${free} inklusive`;
  const extra = count - free;
  return `${free} inklusive + ${extra} extra (+${euro(extra * parseMenuPrice(extraPrice ?? "0"))})`;
}

/** Wird nur gerendert, solange es offen ist – so startet jede Zusammenstellung frisch. */
export function BowlBuilder({ onClose }: { onClose: () => void }) {
  const availability = useAvailability();
  const optionOut = (value: string) => isSoldOut(availability, optionKey(value));
  const bases = bowlSteps[0]?.items ?? [];
  const [size, setSize] = useState<"small" | "large">("small");
  const [base, setBase] = useState(() => bases.find((value) => !optionOut(value)) ?? bases[0] ?? "");
  const [picks, setPicks] = useState<CustomPicks>({});
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);

  const ref: MenuRef = { kind: "custom", name: customBowl.name, size, base, picks };
  const hasProtein = (picks["protein"]?.length ?? 0) > 0;
  const price = (priceOf(ref) ?? 0) / 100;
  const blocked = isSoldOut(availability, itemKey(customBowl.name)) ? "ausverkauft" : blockedReason(availability, ref);

  const toggle = (stepId: string, value: string) =>
    setPicks((current) => {
      const list = current[stepId] ?? [];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...current, [stepId]: next };
    });

  const add = () => {
    if (blocked || !hasProtein) return;
    const trimmed = note.trim();
    // Reihenfolge wie auf der Speisekarte, damit gleiche Bowls im Warenkorb zusammenfallen.
    const ordered: CustomPicks = {};
    for (const step of CUSTOM_STEPS) {
      const list = step.items.filter((item) => picks[step.id]?.includes(item));
      if (list.length) ordered[step.id] = list;
    }
    const finalRef: MenuRef = { ...ref, picks: ordered };
    const detail = customDetail(finalRef);
    track("add_to_cart", { item: customBowl.name, category: "create", variant: detail, qty, value: price * qty });
    cart.add({
      id: `${customBowl.name}-${detail}-${trimmed}`,
      name: customBowl.name,
      detail: `${detail}${trimmed ? ` · ${trimmed}` : ""}`,
      price,
      qty,
      image: "",
      ref: finalRef,
      ...(trimmed ? { note: trimmed } : {}),
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="bottom-0 top-auto flex max-h-[92dvh] w-full max-w-none translate-y-0 flex-col gap-0 overflow-hidden rounded-t-3xl border-0 p-0 max-sm:data-[state=open]:slide-in-from-bottom-1/2 sm:bottom-auto sm:top-[50%] sm:max-h-[88vh] sm:max-w-2xl sm:translate-y-[-50%] sm:rounded-2xl [&>button]:z-10 [&>button]:flex [&>button]:size-9 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-card/90 [&>button]:opacity-100 [&>button]:shadow-sm">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-6 sm:px-8 sm:pt-8">
          <DialogHeader className="space-y-2 pr-10 text-left">
            <DialogTitle className="font-display text-3xl font-normal leading-tight sm:text-4xl">Bowl selbst bauen</DialogTitle>
            <DialogDescription className="text-sm leading-6">
              Wähle Schritt für Schritt aus. Klein {customBowl.small}, Groß {customBowl.large} – Extras über die inklusive Menge kosten Aufpreis.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col gap-7">
            <fieldset>
              <legend className={`${legend} mb-2.5`}>Größe</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["small", "large"] as const).map((value) => (
                  <button key={value} type="button" aria-pressed={size === value} onClick={() => setSize(value)} className={`flex flex-col items-start rounded-2xl border-2 px-4 py-3 text-left transition-all duration-200 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${size === value ? "border-secondary bg-secondary/10" : "border-border bg-card hover:border-secondary/50"}`}>
                    <span className="text-sm font-semibold">{value === "small" ? "Klein" : "Groß"}</span>
                    <span className="text-sm text-muted-foreground">{customBowl[value]}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={`${legend} mb-2.5`}><span className="mr-2 font-display text-lg text-secondary">{bowlSteps[0]?.number}</span>{bowlSteps[0]?.title}</legend>
              <div className="flex flex-wrap gap-2">
                {bases.map((value) => (
                  <button key={value} type="button" aria-pressed={base === value} disabled={optionOut(value)} onClick={() => setBase(value)} className={chip(base === value)}>
                    {value}{optionOut(value) && " (ausverkauft)"}
                  </button>
                ))}
              </div>
            </fieldset>

            {CUSTOM_STEPS.map((step) => {
              const selected = picks[step.id] ?? [];
              return (
                <fieldset key={step.id}>
                  <legend className="mb-2.5 flex w-full flex-wrap items-baseline justify-between gap-x-3">
                    <span className={legend}><span className="mr-2 font-display text-lg text-secondary">{step.number}</span>{step.title}</span>
                    <span className="text-xs text-muted-foreground">{stepRule(step.included, step.extraPrice)}</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {step.items.map((value) => (
                      <button key={value} type="button" aria-pressed={selected.includes(value)} disabled={optionOut(value) && !selected.includes(value)} onClick={() => toggle(step.id, value)} className={chip(selected.includes(value))}>
                        {value}{optionOut(value) && " (ausverkauft)"}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
                    {step.id === "protein" && !hasProtein ? "Bitte mindestens ein Protein wählen." : stepCount(selected.length, step.included, step.extraPrice)}
                  </p>
                </fieldset>
              );
            })}

            <div>
              <Label htmlFor="bowl-note" className={legend}>Notiz an die Küche</Label>
              <Textarea id="bowl-note" className="mt-2.5 min-h-16 bg-card" placeholder="z. B. Sauce extra dazu" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </div>
        </div>

        {/* Immer sichtbare Aktionsleiste */}
        <div className="flex items-center gap-3 border-t border-border bg-background/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-8">
          <div className="flex shrink-0 items-center rounded-full border border-border bg-card">
            <button type="button" aria-label="Weniger" disabled={qty === 1} onClick={() => setQty((current) => Math.max(1, current - 1))} className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-40"><Minus className="size-4" /></button>
            <span className="w-6 text-center font-semibold tabular-nums" aria-live="polite">{qty}</span>
            <button type="button" aria-label="Mehr" disabled={qty >= 20} onClick={() => setQty((current) => Math.min(20, current + 1))} className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-40"><Plus className="size-4" /></button>
          </div>
          {blocked || !hasProtein ? (
            <Button disabled className="h-12 min-w-0 flex-1 rounded-full text-base font-semibold first-letter:uppercase">{blocked ?? "Protein wählen"}</Button>
          ) : (
            <Button className="h-12 min-w-0 flex-1 justify-between rounded-full bg-secondary px-5 text-base font-semibold text-secondary-foreground hover:bg-secondary/90" aria-label={`In den Warenkorb, ${euro(price * qty)}`} onClick={add}>
              <span className="truncate"><span className="sm:hidden">Hinzufügen</span><span className="hidden sm:inline">In den Warenkorb</span></span>
              <span className="shrink-0 tabular-nums">{euro(price * qty)}</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
