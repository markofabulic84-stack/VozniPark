import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { odjava } from "@/app/actions/auth";
import { pretplataAktivna, danaDoIsteka } from "@/lib/pretplata";
import {
  PLAN_NAZIVI,
  PLAN_LIMITI,
  PLAN_MAX_KORISNIKA,
  ZNACAJKA_NAZIVI,
  ZNACAJKE_PO_PLANU,
  type Znacajka,
} from "@/lib/planovi";
import type { Plan } from "@/generated/prisma/enums";
import PretplataForm from "./PretplataForm";

const PLANOVI: Plan[] = ["STARTER", "PRO", "ENTERPRISE"];

const ZNACAJKE_ZA_PRIKAZ: Znacajka[] = [
  "upozorenja_potrosnje",
  "rokovi_dokumenti",
  "gume",
  "ocr_racuna",
  "csv_izvoz",
  "csv_uvoz",
];

export default async function PretplataPage({
  searchParams,
}: {
  searchParams: Promise<{ nakon_placanja?: string }>;
}) {
  const { nakon_placanja } = await searchParams;
  const user = await getCurrentUser();
  const aktivna = pretplataAktivna(user.company.pretplataDo);
  const dana = danaDoIsteka(user.company.pretplataDo);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="text-center">
          <Link href="/" className="mono text-sm" style={{ color: "var(--blue)" }}>
            &lt;/&gt; VozniPark
          </Link>
          <h1 className="display text-2xl mt-4">Pretplata</h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
            {user.company.naziv} · plan {PLAN_NAZIVI[user.company.plan]}
          </p>
        </div>

        {nakon_placanja && (
          <div className="card p-4 text-sm text-center" style={{ borderColor: "var(--blue)" }}>
            Plaćanje zaprimljeno — pretplata se aktivira za par trenutaka.
            Ako se stanje ispod ne promijeni odmah, osvježite stranicu.
          </div>
        )}

        <div className="card p-5 text-center">
          {aktivna ? (
            <>
              <span className="badge badge-ok">aktivna</span>
              <p className="text-sm mt-3">
                Pretplata vrijedi do{" "}
                <strong>
                  {user.company.pretplataDo!.toLocaleDateString("hr-HR")}
                </strong>{" "}
                (još {dana} {dana === 1 ? "dan" : "dana"}).
              </p>
            </>
          ) : (
            <>
              <span className="badge badge-crit">istekla</span>
              <p className="text-sm mt-3">
                Pretplata je istekla — pristup aplikaciji je onemogućen dok se
                ne produži. Podaci firme ostaju sačuvani.
              </p>
            </>
          )}
        </div>

        <div className="card p-4 overflow-x-auto">
          <table className="text-xs w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="text-left p-2" style={{ color: "var(--muted)" }} />
                {PLANOVI.map((p) => (
                  <th key={p} className="text-center p-2" style={{ color: "var(--text)" }}>
                    {PLAN_NAZIVI[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: "1px solid var(--border-soft)" }}>
                <td className="p-2" style={{ color: "var(--muted)" }}>
                  Vozila
                </td>
                {PLANOVI.map((p) => (
                  <td key={p} className="text-center p-2 mono">
                    {PLAN_LIMITI[p] ?? "∞"}
                  </td>
                ))}
              </tr>
              <tr style={{ borderTop: "1px solid var(--border-soft)" }}>
                <td className="p-2" style={{ color: "var(--muted)" }}>
                  Korisnici
                </td>
                {PLANOVI.map((p) => (
                  <td key={p} className="text-center p-2 mono">
                    {PLAN_MAX_KORISNIKA[p] ?? "∞"}
                  </td>
                ))}
              </tr>
              {ZNACAJKE_ZA_PRIKAZ.map((z) => (
                <tr key={z} style={{ borderTop: "1px solid var(--border-soft)" }}>
                  <td className="p-2" style={{ color: "var(--muted)" }}>
                    {ZNACAJKA_NAZIVI[z]}
                  </td>
                  {PLANOVI.map((p) => (
                    <td key={p} className="text-center p-2">
                      {ZNACAJKE_PO_PLANU[p].has(z) ? "✓" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {user.role === "ADMIN" ? (
          <PretplataForm trenutniPlan={user.company.plan} />
        ) : (
          <div className="card p-5 text-sm text-center" style={{ color: "var(--muted)" }}>
            Produljenje pretplate može napraviti samo administrator vaše firme.
          </div>
        )}

        <div className="flex justify-center gap-4">
          {aktivna && (
            <Link href="/app" className="btn btn-ghost">
              ← Natrag u aplikaciju
            </Link>
          )}
          <form action={odjava}>
            <button type="submit" className="btn btn-ghost">
              Odjava
            </button>
          </form>
        </div>

        <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
          Pitanja o pretplati?{" "}
          <a href="mailto:podrska.voznipark@gmail.com" className="mono" style={{ color: "var(--blue)" }}>
            podrska.voznipark@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}
