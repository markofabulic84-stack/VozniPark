import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type LimitRezultat =
  | { dopusteno: true }
  | { dopusteno: false; pokusajZaMin: number };

// Brojanje ide kroz bazu (ne memoriju) da limiter radi i kad aplikacija
// ima više instanci ili se procesi gase između zahtjeva (serverless).
export async function provjeriLimit(
  kljuc: string,
  maxPokusaja: number,
  prozorMs: number,
): Promise<LimitRezultat> {
  const sada = new Date();
  const noviReset = new Date(sada.getTime() + prozorMs);

  // Brojač se prvo atomarno poveća, pa se tek onda gleda rezultat. Kad bi se
  // prvo čitalo pa pisalo (kao prije), dvije istovremene prijave pročitale bi
  // isti count i obje ga povećale na istu vrijednost — napadač bi paralelnim
  // zahtjevima dobio više pokušaja nego što limit dopušta. `increment` se u
  // Postgresu izvodi pod row lockom, pa je serijalizacija zajamčena.
  const zapis = await prisma.rateLimit.upsert({
    where: { kljuc },
    create: { kljuc, count: 1, resetAt: noviReset },
    update: { count: { increment: 1 } },
  });

  // Prozor je istekao — brojanje kreće ispočetka.
  if (zapis.resetAt <= sada) {
    await prisma.rateLimit.update({
      where: { kljuc },
      data: { count: 1, resetAt: noviReset },
    });
    return { dopusteno: true };
  }

  // `count` je vrijednost NAKON povećanja, pa je prekoračenje strogo veće.
  if (zapis.count > maxPokusaja) {
    return {
      dopusteno: false,
      pokusajZaMin: Math.max(
        1,
        Math.ceil((zapis.resetAt.getTime() - sada.getTime()) / 60000),
      ),
    };
  }

  return { dopusteno: true };
}

// Zapisi limitera i iskorišteni/istekli tokeni inače ostaju u bazi zauvijek —
// svaka nova IP+email kombinacija i svaki zahtjev za resetom lozinke ostavi
// red koji se više nikad ne čita. Poziva se iz dnevnog crona.
export async function ocistiIsteklo(): Promise<{ limiti: number; tokeni: number }> {
  const sada = new Date();
  const [limiti, tokeni] = await Promise.all([
    prisma.rateLimit.deleteMany({ where: { resetAt: { lt: sada } } }),
    prisma.passwordResetToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: sada } }, { used: true }] },
    }),
  ]);
  return { limiti: limiti.count, tokeni: tokeni.count };
}

export async function klijentIp(): Promise<string> {
  const zaglavlja = await headers();
  const forwarded = zaglavlja.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "nepoznat";
}
