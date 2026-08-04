import { test, expect } from "@playwright/test";
import { jedinstveniEmail, registrirajFirmu, ocistiRateLimit } from "./helpers";

test.beforeEach(async ({ baseURL }) => {
  await ocistiRateLimit(baseURL!);
});

test("dodavanje vozila, dva puna točenja i automatski izračun potrošnje s upozorenjem", async ({
  page,
}) => {
  await registrirajFirmu(page, {
    firma: "E2E Potrošnja d.o.o.",
    ime: "Iva Testna",
    email: jedinstveniEmail("potrosnja"),
    password: "testlozinka1",
  });

  await page.goto("/app/vozila/novo");
  await page.locator("#naziv").fill("Test Kombi");
  await page.locator("#registracija").fill("ZD 777-PP");
  await page.locator("#referentnaPotrosnja").fill("9.0");
  await page.getByRole("button", { name: "Spremi vozilo" }).click();
  // Regex mora isključiti "/app/vozila/novo" (sama forma) — inače se
  // podudara i prije preusmjeravanja na stvarnu stranicu vozila.
  await page.waitForURL(/\/app\/vozila\/(?!novo\b)/);
  const vehicleUrl = page.url();

  async function unesiTocenje(km: string, litre: string, cijena: string) {
    await page.goto("/app/tocenja/novo");
    await page.locator("#vehicleId").selectOption({ label: "Test Kombi — ZD 777-PP" });
    await page.locator("#kmStanje").fill(km);
    await page.locator("#litre").fill(litre);
    await page.locator("#ukupnaCijena").fill(cijena);
    await page.getByRole("button", { name: "Spremi točenje" }).click();
    await expect(page).toHaveURL(/\/app\/vozila\/.+/);
  }

  await unesiTocenje("5000", "90", "139");
  await unesiTocenje("5500", "53", "82");

  await page.goto(vehicleUrl);
  await expect(page.getByText("10.6 L/100km").first()).toBeVisible();
  await expect(page.getByText(/potrošnja \+18% iznad referentne/)).toBeVisible();

  await page.goto("/app");
  await expect(page.getByText(/Test Kombi.*potrošnja \+18%/)).toBeVisible();
});
