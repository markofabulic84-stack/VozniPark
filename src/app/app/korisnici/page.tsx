import { zahtijevajAdmina } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { obrisiKorisnika } from "@/app/actions/korisnici";
import DodajKorisnikaForm from "./DodajKorisnikaForm";

export default async function KorisniciPage() {
  const admin = await zahtijevajAdmina();
  const korisnici = await prisma.user.findMany({
    where: { companyId: admin.companyId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="display text-2xl">Korisnici</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Upravljajte pristupom firme.
        </p>
      </div>

      <div className="card overflow-hidden">
        {korisnici.map((k, i) => (
          <div
            key={k.id}
            className="flex items-center justify-between p-4"
            style={{
              borderBottom:
                i < korisnici.length - 1
                  ? "1px solid var(--border-soft)"
                  : "none",
            }}
          >
            <div>
              <div className="text-sm font-medium">{k.ime}</div>
              <div className="text-xs mono mt-1" style={{ color: "var(--muted)" }}>
                {k.email}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge badge-muted">
                {k.role === "ADMIN" ? "administrator" : "vozač"}
              </span>
              {k.id !== admin.id && (
                <form action={obrisiKorisnika}>
                  <input type="hidden" name="id" value={k.id} />
                  <button type="submit" className="btn btn-ghost text-xs" style={{ padding: "6px 10px" }}>
                    Ukloni
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>

      <DodajKorisnikaForm />
    </div>
  );
}
