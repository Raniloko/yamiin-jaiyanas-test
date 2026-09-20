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
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto grid h-20 max-w-7xl grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center px-4 sm:h-24 sm:px-8">
          <span aria-hidden="true" />
          <Link to="/" aria-label="Yamiin und Jaiyana's Startseite" className="mx-auto block">
            <img
              src={logoAsset.url}
              alt="YJ Logo"
              className="size-14 rounded-full object-cover grayscale sm:size-16"
            />
          </Link>
          <Button
            type="button"
            ref={openButtonRef}
            variant="ghost"
            size="icon"
            aria-label="Menü öffnen"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="size-11 justify-self-end rounded-full"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-foreground/35 transition-opacity duration-500 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <aside
        aria-label="Hauptmenü"
        aria-hidden={!open}
        inert={!open}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[min(90vw,30rem)] flex-col bg-background px-6 py-6 shadow-2xl transition-transform duration-500 ease-out sm:px-10 sm:py-8 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-border pb-6">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Navigation</span>
          <Button
            type="button"
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            aria-label="Menü schließen"
            onClick={() => setOpen(false)}
            className="size-11 rounded-full"
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
              className={`menu-link border-b border-border py-4 font-display text-3xl font-medium sm:text-4xl ${open ? "menu-link-open" : ""}`}
              activeProps={{ className: "text-muted-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button asChild size="lg" className="h-13 w-full rounded-sm uppercase tracking-[0.12em]">
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