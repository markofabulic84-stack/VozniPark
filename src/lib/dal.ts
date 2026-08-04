import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pretplataAktivna } from "@/lib/pretplata";

export const verifySession = cache(async () => {
  const session = await getSessionPayload();
  if (!session?.userId) {
    redirect("/prijava");
  }
  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { company: true },
  });
  if (!user) {
    // Cookie i dalje kriptografski valjan, ali korisnik/firma su uklonjeni
    // iz baze. Cookiji se smiju brisati samo u Server Actionu/Route Handleru,
    // pa preusmjeravamo na rutu koja briše kolačić i tek onda šalje na /prijava
    // (inače proxy.ts vidi "valjanu" sesiju i vrati na /app -> beskonačna petlja).
    redirect("/api/odjava");
  }
  if ((session.sv ?? -1) !== user.sessionVersion) {
    // Lozinka je promijenjena nakon izdavanja ovog tokena — sesija se
    // poništava iako JWT još kriptografski vrijedi.
    redirect("/api/odjava");
  }
  return user;
});

export async function zahtijevajAdmina() {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") {
    redirect("/app");
  }
  return user;
}

// Guard za sve stranice i akcije koje mijenjaju podatke: istekla pretplata
// znači preusmjeravanje na /pretplata dok je administrator ne produži.
export async function zahtijevajAktivnuPretplatu() {
  const user = await getCurrentUser();
  if (!pretplataAktivna(user.company.pretplataDo)) {
    redirect("/pretplata");
  }
  return user;
}
