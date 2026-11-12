import { loadStripe, type Stripe } from "@stripe/stripe-js";

import { paymentsClientToken, paymentsEnvironment } from "@/lib/payments-env";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    // Wirft, solange für diesen Build kein Zahlungs-Schlüssel hinterlegt ist.
    paymentsEnvironment();
    stripePromise = loadStripe(paymentsClientToken as string);
  }
  return stripePromise;
}
