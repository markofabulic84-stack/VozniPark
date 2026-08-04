import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { statusDatuma, statusServisa } from "@/lib/rokovi";

function Redak({
  naziv,
  vrijednost,
  status,
}: {
  naziv: string;
  vrijednost: string;
  status: "ok" | "upozorenje" | "kritično" | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "var(--muted)" }} className="text-xs">
        {naziv}:
      </span>
      <span className="text-sm">{vrijednost}</span>
      {status && status !== "ok" && (
        <span
          className={`badge ${status === "kritično" ? "badge-crit" : "badge-warn"}`}
        >
          {status}
        </span>
      )}
    </div>
  );
}

export default async function RokoviPage() {
  const user = await getCurrentUser();
  const vozila = await prisma.vehicle.findMany({
    where: { companyId: user.companyId, aktivno: true },
    orderBy: { naziv: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display text-2xl">Rokovi</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Servis, registracija i osiguranje za sva vozila.
        </p>
      </div>

      {vozila.length === 0 ? (
        <div className="card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>
          Nema vozila.
        </div>
      ) : (
        <div className="card overflow-hidden">
          {vozila.map((vozilo, i) => {
            const servis = statusServisa(vozilo.sljedeciServisKm, vozilo.trenutniKm);
            const registracija = statusDatuma(vozilo.registracijaDo);
            const osiguranje = statusDatuma(vozilo.osiguranjeDo);

            return (
              <div
                key={vozilo.id}
                className="p-4 flex flex-col gap-2"
                style={{
                  borderBottom:
                    i < vozila.length - 1
                      ? "1px solid var(--border-soft)"
                      : "none",
                }}
              >
                <Link
                  href={`/app/vozila/${vozilo.id}`}
                  className="text-sm font-medium"
                >
                  {vozilo.naziv}{" "}
                  <span className="mono" style={{ color: "var(--muted)" }}>
                    {vozilo.registracija}
                  </span>
                </Link>
                <div className="flex flex-wrap gap-5">
                  <Redak
                    naziv="Servis"
                    vrijednost={
                      servis
                        ? servis.kmDo < 0
                          ? `kasni ${Math.abs(servis.kmDo)} km`
                          : `za ${servis.kmDo} km`
                        : "nije postavljeno"
                    }
                    status={servis?.status ?? null}
                  />
                  <Redak
                    naziv="Registracija"
                    vrijednost={
                      registracija
                        ? vozilo.registracijaDo!.toLocaleDateString("hr-HR")
                        : "nije postavljeno"
                    }
                    status={registracija?.status ?? null}
                  />
                  <Redak
                    naziv="Osiguranje"
                    vrijednost={
                      osiguranje
                        ? vozilo.osiguranjeDo!.toLocaleDateString("hr-HR")
                        : "nije postavljeno"
                    }
                    status={osiguranje?.status ?? null}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
