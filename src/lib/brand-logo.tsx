import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  /** "light" = dunkler Hintergrund (Footer/Hero) */
  tone?: "dark" | "light";
  showText?: boolean;
};

/** Originales YJ-Logo (rund). */
export function BrandMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span
      aria-label="YJ Logo"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border bg-secondary font-serif text-sm font-bold tracking-[-0.08em] text-secondary-foreground",
        tone === "dark" ? "border-border" : "border-background",
        className,
      )}
    >
      YJ
    </span>
  );
}

export function BrandLogo({ className, markClassName, textClassName, tone = "dark", showText = true }: Props) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <BrandMark tone={tone} className={cn("size-12", markClassName)} />
      {showText && (
        <span className={cn("flex flex-col leading-none", textClassName)}>
          <span className="whitespace-nowrap text-sm font-bold uppercase sm:text-base">
            Yamiin &amp; Jaiyana&rsquo;s
          </span>
          <span className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] opacity-70">Healthy Fastfood</span>
        </span>
      )}
    </span>
  );
}
