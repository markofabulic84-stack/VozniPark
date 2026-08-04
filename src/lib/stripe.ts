import "server-only";
import Stripe from "stripe";
import type { Plan } from "@/generated/prisma/enums";

// Cijene u centima (EUR) za 30 dana pretplate. ENTERPRISE se ne naplaćuje
// karticom nego dogovorom, pa ga nema u ovoj mapi.
export const CIJENE_CENTI: Partial<Record<Plan, number>> = {
  STARTER: 1200,
  PRO: 2700,
};

// Bez STRIPE_SECRET_KEY (lokalni razvoj) vraća null i naplata ostaje
// simulirana; s ključem se koristi pravi Stripe Checkout.
export function getStripe(): Stripe | null {
  const kljuc = process.env.STRIPE_SECRET_KEY;
  if (!kljuc) return null;
  return new Stripe(kljuc);
}
