import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { provjeriCreemPotpis } from "@/lib/creem-potpis";
import { noviIstek } from "@/lib/pretplata";
import type { Plan } from "@/generated/prisma/enums";

// Eventi koji produljuju pretplatu: prva uplata i svaka mjesečna obnova.
// Otkazivanje se namjerno ne obrađuje — pretplata jednostavno istekne na
// datum do kojeg je plaćena, pa korisnik zadrži ono što je platio.
const EVENTI_UPLATE = ["checkout.completed", "subscription.paid"];

// Creem potvrđuje plaćanje push webhookom umjesto redirectom, pa naplata
// radi i ako korisnik zatvori tab prije povratka na /pretplata.
// companyId/plan stižu kroz metadata, postavljene u produziPretplatu.
export async function POST(request: NextRequest) {
  const tajna = process.env.CREEM_WEBHOOK_SECRET;
  if (!tajna) {
    return NextResponse.json({ message: "Webhook nije konfiguriran." }, { status: 501 });
  }

  const sirovoTijelo = await request.text();
  if (!provjeriCreemPotpis(sirovoTijelo, request.headers.get("creem-signature"), tajna)) {
    return NextResponse.json({ message: "Neispravan potpis." }, { status: 401 });
  }

  const payload = JSON.parse(sirovoTijelo);
  if (!EVENTI_UPLATE.includes(payload?.eventType)) {
    return NextResponse.json({ primljeno: true });
  }

  const metadata = payload.object?.metadata ?? {};
  const companyId = typeof metadata.companyId === "string" ? metadata.companyId : null;
  const eventId = payload.id ? String(payload.id) : null;
  if (!companyId || !eventId) {
    return NextResponse.json({ primljeno: true });
  }

  try {
    await prisma.creemUplata.create({ data: { id: eventId, companyId } });
  } catch {
    // Već obrađeno (unique violation) — Creem ponavlja isporuku dok ne dobije
    // 200, pa retry ne smije drugi put produljiti pretplatu.
    return NextResponse.json({ primljeno: true });
  }

  const firma = await prisma.company.findUnique({ where: { id: companyId } });
  if (firma) {
    const planRaw = metadata.plan;
    const plan: Plan =
      planRaw === "STARTER" || planRaw === "PRO" || planRaw === "ENTERPRISE"
        ? planRaw
        : firma.plan;
    await prisma.company.update({
      where: { id: companyId },
      data: { plan, pretplataDo: noviIstek(firma.pretplataDo), naPocetnomProbnom: false },
    });
  }

  return NextResponse.json({ primljeno: true });
}
