import { describe, expect, it } from "vitest";
import { trebajuZimskeGume, statusGuma } from "@/lib/gume";

describe("trebajuZimskeGume", () => {
  it("da tijekom prosinca, siječnja, veljače, ožujka", () => {
    expect(trebajuZimskeGume(new Date(2026, 11, 1))).toBe(true); // prosinac
    expect(trebajuZimskeGume(new Date(2026, 0, 15))).toBe(true); // siječanj
    expect(trebajuZimskeGume(new Date(2026, 2, 31))).toBe(true); // ožujak
  });

  it("da od 15. studenog", () => {
    expect(trebajuZimskeGume(new Date(2026, 10, 14))).toBe(false);
    expect(trebajuZimskeGume(new Date(2026, 10, 15))).toBe(true);
  });

  it("da do 15. travnja uključivo", () => {
    expect(trebajuZimskeGume(new Date(2026, 3, 15))).toBe(true);
    expect(trebajuZimskeGume(new Date(2026, 3, 16))).toBe(false);
  });

  it("ne u ljetnim mjesecima", () => {
    expect(trebajuZimskeGume(new Date(2026, 6, 1))).toBe(false); // srpanj
    expect(trebajuZimskeGume(new Date(2026, 8, 1))).toBe(false); // rujan
  });
});

describe("statusGuma", () => {
  const zimskiDatum = new Date(2026, 11, 1);
  const ljetniDatum = new Date(2026, 6, 1);

  it("kritično ako su ljetne gume u zimskoj sezoni", () => {
    const r = statusGuma({ vrsta: "LJETNE", datum: new Date() }, zimskiDatum);
    expect(r.status).toBe("kritično");
  });

  it("kritično ako nema evidencije u zimskoj sezoni", () => {
    const r = statusGuma(null, zimskiDatum);
    expect(r.status).toBe("kritično");
  });

  it("ok ako su zimske gume u zimskoj sezoni", () => {
    expect(statusGuma({ vrsta: "ZIMSKE", datum: new Date() }, zimskiDatum)).toEqual({
      status: "ok",
    });
  });

  it("upozorenje ako su zimske gume izvan sezone", () => {
    const r = statusGuma({ vrsta: "ZIMSKE", datum: new Date() }, ljetniDatum);
    expect(r.status).toBe("upozorenje");
  });

  it("ok ako su ljetne gume izvan zimske sezone", () => {
    expect(statusGuma({ vrsta: "LJETNE", datum: new Date() }, ljetniDatum)).toEqual({
      status: "ok",
    });
  });

  it("ok bez evidencije izvan zimske sezone", () => {
    expect(statusGuma(null, ljetniDatum)).toEqual({ status: "ok" });
  });
});
