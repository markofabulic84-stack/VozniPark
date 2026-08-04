import { describe, expect, it } from "vitest";
import {
  imaZnacajku,
  jeUNeogranicenomProbnom,
  maxKorisnika,
  maxVozila,
} from "@/lib/planovi";

const DAN_MS = 24 * 60 * 60 * 1000;

// imaZnacajku/maxVozila/maxKorisnika interno koriste stvarni Date.now() (isto
// kao u produkciji), pa datumi ovdje moraju biti relativni prema Date.now()
// u trenutku pokretanja testa — ne prema fiksnom kalendarskom datumu — da
// testovi ostanu deterministični neovisno o danu pokretanja.
function firma(preinake: Partial<Parameters<typeof imaZnacajku>[0]> = {}) {
  return {
    plan: "STARTER" as const,
    naPocetnomProbnom: false,
    pretplataDo: new Date(Date.now() + 10 * DAN_MS),
    ...preinake,
  };
}

describe("jeUNeogranicenomProbnom", () => {
  const sada = new Date(2026, 6, 1);

  it("da tijekom aktivnog probnog perioda", () => {
    const f = {
      plan: "STARTER" as const,
      naPocetnomProbnom: true,
      pretplataDo: new Date(sada.getTime() + 3 * DAN_MS),
    };
    expect(jeUNeogranicenomProbnom(f, sada)).toBe(true);
  });

  it("ne nakon prve uplate (naPocetnomProbnom false) iako je pretplata aktivna", () => {
    const f = {
      plan: "STARTER" as const,
      naPocetnomProbnom: false,
      pretplataDo: new Date(sada.getTime() + 3 * DAN_MS),
    };
    expect(jeUNeogranicenomProbnom(f, sada)).toBe(false);
  });

  it("ne ako je probni period istekao", () => {
    const f = {
      plan: "STARTER" as const,
      naPocetnomProbnom: true,
      pretplataDo: new Date(sada.getTime() - DAN_MS),
    };
    expect(jeUNeogranicenomProbnom(f, sada)).toBe(false);
  });
});

describe("imaZnacajku", () => {
  it("Starter nema napredne značajke", () => {
    expect(imaZnacajku(firma({ plan: "STARTER" }), "ocr_racuna")).toBe(false);
    expect(imaZnacajku(firma({ plan: "STARTER" }), "csv_izvoz")).toBe(false);
  });

  it("Pro ima napredne značajke, ali ne uvoz", () => {
    const pro = firma({ plan: "PRO" });
    expect(imaZnacajku(pro, "ocr_racuna")).toBe(true);
    expect(imaZnacajku(pro, "gume")).toBe(true);
    expect(imaZnacajku(pro, "csv_uvoz")).toBe(false);
  });

  it("Enterprise ima sve", () => {
    expect(imaZnacajku(firma({ plan: "ENTERPRISE" }), "csv_uvoz")).toBe(true);
  });

  it("tijekom probnog perioda Starter dobiva sve značajke", () => {
    const proba = firma({ plan: "STARTER", naPocetnomProbnom: true });
    expect(imaZnacajku(proba, "csv_uvoz")).toBe(true);
    expect(imaZnacajku(proba, "ocr_racuna")).toBe(true);
  });
});

describe("maxVozila / maxKorisnika", () => {
  it("poštuju plan izvan probe", () => {
    expect(maxVozila(firma({ plan: "STARTER" }))).toBe(5);
    expect(maxKorisnika(firma({ plan: "STARTER" }))).toBe(2);
    expect(maxVozila(firma({ plan: "ENTERPRISE" }))).toBeNull();
  });

  it("neograničeno tijekom probe bez obzira na plan", () => {
    const proba = firma({ plan: "STARTER", naPocetnomProbnom: true });
    expect(maxVozila(proba)).toBeNull();
    expect(maxKorisnika(proba)).toBeNull();
  });
});
