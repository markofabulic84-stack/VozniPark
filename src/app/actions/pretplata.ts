"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { zahtijevajAdmina } from "@/lib/dal";
import { noviIstek } from "@/lib/pretplata";
import { maxVozilaZaPlan, PLAN_NAZIVI } from "@/lib/planovi";
import { getStripe, CIJENE_CENTI } from "@/lib/stripe";
import { getCreemConfig, kreirajCreemCheckout, CREEM_PROIZVODI } from "@/lib/creem";
import type { Plan } from "@/generated/prisma/enums";

export type PretplataState = { message?: string; uspjeh?: boolean } | undefined;

export async function produziPretplatu(
  _state: PretplataState,
  formData: FormData,
): Promise<PretplataState> {
  // Namjerno bez provjere aktivne pretplate — istekli admin mora moći platiti.
  const admin = await zahtijevajAdmina();

  const planRaw = String(formData.get("plan") ?? "");
  const plan: Plan =
    planRaw === "STARTER" || planRaw === "PRO" || planRaw === "ENTERPRISE"
      ? planRaw
      : admin.company.plan;

  const limit = maxVozilaZaPlan(plan);
  if (limit != null) {
    const brojVozila = await prisma.vehicle.count({
      where: { companyId: admin.companyId, aktivno: true },
    });
    if (brojVozila > limit) {
      return {
        message: `Plan ${PLAN_NAZIVI[plan]} dopušta ${limit} vozila, a imate ih ${brojVozila}. Deaktivirajte višak vozila ili odaberite veći plan.`,
      };
    }
  }

  const baza = process.env.APP_URL ?? "http://localhost:3000";

  // Creem ima prioritet — Merchant of Record, radi bez registrirane firme
  // (vidi README). Stripe ostaje za kasnije, kad postoji pravni subjekt.
  const creem = getCreemConfig();
  if (creem) {
    const productId = CREEM_PROIZVODI[plan];
    if (!productId) {
      return {
        message:
          "Plan Veći vozni park ugovara se izravno — javite nam se za ponudu.",
      };
    }

    // Samo poziv prema Creemu ide u try — redirect() se u Next.js-u
    // implementira bacanjem iznimke, pa bi ga catch progutao i korisnik bi
    // ostao na stranici bez ikakve poruke.
    let url: string;
    try {
      url = await kreirajCreemCheckout({
        config: creem,
        productId,
        email: admin.email,
        metadata: { companyId: admin.companyId, plan },
        successUrl: `${baza}/pretplata?nakon_placanja=1`,
      });
    } catch (greska) {
      console.error("Creem checkout nije uspio:", greska);
      return {
        message:
          "Naplata trenutno nije dostupna. Pokušajte ponovno za koju minutu ili nam se javite na podrska.voznipark@gmail.com.",
      };
    }

    // Pretplata se produljuje u /api/webhook/creem, kad Creem potvrdi
    // plaćanje — ne ovdje na redirectu.
    redirect(url);
  }

  const stripe = getStripe();

  if (stripe) {
    const cijena = CIJENE_CENTI[plan];
    if (cijena == null) {
      return {
        message:
          "Plan Veći vozni park ugovara se izravno — javite nam se za ponudu.",
      };
    }

    const sesija = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `VozniPark ${PLAN_NAZIVI[plan]} — 30 dana`,
            },
            unit_amount: cijena,
          },
          quantity: 1,
        },
      ],
      metadata: { companyId: admin.companyId, plan },
      customer_email: admin.email,
      success_url: `${baza}/api/stripe-potvrda?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baza}/pretplata`,
    });

    // Pretplata se produljuje tek u /api/stripe-potvrda, NAKON što Stripe
    // potvrdi da je sesija stvarno plaćena.
    redirect(sesija.url!);
  }

  // Fallback bez naplatnog posrednika (ni Creem ni Stripe): simulirana
  // naplata za lokalni razvoj.
  const istek = noviIstek(admin.company.pretplataDo);
  await prisma.company.update({
    where: { id: admin.companyId },
    data: { plan, pretplataDo: istek, naPocetnomProbnom: false },
  });

  revalidatePath("/pretplata");
  revalidatePath("/app");
  return {
    uspjeh: true,
    message: `Pretplata (${PLAN_NAZIVI[plan]}) vrijedi do ${istek.toLocaleDateString("hr-HR")}. [simulirana naplata — naplatni posrednik nije konfiguriran]`,
  };
}
