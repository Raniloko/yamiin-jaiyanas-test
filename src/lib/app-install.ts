// Admin & Küche als App auf dem Home-Bildschirm (iPhone/iPad über Safari, Android über Chrome).
import { useEffect, useState } from "react";

export type InternalApp = "admin" | "kitchen";

const TITLES: Record<InternalApp, string> = { admin: "YJ Admin", kitchen: "YJ Küche" };

/** Kopf-Tags für eine installierbare Web-App: Manifest, Icon, Vollbild und Statusleiste. */
export function appHead(app: InternalApp) {
  return {
    meta: [
      // viewport-fit=cover, damit Kopf- und Fußleisten die sicheren Bereiche (Notch, Home-Balken) selbst auffüllen.
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: TITLES[app] },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "theme-color", content: "#ffffff" },
    ],
    links: [
      { rel: "manifest", href: `/app/${app}.webmanifest` },
      { rel: "apple-touch-icon", href: `/app/${app}-180.png`, sizes: "180x180" },
    ],
  };
}

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export type InstallState =
  | { kind: "hidden" }
  | { kind: "ios" }
  | { kind: "prompt"; install: () => void };

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPadOS meldet sich als Mac – dort hilft die Touch-Erkennung.
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const dismissKey = (app: InternalApp) => `yj-install-hint-${app}`;

/** Ob (und wie) wir anbieten, Admin bzw. Küche als App zu installieren. */
export function useInstallHint(app: InternalApp) {
  const [state, setState] = useState<InstallState>({ kind: "hidden" });

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(dismissKey(app))) return;
    } catch {
      // Ohne Speicher zeigen wir den Hinweis trotzdem.
    }
    if (isIOS()) {
      setState({ kind: "ios" });
      return;
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      const prompt = event as InstallPrompt;
      setState({
        kind: "prompt",
        install: () => {
          void prompt.prompt();
          void prompt.userChoice.finally(() => setState({ kind: "hidden" }));
        },
      });
    };
    const onInstalled = () => setState({ kind: "hidden" });
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [app]);

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKey(app), "1");
    } catch {
      // egal – dann nur für diese Sitzung ausgeblendet
    }
    setState({ kind: "hidden" });
  };

  return { state, dismiss };
}
