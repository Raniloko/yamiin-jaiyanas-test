import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { blockedReason, useAvailability } from "@/lib/availability";
import { cart, euro, useCart, type CartItem } from "@/lib/cart-store";

const HIDDEN_ON = ["/checkout", "/kitchen", "/order-success", "/admin"];
const EASE = "duration-500 ease-[cubic-bezier(.32,.72,0,1)] motion-reduce:transition-none";

export function CartDock() {
  const { items, count, total, drawerOpen } = useCart();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hidden = HIDDEN_ON.includes(pathname);
  const expanded = pathname === "/speisekarte";
  const goCheckout = () => {
    cart.openDrawer(false);
    navigate({ to: "/checkout" });
  };

  return (
    <>
      {!hidden && (
        <div
          className={`pointer-events-none fixed inset-x-3 bottom-3 z-40 flex justify-end transition-[opacity,transform] ${EASE} md:inset-x-auto md:right-6 md:bottom-6 ${count > 0 ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"}`}
          role="toolbar"
          aria-label="Warenkorb"
        >
          <div
            className={`pointer-events-auto flex items-center overflow-hidden border border-white/10 bg-[#1f2022]/95 text-[#f8f6f0] shadow-2xl shadow-[#1f2022]/30 backdrop-blur-md transition-[width,height,border-radius,padding] ${EASE} ${expanded ? "h-[4.5rem] w-full rounded-2xl px-2 md:w-[26rem]" : "h-16 w-16 rounded-[2rem] px-0"}`}
          >
            <button
              type="button"
              onClick={() => (expanded ? cart.openDrawer() : navigate({ to: "/speisekarte" }))}
              aria-label={`Warenkorb öffnen, ${count} Artikel`}
              className={`flex h-14 min-w-0 grow items-center rounded-xl text-left outline-none transition-[padding,gap,transform] ${EASE} active:scale-[.96] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#d9946d] ${expanded ? "gap-3 px-2" : "justify-center gap-0 px-3"}`}
            >
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[#c46b38] text-white">
                <ShoppingBag className="size-5" />
                <span key={count} className="absolute -right-1 -top-1 flex size-5 animate-in zoom-in-50 items-center justify-center rounded-full bg-[#f8f6f0] text-[10px] font-bold text-[#1f2022] duration-300">
                  {count}
                </span>
              </span>
              <span className={`min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] ${EASE} ${expanded ? "max-w-[10rem] translate-x-0 opacity-100" : "max-w-0 -translate-x-2 opacity-0"}`}>
                <span className="block text-sm font-semibold">{count} {count === 1 ? "Artikel" : "Artikel"}</span>
                <span className="block text-xs text-[#cfc2b5]">{euro(total)}</span>
              </span>
            </button>
            <Button
              type="button"
              tabIndex={expanded ? 0 : -1}
              onClick={goCheckout}
              className={`h-12 shrink-0 overflow-hidden whitespace-nowrap rounded-xl bg-[#f8f6f0] font-bold text-[#1f2022] transition-[max-width,padding,opacity,transform] ${EASE} hover:bg-[#d9946d] ${expanded ? "max-w-[9rem] translate-x-0 px-4 opacity-100" : "pointer-events-none max-w-0 translate-x-2 px-0 opacity-0"}`}
            >
              Zur Kasse <ArrowRight className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Sheet open={drawerOpen} onOpenChange={(open) => cart.openDrawer(open)}>
        <SheetContent className="flex w-full flex-col gap-0 border-l-[#d9cec0] bg-[#fffaf4] p-0 sm:max-w-md [&>button]:hidden">
          <SheetHeader className="flex-row items-center justify-between gap-4 border-b border-[#eadfd2] px-6 py-5 text-left">
            <div>
              <SheetTitle className="font-display text-3xl">Dein Warenkorb</SheetTitle>
              <SheetDescription>{count ? `${count} Artikel · Abholung oder Lieferung in Hanau` : "Noch ist dein Warenkorb leer."}</SheetDescription>
            </div>
            <Button type="button" variant="outline" size="icon" aria-label="Warenkorb schließen" onClick={() => cart.openDrawer(false)} className="shrink-0 rounded-full border-[#d9cec0]">
              <X />
            </Button>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center text-[#6f675f]">
              <span className="flex size-16 items-center justify-center rounded-full bg-[#f1e8dc]"><ShoppingBag className="size-7 text-[#a85b39]" /></span>
              <p>Füge deine Favoriten hinzu – zum Abholen oder liefern lassen.</p>
              <Button onClick={() => { cart.openDrawer(false); navigate({ to: "/speisekarte" }); }} className="rounded-full bg-[#292725] text-white hover:bg-[#a85b39]">Zur Speisekarte</Button>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-[#eadfd2] overflow-y-auto px-6">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-4">
                    <img src={item.image} alt="" className="size-20 shrink-0 rounded-xl bg-[#f1e8dc] object-contain p-1" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{item.name}</p>
                          <p className="line-clamp-2 text-xs text-[#6f675f]">{item.detail}</p>
                          <BlockedNote item={item} />
                        </div>
                        <button type="button" onClick={() => cart.remove(item.id)} aria-label={`${item.name} entfernen`} className="rounded-full p-1.5 text-[#a85b39] transition-colors hover:bg-[#f1e8dc]">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center rounded-full border border-[#d9cec0] bg-white">
                          <button type="button" onClick={() => cart.change(item.id, -1)} aria-label="Weniger" className="flex size-8 items-center justify-center rounded-full hover:bg-[#f1e8dc]"><Minus className="size-3.5" /></button>
                          <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                          <button type="button" onClick={() => cart.change(item.id, 1)} aria-label="Mehr" className="flex size-8 items-center justify-center rounded-full hover:bg-[#f1e8dc]"><Plus className="size-3.5" /></button>
                        </div>
                        <strong>{euro(item.price * item.qty)}</strong>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[#d9cec0] bg-[#f8f2ea] px-6 pb-6 pt-5">
                <p className="text-sm text-[#6f675f]">Abholung oder Lieferung wählst du an der Kasse.</p>
                <div className="mt-2 flex justify-between text-lg font-bold"><span>Zwischensumme</span><span>{euro(total)}</span></div>
                <p className="text-xs text-[#6f675f]">inkl. MwSt.</p>
                <Button onClick={goCheckout} className="mt-4 h-12 w-full rounded-full bg-[#292725] text-white hover:bg-[#a85b39]">Zur Kasse · {euro(total)} <ArrowRight className="ml-1" /></Button>
                <Button type="button" variant="ghost" onClick={() => cart.openDrawer(false)} className="mt-2 h-10 w-full rounded-full">Weiter einkaufen</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Nur im geöffneten Warenkorb – so hält nicht jede Seite eine Live-Verbindung offen. */
function BlockedNote({ item }: { item: CartItem }) {
  const reason = blockedReason(useAvailability(), item.ref);
  return reason ? <p className="text-xs font-semibold text-[#b4432f]">Leider {reason}</p> : null;
}
