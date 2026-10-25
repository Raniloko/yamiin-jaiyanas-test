// Gemeinsamer Rahmen für Impressum, Datenschutzerklärung und AGB: ruhiger Lesetext im Design der Seite.
import type { ReactNode } from "react";

import { PageHero } from "@/components/site/brand-ui";
import { isLegalComplete, LEGAL, type LegalField } from "@/lib/legal-info";

export function LegalPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <main className="bg-background pb-24 text-foreground">
      <PageHero compact width="max-w-3xl">
        <h1 className="hero-rise font-display text-5xl leading-none sm:text-6xl">{title}</h1>
        <p className="hero-rise mt-4 text-sm text-primary-foreground/75" style={{ animationDelay: "120ms" }}>Stand: {LEGAL.updated}</p>
      </PageHero>
      <article className="mx-auto max-w-3xl px-5 pt-10 text-base leading-7 sm:px-8 [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2 [&_li]:mt-1.5 [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        {!isLegalComplete() && (
          <p role="note" className="mb-8 rounded-2xl border border-brick/30 bg-brick/10 px-4 py-3 text-sm font-semibold text-brick">
            Entwurf: Markierte Angaben fehlen noch. Diese Seite erst veröffentlichen, wenn alles ausgefüllt und geprüft ist.
          </p>
        )}
        {intro && <div className="mb-8 text-muted-foreground">{intro}</div>}
        <div className="space-y-10">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold leading-snug">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Angabe aus legal-info.ts – fehlt sie noch, erscheint ein markierter Platzhalter mit Hinweis, was hingehört. */
export function Fill({ value, hint }: { value: LegalField; hint: string }) {
  if (value === null) {
    return <mark className="rounded bg-brick/15 px-1 font-semibold text-brick">[Angabe fehlt: {hint}]</mark>;
  }
  return <>{value || null}</>;
}
