import * as Sentry from "@sentry/nextjs";

// NEXT_PUBLIC_ prefiks je obavezan da bi Next.js ovu vrijednost ugradio u
// klijentski (browser) kod. Bez nje praćenje na klijentu ostaje isključeno.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
