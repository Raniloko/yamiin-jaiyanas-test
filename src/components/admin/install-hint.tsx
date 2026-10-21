import { Download, Share, SquarePlus, X } from "lucide-react";

import { BrandMark } from "@/components/brand-logo";
import { useInstallHint, type InternalApp } from "@/lib/app-install";

/** Hinweis-Karte: Admin bzw. Küche als App auf den Home-Bildschirm legen. Verschwindet in der App von selbst. */
export function InstallHint({ app, className }: { app: InternalApp; className?: string }) {
  const { state, dismiss } = useInstallHint(app);
  if (state.kind === "hidden") return null;
  const name = app === "admin" ? "Admin" : "Küche";

  return (
    <aside aria-label="Als App installieren" className={`relative flex gap-3 rounded-2xl border border-border bg-card p-4 pr-10 shadow-sm ${className ?? ""}`}>
      <BrandMark className="size-10 shrink-0 grayscale" />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{name} als App aufs Handy</p>
        {state.kind === "ios" ? (
          <ol className="mt-1.5 space-y-1 text-muted-foreground">
            <li className="flex flex-wrap items-center gap-1">1. In Safari auf <Share className="inline size-4 text-foreground" aria-label="Teilen" /> <strong className="text-foreground">Teilen</strong> tippen</li>
            <li className="flex flex-wrap items-center gap-1">2. <SquarePlus className="inline size-4 text-foreground" aria-hidden="true" /> <strong className="text-foreground">Zum Home-Bildschirm</strong> wählen</li>
            <li>3. Öffnen über das neue Icon – ohne Browserleiste, im Vollbild.</li>
          </ol>
        ) : (
          <>
            <p className="mt-1 text-muted-foreground">Mit eigenem Icon auf dem Home-Bildschirm, im Vollbild ohne Browserleiste.</p>
            <button type="button" onClick={state.install} className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background">
              <Download className="size-4" /> Installieren
            </button>
          </>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label="Hinweis ausblenden" className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
        <X className="size-4" />
      </button>
    </aside>
  );
}
