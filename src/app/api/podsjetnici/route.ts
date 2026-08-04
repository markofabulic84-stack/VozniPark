import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { posaljiEmail } from "@/lib/email";
import { pripremiPodsjetnike } from "@/lib/podsjetnici-core";
import { ocistiIsteklo } from "@/lib/rate-limit";

export const maxDuration = 60;

// Ruta za Vercel Cron (vercel.json). Vercel šalje "Authorization: Bearer
// <CRON_SECRET>" — bez ispravnog secreta ruta odbija zahtjev da je ne može
// okidati bilo tko izvana.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Neautorizirano." }, { status: 401 });
  }

  const poruke = await pripremiPodsjetnike(prisma);
  for (const poruka of poruke) {
    await posaljiEmail(poruka);
  }

  // Dnevni cron je i jedino mjesto gdje se čiste zapisi koje inače nitko ne
  // briše (limiter, iskorišteni tokeni) — bez toga te tablice samo rastu.
  const ocisceno = await ocistiIsteklo();

  return NextResponse.json({ poslano: poruke.length, ocisceno });
}
