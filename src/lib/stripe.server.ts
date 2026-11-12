import Stripe from "stripe";

import type { StripeEnv } from "@/lib/payments-env";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export type { StripeEnv };

const GATEWAY_STRIPE_BASE = "https://connector-gateway.lovable.dev/stripe";

export function getConnectionApiKey(env: StripeEnv): string {
  return env === "sandbox" ? getEnv("STRIPE_SANDBOX_API_KEY") : getEnv("STRIPE_LIVE_API_KEY");
}

/** Echter Schlüssel aus einem eigenen Stripe-Konto (geheim `sk_…` oder eingeschränkt `rk_…`). */
const isStripeSecretKey = (key: string) => /^(sk|rk)_(test|live)_/.test(key);

// Zwei Wege zu Stripe:
//  * Eigenes Hosting (Vercel): STRIPE_SANDBOX_API_KEY / STRIPE_LIVE_API_KEY enthalten echte Stripe-Schlüssel
//    (sk_test_… bzw. sk_live_…) → direkt an api.stripe.com.
//  * Lovable: dort sind es Verbindungsschlüssel des Lovable-Connectors → über das Connector-Gateway
//    (nur api.stripe.com wird weitergeleitet, nicht files.stripe.com oder connect.stripe.com).
export function createStripeClient(env: StripeEnv): Stripe {
  const connectionApiKey = getConnectionApiKey(env);

  if (isStripeSecretKey(connectionApiKey)) {
    // Ein Test-Schlüssel darf nie echte Zahlungen annehmen und umgekehrt.
    if (connectionApiKey.includes(env === "live" ? "_test_" : "_live_")) {
      throw new Error(`${env === "live" ? "STRIPE_LIVE_API_KEY" : "STRIPE_SANDBOX_API_KEY"} gehört zur falschen Stripe-Umgebung`);
    }
    return new Stripe(connectionApiKey, {
      apiVersion: "2026-03-25.dahlia",
      httpClient: Stripe.createFetchHttpClient(),
    });
  }

  const lovableApiKey = getEnv("LOVABLE_API_KEY");

  return new Stripe(connectionApiKey, {
    apiVersion: "2026-03-25.dahlia",
    httpClient: Stripe.createFetchHttpClient((input, init) => {
      const stripeUrl = input instanceof Request ? input.url : input.toString();
      const gatewayUrl = stripeUrl.replace("https://api.stripe.com", GATEWAY_STRIPE_BASE);
      return fetch(gatewayUrl, {
        ...init,
        headers: {
          ...Object.fromEntries(
            new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).entries(),
          ),
          "X-Connection-Api-Key": connectionApiKey,
          "Lovable-API-Key": lovableApiKey,
        },
      });
    }),
  });
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const stripeError = error as {
      message?: string;
      type?: string;
      code?: string;
      decline_code?: string;
      param?: string;
      requestId?: string;
      raw?: {
        message?: string;
        type?: string;
        code?: string;
        decline_code?: string;
        param?: string;
        requestId?: string;
      };
    };

    const message = stripeError.raw?.message ?? stripeError.message;
    if (message) {
      const details = [
        stripeError.raw?.type ?? stripeError.type,
        stripeError.raw?.code ?? stripeError.code,
        stripeError.raw?.decline_code ?? stripeError.decline_code,
        stripeError.raw?.param ?? stripeError.param,
        stripeError.raw?.requestId ?? stripeError.requestId,
      ].filter(Boolean);
      return details.length ? `${message} (${details.join(", ")})` : message;
    }
  }

  return "Stripe request failed";
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

/** Vergleich ohne frühen Abbruch – die Dauer verrät nicht, wie viele Stellen der Signatur stimmen. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index++) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

export type WebhookEvent = { id?: string; type: string; livemode?: boolean; data: { object: unknown } };

/** Wirft, wenn die Signatur fehlt, nicht stimmt oder zu alt ist – dann darf das Ereignis nicht verarbeitet werden. */
export async function verifyWebhook(req: Request, env: StripeEnv): Promise<WebhookEvent> {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const secret = env === "sandbox" ? getEnv("PAYMENTS_SANDBOX_WEBHOOK_SECRET") : getEnv("PAYMENTS_LIVE_WEBHOOK_SECRET");

  if (!signature || !body) {
    throw new Error("Missing signature or body");
  }

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of signature.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1" && value) v1Signatures.push(value);
  }

  if (!timestamp || v1Signatures.length === 0) {
    throw new Error("Invalid signature format");
  }

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) {
    throw new Error("Webhook timestamp too old");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  const expected = toHex(new Uint8Array(signed));

  if (!v1Signatures.some((candidate) => safeEqual(candidate, expected))) {
    throw new Error("Invalid webhook signature");
  }

  const event = JSON.parse(body) as WebhookEvent;
  // Ein Test-Ereignis darf nie über den Live-Zugang ankommen und umgekehrt.
  if (typeof event.livemode === "boolean" && event.livemode !== (env === "live")) {
    throw new Error("Webhook environment mismatch");
  }
  return event;
}
