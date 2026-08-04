import { describe, expect, it } from "vitest";
import {
  izracunajIntervale,
  odstupanjeStatus,
  referentnaPotrosnja,
} from "@/lib/potrosnja";

const d = (dan: number) => new Date(2026, 0, dan);

describe("izracunajIntervale (puno-u-puno)", () => {
  it("računa potrošnju između dva puna spremnika", () => {
    const intervali = izracunajIntervale([
      { kmStanje: 10000, litre: 40, punSpremnik: true, datum: d(1) },
      { kmStanje: 10500, litre: 35, punSpremnik: true, datum: d(10) },
    ]);
    expect(intervali).toHaveLength(1);
    expect(intervali[0].potrosnja).toBeCloseTo(7.0);
    expect(intervali[0].odKm).toBe(10000);
    expect(intervali[0].doKm).toBe(10500);
  });

  it("uključuje djelomična točenja u interval, bez stvaranja lažnog intervala", () => {
    const intervali = izracunajIntervale([
      { kmStanje: 10000, litre: 40, punSpremnik: true, datum: d(1) },
      { kmStanje: 10200, litre: 15, punSpremnik: false, datum: d(5) },
      { kmStanje: 10500, litre: 20, punSpremnik: true, datum: d(10) },
    ]);
    expect(intervali).toHaveLength(1);
    // 15 + 20 litara na 500 km = 7 L/100km
    expect(intervali[0].potrosnja).toBeCloseTo(7.0);
  });

  it("vraća prazno za manje od dva puna točenja", () => {
    expect(
      izracunajIntervale([
        { kmStanje: 10000, litre: 40, punSpremnik: true, datum: d(1) },
        { kmStanje: 10200, litre: 15, punSpremnik: false, datum: d(5) },
      ]),
    ).toHaveLength(0);
  });

  it("preskače intervale bez prijeđenih kilometara", () => {
    expect(
      izracunajIntervale([
        { kmStanje: 10000, litre: 40, punSpremnik: true, datum: d(1) },
        { kmStanje: 10000, litre: 5, punSpremnik: true, datum: d(2) },
      ]),
    ).toHaveLength(0);
  });
});

describe("referentnaPotrosnja", () => {
  it("ručna referenca ima prednost", () => {
    expect(referentnaPotrosnja(9.0, [])).toBe(9.0);
  });

  it("prosjek prethodnih intervala kad nema ručne (zadnji se isključuje)", () => {
    const intervali = [
      { odKm: 0, doKm: 500, datum: d(1), litre: 35, potrosnja: 7.0 },
      { odKm: 500, doKm: 1000, datum: d(2), litre: 40, potrosnja: 8.0 },
      { odKm: 1000, doKm: 1500, datum: d(3), litre: 60, potrosnja: 12.0 },
    ];
    expect(referentnaPotrosnja(null, intervali)).toBeCloseTo(7.5);
  });

  it("null kad nema dovoljno podataka", () => {
    expect(referentnaPotrosnja(null, [])).toBeNull();
  });
});

describe("odstupanjeStatus", () => {
  it("ok ispod +10%", () => {
    expect(odstupanjeStatus(7.5, 7.0).status).toBe("ok");
  });
  it("upozorenje od +10%", () => {
    const r = odstupanjeStatus(7.7, 7.0);
    expect(r.status).toBe("upozorenje");
    expect(r.postotak).toBeCloseTo(10);
  });
  it("kritično od +25%", () => {
    expect(odstupanjeStatus(9.0, 7.0).status).toBe("kritično");
  });
});
