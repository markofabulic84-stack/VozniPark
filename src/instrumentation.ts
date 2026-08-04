import * as Sentry from "@sentry/nextjs";

// Bez SENTRY_DSN (nema Sentry računa još) praćenje grešaka ostaje isključeno
// — isti obrazac kao Stripe/SMTP u ovoj aplikaciji (uključi se dodavanjem
// jedne env varijable, bez promjene koda).
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
