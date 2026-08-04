import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { izracunajIntervale, referentnaPotrosnja } from "@/lib/potrosnja";
import { upozorenjaZaVozilo, filtrirajPoPlanu } from "@/lib/upozorenja";
import { statusGuma } from "@/lib/gume";
import { imaZnacajku } from "@/lib/planovi";
import { deaktivirajVozilo } from "@/app/actions/vozila";
import EditVoziloForm from "./EditVoziloForm";
import PotrosnjaChart from "./PotrosnjaChart";

const VRSTE_GORIVA_NAZIVI: Record<string, string> = {
  DIZEL: "dizel",
  BENZIN: "benzin",
  LPG: "LPG",
  ELEKTRICNO: "električno",
};

const NAZIV_VRSTE_GUME: Record<string, string> = {
  LJETNE: "ljetne",
  ZIMSKE: "zimske",
};

export default async function VoziloDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const vozilo = await prisma.vehicle.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      fuelEntries: { orderBy: { kmStanje: "desc" } },
      zamjeneGuma: { orderBy: { datum: "desc" }, take: 1 },
    },
  });

  if (!vozilo) notFound();

  const intervali = izracunajIntervale(vozilo.fuelEntries);
  const referentna = referentnaPotrosnja(vozilo.referentnaPotrosnja, intervali);
  const zadnjaZamjenaGuma = vozilo.zamjeneGuma[0] ?? null;
  const upozorenja = filtrirajPoPlanu(
    upozorenjaZaVozilo({ ...vozilo, zadnjaZamjenaGuma }),
    user.company,
  );
  const gume = statusGuma(zadnjaZamjenaGuma);
  const imaGume = imaZnacajku(user.company, "gume");

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-2xl">{vozilo.naziv}</h1>
          <p className="text-sm mono mt-1" style={{ color: "var(--muted)" }}>
            {vozilo.registracija}
          </p>
        </div>
        <Link
          href={`/app/tocenja/novo?vozilo=${vozilo.id}`}
          className="btn btn-primary"
        >
          Unesi točenje
        </Link>
      </div>

      {upozorenja.length > 0 && (
        <div className="card p-4 flex flex-col gap-2">
          {upozorenja.map((u, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span
                className={`badge ${u.status === "kritično" ? "badge-crit" : "badge-warn"}`}
              >
                {u.status}
              </span>
              {u.poruka}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Stanje
          </div>
          <div className="display text-2xl mt-2 mono">
            {vozilo.trenutniKm.toLocaleString("hr-HR")} km
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Referentna potrošnja
          </div>
          <div className="display text-2xl mt-2 mono">
            {referentna ? `${referentna.toFixed(1)} L/100km` : "—"}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Zadnja potrošnja
          </div>
          <div className="display text-2xl mt-2 mono">
            {intervali.length
              ? `${intervali[intervali.length - 1].potrosnja.toFixed(1)} L/100km`
              : "—"}
          </div>
        </div>
      </div>

      <div>
        <h2 className="display text-lg mb-4">Podaci o vozilu</h2>
        {user.role === "ADMIN" ? (
          <EditVoziloForm vozilo={vozilo} />
        ) : (
          <div className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Sljedeći servis na
              </div>
              <div className="mt-1">
                {vozilo.sljedeciServisKm != null
                  ? `${vozilo.sljedeciServisKm.toLocaleString("hr-HR")} km`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Registracija vrijedi do
              </div>
              <div className="mt-1">
                {vozilo.registracijaDo
                  ? vozilo.registracijaDo.toLocaleDateString("hr-HR")
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Osiguranje vrijedi do
              </div>
              <div className="mt-1">
                {vozilo.osiguranjeDo
                  ? vozilo.osiguranjeDo.toLocaleDateString("hr-HR")
                  : "—"}
              </div>
            </div>
            <div className="sm:col-span-2 text-xs" style={{ color: "var(--muted)" }}>
              Uređivanje podataka vozila dostupno je samo administratoru.
            </div>
          </div>
        )}
      </div>

      {imaGume ? (
        <div>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="display text-lg">Gume</h2>
            <Link
              href={`/app/gume/novo?vozilo=${vozilo.id}`}
              className="btn btn-ghost text-sm"
            >
              Zabilježi zamjenu
            </Link>
          </div>
          <div className="card p-5 flex items-center justify-between flex-wrap gap-3 text-sm">
            <span>
              {zadnjaZamjenaGuma
                ? `Trenutno: ${NAZIV_VRSTE_GUME[zadnjaZamjenaGuma.vrsta]} gume (od ${zadnjaZamjenaGuma.datum.toLocaleDateString("hr-HR")})`
                : "Nema evidencije o gumama."}
            </span>
            {gume.status !== "ok" && (
              <span
                className={`badge ${gume.status === "kritično" ? "badge-crit" : "badge-warn"}`}
              >
                {gume.status}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="display text-lg mb-4">Gume</h2>
          <div className="card p-5 text-sm" style={{ color: "var(--muted)" }}>
            Evidencija zamjene guma dostupna je na Pro i višim planovima.{" "}
            <Link href="/pretplata" className="mono" style={{ color: "var(--blue)" }}>
              Nadogradi plan →
            </Link>
          </div>
        </div>
      )}

      <div>
        <h2 className="display text-lg mb-4">
          Potrošnja (puno-u-puno intervali)
        </h2>
        {intervali.length >= 2 && (
          <div className="mb-4">
            <PotrosnjaChart intervali={intervali} referentna={referentna} />
          </div>
        )}
        {intervali.length === 0 ? (
          <div className="card p-6 text-sm" style={{ color: "var(--muted)" }}>
            Potreban je bar dvoje punih točenja spremnika za izračun.
          </div>
        ) : (
          <div className="card overflow-hidden">
            {[...intervali].reverse().map((interval, i) => (
              <div
                key={i}
                className="flex items-center justify-between flex-wrap gap-1 p-4 text-sm"
                style={{
                  borderBottom:
                    i < intervali.length - 1
                      ? "1px solid var(--border-soft)"
                      : "none",
                }}
              >
                <span style={{ color: "var(--muted)" }}>
                  {interval.datum.toLocaleDateString("hr-HR")} ·{" "}
                  {interval.odKm.toLocaleString("hr-HR")} →{" "}
                  {interval.doKm.toLocaleString("hr-HR")} km
                </span>
                <span className="mono">
                  {interval.potrosnja.toFixed(1)} L/100km
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="display text-lg mb-4">Točenja goriva</h2>
        {vozilo.fuelEntries.length === 0 ? (
          <div className="card p-6 text-sm" style={{ color: "var(--muted)" }}>
            Još nema unesenih točenja.
          </div>
        ) : (
          <div className="card overflow-hidden">
            {vozilo.fuelEntries.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center justify-between flex-wrap gap-1 p-4 text-sm"
                style={{
                  borderBottom:
                    i < vozilo.fuelEntries.length - 1
                      ? "1px solid var(--border-soft)"
                      : "none",
                }}
              >
                <span style={{ color: "var(--muted)" }}>
                  {t.datum.toLocaleDateString("hr-HR")} ·{" "}
                  {t.kmStanje.toLocaleString("hr-HR")} km
                  {t.vrstaGoriva && ` · ${VRSTE_GORIVA_NAZIVI[t.vrstaGoriva] ?? t.vrstaGoriva}`}
                </span>
                <span className="mono flex items-center gap-2">
                  {t.litre.toFixed(1)} L · {t.ukupnaCijena.toFixed(2)} €
                  {!t.punSpremnik && (
                    <span style={{ color: "var(--muted)" }}> · djelomično</span>
                  )}
                  {t.racunSlika && (
                    <a
                      href={t.racunSlika}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--blue)" }}
                    >
                      račun
                    </a>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {user.role === "ADMIN" && (
        <form action={deaktivirajVozilo}>
          <input type="hidden" name="id" value={vozilo.id} />
          <button type="submit" className="btn btn-danger">
            Deaktiviraj vozilo
          </button>
        </form>
      )}
    </div>
  );
}
