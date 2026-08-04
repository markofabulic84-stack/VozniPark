import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/dal";
import { pretplataAktivna } from "@/lib/pretplata";
import { maxVozila, imaZnacajku } from "@/lib/planovi";

const MAX_BAJTOVA = 5 * 1024 * 1024;
const MAX_REDOVA = 5000;

type Red = Record<string, unknown>;

function nadjiKljuc(red: Red, ...kandidati: string[]): string | null {
  const kljucevi = Object.keys(red);
  for (const kandidat of kandidati) {
    const pogodak = kljucevi.find(
      (k) => k.trim().toLowerCase() === kandidat.toLowerCase(),
    );
    if (pogodak) return pogodak;
  }
  return null;
}

function uBroj(vrijednost: unknown): number | null {
  if (typeof vrijednost === "number" && Number.isFinite(vrijednost)) {
    return vrijednost;
  }
  if (typeof vrijednost === "string") {
    const broj = parseFloat(vrijednost.replace(",", "."));
    return Number.isFinite(broj) ? broj : null;
  }
  return null;
}

function uDatum(vrijednost: unknown): Date {
  if (vrijednost instanceof Date && !Number.isNaN(vrijednost.getTime())) {
    return vrijednost;
  }
  if (typeof vrijednost === "string") {
    // hrvatski format d.M.yyyy. ili ISO
    const hr = vrijednost.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?$/);
    if (hr) return new Date(Number(hr[3]), Number(hr[2]) - 1, Number(hr[1]));
    const parsed = new Date(vrijednost);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") {
    return NextResponse.json({ message: "Samo administrator." }, { status: 403 });
  }
  if (!pretplataAktivna(user.company.pretplataDo)) {
    return NextResponse.json({ message: "Pretplata je istekla." }, { status: 402 });
  }
  if (!imaZnacajku(user.company, "csv_uvoz")) {
    return NextResponse.json(
      { message: "Uvoz iz Excel/CSV dostupan je samo na Enterprise planu." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("datoteka");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Nedostaje datoteka." }, { status: 400 });
  }
  if (file.size > MAX_BAJTOVA) {
    return NextResponse.json(
      { message: "Datoteka je prevelika (maks. 5 MB)." },
      { status: 400 },
    );
  }

  let redovi: Red[];
  try {
    const radnaKnjiga = XLSX.read(Buffer.from(await file.arrayBuffer()), {
      cellDates: true,
    });
    const list = radnaKnjiga.Sheets[radnaKnjiga.SheetNames[0]];
    redovi = XLSX.utils.sheet_to_json<Red>(list, { defval: "" });
  } catch {
    return NextResponse.json(
      { message: "Datoteku nije moguće pročitati — očekuje se .xlsx ili .csv." },
      { status: 400 },
    );
  }

  if (redovi.length === 0) {
    return NextResponse.json({ message: "Datoteka je prazna." }, { status: 400 });
  }
  if (redovi.length > MAX_REDOVA) {
    return NextResponse.json(
      { message: `Previše redova (maks. ${MAX_REDOVA}).` },
      { status: 400 },
    );
  }

  const prviRed = redovi[0];
  const kRegistracija = nadjiKljuc(prviRed, "registracija", "reg", "vozilo");
  const kDatum = nadjiKljuc(prviRed, "datum", "date");
  const kKm = nadjiKljuc(prviRed, "km", "km stanje", "kilometri", "stanje km");
  const kLitre = nadjiKljuc(prviRed, "litre", "litara", "l");
  const kCijena = nadjiKljuc(
    prviRed,
    "cijena",
    "ukupna cijena",
    "ukupna cijena (eur)",
    "iznos",
  );
  const kPun = nadjiKljuc(prviRed, "pun spremnik", "pun", "full");

  if (!kRegistracija || !kKm || !kLitre || !kCijena) {
    return NextResponse.json(
      {
        message:
          "Nedostaju obavezni stupci. Očekuju se: Registracija, Km, Litre, Cijena (opcionalno: Datum, Pun spremnik).",
      },
      { status: 400 },
    );
  }

  const vozila = await prisma.vehicle.findMany({
    where: { companyId: user.companyId },
  });
  const poRegistraciji = new Map(vozila.map((v) => [v.registracija.toLowerCase(), v]));
  const limit = maxVozila(user.company);
  let aktivnihVozila = vozila.filter((v) => v.aktivno).length;

  let uvezeno = 0;
  let novihVozila = 0;
  const preskoceno: string[] = [];

  for (const [indeks, red] of redovi.entries()) {
    const registracija = String(red[kRegistracija] ?? "").trim();
    const km = uBroj(red[kKm]);
    const litre = uBroj(red[kLitre]);
    const cijena = uBroj(red[kCijena]);

    if (!registracija || km == null || litre == null || cijena == null) {
      preskoceno.push(`red ${indeks + 2}: nepotpuni podaci`);
      continue;
    }

    let vozilo = poRegistraciji.get(registracija.toLowerCase());
    if (!vozilo) {
      if (limit != null && aktivnihVozila >= limit) {
        preskoceno.push(
          `red ${indeks + 2}: ${registracija} — dosegnut limit vozila za plan`,
        );
        continue;
      }
      vozilo = await prisma.vehicle.create({
        data: {
          companyId: user.companyId,
          naziv: registracija,
          registracija,
          trenutniKm: Math.trunc(km),
        },
      });
      poRegistraciji.set(registracija.toLowerCase(), vozilo);
      aktivnihVozila++;
      novihVozila++;
    }

    const punRaw = kPun ? String(red[kPun] ?? "").trim().toLowerCase() : "da";
    await prisma.fuelEntry.create({
      data: {
        vehicleId: vozilo.id,
        userId: user.id,
        datum: kDatum ? uDatum(red[kDatum]) : new Date(),
        kmStanje: Math.trunc(km),
        litre,
        ukupnaCijena: cijena,
        punSpremnik: !["ne", "no", "0", "false"].includes(punRaw),
        napomena: "uvezeno iz tablice",
      },
    });

    if (Math.trunc(km) > vozilo.trenutniKm) {
      await prisma.vehicle.update({
        where: { id: vozilo.id },
        data: { trenutniKm: Math.trunc(km) },
      });
      vozilo.trenutniKm = Math.trunc(km);
    }
    uvezeno++;
  }

  return NextResponse.json({ uvezeno, novihVozila, preskoceno });
}
