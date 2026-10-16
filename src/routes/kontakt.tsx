import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";

import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Besuch & Kontakt | Yamiin & Jaiyana's Hanau" },
      { name: "description", content: "Adresse, Öffnungszeiten und Kontakt von Yamiin & Jaiyana's in der Willy-Brandt-Straße 23 in Hanau." },
      { property: "og:title", content: "Besuch Yamiin & Jaiyana's in Hanau" },
      { property: "og:description", content: "Öffnungszeiten, Anfahrt und direkter Kontakt zum Healthy-Fastfood-Laden in Hanau." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-[90rem] px-5 py-14 sm:px-8 sm:py-20">
        <div className="max-w-2xl">
           <p className="text-xs font-bold uppercase">Mitten in Hanau</p>
           <h1 className="mt-5 text-6xl leading-none sm:text-8xl">Komm <em className="text-secondary">vorbei.</em></h1>
           <p className="mt-5 text-lg leading-7">Frisch vor Ort genießen, abholen oder in Hanau liefern lassen.</p>
        </div>
         <div className="mt-12 grid overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-2">
           <div className="bg-muted p-6 sm:p-10">
             <h2 className="text-4xl">Kontakt</h2>
            <address className="mt-7 space-y-5 not-italic">
              <a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className="flex items-start gap-3 hover:text-muted-foreground"><MapPin className="mt-0.5 size-5 shrink-0" />{SITE.street}<br />{SITE.zipCity}</a>
              <a href={SITE.phoneHref} className="flex items-center gap-3 hover:text-muted-foreground"><Phone className="size-5 shrink-0" />{SITE.phone}</a>
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 hover:text-muted-foreground"><Mail className="size-5 shrink-0" />{SITE.email}</a>
            </address>
          </div>
           <div className="border-t border-border bg-card p-6 lg:border-l lg:border-t-0 sm:p-10">
             <h2 className="text-4xl">Öffnungszeiten</h2>
            <dl className="mt-7 divide-y divide-border">
              {SITE.hours.map((row) => (
                <div key={row.days} className="flex justify-between gap-6 py-3"><dt>{row.days}</dt><dd>{row.time}</dd></div>
              ))}
            </dl>
             <a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 font-semibold text-background transition hover:bg-secondary">Route öffnen <ExternalLink className="size-4" /></a>
          </div>
        </div>
      </section>
    </main>
  );
}