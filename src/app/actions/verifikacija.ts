"use server";

import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { posaljiEmail } from "@/lib/email";
import { getCurrentUser } from "@/lib/dal";
import { klijentIp, provjeriLimit } from "@/lib/rate-limit";

const TOKEN_TRAJANJE_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Interno (poziva se iz registracije i iz "pošalji ponovno").
export async function posaljiVerifikacijskiEmail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.emailVerificiranAt) return;

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      namjena: "verifikacija",
      expiresAt: new Date(Date.now() + TOKEN_TRAJANJE_MS),
    },
  });

  const baza = process.env.APP_URL ?? "http://localhost:3000";
  await posaljiEmail({
    to: user.email,
    subject: "VozniPark — potvrdite email adresu",
    text: [
      `Pozdrav ${user.ime},`,
      "",
      "potvrdite svoju email adresu klikom na poveznicu (vrijedi 24 sata):",
      "",
      `${baza}/potvrda-emaila/${token}`,
      "",
      "Ako se niste registrirali na VozniPark, zanemarite ovu poruku.",
    ].join("\n"),
  });
}

export type VerifikacijaState = { message?: string } | undefined;

export async function ponovnoPosaljiVerifikaciju(): Promise<VerifikacijaState> {
  const user = await getCurrentUser();
  if (user.emailVerificiranAt) {
    return { message: "Email je već potvrđen." };
  }

  const ip = await klijentIp();
  const limit = await provjeriLimit(
    `verifikacija:${ip}:${user.id}`,
    3,
    60 * 60 * 1000,
  );
  if (!limit.dopusteno) {
    return {
      message: `Previše zahtjeva — pokušajte ponovno za ${limit.pokusajZaMin} min.`,
    };
  }

  await posaljiVerifikacijskiEmail(user.id);
  return { message: "Email s potvrdom je ponovno poslan." };
}
