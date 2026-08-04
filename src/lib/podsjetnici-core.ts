// Priprema email podsjetnika na rokove — zajednička logika za CLI skriptu
// (scripts/podsjetnici.ts) i Vercel Cron rutu (/api/podsjetnici).
// Relativni importi (ne "@/" alias) da modul radi i pod tsx-om u CLI skripti.
import type { PrismaClient } from "../generated/prisma/client";
import { statusDatuma, statusServisa } from "./rokovi";
import { danaDoIsteka } from "./pretplata";

export type EmailPoruka = { to: string; subject: string; text: string };

type FirmaZaProbniPodsjetnik = {
  naziv: string;
  naPocetnomProbnom: boolean;
  pretplataDo: Date | null;
};

type KorisnikZaPodsjetnik = { ime: string; email: string };

// Jedan podsjetnik, dan prije nego probni period istekne — dovoljno rano da
// admin stigne odabrati plan, a ne toliko rano da se izgubi u pozadinskoj
// buci. Nakon isteka probe zaključavanje aplikacije (zahtijevajAktivnuPretplatu)
// već je dovoljno upozorenje unutar same aplikacije.
export function porukaProbniIstek(
  firma: FirmaZaProbniPodsjetnik,
  admin: KorisnikZaPodsjetnik,
  sada: Date = new Date(),
): EmailPoruka | null {
  if (!firma.naPocetnomProbnom) return null;
  if (danaDoIsteka(firma.pretplataDo, sada) !== 1) return null;

  return {
    to: admin.email,
    subject: "VozniPark — probni period ističe sutra",
    text: [
      `Pozdrav ${admin.ime},`,
      "",
      `probni period za firmu ${firma.naziv} ističe sutra.`,
      "Ako ne odaberete plan, pristup aplikaciji bit će privremeno onemogućen dok se pretplata ne aktivira — svi podaci ostaju sačuvani.",
      "",
      "Odaberite plan: /pretplata",
    ].join("\n"),
  };
}

export async function pripremiPodsjetnike(
  prisma: PrismaClient,
): Promise<EmailPoruka[]> {
  const firme = await prisma.company.findMany({
    include: {
      vehicles: { where: { aktivno: true } },
      users: { where: { role: "ADMIN" } },
    },
  });

  const poruke: EmailPoruka[] = [];

  for (const firma of firme) {
    const stavke: string[] = [];

    for (const vozilo of firma.vehicles) {
      const oznaka = `${vozilo.naziv} (${vozilo.registracija})`;

      const servis = statusServisa(vozilo.sljedeciServisKm, vozilo.trenutniKm);
      if (servis && servis.status !== "ok") {
        stavke.push(
          servis.kmDo < 0
            ? `- ${oznaka}: servis KASNI ${Math.abs(servis.kmDo)} km`
            : `- ${oznaka}: servis za ${servis.kmDo} km`,
        );
      }

      const registracija = statusDatuma(vozilo.registracijaDo);
      if (registracija && registracija.status !== "ok") {
        stavke.push(
          registracija.danaDo < 0
            ? `- ${oznaka}: registracija ISTEKLA prije ${Math.abs(registracija.danaDo)} dana`
            : `- ${oznaka}: registracija ističe za ${registracija.danaDo} dana`,
        );
      }

      const osiguranje = statusDatuma(vozilo.osiguranjeDo);
      if (osiguranje && osiguranje.status !== "ok") {
        stavke.push(
          osiguranje.danaDo < 0
            ? `- ${oznaka}: osiguranje ISTEKLO prije ${Math.abs(osiguranje.danaDo)} dana`
            : `- ${oznaka}: osiguranje ističe za ${osiguranje.danaDo} dana`,
        );
      }
    }

    if (stavke.length > 0) {
      for (const admin of firma.users) {
        poruke.push({
          to: admin.email,
          subject: `VozniPark — ${stavke.length} ${stavke.length === 1 ? "rok zahtijeva" : "roka zahtijeva"} pažnju`,
          text: [
            `Pozdrav ${admin.ime},`,
            "",
            `pregled rokova za firmu ${firma.naziv}:`,
            "",
            ...stavke,
            "",
            "Detalji: /app/rokovi",
          ].join("\n"),
        });
      }
    }

    for (const admin of firma.users) {
      const probniPodsjetnik = porukaProbniIstek(firma, admin);
      if (probniPodsjetnik) poruke.push(probniPodsjetnik);
    }
  }

  return poruke;
}
