import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { noviIstek } from "@/lib/pretplata";
import type { Plan } from "@/generated/prisma/enums";

// Povratna ruta sa Stripe Checkouta. Stanje sesije se dohvaća izravno sa
// Stripe API-ja (server-server), pa korisnik ne može krivotvoriti "plaćeno";
// StripeUplata zapis osigurava da ista sesija ne produlji pretplatu dvaput.
export async function GET(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.redirect(new URL("/pretplata", request.url));
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.redirect(new URL("/pretplata", request.url));
  }

  const sesija = await stripe.checkout.sessions.retrieve(sessionId);
  const companyId = sesija.metadata?.companyId;
  const planRaw = sesija.metadata?.plan;

  if (sesija.payment_status !== "paid" || !companyId) {
    return NextResponse.redirect(new URL("/pretplata", request.url));
  }

  try {
    await prisma.stripeUplata.create({
      data: { id: sesija.id, companyId },
    });
  } catch {
    // Već obrađeno (unique violation) — samo natrag na pregled pretplate.
    return NextResponse.redirect(new URL("/pretplata", request.url));
  }

  const firma = await prisma.company.findUnique({ where: { id: companyId } });
  if (firma) {
    const plan: Plan =
      planRaw === "STARTER" || planRaw === "PRO" || planRaw === "ENTERPRISE"
        ? planRaw
        : firma.plan;
    await prisma.company.update({
      where: { id: companyId },
      data: { plan, pretplataDo: noviIstek(firma.pretplataDo), naPocetnomProbnom: false },
    });
  }

  return NextResponse.redirect(new URL("/pretplata", request.url));
}
