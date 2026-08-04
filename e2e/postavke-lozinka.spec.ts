import { test, expect } from "@playwright/test";
import { jedinstveniEmail, registrirajFirmu, prijaviSe, ocistiRateLimit } from "./helpers";

test.beforeEach(async ({ baseURL }) => {
  await ocistiRateLimit(baseURL!);
});

test("promjena lozinke: stara ne radi, nova radi, trenutni uređaj ostaje prijavljen", async ({
  page,
}) => {
  const email = jedinstveniEmail("lozinka");
  await registrirajFirmu(page, {
    firma: "E2E Lozinka d.o.o.",
    ime: "Sara Testna",
    email,
    password: "staralozinka1",
  });

  await page.goto("/app/postavke");
  await page.locator("#trenutnaLozinka").fill("staralozinka1");
  await page.locator("#novaLozinka").fill("novalozinka2");
  await page.getByRole("button", { name: "Promijeni lozinku" }).click();
  await expect(page.getByText("Lozinka je promijenjena.")).toBeVisible();

  // Trenutni uređaj mora ostati prijavljen bez ponovne prijave.
  await page.goto("/app");
  await expect(page).toHaveURL("/app");
  await expect(page.getByText("Dobar dan, Sara Testna.")).toBeVisible();

  await page.getByRole("button", { name: "Odjava" }).click();
  await expect(page).toHaveURL("/prijava");

  await prijaviSe(page, email, "staralozinka1");
  await expect(page.getByText("Neispravan email ili lozinka.")).toBeVisible();

  await prijaviSe(page, email, "novalozinka2");
  await expect(page).toHaveURL("/app");
});
