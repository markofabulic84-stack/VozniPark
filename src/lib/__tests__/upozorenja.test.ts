import { describe, expect, it } from "vitest";
import { upozorenjaZaVozilo, svaUpozorenja, filtrirajPoPlanu } from "@/lib/upozorenja";

const DAN_MS = 24 * 60 * 60 * 1000;
const d = (pomak: number) => new Date(Date.now() + pomak * DAN_MS);

// Fiksni ljetni datum za testove koji se ne bave gumama — bez ovoga bi test
// suite postao ovisan o stvarnom mjesecu pokretanja (npr. u prosincu bi
// odjednom svako vozilo dobilo i upozorenje o gumama).
const LJETO = new Date(2026, 6, 1);

function vozilo(preinake: Partial<Parameters<typeof upozorenjaZaVozilo>[0]> = {}) {
  return {
    id: "v1",
    naziv: "Test Vozilo",
    registracija: "ZD 000-AA",
    trenutniKm: 10000,
    referentnaPotrosnja: null,
    sljedeciServisKm: null,
    registracijaDo: null,
    osiguranjeDo: null,
    fuelEntries: [],
    zadnjaZamjenaGuma: { vrsta: "LJETNE" as const, datum: new Date() },
    ...preinake,
  };
}

describe("upozorenjaZaVozilo", () => {
  it("bez podataka nema upozorenja", () => {
    expect(upozorenjaZaVozilo(vozilo(), LJETO)).toHaveLength(0);
  });

  it("prijavljuje odstupanje potrošnje iznad referentne", () => {
    const u = upozorenjaZaVozilo(
      vozilo({
        referentnaPotrosnja: 9.0,
        fuelEntries: [
          { kmStanje: 5000, litre: 90, punSpremnik: true, datum: d(-20) },
          { kmStanje: 5500, litre: 53, punSpremnik: true, datum: d(-3) },
        ],
      }),
      LJETO,
    );
    expect(u).toHaveLength(1);
    expect(u[0].vrsta).toBe("potrosnja");
    expect(u[0].poruka).toContain("+18%");
  });

  it("prijavljuje skori servis i istekle rokove", () => {
    const u = upozorenjaZaVozilo(
      vozilo({
        trenutniKm: 45000,
        sljedeciServisKm: 45330,
        registracijaDo: d(-10),
        osiguranjeDo: d(15),
      }),
      LJETO,
    );
    const vrste = u.map((x) => x.vrsta).sort();
    expect(vrste).toEqual(["osiguranje", "registracija", "servis"]);
    const registracija = u.find((x) => x.vrsta === "registracija")!;
    expect(registracija.status).toBe("kritično");
  });

  it("prijavljuje nedostatak zimskih guma u zimskoj sezoni", () => {
    const zima = new Date(2026, 11, 1);
    const u = upozorenjaZaVozilo(vozilo({ zadnjaZamjenaGuma: null }), zima);
    expect(u).toHaveLength(1);
    expect(u[0].vrsta).toBe("gume");
    expect(u[0].status).toBe("kritično");
  });

  it("bez upozorenja o gumama kad su zimske postavljene u sezoni", () => {
    const zima = new Date(2026, 11, 1);
    const u = upozorenjaZaVozilo(
      vozilo({ zadnjaZamjenaGuma: { vrsta: "ZIMSKE", datum: new Date() } }),
      zima,
    );
    expect(u).toHaveLength(0);
  });
});

describe("svaUpozorenja", () => {
  it("kritična upozorenja dolaze prije običnih", () => {
    const rezultat = svaUpozorenja(
      [
        vozilo({ id: "a", registracijaDo: d(15) }),
        vozilo({ id: "b", registracija: "ZD 111-BB", osiguranjeDo: d(-2) }),
      ],
      LJETO,
    );
    expect(rezultat[0].status).toBe("kritično");
    expect(rezultat[1].status).toBe("upozorenje");
  });
});

describe("filtrirajPoPlanu", () => {
  const starter = { plan: "STARTER" as const, naPocetnomProbnom: false, pretplataDo: null };
  const pro = { plan: "PRO" as const, naPocetnomProbnom: false, pretplataDo: null };

  it("Starter ne vidi upozorenja o rokovima dokumenata ni potrošnji", () => {
    const u = upozorenjaZaVozilo(
      vozilo({
        trenutniKm: 45000,
        sljedeciServisKm: 45330,
        registracijaDo: d(-10),
        referentnaPotrosnja: 9.0,
        fuelEntries: [
          { kmStanje: 5000, litre: 90, punSpremnik: true, datum: d(-20) },
          { kmStanje: 5500, litre: 53, punSpremnik: true, datum: d(-3) },
        ],
      }),
      LJETO,
    );
    const filtrirano = filtrirajPoPlanu(u, starter);
    expect(filtrirano.map((x) => x.vrsta)).toEqual(["servis"]);
  });

  it("Pro vidi sve vrste osim gdje plan ionako ne ograničava", () => {
    const u = upozorenjaZaVozilo(vozilo({ registracijaDo: d(-10) }), LJETO);
    expect(filtrirajPoPlanu(u, pro)).toHaveLength(u.length);
  });
});
