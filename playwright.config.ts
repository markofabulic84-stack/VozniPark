import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Produkcijski build umjesto "next dev": Turbopackov dev-mod kompajlira
    // rute na zahtjev, pa "hladan" server usporava prve posjete i zna
    // uzrokovati nestabilne timeoute u testovima. Build je već napravljen u
    // CI-ju prije ovog koraka; lokalno ga ova naredba napravi po potrebi.
    // U CI-ju je build već napravljen u zasebnom koraku (ci.yml) — ovdje
    // dovoljno samo pokrenuti server; lokalno naredba builda po potrebi.
    command: process.env.CI ? "npm run start" : "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { E2E_TESTING: "true" },
  },
});
