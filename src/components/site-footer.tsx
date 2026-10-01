import { Link } from "@tanstack/react-router";

import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-[90rem] gap-8 px-5 py-12 text-sm sm:grid-cols-3 sm:px-8">
        <div>
          <BrandLogo tone="light" markClassName="size-14" />
          <p className="mt-3 opacity-60">Hanau</p>
        </div>
        <nav className="flex flex-col items-start gap-2 sm:items-center">
           <Link to="/speisekarte" className="border-b border-background">Speisekarte</Link>
           <Link to="/kontakt" className="border-b border-background">Kontakt &amp; Anfahrt</Link>
        </nav>
         <div className="opacity-60 sm:text-right">
          <p>Willy-Brandt-Straße 23</p>
          <p>63450 Hanau</p>
        </div>
      </div>
    </footer>
  );
}