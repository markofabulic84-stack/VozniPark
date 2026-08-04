import { describe, expect, it } from "vitest";
import { porukaProbniIstek } from "@/lib/podsjetnici-core";

const DAN_MS = 24 * 60 * 60 * 1000;
const sada = new Date(2026, 6, 1, 7);

const admin = { ime: "Ante Perić", email: "admin@vozni-park.hr" };

function firma(preinake: Partial<Parameters<typeof porukaProbniIstek>[0]> = {}) {
  return {
    naziv: "Test d.o.o.",
    naPocetnomProbnom: true,
    pretplataDo: new Date(sada.getTime() + DAN_MS),
    ...preinake,
  };
}

describe("porukaProbniIstek", () => {
  it("šalje podsjetnik kad probni period ističe sutra", () => {
    const poruka = porukaProbniIstek(firma(), admin, sada);
    expect(poruka).not.toBeNull();
    expect(poruka!.to).toBe(admin.email);
    expect(poruka!.subject).toContain("ističe sutra");
    expect(poruka!.text).toContain("Test d.o.o.");
    expect(poruka!.text).toContain("/pretplata");
  });

  it("ne šalje ako je nakon prve uplate (naPocetnomProbnom false)", () => {
    const poruka = porukaProbniIstek(firma({ naPocetnomProbnom: false }), admin, sada);
    expect(poruka).toBeNull();
  });

  it("ne šalje ako do isteka ima više od jednog dana", () => {
    const poruka = porukaProbniIstek(
      firma({ pretplataDo: new Date(sada.getTime() + 2 * DAN_MS) }),
      admin,
      sada,
    );
    expect(poruka).toBeNull();
  });

  it("ne šalje nakon što je probni period već istekao", () => {
    const poruka = porukaProbniIstek(
      firma({ pretplataDo: new Date(sada.getTime() - DAN_MS) }),
      admin,
      sada,
    );
    expect(poruka).toBeNull();
  });

  it("ne šalje bez postavljenog datuma isteka", () => {
    const poruka = porukaProbniIstek(firma({ pretplataDo: null }), admin, sada);
    expect(poruka).toBeNull();
  });
});
