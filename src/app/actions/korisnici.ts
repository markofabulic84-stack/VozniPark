"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { zahtijevajAdmina, zahtijevajAktivnuPretplatu } from "@/lib/dal";
import { maxKorisnika, PLAN_NAZIVI } from "@/lib/planovi";

export type KorisnikState = { message?: string } | undefined;

export async function dodajKorisnika(
  _state: KorisnikState,
  formData: FormData,
): Promise<KorisnikState> {
  await zahtijevajAktivnuPretplatu();
  const admin = await zahtijevajAdmina();

  const ime = String(formData.get("ime") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "VOZAC";

  if (ime.length < 2) return { message: "Unesite ime." };
  if (!email.includes("@")) return { message: "Unesite ispravan email." };
  if (password.length < 8) {
    return { message: "Lozinka mora imati bar 8 znakova." };
  }

  const postojeci = await prisma.user.findUnique({ where: { email } });
  if (postojeci) {
    return { message: "Korisnik s tom email adresom već postoji." };
  }

  const limit = maxKorisnika(admin.company);
  if (limit != null) {
    const brojKorisnika = await prisma.user.count({
      where: { companyId: admin.companyId },
    });
    if (brojKorisnika >= limit) {
      return {
        message: `Dosegnut je limit od ${limit} korisnika za ${PLAN_NAZIVI[admin.company.plan]} plan.`,
      };
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { ime, email, passwordHash, role, companyId: admin.companyId },
  });

  revalidatePath("/app/korisnici");
  return { message: "Korisnik dodan." };
}

export async function obrisiKorisnika(formData: FormData) {
  await zahtijevajAktivnuPretplatu();
  const admin = await zahtijevajAdmina();
  const id = String(formData.get("id") ?? "");
  if (id === admin.id) return;

  await prisma.user.deleteMany({
    where: { id, companyId: admin.companyId },
  });

  revalidatePath("/app/korisnici");
}
