import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-display text-base font-semibold">Yamiin &amp; Jaiyana&rsquo;s</p>
          <p className="mt-1 text-muted-foreground">Healthy Fastfood · Hanau</p>
        </div>
        <nav className="flex flex-col items-start gap-2 sm:items-center">
          <Link to="/speisekarte" className="hover:text-muted-foreground">Speisekarte</Link>
          <Link to="/kontakt" className="hover:text-muted-foreground">Kontakt &amp; Anfahrt</Link>
        </nav>
        <div className="text-muted-foreground sm:text-right">
          <p>Willy-Brandt-Straße 23</p>
          <p>63450 Hanau</p>
        </div>
      </div>
    </footer>
  );
}