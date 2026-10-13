import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
      openButtonRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
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

          {/* Smartphone: Hamburger */}
          <Button
            type="button"
            ref={openButtonRef}
            variant="ghost"
            size="icon"
            aria-label="Menü öffnen"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="size-11 rounded-full border border-border bg-card text-foreground shadow-none hover:bg-muted md:hidden"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      {/* Slide-in-Menü nur auf dem Smartphone */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-[2px] md:hidden"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <aside
            aria-label="Hauptmenü"
            className="fixed right-0 top-0 z-50 flex h-dvh w-[min(92vw,34rem)] flex-col border-l border-border bg-background px-6 py-6 shadow-2xl animate-in slide-in-from-right duration-300 sm:px-10 sm:py-8 md:hidden"
          >
        <div className="flex items-center justify-between border-b border-border pb-6">
          <span className="font-display text-sm uppercase">Navigation</span>
          <Button
            type="button"
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            aria-label="Menü schließen"
            onClick={() => setOpen(false)}
            className="size-11 rounded-md border-2 border-border bg-background shadow-[3px_3px_0_var(--foreground)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--foreground)] active:translate-x-1 active:translate-y-1 active:shadow-none hover:[&_svg]:rotate-90"
          >
            <X className="size-5" strokeWidth={1.5} />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col justify-center gap-1">
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`menu-link group border-b border-border py-4 font-display text-3xl leading-none outline-none hover:pl-3 hover:text-secondary focus-visible:pl-3 sm:text-5xl ${open ? "menu-link-open" : ""}`}
              activeProps={{ className: "opacity-50" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button asChild size="lg" className="h-14 w-full rounded-full bg-foreground font-semibold text-background shadow-none hover:bg-secondary">
          <a href={LIEFERANDO} target="_blank" rel="noreferrer">
            Jetzt bestellen
          </a>
        </Button>
      </aside>
        </>
      )}
    </>
  );
}
