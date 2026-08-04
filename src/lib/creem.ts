import "server-only";
import type { Plan } from "@/generated/prisma/enums";

// Product ID po planu, iz Creem dashboarda (Products → proizvod → ID u
// formatu prod_xxx). ENTERPRISE nema proizvod — ugovara se izravno.
const CREEM_PROIZVODI: Partial<Record<Plan, string>> = {};
if (process.env.CREEM_PRODUCT_STARTER) {
  CREEM_PROIZVODI.STARTER = process.env.CREEM_PRODUCT_STARTER;
}
if (process.env.CREEM_PRODUCT_PRO) {
  CREEM_PROIZVODI.PRO = process.env.CREEM_PRODUCT_PRO;
}
export { CREEM_PROIZVODI };

export type CreemConfig = { apiKey: string; baseUrl: string };

// Test i live koriste različite host-ove, a razlikuju se po prefiksu ključa
// (creem_test_...) — pa nema zasebne env varijable koja bi se mogla
// razići s ključem i tiho slati testne uplate na produkciju.
export function getCreemConfig(): CreemConfig | null {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) return null;
  const baseUrl = apiKey.startsWith("creem_test_")
    ? "https://test-api.creem.io"
    : "https://api.creem.io";
  return { apiKey, baseUrl };
}

export async function kreirajCreemCheckout(opts: {
  config: CreemConfig;
  productId: string;
  email: string;
  metadata: Record<string, string>;
  successUrl: string;
}): Promise<string> {
  const odgovor = await fetch(`${opts.config.baseUrl}/v1/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.config.apiKey,
    },
    body: JSON.stringify({
      product_id: opts.productId,
      success_url: opts.successUrl,
      customer: { email: opts.email },
      metadata: opts.metadata,
    }),
  });

  if (!odgovor.ok) {
    throw new Error(
      `Creem checkout greška: ${odgovor.status} ${await odgovor.text()}`,
    );
  }

  const podaci = await odgovor.json();
  return podaci.checkout_url as string;
}
