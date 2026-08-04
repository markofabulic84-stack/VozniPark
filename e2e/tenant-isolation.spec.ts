import { test, expect } from "@playwright/test";
import { jedinstveniEmail, registrirajFirmu, ocistiRateLimit } from "./helpers";

test.beforeEach(async ({ baseURL }) => {
  await ocistiRateLimit(baseURL!);
});

test("firma B ne vidi vozila firme A", async ({ page }) => {
  const emailA = jedinstveniEmail("tenant-a");
  await registrirajFirmu(page, {
    firma: "E2E Firma A d.o.o.",
    ime: "Marko A",
    email: emailA,
    password: "testlozinka1",
  });

  await page.goto("/app/vozila/novo");
  await page.locator("#naziv").fill("Tajno Vozilo Firme A");
  await page.locator("#registracija").fill("ZD 001-AA");
  await page.getByRole("button", { name: "Spremi vozilo" }).click();
  await expect(page).toHaveURL(/\/app\/vozila\/.+/);

  await page.getByRole("button", { name: "Odjava" }).click();
  await expect(page).toHaveURL("/prijava");

  const emailB = jedinstveniEmail("tenant-b");
  await registrirajFirmu(page, {
    firma: "E2E Firma B d.o.o.",
    ime: "Petra B",
    email: emailB,
    password: "testlozinka1",
  });

  await page.goto("/app/vozila");
  await expect(page.getByText("Tajno Vozilo Firme A")).toHaveCount(0);
  await expect(page.getByText("Još nemate dodanih vozila.")).toBeVisible();
});
