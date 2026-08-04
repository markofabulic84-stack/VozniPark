"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { zahtijevajAktivnuPretplatu } from "@/lib/dal";
import { parsirajDatumUnosa } from "@/lib/datum";

export type TocenjeState = { message?: string } | undefined;

export async function kreirajTocenje(
  _state: TocenjeState,
  formData: FormData,
): Promise<TocenjeState> {
  const user = await zahtijevajAktivnuPretplatu();

  const vehicleId = String(formData.get("vehicleId") ?? "");
  const kmStanje = Number(formData.get("kmStanje"));
  const litre = Number(formData.get("litre"));
  const ukupnaCijena = Number(formData.get("ukupnaCijena"));
  const punSpremnik = formData.get("punSpremnik") === "on";
  const napomena = String(formData.get("napomena") ?? "").trim() || null;
  const vrstaGoriva = String(formData.get("vrstaGoriva") ?? "").trim() || null;
  const racunSlika = String(formData.get("racunSlika") ?? "").trim() || null;

  const vozilo = await prisma.vehicle.findFirst({
    where: { id: vehicleId, companyId: user.companyId },
  });
  if (!vozilo) {
    return { message: "Odaberite vozilo." };
  }

  if (!Number.isFinite(kmStanje) || kmStanje < 0) {
    return { message: "Unesite ispravno stanje kilometara." };
  }
  if (!Number.isFinite(litre) || litre <= 0) {
    return { message: "Unesite ispravnu količinu litara." };
  }
  if (!Number.isFinite(ukupnaCijena) || ukupnaCijena < 0) {
    return { message: "Unesite ispravnu cijenu." };
  }

  const parsiraniDatum = parsirajDatumUnosa(formData.get("datum"));
  if (!parsiraniDatum.ok) {
    return { message: "Unesite ispravan datum." };
  }
  const datum = parsiraniDatum.datum;

  await prisma.fuelEntry.create({
    data: {
      vehicleId,
      userId: user.id,
      datum,
      kmStanje: Math.trunc(kmStanje),
      litre,
      ukupnaCijena,
      punSpremnik,
      vrstaGoriva,
      racunSlika,
      napomena,
    },
  });

  const azuriranja: Record<string, unknown> = {};
  if (kmStanje > vozilo.trenutniKm) {
    azuriranja.trenutniKm = Math.trunc(kmStanje);
  }
  if (vrstaGoriva && !vozilo.zadanaVrstaGoriva) {
    azuriranja.zadanaVrstaGoriva = vrstaGoriva;
  }
  if (Object.keys(azuriranja).length > 0) {
    await prisma.vehicle.update({ where: { id: vehicleId }, data: azuriranja });
  }

  revalidatePath(`/app/vozila/${vehicleId}`);
  revalidatePath("/app/vozila");
  revalidatePath("/app");
  redirect(`/app/vozila/${vehicleId}`);
}
