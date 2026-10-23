// Gemeinsame Bausteine der Gäste-Seiten (Startseite, Speisekarte, Über uns, Kontakt) – ein Look, eine Stelle.
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import heroBowlImage from "@/assets/hero-bowl.jpg";
import { useOpenStatus } from "@/lib/use-open-status";
import { cn } from "@/lib/utils";

const FACE =
  "glow-cta-face group inline-flex h-14 items-center gap-2.5 rounded-full px-7 text-base font-semibold shadow-xl transition-[background-color,transform] duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c3a6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#292725] sm:h-16 sm:px-8 sm:text-lg";
const TONES = {
  light: "bg-[#f5f0e8] text-[#292725] shadow-black/30 hover:bg-white",
  dark: "bg-[#292725] text-[#f5f0e8] shadow-[#292725]/25 hover:bg-[#1f1d1b]",
};

/** Haupt-Button mit umlaufendem Licht (siehe .glow-cta in styles.css). Standard: zu den Bowls. */
export function GlowCta({ children, hash = "bowls", href, tone = "light", icon }: { children: ReactNode; hash?: string; href?: string; tone?: "light" | "dark"; icon?: ReactNode }) {
  const inner = (
    <>
      {children}
      {icon ?? <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />}
    </>
  );
  return (
    <span className="glow-cta">
      <span className="glow-cta-halo" aria-hidden="true"><span /></span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className={cn(FACE, TONES[tone])}>{inner}</a>
      ) : (
        <Link to="/speisekarte" hash={hash} className={cn(FACE, TONES[tone])}>{inner}</Link>
      )}
    </span>
  );
}

/** "Jetzt geöffnet · bis 20:00 Uhr" mit pulsierendem Punkt – für dunkle Flächen. */
export function OpenBadge({ className, fallback = "Willy-Brandt-Straße 23 · Hanau" }: { className?: string; fallback?: string }) {
  const status = useOpenStatus();
  return (
    <p className={cn("hero-rise inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-[#f5f0e8] backdrop-blur-md sm:text-sm", className)}>
      <span className="relative flex size-2.5" aria-hidden="true">
        {status?.open && <span className="live-ping absolute inset-0 rounded-full bg-[#5fd068]" />}
        <span className={`relative size-2.5 rounded-full ${status ? (status.open ? "bg-[#5fd068]" : "bg-[#f5c3a6]") : "bg-white/40"}`} />
      </span>
      {status ? status.text : fallback}
    </p>
  );
}

/** Dunkler Seitenkopf mit Foto, warmem Licht und aufsteigender Überschrift. */
export function PageHero({ children, aside, className }: { children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <section className={cn("relative isolate overflow-hidden border-b border-border bg-[#292725] text-[#f5f0e8]", className)}>
      <img src={heroBowlImage} alt="" aria-hidden="true" className="hero-drift absolute inset-0 -z-20 size-full object-cover object-center opacity-35" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(30,28,25,.96)_0%,rgba(30,28,25,.82)_55%,rgba(30,28,25,.55)_100%)]" aria-hidden="true" />
      {/* Warmes Licht als Verlauf statt Weichzeichner – Safari zeichnet große Unschärfen sonst eckig. */}
      <div className="absolute -left-48 top-0 -z-10 size-[40rem] rounded-full bg-[radial-gradient(circle,rgba(196,107,56,.32),transparent_65%)]" aria-hidden="true" />
      <div className={cn("mx-auto grid max-w-[90rem] items-center gap-10 px-5 py-14 sm:px-8 sm:py-20", aside && "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]")}>
        <div className="relative z-10 min-w-0">{children}</div>
        {aside}
      </div>
    </section>
  );
}

/** Überschrift mit Wörtern, die nacheinander aufsteigen: zweite Zeile kursiv in Pfirsich. */
export function RiseTitle({ lead, accent, className }: { lead: string; accent: string; className?: string }) {
  const words = lead.split(" ");
  return (
    <h1 className={cn("text-[3.4rem] leading-[0.9] sm:text-8xl", className)}>
      {/* Echte Leerzeichen zwischen den Wörtern, damit Vorlesen und Kopieren stimmen. */}
      {words.map((word, index) => <span key={`${word}-${index}`}>{index > 0 && " "}<span className="hero-rise inline-block" style={{ animationDelay: `${80 + index * 80}ms` }}>{word}</span></span>)}
      <br />
      <em className="hero-rise inline-block text-[#f5c3a6]" style={{ animationDelay: `${80 + words.length * 80 + 60}ms` }}>{accent}</em>
    </h1>
  );
}

export function Ticker({ words }: { words: string[] }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {words.map((word) => (
        <li key={word} className="flex items-center gap-8 pr-8 font-display text-2xl italic sm:text-3xl">
          {word}<span className="text-base not-italic text-[#f5c3a6]" aria-hidden="true">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden bg-[#c46b38] py-4 text-[#fff7f1] sm:py-5">
      <div className="animate-ticker flex w-max">{row(false)}{row(true)}</div>
    </div>
  );
}

export function SectionHead({ eyebrow, title, accent, children }: { eyebrow: string; title: string; accent: string; children?: ReactNode }) {
  return (
    <div className="reveal grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
        <h2 className="mt-4 text-5xl leading-[0.95] sm:text-7xl">{title}<br /><em className="text-secondary">{accent}</em></h2>
      </div>
      {children && <div className="max-w-xl text-lg leading-8 text-muted-foreground lg:justify-self-end">{children}</div>}
    </div>
  );
}

/** Dunkles Abschluss-Banner mit Button. */
export function CtaBanner({ eyebrow, title, cta, children }: { eyebrow: string; title: ReactNode; cta: ReactNode; children?: ReactNode }) {
  return (
    <section className="px-5 pb-24 sm:px-8 sm:pb-28">
      <div className="reveal relative isolate mx-auto max-w-[90rem] overflow-hidden rounded-[2.5rem] bg-[#292725] px-6 py-16 text-center text-[#f5f0e8] sm:px-10 sm:py-24">
        <img src={heroBowlImage} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover opacity-25" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(196,107,56,.55),transparent_60%)]" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5c3a6]">{eyebrow}</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-5xl leading-[0.95] sm:text-7xl">{title}</h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">{cta}</div>
        {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/70">{children}</div>}
      </div>
    </section>
  );
}
