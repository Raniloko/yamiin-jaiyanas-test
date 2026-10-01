import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  /** "light" = dunkler Hintergrund (Footer/Hero) */
  tone?: "dark" | "light";
  showText?: boolean;
};

/** Scharfes Vektor-Monogramm "Y&J" mit Wortmarke. */
export function BrandMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const fg = tone === "dark" ? "var(--foreground)" : "var(--background)";
  const bg = tone === "dark" ? "var(--background)" : "var(--foreground)";
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Y&J Logo" className={cn("shrink-0", className)}>
      <rect x="2" y="2" width="56" height="56" rx="10" fill="var(--secondary)" transform="translate(4 4)" />
      <rect x="2" y="2" width="56" height="56" rx="10" fill={bg} stroke={fg} strokeWidth="3" />
      <text x="9" y="44" fontFamily="'Archivo Black', sans-serif" fontSize="30" fill={fg}>Y</text>
      <text x="35" y="44" fontFamily="'Archivo Black', sans-serif" fontSize="30" fill={fg}>J</text>
      <text x="25" y="52" fontFamily="'Archivo Black', sans-serif" fontSize="22" fill="var(--secondary)" stroke={fg} strokeWidth="1.2" paintOrder="stroke">&amp;</text>
    </svg>
  );
}

export function BrandLogo({ className, markClassName, textClassName, tone = "dark", showText = true }: Props) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <BrandMark tone={tone} className={cn("size-12", markClassName)} />
      {showText && (
        <span className={cn("flex flex-col leading-none", textClassName)}>
          <span className="whitespace-nowrap font-display text-base uppercase tracking-tight">
            Yamiin <span className="text-secondary [-webkit-text-stroke:1px_currentColor] [paint-order:stroke]">&amp;</span> Jaiyana&rsquo;s
          </span>
          <span className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] opacity-70">Healthy Fastfood</span>
        </span>
      )}
    </span>
  );
}
