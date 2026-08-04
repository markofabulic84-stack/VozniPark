import { describe, expect, it } from "vitest";
import {
  danaDoIsteka,
  noviIstek,
  pretplataAktivna,
  probniIstek,
  OBNOVA_DANA,
  PROBNI_PERIOD_DANA,
} from "@/lib/pretplata";

const DAN_MS = 24 * 60 * 60 * 1000;
const sada = new Date(2026, 6, 1, 12);

describe("pretplataAktivna", () => {
  it("neaktivna bez datuma", () => {
    expect(pretplataAktivna(null, sada)).toBe(false);
  });

  it("aktivna prije isteka", () => {
    expect(pretplataAktivna(new Date(sada.getTime() + DAN_MS), sada)).toBe(true);
  });

  it("neaktivna nakon isteka", () => {
    expect(pretplataAktivna(new Date(sada.getTime() - DAN_MS), sada)).toBe(false);
  });
});

describe("danaDoIsteka", () => {
  it("null bez datuma", () => {
    expect(danaDoIsteka(null, sada)).toBeNull();
  });

  it("pozitivno prije isteka", () => {
    expect(danaDoIsteka(new Date(sada.getTime() + 7 * DAN_MS), sada)).toBe(7);
  });

  it("negativno nakon isteka", () => {
    expect(danaDoIsteka(new Date(sada.getTime() - 3 * DAN_MS), sada)).toBe(-3);
  });
});

describe("noviIstek", () => {
  it("produljuje od datuma isteka dok pretplata još traje (dani se ne gube)", () => {
    const trenutniIstek = new Date(sada.getTime() + 10 * DAN_MS);
    const novi = noviIstek(trenutniIstek, sada);
    expect(novi.getTime()).toBe(trenutniIstek.getTime() + OBNOVA_DANA * DAN_MS);
  });

  it("produljuje od danas kad je pretplata istekla", () => {
    const istekli = new Date(sada.getTime() - 20 * DAN_MS);
    const novi = noviIstek(istekli, sada);
    expect(novi.getTime()).toBe(sada.getTime() + OBNOVA_DANA * DAN_MS);
  });

  it("produljuje od danas kad datuma nema", () => {
    expect(noviIstek(null, sada).getTime()).toBe(
      sada.getTime() + OBNOVA_DANA * DAN_MS,
    );
  });
});

describe("probniIstek", () => {
  it("probni period traje 30 dana", () => {
    expect(probniIstek(sada).getTime()).toBe(
      sada.getTime() + PROBNI_PERIOD_DANA * DAN_MS,
    );
  });
});
