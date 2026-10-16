import { useId } from "react";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  /** "light" = dunkler Hintergrund (Footer/Hero) */
  tone?: "dark" | "light";
  showText?: boolean;
};

/**
 * YJ-Logo als SVG nachgebaut (Original: runder Stein-Badge mit "Y | J" und zwei offenen Kreisbögen).
 * Vektor statt Bild, damit es in jeder Größe scharf bleibt.
 */
export function BrandMark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Yamiin & Jaiyana's Logo"
      className={cn(
        "inline-block shrink-0 rounded-full",
        tone === "dark" ? "shadow-sm" : "",
        className,
      )}
    >
      <defs>
        <radialGradient id={`${id}-stone`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#f1e7de" />
          <stop offset="60%" stopColor="#e7d9cf" />
          <stop offset="100%" stopColor="#dccbbe" />
        </radialGradient>
        <filter id={`${id}-marble`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.08" numOctaves="3" seed="7" />
          <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.48  0 0 0 0 0.42  0 0 0 -1.6 0.9" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#${id}-stone)`} />
      <circle cx="50" cy="50" r="50" filter={`url(#${id}-marble)`} opacity="0.35" />
      <g fill="none" stroke="#8d837b" strokeLinecap="round">
        <path d="M40.9 15.2 A35 35 0 0 1 83.8 39.9" strokeWidth="0.8" />
        <path d="M16.2 58.1 A35 35 0 0 0 60.2 82.5" strokeWidth="0.8" />
        <path d="M50 27 V73" strokeWidth="0.5" />
      </g>
      <g
        fill="none"
        stroke="#6f6863"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Y */}
        <path d="M35.5 39 L40 48.2 L44.5 39 M40 48.2 V57" />
        {/* J */}
        <path d="M59.5 39 V53.5 Q59.5 57.2 56 57.2 Q54.4 57.2 53.6 56.2" />
      </g>
    </svg>
  );
}

export function BrandLogo({
  className,
  markClassName,
  textClassName,
  tone = "dark",
  showText = true,
}: Props) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <BrandMark tone={tone} className={cn("size-12", markClassName)} />
      {showText && (
        <span className={cn("flex flex-col leading-none", textClassName)}>
          <span className="whitespace-nowrap text-sm font-bold uppercase sm:text-base">
            Yamiin &amp; Jaiyana&rsquo;s
          </span>
          <span className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] opacity-70">
            Healthy Fastfood
          </span>
        </span>
      )}
    </span>
  );
}
