import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { provjeriCreemPotpis } from "@/lib/creem-potpis";

const TAJNA = "tajni-kljuc";
const TIJELO = JSON.stringify({ eventType: "checkout.completed" });

function potpisi(tijelo: string, tajna: string) {
  return createHmac("sha256", tajna).update(tijelo).digest("hex");
}

describe("provjeriCreemPotpis", () => {
  it("prihvaća ispravan potpis", () => {
    expect(provjeriCreemPotpis(TIJELO, potpisi(TIJELO, TAJNA), TAJNA)).toBe(true);
  });

  it("odbija potpis krivim ključem", () => {
    expect(provjeriCreemPotpis(TIJELO, potpisi(TIJELO, "pogresan-kljuc"), TAJNA)).toBe(false);
  });

  it("odbija potpis za izmijenjeno tijelo", () => {
    expect(provjeriCreemPotpis(TIJELO + "x", potpisi(TIJELO, TAJNA), TAJNA)).toBe(false);
  });

  it("odbija kad nema potpisa", () => {
    expect(provjeriCreemPotpis(TIJELO, null, TAJNA)).toBe(false);
  });

  it("odbija potpis krive duljine bez pucanja", () => {
    expect(provjeriCreemPotpis(TIJELO, "kratko", TAJNA)).toBe(false);
  });
});
