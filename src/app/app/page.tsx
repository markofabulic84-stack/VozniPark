import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { svaUpozorenja, filtrirajPoPlanu } from "@/lib/upozorenja";
import { maxVozila } from "@/lib/planovi";

export default async function PregledPage() {
  const user = await getCurrentUser();

  const vozila = await prisma.vehicle.findMany({
    where: { companyId: user.companyId, aktivno: true },
    include: {
      // Samo polja koja traži izračun potrošnje — bez ovoga se za svako
      // točenje povlače i URL slike računa i napomena, na svakom prikazu
      // pregleda.
      fuelEntries: {
        select: { kmStanje: true, litre: true, punSpremnik: true, datum: true },
      },
      zamjeneGuma: { orderBy: { datum: "desc" }, take: 1 },
    },
    orderBy: { naziv: "asc" },
  });

  const upozorenja = filtrirajPoPlanu(
    svaUpozorenja(
      vozila.map((v) => ({ ...v, zadnjaZamjenaGuma: v.zamjeneGuma[0] ?? null })),
    ),
    user.company,
  );
  const limit = maxVozila(user.company);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="display text-2xl">Pregled</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Dobar dan, {user.ime}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Vozila
          </div>
          <div className="display text-3xl mt-2">
            {vozila.length}
            {limit != null && (
              <span
                className="text-sm mono"
                style={{ color: "var(--muted)" }}
              >
                {" "}
                / {limit}
              </span>
            )}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Aktivna upozorenja
          </div>
          <div
            className="display text-3xl mt-2"
            style={{
              color: upozorenja.length ? "var(--amber)" : "var(--text)",
            }}
          >
            {upozorenja.length}
          </div>
        </div>
        <div className="card p-5 flex flex-col gap-2 justify-center">
          <Link href="/app/tocenja/novo" className="btn btn-primary text-sm">
            Unesi točenje
          </Link>
          {user.role === "ADMIN" && (
            <Link href="/app/vozila/novo" className="btn btn-ghost text-sm">
              Dodaj vozilo
            </Link>
          )}
        </div>
      </div>

      <div>
        <h2 className="display text-lg mb-4">Upozorenja</h2>
        {upozorenja.length === 0 ? (
          <div className="card p-6 text-sm" style={{ color: "var(--muted)" }}>
            Nema aktivnih upozorenja. Sve je u redu.
          </div>
        ) : (
          <div className="card divide-y" style={{ borderColor: "var(--border-soft)" }}>
            {upozorenja.map((u, i) => (
              <div
                key={i}
                className="flex items-center justify-between flex-wrap gap-3 p-4"
                style={{ borderBottom: i < upozorenja.length - 1 ? "1px solid var(--border-soft)" : "none" }}
              >
                <span className="text-sm">{u.poruka}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${u.status === "kritično" ? "badge-crit" : "badge-warn"}`}
                  >
                    {u.status}
                  </span>
                  <Link
                    href={`/app/vozila/${u.vehicleId}`}
                    className="text-sm mono"
                    style={{ color: "var(--blue)" }}
                  >
                    otvori →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
