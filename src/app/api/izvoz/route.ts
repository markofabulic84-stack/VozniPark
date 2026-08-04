import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { imaZnacajku } from "@/lib/planovi";

function csvPolje(vrijednost: string | number): string {
  const tekst = String(vrijednost);
  if (/[",\n]/.test(tekst)) {
    return `"${tekst.replace(/"/g, '""')}"`;
  }
  return tekst;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!imaZnacajku(user.company, "csv_izvoz")) {
    return NextResponse.json(
      { message: "Izvoz podataka (CSV) dostupan je na Pro i višim planovima." },
      { status: 403 },
    );
  }

  const tocenja = await prisma.fuelEntry.findMany({
    where: { vehicle: { companyId: user.companyId } },
    include: { vehicle: true, user: true },
    orderBy: { datum: "asc" },
  });

  const zaglavlje = [
    "Datum",
    "Vozilo",
    "Registracija",
    "Km stanje",
    "Litre",
    "Ukupna cijena (EUR)",
    "Pun spremnik",
    "Unio",
    "Napomena",
  ];

  const redovi = tocenja.map((t) =>
    [
      t.datum.toISOString().slice(0, 10),
      t.vehicle.naziv,
      t.vehicle.registracija,
      t.kmStanje,
      t.litre.toFixed(2),
      t.ukupnaCijena.toFixed(2),
      t.punSpremnik ? "da" : "ne",
      t.user?.ime ?? "",
      t.napomena ?? "",
    ]
      .map(csvPolje)
      .join(","),
  );

  const csv = [zaglavlje.join(","), ...redovi].join("\n");

  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vozni-park-izvoz-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
