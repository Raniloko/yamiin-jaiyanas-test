import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import logoAsset from "@/assets/yj-logo.jpeg.asset.json";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Startseite" },
  { to: "/speisekarte", label: "Speisekarte" },
  { to: "/ueber-uns", label: "Über uns" },
  { to: "/kontakt", label: "Besuch & Kontakt" },
] as const;

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
      <header className="sticky top-0 z-40 border-b-2 border-border bg-background">
        <div className="mx-auto flex h-18 max-w-[90rem] items-center justify-between px-4 sm:h-20 sm:px-8">
          <Link to="/" aria-label="Yamiin und Jaiyana's Startseite" className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt="YJ Logo"
              className="size-11 rounded-full border-2 border-border object-cover grayscale sm:size-12"
            />
            <span className="hidden font-display text-sm uppercase sm:block">Yamiin &amp; Jaiyana&rsquo;s</span>
          </Link>
          <Button
            type="button"
            ref={openButtonRef}
            variant="ghost"
            size="icon"
            aria-label="Menü öffnen"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="size-11 rounded-md border-2 border-border bg-secondary text-secondary-foreground shadow-[4px_4px_0_var(--foreground)] hover:bg-secondary/90"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-foreground/70 transition-opacity duration-300 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <aside
        aria-label="Hauptmenü"
        aria-hidden={!open}
        inert={!open}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[min(92vw,34rem)] flex-col border-l-2 border-border bg-secondary px-6 py-6 shadow-2xl transition-transform duration-500 ease-out sm:px-10 sm:py-8 ${open ? "translate-x-0" : "translate-x-full"}`}
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
            className="size-11 rounded-md border-2 border-border bg-background"
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
              className={`menu-link border-b-2 border-border py-4 font-display text-3xl uppercase leading-none sm:text-5xl ${open ? "menu-link-open" : ""}`}
              activeProps={{ className: "opacity-50" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button asChild size="lg" className="h-14 w-full rounded-md border-2 border-border bg-foreground font-bold uppercase text-background shadow-[5px_5px_0_var(--background)]">
          <a
            href="https://www.lieferando.de/speisekarte/yamiin-jaiyanas-healthy-fastfood"
            target="_blank"
            rel="noreferrer"
          >
            Jetzt bestellen
          </a>
        </Button>
      </aside>
    </>
  );
}