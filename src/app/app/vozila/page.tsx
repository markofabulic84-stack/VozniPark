import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { upozorenjaZaVozilo, filtrirajPoPlanu } from "@/lib/upozorenja";
import { maxVozila } from "@/lib/planovi";

export default async function VozilaPage() {
  const user = await getCurrentUser();
  const vozila = await prisma.vehicle.findMany({
    where: { companyId: user.companyId, aktivno: true },
    include: {
      // Vidi napomenu u src/app/app/page.tsx — dohvaća se samo ono što
      // izračun potrošnje stvarno koristi.
      fuelEntries: {
        select: { kmStanje: true, litre: true, punSpremnik: true, datum: true },
      },
      zamjeneGuma: { orderBy: { datum: "desc" }, take: 1 },
    },
    orderBy: { naziv: "asc" },
  });
  const limit = maxVozila(user.company);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-2xl">Vozila</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {vozila.length}
            {limit != null ? ` / ${limit} vozila` : " vozila"}
          </p>
        </div>
        {user.role === "ADMIN" && (
          <Link href="/app/vozila/novo" className="btn btn-primary">
            Dodaj vozilo
          </Link>
        )}
      </div>

      {vozila.length === 0 ? (
        <div className="card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>
          Još nemate dodanih vozila.
        </div>
      ) : (
        <div className="card overflow-hidden">
          {vozila.map((vozilo, i) => {
            const upozorenja = filtrirajPoPlanu(
              upozorenjaZaVozilo({
                ...vozilo,
                zadnjaZamjenaGuma: vozilo.zamjeneGuma[0] ?? null,
              }),
              user.company,
            );
            const najgore = upozorenja.some((u) => u.status === "kritično")
              ? "kritično"
              : upozorenja.length > 0
                ? "upozorenje"
                : "ok";
            return (
              <Link
                key={vozilo.id}
                href={`/app/vozila/${vozilo.id}`}
                className="flex items-center justify-between gap-4 p-4"
                style={{
                  borderBottom:
                    i < vozila.length - 1
                      ? "1px solid var(--border-soft)"
                      : "none",
                }}
              >
                <div>
                  <div className="text-sm font-medium">{vozilo.naziv}</div>
                  <div
                    className="text-xs mono mt-1"
                    style={{ color: "var(--muted)" }}
                  >
                    {vozilo.registracija} · {vozilo.trenutniKm.toLocaleString("hr-HR")} km
                  </div>
                </div>
                <span
                  className={`badge ${
                    najgore === "kritično"
                      ? "badge-crit"
                      : najgore === "upozorenje"
                        ? "badge-warn"
                        : "badge-ok"
                  }`}
                >
                  {najgore === "ok" ? "u redu" : `${upozorenja.length} upozorenje`}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
