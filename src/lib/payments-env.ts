// Test- oder Live-Zahlung? Das entscheidet allein der Build über den öffentlichen Stripe-Schlüssel
// (VITE_PAYMENTS_CLIENT_TOKEN) – Browser und Server lesen denselben Wert. Der Browser darf die
// Umgebung nie als Parameter mitschicken: sonst ließe sich eine echte Bestellung mit einer
// Testkarte "bezahlen".
export type StripeEnv = "sandbox" | "live";

export const paymentsClientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

/** Umgebung aus dem Schlüssel-Präfix – niemals still auf "live" fallen. */
export function paymentsEnvironment(): StripeEnv {
  if (paymentsClientToken?.startsWith("pk_test_")) return "sandbox";
  if (paymentsClientToken?.startsWith("pk_live_")) return "live";
  throw new Error("Zahlungen sind für diesen Build nicht konfiguriert.");
}

/** true, wenn dieser Build echte Zahlungen annimmt. */
export const isLiveBuild = () => paymentsClientToken?.startsWith("pk_live_") === true;

/** Eine Stripe-Session aus dem Test-Modus (kein echtes Geld). */
export const isTestSession = (sessionId: string | null | undefined) => sessionId?.startsWith("cs_test_") === true;
