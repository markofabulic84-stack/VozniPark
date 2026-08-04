import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { imaZnacajku } from "@/lib/planovi";

export default async function IzvjestajiPage() {
  const user = await getCurrentUser();
  const brojTocenja = await prisma.fuelEntry.count({
    where: { vehicle: { companyId: user.companyId } },
  });
  const izvozDostupan = imaZnacajku(user.company, "csv_izvoz");

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="display text-2xl">Izvještaji</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Izvoz podataka za knjigovodstvo.
        </p>
      </div>

      <div className="card p-6 flex flex-col gap-4">
        <div>
          <div className="text-sm font-medium">Sva točenja goriva (CSV)</div>
          <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {brojTocenja} zapisa za sva vozila firme.
          </div>
        </div>
        {izvozDostupan ? (
          <a href="/api/izvoz" className="btn btn-primary w-fit">
            Preuzmi CSV
          </a>
        ) : (
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            Izvoz podataka (CSV) dostupan je na Pro i višim planovima.{" "}
            <Link href="/pretplata" className="mono" style={{ color: "var(--blue)" }}>
              Nadogradi plan →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
