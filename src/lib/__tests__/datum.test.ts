import { describe, expect, it } from "vitest";
import { parsirajDatum, parsirajDatumUnosa } from "@/lib/datum";

describe("parsirajDatum", () => {
  it("parsira ispravan ISO datum", () => {
    expect(parsirajDatum("2026-08-04")?.getFullYear()).toBe(2026);
  });

  it("vraća null za prazno", () => {
    expect(parsirajDatum("")).toBeNull();
    expect(parsirajDatum("   ")).toBeNull();
    expect(parsirajDatum(null)).toBeNull();
  });

  it("vraća null za neispravan tekst umjesto Invalid Date", () => {
    expect(parsirajDatum("nije-datum")).toBeNull();
    expect(parsirajDatum("2026-13-45")).toBeNull();
  });
});

describe("parsirajDatumUnosa", () => {
  it("prazno polje znači danas", () => {
    const r = parsirajDatumUnosa("");
    expect(r.ok).toBe(true);
    if (r.ok) expect(Number.isNaN(r.datum.getTime())).toBe(false);
  });

  it("ispravan datum se preuzima", () => {
    const r = parsirajDatumUnosa("2026-08-04");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.datum.getFullYear()).toBe(2026);
  });

  // Ovo je regresija za bug koji je rušio unos: Invalid Date je prolazio
  // sve do Prisma INSERT-a i vraćao 500 umjesto poruke korisniku.
  it("neispravan datum je greška, ne tiha zamjena današnjim", () => {
    expect(parsirajDatumUnosa("nije-datum").ok).toBe(false);
    expect(parsirajDatumUnosa("31/02/2026").ok).toBe(false);
  });
});
