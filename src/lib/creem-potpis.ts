// Odvojeno od creem.ts (koji ima "server-only" oznaku) da ova čista kripto
// funkcija bude testabilna izravno, bez server-only greške u vitestu.
import { createHmac, timingSafeEqual } from "crypto";

// Creem potpisuje webhook tijelo HMAC-SHA256 (hex) tajnim ključem iz
// dashboarda (Developers → Webhook) i šalje ga u "creem-signature" headeru.
// timingSafeEqual da usporedba ne otkriva točan potpis kroz razliku u
// trajanju usporedbe.
export function provjeriCreemPotpis(
  sirovoTijelo: string,
  potpis: string | null,
  tajna: string,
): boolean {
  if (!potpis) return false;
  const ocekivano = createHmac("sha256", tajna).update(sirovoTijelo).digest("hex");
  const a = Buffer.from(ocekivano, "utf8");
  const b = Buffer.from(potpis, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
