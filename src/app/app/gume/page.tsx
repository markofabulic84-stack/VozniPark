import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { statusGuma } from "@/lib/gume";
import { imaZnacajku } from "@/lib/planovi";
import { obrisiZamjenuGuma } from "@/app/actions/gume";

const NAZIV_VRSTE: Record<string, string> = {
  LJETNE: "ljetne",
  ZIMSKE: "zimske",
};

export default async function GumePage() {
  const user = await getCurrentUser();

  if (!imaZnacajku(user.company, "gume")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="display text-2xl">Gume</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Evidencija zamjene ljetnih/zimskih guma po vozilu.
          </p>
        </div>
        <div className="card p-6 text-sm" style={{ color: "var(--muted)" }}>
          Ova značajka dostupna je na Pro i višim planovima.{" "}
          <Link href="/pretplata" className="mono" style={{ color: "var(--blue)" }}>
            Nadogradi plan →
          </Link>
        </div>
      </div>
    );
  }

  const vozila = await prisma.vehicle.findMany({
    where: { companyId: user.companyId, aktivno: true },
    orderBy: { naziv: "asc" },
    include: {
      zamjeneGuma: { orderBy: { datum: "desc" }, take: 1 },
    },
  });

  const zamjene = await prisma.tireChange.findMany({
    where: { vehicle: { companyId: user.companyId } },
    include: { vehicle: true, user: true },
    orderBy: { datum: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-2xl">Gume</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Evidencija zamjene ljetnih/zimskih guma po vozilu.
          </p>
        </div>
        <Link href="/app/gume/novo" className="btn btn-primary">
          Zabilježi zamjenu
        </Link>
      </div>

      <div className="card overflow-hidden">
        {vozila.map((vozilo, i) => {
          const zadnja = vozilo.zamjeneGuma[0] ?? null;
          const status = statusGuma(zadnja);
          return (
            <div
              key={vozilo.id}
              className="flex items-center justify-between flex-wrap gap-2 p-4 text-sm"
              style={{
                borderBottom:
                  i < vozila.length - 1 ? "1px solid var(--border-soft)" : "none",
              }}
            >
              <div>
                <Link href={`/app/vozila/${vozilo.id}`} className="font-medium">
                  {vozilo.naziv}{" "}
                  <span className="mono" style={{ color: "var(--muted)" }}>
                    {vozilo.registracija}
                  </span>
                </Link>
                <div style={{ color: "var(--muted)" }}>
                  {zadnja
                    ? `trenutno: ${NAZIV_VRSTE[zadnja.vrsta]} (od ${zadnja.datum.toLocaleDateString("hr-HR")})`
                    : "nema evidencije o gumama"}
                </div>
              </div>
              {status.status !== "ok" && (
                <span
                  className={`badge ${status.status === "kritično" ? "badge-crit" : "badge-warn"}`}
                >
                  {status.status}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="display text-lg mb-4">Povijest zamjena</h2>
        {zamjene.length === 0 ? (
          <div className="card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            Još nema zabilježenih zamjena guma.
          </div>
        ) : (
          <div className="card overflow-hidden">
            {zamjene.map((z, i) => (
              <div
                key={z.id}
                className="flex items-center justify-between flex-wrap gap-2 p-4 text-sm"
                style={{
                  borderBottom:
                    i < zamjene.length - 1 ? "1px solid var(--border-soft)" : "none",
                }}
              >
                <div>
                  <div className="font-medium">
                    {z.vehicle.naziv}{" "}
                    <span className="mono" style={{ color: "var(--muted)" }}>
                      {z.vehicle.registracija}
                    </span>
                  </div>
                  <div style={{ color: "var(--muted)" }}>
                    {z.datum.toLocaleDateString("hr-HR")} · postavljene{" "}
                    {NAZIV_VRSTE[z.vrsta]} gume
                    {z.kmStanje != null &&
                      ` · ${z.kmStanje.toLocaleString("hr-HR")} km`}
                    {z.user && ` · ${z.user.ime}`}
                  </div>
                </div>
                <form action={obrisiZamjenuGuma}>
                  <input type="hidden" name="id" value={z.id} />
                  <button
                    type="submit"
                    className="btn btn-ghost text-xs"
                    style={{ padding: "6px 10px" }}
                  >
                    Ukloni
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
