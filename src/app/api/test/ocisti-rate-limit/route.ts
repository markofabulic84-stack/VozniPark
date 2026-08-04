import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Samo za E2E testove (playwright/e2e/helpers.ts) — čisti limiter prijave/
// registracije da testovi koji ponavljano registriraju firme s iste adrese
// ne budu ograničeni vlastitim prethodnim pokretanjima.
//
// Namjerno provjerava E2E_TESTING, NE NODE_ENV: E2E testovi rade protiv
// produkcijskog builda (`next start`, koji sam postavlja NODE_ENV=production)
// da izbjegnu nestabilne timeoute od Turbopackovog kompajliranja ruta na
// zahtjev u dev-modu — provjera na NODE_ENV bi ovu rutu ugasila baš kad je
// testovima treba. E2E_TESTING postavlja samo Playwrightov webServer
// (playwright.config.ts), nikad se ne postavlja na pravoj Vercel produkciji.
export async function POST() {
  if (process.env.E2E_TESTING !== "true") {
    return NextResponse.json({ message: "Nije pronađeno." }, { status: 404 });
  }
  await prisma.rateLimit.deleteMany();
  return NextResponse.json({ ocisceno: true });
}
