import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // tesseract.js spawns a worker_thread using a path computed at runtime
  // (__dirname-based); bundling it breaks that resolution, so it must be
  // required directly from node_modules instead of bundled.
  serverExternalPackages: ["tesseract.js"],
};

// Bez SENTRY_AUTH_TOKEN (nema Sentry računa još) ovo samo preskače upload
// source mapova – ne ruši build. Kad se doda račun, postaviti org/project/
// authToken u .env i source mapovi će se automatski slati.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
