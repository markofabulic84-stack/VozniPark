import {
  izracunajIntervale,
  referentnaPotrosnja,
  odstupanjeStatus,
} from "@/lib/potrosnja";
import { statusDatuma, statusServisa } from "@/lib/rokovi";
import { statusGuma, type ZadnjaZamjenaGuma } from "@/lib/gume";
import { imaZnacajku, type CompanyZaPlan, type Znacajka } from "@/lib/planovi";

type Tocenje = {
  kmStanje: number;
  litre: number;
  punSpremnik: boolean;
  datum: Date;
};

export type VoziloZaUpozorenja = {
  id: string;
  naziv: string;
  registracija: string;
  trenutniKm: number;
  referentnaPotrosnja: number | null;
  sljedeciServisKm: number | null;
  registracijaDo: Date | null;
  osiguranjeDo: Date | null;
  fuelEntries: Tocenje[];
  zadnjaZamjenaGuma?: ZadnjaZamjenaGuma;
};

export type Upozorenje = {
  vehicleId: string;
  vehicleNaziv: string;
  vehicleRegistracija: string;
  vrsta: "potrosnja" | "servis" | "registracija" | "osiguranje" | "gume";
  status: "upozorenje" | "kritično";
  poruka: string;
};

export function upozorenjaZaVozilo(
  vozilo: VoziloZaUpozorenja,
  sada: Date = new Date(),
): Upozorenje[] {
  const upozorenja: Upozorenje[] = [];
  const oznaka = `${vozilo.naziv} (${vozilo.registracija})`;

  const intervali = izracunajIntervale(vozilo.fuelEntries);
  const referentna = referentnaPotrosnja(
    vozilo.referentnaPotrosnja,
    intervali,
  );
  if (referentna && intervali.length > 0) {
    const zadnji = intervali[intervali.length - 1];
    const { postotak, status } = odstupanjeStatus(
      zadnji.potrosnja,
      referentna,
    );
    if (status !== "ok") {
      upozorenja.push({
        vehicleId: vozilo.id,
        vehicleNaziv: vozilo.naziv,
        vehicleRegistracija: vozilo.registracija,
        vrsta: "potrosnja",
        status,
        poruka: `${oznaka} — potrošnja +${postotak.toFixed(0)}% iznad referentne`,
      });
    }
  }

  const servis = statusServisa(vozilo.sljedeciServisKm, vozilo.trenutniKm);
  if (servis && servis.status !== "ok") {
    upozorenja.push({
      vehicleId: vozilo.id,
      vehicleNaziv: vozilo.naziv,
      vehicleRegistracija: vozilo.registracija,
      vrsta: "servis",
      status: servis.status,
      poruka:
        servis.kmDo < 0
          ? `${oznaka} — servis kasni ${Math.abs(servis.kmDo)} km`
          : `${oznaka} — servis za ${servis.kmDo} km`,
    });
  }

  const registracija = statusDatuma(vozilo.registracijaDo);
  if (registracija && registracija.status !== "ok") {
    upozorenja.push({
      vehicleId: vozilo.id,
      vehicleNaziv: vozilo.naziv,
      vehicleRegistracija: vozilo.registracija,
      vrsta: "registracija",
      status: registracija.status,
      poruka:
        registracija.danaDo < 0
          ? `${oznaka} — registracija istekla prije ${Math.abs(registracija.danaDo)} dana`
          : `${oznaka} — registracija ističe za ${registracija.danaDo} dana`,
    });
  }

  const osiguranje = statusDatuma(vozilo.osiguranjeDo);
  if (osiguranje && osiguranje.status !== "ok") {
    upozorenja.push({
      vehicleId: vozilo.id,
      vehicleNaziv: vozilo.naziv,
      vehicleRegistracija: vozilo.registracija,
      vrsta: "osiguranje",
      status: osiguranje.status,
      poruka:
        osiguranje.danaDo < 0
          ? `${oznaka} — osiguranje isteklo prije ${Math.abs(osiguranje.danaDo)} dana`
          : `${oznaka} — osiguranje ističe za ${osiguranje.danaDo} dana`,
    });
  }

  const gume = statusGuma(vozilo.zadnjaZamjenaGuma ?? null, sada);
  if (gume.status !== "ok") {
    upozorenja.push({
      vehicleId: vozilo.id,
      vehicleNaziv: vozilo.naziv,
      vehicleRegistracija: vozilo.registracija,
      vrsta: "gume",
      status: gume.status,
      poruka: `${oznaka} — ${gume.poruka}`,
    });
  }

  return upozorenja;
}

export function svaUpozorenja(
  vozila: VoziloZaUpozorenja[],
  sada: Date = new Date(),
): Upozorenje[] {
  return vozila
    .flatMap((v) => upozorenjaZaVozilo(v, sada))
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "kritično" ? -1 : 1));
}

const ZNACAJKA_ZA_VRSTU: Partial<Record<Upozorenje["vrsta"], Znacajka>> = {
  potrosnja: "upozorenja_potrosnje",
  registracija: "rokovi_dokumenti",
  osiguranje: "rokovi_dokumenti",
  gume: "gume",
};

// "servis" nema odgovarajuću značajku pa ostaje dostupan na svim planovima
// (uključen u Starter — "praćenje goriva i servisa").
export function filtrirajPoPlanu(
  upozorenja: Upozorenje[],
  company: CompanyZaPlan,
): Upozorenje[] {
  return upozorenja.filter((u) => {
    const znacajka = ZNACAJKA_ZA_VRSTU[u.vrsta];
    return !znacajka || imaZnacajku(company, znacajka);
  });
}
