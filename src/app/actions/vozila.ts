"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { zahtijevajAktivnuPretplatu } from "@/lib/dal";
import { maxVozila, PLAN_NAZIVI } from "@/lib/planovi";
import { parsirajDatum } from "@/lib/datum";

const PORUKA_SAMO_ADMIN = "Samo administrator firme može upravljati vozilima.";

export type VoziloState = { message?: string } | undefined;

function parsirajOpcionalniBroj(vrijednost: FormDataEntryValue | null) {
  if (!vrijednost || String(vrijednost).trim() === "") return null;
  const broj = Number(vrijednost);
  return Number.isFinite(broj) ? broj : null;
}


export async function kreirajVozilo(
  _state: VoziloState,
  formData: FormData,
): Promise<VoziloState> {
  const user = await zahtijevajAktivnuPretplatu();
  if (user.role !== "ADMIN") {
    return { message: PORUKA_SAMO_ADMIN };
  }

  const naziv = String(formData.get("naziv") ?? "").trim();
  const registracija = String(formData.get("registracija") ?? "").trim();

  if (naziv.length < 2 || registracija.length < 2) {
    return { message: "Unesite naziv i registraciju vozila." };
  }

  const limit = maxVozila(user.company);
  if (limit != null) {
    const broj = await prisma.vehicle.count({
      where: { companyId: user.companyId, aktivno: true },
    });
    if (broj >= limit) {
      return {
        message: `Dosegnut je limit od ${limit} vozila za ${PLAN_NAZIVI[user.company.plan]} plan.`,
      };
    }
  }

  const postojece = await prisma.vehicle.findFirst({
    where: { companyId: user.companyId, registracija },
  });
  if (postojece) {
    return { message: "Vozilo s tom registracijom već postoji." };
  }

  const trenutniKm = parsirajOpcionalniBroj(formData.get("trenutniKm")) ?? 0;

  const vozilo = await prisma.vehicle.create({
    data: {
      companyId: user.companyId,
      naziv,
      registracija,
      trenutniKm: Math.max(0, Math.trunc(trenutniKm)),
      referentnaPotrosnja: parsirajOpcionalniBroj(
        formData.get("referentnaPotrosnja"),
      ),
      sljedeciServisKm: parsirajOpcionalniBroj(
        formData.get("sljedeciServisKm"),
      ),
      registracijaDo: parsirajDatum(formData.get("registracijaDo")),
      osiguranjeDo: parsirajDatum(formData.get("osiguranjeDo")),
    },
  });

  revalidatePath("/app/vozila");
  redirect(`/app/vozila/${vozilo.id}`);
}

export async function azurirajVozilo(
  _state: VoziloState,
  formData: FormData,
): Promise<VoziloState> {
  const user = await zahtijevajAktivnuPretplatu();
  if (user.role !== "ADMIN") {
    return { message: PORUKA_SAMO_ADMIN };
  }
  const id = String(formData.get("id") ?? "");

  const vozilo = await prisma.vehicle.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!vozilo) {
    return { message: "Vozilo nije pronađeno." };
  }

  const naziv = String(formData.get("naziv") ?? "").trim();
  const registracija = String(formData.get("registracija") ?? "").trim();
  if (naziv.length < 2 || registracija.length < 2) {
    return { message: "Unesite naziv i registraciju vozila." };
  }

  const trenutniKm = parsirajOpcionalniBroj(formData.get("trenutniKm"));

  await prisma.vehicle.update({
    where: { id },
    data: {
      naziv,
      registracija,
      trenutniKm: trenutniKm != null ? Math.max(0, Math.trunc(trenutniKm)) : vozilo.trenutniKm,
      referentnaPotrosnja: parsirajOpcionalniBroj(
        formData.get("referentnaPotrosnja"),
      ),
      sljedeciServisKm: parsirajOpcionalniBroj(
        formData.get("sljedeciServisKm"),
      ),
      registracijaDo: parsirajDatum(formData.get("registracijaDo")),
      osiguranjeDo: parsirajDatum(formData.get("osiguranjeDo")),
    },
  });

  revalidatePath(`/app/vozila/${id}`);
  revalidatePath("/app/vozila");
  return { message: "Spremljeno." };
}

export async function deaktivirajVozilo(formData: FormData) {
  const user = await zahtijevajAktivnuPretplatu();
  if (user.role !== "ADMIN") return;
  const id = String(formData.get("id") ?? "");

  const vozilo = await prisma.vehicle.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!vozilo) return;

  await prisma.vehicle.update({ where: { id }, data: { aktivno: false } });
  revalidatePath("/app/vozila");
  redirect("/app/vozila");
}
