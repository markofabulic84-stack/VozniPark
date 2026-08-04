import { createHash } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const zapis = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (
    !zapis ||
    zapis.namjena !== "verifikacija" ||
    zapis.used ||
    zapis.expiresAt < new Date()
  ) {
    return NextResponse.redirect(new URL("/prijava?potvrda=nevazeca", request.url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: zapis.userId },
      data: { emailVerificiranAt: new Date() },
    }),
    prisma.passwordResetToken.update({
      where: { id: zapis.id },
      data: { used: true },
    }),
  ]);

  return NextResponse.redirect(new URL("/app", request.url));
}
