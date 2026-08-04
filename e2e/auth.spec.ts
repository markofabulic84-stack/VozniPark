import { test, expect } from "@playwright/test";
import { jedinstveniEmail, registrirajFirmu, prijaviSe, ocistiRateLimit } from "./helpers";

test.beforeEach(async ({ baseURL }) => {
  await ocistiRateLimit(baseURL!);
});

test("registracija, odjava i ponovna prijava", async ({ page }) => {
  const email = jedinstveniEmail("auth");
  await registrirajFirmu(page, {
    firma: "E2E Auth Test d.o.o.",
    ime: "Ana Testna",
    email,
    password: "testlozinka1",
  });

  await expect(page.getByText("Dobar dan, Ana Testna.")).toBeVisible();
  await expect(page.getByText("E2E Auth Test d.o.o.")).toBeVisible();

  await page.getByRole("button", { name: "Odjava" }).click();
  await expect(page).toHaveURL("/prijava");

  await prijaviSe(page, email, "testlozinka1");
  await expect(page).toHaveURL("/app");
  await expect(page.getByText("Dobar dan, Ana Testna.")).toBeVisible();
});

test("pogrešna lozinka se odbija, a nakon previše pokušaja prijava se blokira", async ({
  page,
}) => {
  const email = jedinstveniEmail("ratelimit");
  await registrirajFirmu(page, {
    firma: "E2E Rate Limit d.o.o.",
    ime: "Ivo Testni",
    email,
    password: "testlozinka1",
  });
  await page.getByRole("button", { name: "Odjava" }).click();
  await expect(page).toHaveURL("/prijava");

  for (let i = 1; i <= 5; i++) {
    await prijaviSe(page, email, "kriva-lozinka");
    await expect(page.getByText("Neispravan email ili lozinka.")).toBeVisible();
  }

  // 6. pokušaj (čak i s ispravnom lozinkom) mora biti blokiran limiterom.
  await prijaviSe(page, email, "testlozinka1");
  await expect(page.getByText(/Previše neuspjelih pokušaja/)).toBeVisible();
});
