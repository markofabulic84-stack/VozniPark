"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { posaljiEmail } from "@/lib/email";
import { klijentIp, provjeriLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/dal";
import { createSession } from "@/lib/session";

const TOKEN_TRAJANJE_MS = 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type ZahtjevState = { message?: string; poslano?: boolean } | undefined;

export async function zatraziResetLozinke(
  _state: ZahtjevState,
  formData: FormData,
): Promise<ZahtjevState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) {
    return { message: "Unesite ispravnu email adresu." };
  }

  const ip = await klijentIp();
  const limit = await provjeriLimit(`reset:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.dopusteno) {
    return {
      message: `Previše zahtjeva — pokušajte ponovno za ${limit.pokusajZaMin} min.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Odgovor je isti postoji li korisnik ili ne (bez otkrivanja registriranih
  // adresa); email se šalje samo ako korisnik stvarno postoji.
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TRAJANJE_MS),
      },
    });

    const baza = process.env.APP_URL ?? "http://localhost:3000";
    await posaljiEmail({
      to: email,
      subject: "VozniPark — postavljanje nove lozinke",
      text: [
        `Pozdrav ${user.ime},`,
        "",
        "zatražena je promjena lozinke za vaš VozniPark račun.",
        `Poveznica vrijedi 60 minuta:`,
        "",
        `${baza}/reset-lozinka/${token}`,
        "",
        "Ako niste vi zatražili promjenu, slobodno zanemarite ovu poruku.",
      ].join("\n"),
    });
  }

  return {
    poslano: true,
    message:
      "Ako račun s tom adresom postoji, poslali smo poveznicu za novu lozinku.",
  };
}

export type ResetState = { message?: string } | undefined;

export async function postaviNovuLozinku(
  _state: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { message: "Lozinka mora imati bar 8 znakova." };
  }

  const zapis = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (
    !zapis ||
    zapis.namjena !== "reset" ||
    zapis.used ||
    zapis.expiresAt < new Date()
  ) {
    return {
      message: "Poveznica je nevažeća ili istekla. Zatražite novu.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: zapis.userId },
      // sessionVersion + 1 poništava sve postojeće sesije tog korisnika —
      // ukradena/stara sesija prestaje vrijediti čim se lozinka promijeni.
      data: { passwordHash, sessionVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.update({
      where: { id: zapis.id },
      data: { used: true },
    }),
  ]);

  redirect("/prijava");
}

export type PromjenaLozinkeState =
  | { message?: string; uspjeh?: boolean }
  | undefined;

export async function promijeniLozinku(
  _state: PromjenaLozinkeState,
  formData: FormData,
): Promise<PromjenaLozinkeState> {
  const user = await getCurrentUser();

  const trenutna = String(formData.get("trenutnaLozinka") ?? "");
  const nova = String(formData.get("novaLozinka") ?? "");

  if (nova.length < 8) {
    return { message: "Nova lozinka mora imati bar 8 znakova." };
  }

  const ip = await klijentIp();
  const limit = await provjeriLimit(`promjena-lozinke:${user.id}:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.dopusteno) {
    return {
      message: `Previše pokušaja — pokušajte ponovno za ${limit.pokusajZaMin} min.`,
    };
  }

  const podudara = await bcrypt.compare(trenutna, user.passwordHash);
  if (!podudara) {
    return { message: "Trenutna lozinka nije točna." };
  }

  const passwordHash = await bcrypt.hash(nova, 10);
  const azurirani = await prisma.user.update({
    where: { id: user.id },
    // sessionVersion + 1 poništava sesije na SVIM ostalim uređajima; ovaj
    // uređaj odmah dobiva novu sesiju s ažuriranom verzijom pa ostaje
    // prijavljen (za razliku od reset-lozinke tokom, gdje nema "trenutnog
    // uređaja" da ga treba zadržati prijavljenim).
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });

  await createSession({
    userId: azurirani.id,
    companyId: azurirani.companyId,
    role: azurirani.role,
    sv: azurirani.sessionVersion,
  });

  return { uspjeh: true, message: "Lozinka je promijenjena." };
}
