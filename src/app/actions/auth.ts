"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { probniIstek } from "@/lib/pretplata";
import { klijentIp, provjeriLimit } from "@/lib/rate-limit";
import { posaljiVerifikacijskiEmail } from "@/app/actions/verifikacija";
import {
  PrijavaSchema,
  PrijavaState,
  RegistracijaSchema,
  RegistracijaState,
} from "@/lib/definitions";

export async function registracija(
  _state: RegistracijaState,
  formData: FormData,
): Promise<RegistracijaState> {
  const ip = await klijentIp();
  const limit = await provjeriLimit(`registracija:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.dopusteno) {
    return {
      message: `Previše pokušaja registracije — pokušajte ponovno za ${limit.pokusajZaMin} min.`,
    };
  }

  const validirano = RegistracijaSchema.safeParse({
    firma: formData.get("firma"),
    ime: formData.get("ime"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validirano.success) {
    return { errors: validirano.error.flatten().fieldErrors };
  }

  const { firma, ime, email, password } = validirano.data;

  const postojeci = await prisma.user.findUnique({ where: { email } });
  if (postojeci) {
    return { message: "Korisnik s tom email adresom već postoji." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      ime,
      email,
      passwordHash,
      role: "ADMIN",
      company: {
        create: { naziv: firma, pretplataDo: probniIstek() },
      },
    },
  });

  await posaljiVerifikacijskiEmail(user.id);

  await createSession({
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    sv: user.sessionVersion,
  });

  redirect("/app");
}

export async function prijava(
  _state: PrijavaState,
  formData: FormData,
): Promise<PrijavaState> {
  const validirano = PrijavaSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validirano.success) {
    return { errors: validirano.error.flatten().fieldErrors };
  }

  const { email, password } = validirano.data;

  // Limit po IP-u i po računu: 5 pokušaja u 15 minuta. Provjera ide PRIJE
  // usporedbe lozinke da ni ispravna lozinka ne zaobiđe blokadu (spriječava
  // paralelno pogađanje do pogotka).
  const ip = await klijentIp();
  const limit = await provjeriLimit(
    `prijava:${ip}:${email}`,
    5,
    15 * 60 * 1000,
  );
  if (!limit.dopusteno) {
    return {
      message: `Previše neuspjelih pokušaja — pokušajte ponovno za ${limit.pokusajZaMin} min.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const podudara = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !podudara) {
    return { message: "Neispravan email ili lozinka." };
  }

  await createSession({
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    sv: user.sessionVersion,
  });

  redirect("/app");
}

export async function odjava() {
  await deleteSession();
  redirect("/prijava");
}
