"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { zahtijevajAktivnuPretplatu } from "@/lib/dal";
import { parsirajDatumUnosa } from "@/lib/datum";

export type DnevnaVoznjaState = { message?: string } | undefined;

export async function kreirajDnevnuVoznju(
  _state: DnevnaVoznjaState,
  formData: FormData,
): Promise<DnevnaVoznjaState> {
  const user = await zahtijevajAktivnuPretplatu();

  const vehicleId = String(formData.get("vehicleId") ?? "");
  const pocetniKm = Number(formData.get("pocetniKm"));
  const zavrsniKm = Number(formData.get("zavrsniKm"));
  const napomena = String(formData.get("napomena") ?? "").trim() || null;

  const vozilo = await prisma.vehicle.findFirst({
    where: { id: vehicleId, companyId: user.companyId },
  });
  if (!vozilo) {
    return { message: "Odaberite vozilo." };
  }
  if (!Number.isFinite(pocetniKm) || pocetniKm < 0) {
    return { message: "Unesite ispravan početni km." };
  }
  if (!Number.isFinite(zavrsniKm) || zavrsniKm < pocetniKm) {
    return { message: "Završni km mora biti veći ili jednak početnom." };
  }

  const parsiraniDatum = parsirajDatumUnosa(formData.get("datum"));
  if (!parsiraniDatum.ok) {
    return { message: "Unesite ispravan datum." };
  }
  const datum = parsiraniDatum.datum;

  await prisma.dailyLog.create({
    data: {
      vehicleId,
      userId: user.id,
      datum,
      pocetniKm: Math.trunc(pocetniKm),
      zavrsniKm: Math.trunc(zavrsniKm),
      napomena,
    },
  });

  if (zavrsniKm > vozilo.trenutniKm) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { trenutniKm: Math.trunc(zavrsniKm) },
    });
  }

  revalidatePath("/app/kilometraza");
  revalidatePath(`/app/vozila/${vehicleId}`);
  redirect("/app/kilometraza");
}

export async function obrisiDnevnuVoznju(formData: FormData) {
  const user = await zahtijevajAktivnuPretplatu();
  const id = String(formData.get("id") ?? "");

  await prisma.dailyLog.deleteMany({
    where: { id, vehicle: { companyId: user.companyId } },
  });

  revalidatePath("/app/kilometraza");
}
