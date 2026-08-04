"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { zahtijevajAktivnuPretplatu } from "@/lib/dal";
import { imaZnacajku } from "@/lib/planovi";
import { parsirajDatumUnosa } from "@/lib/datum";

export type ZamjenaGumaState = { message?: string } | undefined;

export async function kreirajZamjenuGuma(
  _state: ZamjenaGumaState,
  formData: FormData,
): Promise<ZamjenaGumaState> {
  const user = await zahtijevajAktivnuPretplatu();
  if (!imaZnacajku(user.company, "gume")) {
    return { message: "Evidencija zamjene guma dostupna je na Pro i višim planovima." };
  }

  const vehicleId = String(formData.get("vehicleId") ?? "");
  const vrstaRaw = String(formData.get("vrsta") ?? "");
  const vrsta = vrstaRaw === "ZIMSKE" ? "ZIMSKE" : vrstaRaw === "LJETNE" ? "LJETNE" : null;
  const kmRaw = String(formData.get("kmStanje") ?? "").trim();
  const kmStanje = kmRaw ? Number(kmRaw) : null;
  const napomena = String(formData.get("napomena") ?? "").trim() || null;

  const vozilo = await prisma.vehicle.findFirst({
    where: { id: vehicleId, companyId: user.companyId },
  });
  if (!vozilo) {
    return { message: "Odaberite vozilo." };
  }
  if (!vrsta) {
    return { message: "Odaberite vrstu guma." };
  }
  if (kmRaw && (!Number.isFinite(kmStanje) || (kmStanje as number) < 0)) {
    return { message: "Unesite ispravno stanje kilometara." };
  }

  const parsiraniDatum = parsirajDatumUnosa(formData.get("datum"));
  if (!parsiraniDatum.ok) {
    return { message: "Unesite ispravan datum." };
  }
  const datum = parsiraniDatum.datum;

  await prisma.tireChange.create({
    data: {
      vehicleId,
      userId: user.id,
      datum,
      vrsta,
      kmStanje,
      napomena,
    },
  });

  revalidatePath("/app/gume");
  revalidatePath(`/app/vozila/${vehicleId}`);
  redirect("/app/gume");
}

export async function obrisiZamjenuGuma(formData: FormData) {
  const user = await zahtijevajAktivnuPretplatu();
  const id = String(formData.get("id") ?? "");

  await prisma.tireChange.deleteMany({
    where: { id, vehicle: { companyId: user.companyId } },
  });

  revalidatePath("/app/gume");
}
