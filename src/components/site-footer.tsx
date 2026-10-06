import { Link } from "@tanstack/react-router";

import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-5 py-14 text-sm sm:grid-cols-3 sm:px-8">
        <div>
          <BrandLogo tone="light" markClassName="size-14" />
          <p className="mt-4 max-w-xs opacity-60">Where good people eat well.</p>
        </div>
        <nav className="flex flex-col items-start gap-2 sm:items-center">
           <Link to="/speisekarte" className="border-b border-background/30 pb-1 hover:text-secondary">Speisekarte</Link>
           <Link to="/kontakt" className="border-b border-background/30 pb-1 hover:text-secondary">Kontakt &amp; Anfahrt</Link>
        </nav>
         <div className="opacity-60 sm:text-right">
          <p>Willy-Brandt-Straße 23</p>
          <p>63450 Hanau</p>
        </div>
      </div>
    </footer>
  );
}