import type { Page } from "@playwright/test";

export function jedinstveniEmail(prefiks: string): string {
  return `${prefiks}-${Date.now()}-${Math.floor(Math.random() * 10000)}@e2e-test.hr`;
}

// Testovi registriraju više firmi zaredom s iste (localhost) adrese, pa bi
// brzo potrošili produkcijski limiter za registraciju/prijavu (namjerno
// strog: 5/h). Čisti se preko interne test-only rute (vidi
// src/app/api/test/ocisti-rate-limit/route.ts) prije svakog testa da jedan
// test suite run ne bude ograničen vlastitim prethodnim testovima.
export async function ocistiRateLimit(baseURL: string) {
  await fetch(`${baseURL}/api/test/ocisti-rate-limit`, { method: "POST" });
}

export type NovaFirma = {
  firma: string;
  ime: string;
  email: string;
  password: string;
};

// Popunjava i šalje formu registracije; nakon uspjeha korisnik je
// prijavljen i preusmjeren na /app.
export async function registrirajFirmu(page: Page, podaci: NovaFirma) {
  await page.goto("/registracija");
  await page.locator("#firma").fill(podaci.firma);
  await page.locator("#ime").fill(podaci.ime);
  await page.locator("#email").fill(podaci.email);
  await page.locator("#password").fill(podaci.password);
  await page.getByRole("button", { name: "Registriraj firmu" }).click();
  await page.waitForURL("/app");
}

export async function prijaviSe(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/prijava");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Prijavi se" }).click();
}
