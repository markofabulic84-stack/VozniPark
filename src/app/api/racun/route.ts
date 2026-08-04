import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createWorker } from "tesseract.js";
import { getCurrentUser } from "@/lib/dal";
import { pretplataAktivna } from "@/lib/pretplata";
import { imaZnacajku } from "@/lib/planovi";

// OCR zna trajati 5–15 s po slici — dulji limit da Vercel funkcija ne
// pukne na sporijim/zgužvanijim računima.
export const maxDuration = 60;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "racuni");
const MAX_BAJTOVA = 8 * 1024 * 1024;

const VRSTE_GORIVA: { kljucne: string[]; kod: string }[] = [
  { kljucne: ["eurodizel", "dizel", "diesel"], kod: "DIZEL" },
  { kljucne: ["benzin", "unleaded", "petrol", "95", "98"], kod: "BENZIN" },
  { kljucne: ["lpg", "autoplin", " plin"], kod: "LPG" },
  { kljucne: ["struja", "elektr"], kod: "ELEKTRICNO" },
];

function prepoznajVrstuGoriva(tekst: string): string | null {
  const lower = ` ${tekst.toLowerCase()} `;
  for (const v of VRSTE_GORIVA) {
    if (v.kljucne.some((k) => lower.includes(k))) return v.kod;
  }
  return null;
}

function izvuciBrojeve(tekst: string) {
  const linije = tekst.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let litre: number | null = null;
  let cijena: number | null = null;

  for (const linija of linije) {
    const lower = linija.toLowerCase();
    const brojMatch = linija.match(/(\d{1,4}[.,]\d{1,3})/);
    if (!brojMatch) continue;
    const broj = parseFloat(brojMatch[1].replace(",", "."));

    // "cijena/l", "€/l", "eur/l" su cijena PO litri, ne količina litara —
    // moraju se isključiti prije provjere generičkog "l" uz broj.
    const cijenaPoLitri = /cijena\s*\/?\s*l\b|[€$]\s*\/\s*l\b|eur\s*\/\s*l\b|kn\s*\/\s*l\b/.test(
      lower,
    );
    const izgledaKaoLitre =
      !cijenaPoLitri && (/litr|litar/.test(lower) || /\d[.,]\d+\s*l\b/.test(lower));

    if (litre === null && izgledaKaoLitre && broj > 0 && broj < 500) {
      litre = broj;
    }
    if (
      cijena === null &&
      /ukupno|za platiti|iznos|eur|kn\b|total/.test(lower) &&
      !cijenaPoLitri &&
      broj > 0 &&
      broj < 5000
    ) {
      cijena = broj;
    }
  }

  return { litre, cijena };
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!pretplataAktivna(user.company.pretplataDo)) {
    return NextResponse.json(
      { message: "Pretplata je istekla." },
      { status: 402 },
    );
  }
  if (!imaZnacajku(user.company, "ocr_racuna")) {
    return NextResponse.json(
      { message: "Slikanje računa dostupno je na Pro i višim planovima." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("slika");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Nedostaje slika." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { message: "Datoteka mora biti slika." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BAJTOVA) {
    return NextResponse.json(
      { message: "Slika je prevelika (maks. 8 MB)." },
      { status: 400 },
    );
  }

  const bajtovi = Buffer.from(await file.arrayBuffer());
  const ekstenzija = file.type === "image/png" ? "png" : "jpg";
  const datotekaNaziv = `${user.companyId}-${randomUUID()}.${ekstenzija}`;

  let racunUrl: string;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Vercel Blob — trajni cloud storage (lokalni disk na Vercelu nestaje
    // pri svakom deployu). Token dolazi automatski kad se Blob store poveže
    // s projektom u Vercel dashboardu.
    const { put } = await import("@vercel/blob");
    const blob = await put(`racuni/${datotekaNaziv}`, bajtovi, {
      access: "public",
      contentType: file.type,
    });
    racunUrl = blob.url;
  } else {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, datotekaNaziv), bajtovi);
    racunUrl = `/uploads/racuni/${datotekaNaziv}`;
  }

  let sirovText = "";
  try {
    const worker = await createWorker("eng");
    const rezultat = await worker.recognize(bajtovi);
    sirovText = rezultat.data.text;
    await worker.terminate();
  } catch (greska) {
    console.error("OCR greška:", greska);
    return NextResponse.json({
      racunUrl,
      litre: null,
      ukupnaCijena: null,
      vrstaGoriva: null,
      ocrUspio: false,
    });
  }

  const { litre, cijena } = izvuciBrojeve(sirovText);
  const vrstaGoriva = prepoznajVrstuGoriva(sirovText);

  return NextResponse.json({
    racunUrl,
    litre,
    ukupnaCijena: cijena,
    vrstaGoriva,
    ocrUspio: true,
  });
}
