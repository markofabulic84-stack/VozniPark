import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { obrisiDnevnuVoznju } from "@/app/actions/kilometraza";

export default async function KilometrazaPage() {
  const user = await getCurrentUser();

  const voznje = await prisma.dailyLog.findMany({
    where: { vehicle: { companyId: user.companyId } },
    include: { vehicle: true, user: true },
    orderBy: { datum: "desc" },
    take: 100,
  });

  const ukupnoKm = voznje.reduce((z, v) => z + (v.zavrsniKm - v.pocetniKm), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-2xl">Kilometraža</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Dnevna evidencija prijeđenih kilometara po vozilu.
          </p>
        </div>
        <Link href="/app/kilometraza/novo" className="btn btn-primary">
          Dodaj unos
        </Link>
      </div>

      <div className="card p-5 sm:w-fit">
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          Ukupno evidentirano (zadnjih {voznje.length} unosa)
        </div>
        <div className="display text-2xl mt-2 mono">
          {ukupnoKm.toLocaleString("hr-HR")} km
        </div>
      </div>

      {voznje.length === 0 ? (
        <div className="card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>
          Još nema unesenih dnevnih voznji.
        </div>
      ) : (
        <div className="card overflow-hidden">
          {voznje.map((v, i) => (
            <div
              key={v.id}
              className="flex items-center justify-between flex-wrap gap-2 p-4 text-sm"
              style={{
                borderBottom:
                  i < voznje.length - 1 ? "1px solid var(--border-soft)" : "none",
              }}
            >
              <div>
                <div className="font-medium">
                  {v.vehicle.naziv}{" "}
                  <span className="mono" style={{ color: "var(--muted)" }}>
                    {v.vehicle.registracija}
                  </span>
                </div>
                <div style={{ color: "var(--muted)" }}>
                  {v.datum.toLocaleDateString("hr-HR")} ·{" "}
                  {v.pocetniKm.toLocaleString("hr-HR")} →{" "}
                  {v.zavrsniKm.toLocaleString("hr-HR")} km
                  {v.user && ` · ${v.user.ime}`}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="mono">
                  {(v.zavrsniKm - v.pocetniKm).toLocaleString("hr-HR")} km
                </span>
                <form action={obrisiDnevnuVoznju}>
                  <input type="hidden" name="id" value={v.id} />
                  <button
                    type="submit"
                    className="btn btn-ghost text-xs"
                    style={{ padding: "6px 10px" }}
                  >
                    Ukloni
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
