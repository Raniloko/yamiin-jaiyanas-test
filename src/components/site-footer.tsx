import { Link } from "@tanstack/react-router";

import { BrandLogo, BrandMark } from "@/components/brand-logo";
import { SITE } from "@/lib/site-info";

const linkClass =
  "border-b border-background/20 pb-0.5 transition-colors hover:border-secondary hover:text-secondary";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-foreground text-background">
      {/* Großes Logo als dezentes Wasserzeichen */}
      <BrandMark
        tone="light"
        className="pointer-events-none absolute -bottom-24 -right-24 size-80 opacity-[0.06] sm:size-[28rem]"
      />
      <div className="relative mx-auto grid max-w-[90rem] gap-10 px-5 py-14 text-sm sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        <div>
          <BrandLogo tone="light" markClassName="size-14" />
          <p className="mt-4 max-w-xs opacity-60">Where good people eat well.</p>
        </div>

        <nav aria-label="Footer" className="flex flex-col items-start gap-2.5">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] opacity-50">Entdecken</p>
          <Link to="/speisekarte" className={linkClass}>
            Speisekarte &amp; bestellen
          </Link>
          <Link to="/ueber-uns" className={linkClass}>
            Über uns
          </Link>
          <Link to="/kontakt" className={linkClass}>
            Kontakt &amp; Anfahrt
          </Link>
          <Link to="/meine-bestellungen" className={linkClass}>
            Meine Bestellungen
          </Link>
        </nav>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] opacity-50">
            Öffnungszeiten
          </p>
          <dl className="space-y-1.5">
            {SITE.hours.map((row) => (
              <div key={row.days} className="flex justify-between gap-6 sm:max-w-60">
                <dt className="opacity-70">{row.days}</dt>
                <dd className="tabular-nums">{row.time}</dd>
              </div>
            ))}
          </dl>
        </div>

        <address className="not-italic">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] opacity-50">Besuch</p>
          <a
            href={SITE.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="block opacity-80 hover:text-secondary hover:opacity-100"
          >
            {SITE.street}
            <br />
            {SITE.zipCity}
          </a>
          <a
            href={SITE.phoneHref}
            className="mt-3 block opacity-80 hover:text-secondary hover:opacity-100"
          >
            {SITE.phone}
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="block opacity-80 hover:text-secondary hover:opacity-100"
          >
            {SITE.email}
          </a>
          <p className="mt-4 text-xs opacity-50">
            Auch bei{" "}
            <a
              href={SITE.lieferando}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-secondary"
            >
              Lieferando
            </a>
            {" & "}
            <a
              href={SITE.wolt}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-secondary"
            >
              Wolt
            </a>
          </p>
        </address>
      </div>
      <div className="relative border-t border-background/10">
        <p className="mx-auto max-w-[90rem] px-5 py-5 text-xs opacity-40 sm:px-8">
          © {new Date().getFullYear()} {SITE.name} Healthy Fastfood · Hanau
        </p>
      </div>
    </footer>
  );
}
