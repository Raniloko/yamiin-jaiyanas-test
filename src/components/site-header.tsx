import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Startseite" },
  { to: "/speisekarte", label: "Speisekarte" },
  { to: "/ueber-uns", label: "Über uns" },
  { to: "/kontakt", label: "Besuch & Kontakt" },
] as const;

const LIEFERANDO = "https://www.lieferando.de/speisekarte/yamiin-jaiyanas-healthy-fastfood";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <header className={`sticky top-0 border-b border-border bg-background/95 backdrop-blur-md ${open ? "z-[60]" : "z-40"}`}>
        <div className="mx-auto flex h-18 max-w-[90rem] items-center justify-between px-4 sm:h-20 sm:px-8">
          <Link to="/" aria-label="Yamiin und Jaiyana's Startseite" className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <BrandMark className="size-11 transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-105 sm:size-12" />
            <span className="flex flex-col leading-none md:hidden xl:flex">
              <span className="whitespace-nowrap text-sm font-bold uppercase sm:text-base">Yamiin &amp; Jaiyana&rsquo;s</span>
              <span className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] opacity-70">Healthy Fastfood</span>
            </span>
          </Link>

          {/* Tablet & Desktop: horizontale Navigation statt Hamburger */}
          <nav aria-label="Hauptnavigation" className="hidden items-center gap-0.5 md:flex lg:gap-1">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group relative whitespace-nowrap px-2 py-2 text-xs font-semibold outline-none transition-colors duration-200 hover:text-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:px-3 lg:text-sm"
                activeProps={{ className: "text-secondary underline decoration-secondary decoration-2 underline-offset-8" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                <span className="relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5">
                  {item.label}
                </span>
              </Link>
            ))}
            <Button
              asChild
              className="ml-3 h-11 rounded-full bg-foreground px-5 font-semibold text-background shadow-none hover:-translate-y-0.5 hover:bg-secondary active:translate-y-0"
            >
              <a href={LIEFERANDO} target="_blank" rel="noreferrer">
                Jetzt bestellen
              </a>
            </Button>
          </nav>

          {/* Smartphone: Hamburger mit animiertem Icon */}
          <button
            type="button"
            ref={openButtonRef}
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((current) => !current)}
            className="relative flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground outline-none transition-[background-color,transform] duration-200 hover:bg-muted active:scale-95 focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            <span className="relative block h-3 w-5" aria-hidden="true">
              <span className={`absolute left-0 h-[2px] w-5 rounded-full bg-current transition-[top,transform] duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${open ? "top-[5px] rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-[2px] rounded-full bg-current transition-[top,transform,width] duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${open ? "top-[5px] w-5 -rotate-45" : "top-[10px] w-3.5"}`} />
            </span>
          </button>
        </div>
      </header>

      {/* Slide-in-Menü nur auf dem Smartphone */}
      <div
        className={`fixed inset-0 z-50 bg-foreground/50 backdrop-blur-[2px] transition-opacity duration-500 ease-[cubic-bezier(.32,.72,0,1)] md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <aside
        id="mobile-menu"
        aria-label="Hauptmenü"
        aria-hidden={!open}
        inert={!open}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[min(88vw,26rem)] flex-col rounded-l-3xl bg-background px-6 pb-6 pt-24 shadow-2xl transition-[transform,visibility] duration-500 ease-[cubic-bezier(.32,.72,0,1)] motion-reduce:transition-none md:hidden ${open ? "visible translate-x-0" : "invisible translate-x-full"}`}
      >
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Navigation</span>
        <nav className="mt-4 flex flex-1 flex-col gap-1">
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`menu-link group flex items-center justify-between border-b border-border py-4 font-display text-3xl leading-none outline-none hover:text-secondary focus-visible:text-secondary ${open ? "menu-link-open" : ""}`}
              activeProps={{ className: "text-secondary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
              <span className="text-lg opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-1 group-hover:opacity-100">→</span>
            </Link>
          ))}
        </nav>

        <Button asChild size="lg" className={`menu-link h-14 w-full rounded-full bg-foreground font-semibold text-background shadow-none hover:bg-secondary ${open ? "menu-link-open" : ""}`}>
          <a href={LIEFERANDO} target="_blank" rel="noreferrer">
            Jetzt bestellen
          </a>
        </Button>
      </aside>
    </>
  );
}
