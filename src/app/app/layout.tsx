import Link from "next/link";
import { zahtijevajAktivnuPretplatu } from "@/lib/dal";
import { odjava } from "@/app/actions/auth";
import { PLAN_NAZIVI, imaZnacajku, jeUNeogranicenomProbnom } from "@/lib/planovi";
import { danaDoIsteka, UPOZORENJE_ISTEK_DANA } from "@/lib/pretplata";
import NavLink from "./NavLink";
import MobileNav from "./MobileNav";
import VerifikacijaBanner from "./VerifikacijaBanner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await zahtijevajAktivnuPretplatu();
  const danaPretplate = danaDoIsteka(user.company.pretplataDo);
  const uProbnom = jeUNeogranicenomProbnom(user.company);

  const navContent = (
    <>
      <div>
        <Link
          href="/"
          className="mono text-sm hidden md:block mb-8"
          style={{ color: "var(--blue)" }}
        >
          &lt;/&gt; VozniPark
        </Link>
        <nav className="flex flex-col gap-1">
          <NavLink href="/app">Pregled</NavLink>
          <NavLink href="/app/vozila">Vozila</NavLink>
          <NavLink href="/app/kilometraza">Kilometraža</NavLink>
          {imaZnacajku(user.company, "gume") && (
            <NavLink href="/app/gume">Gume</NavLink>
          )}
          <NavLink href="/app/rokovi">Rokovi</NavLink>
          <NavLink href="/app/izvjestaji">Izvještaji</NavLink>
          <NavLink href="/app/postavke">Postavke</NavLink>
          {user.role === "ADMIN" && (
            <>
              {imaZnacajku(user.company, "csv_uvoz") && (
                <NavLink href="/app/uvoz">Uvoz podataka</NavLink>
              )}
              <NavLink href="/app/korisnici">Korisnici</NavLink>
            </>
          )}
        </nav>
      </div>

      <div className="flex flex-col gap-3 mt-8 md:mt-0">
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          <div style={{ color: "var(--text)" }}>{user.company.naziv}</div>
          <div className="mono mt-1">
            {uProbnom ? "probni period" : `plan ${PLAN_NAZIVI[user.company.plan]}`}
          </div>
          <Link
            href="/pretplata"
            className="mono block mt-1"
            style={{ color: "var(--blue)" }}
          >
            {uProbnom ? "probni period do" : "pretplata do"}{" "}
            {user.company.pretplataDo!.toLocaleDateString("hr-HR")}
          </Link>
        </div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {user.ime} · {user.role === "ADMIN" ? "administrator" : "vozač"}
        </div>
        <form action={odjava}>
          <button type="submit" className="btn btn-ghost w-full text-sm">
            Odjava
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-screen">
      <MobileNav>{navContent}</MobileNav>

      <aside
        className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:justify-between p-4"
        style={{ borderRight: "1px solid var(--border-soft)" }}
      >
        {navContent}
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-8 relative">
        {!user.emailVerificiranAt && <VerifikacijaBanner />}
        {danaPretplate != null && danaPretplate <= UPOZORENJE_ISTEK_DANA && (
          <div
            className="card p-3 mb-6 flex items-center justify-between flex-wrap gap-2 text-sm"
            style={{ borderColor: "var(--amber)" }}
          >
            <span>
              {uProbnom
                ? `⏳ Probni period ističe za ${danaPretplate} ${danaPretplate === 1 ? "dan" : "dana"} — sve značajke su trenutno otključane.`
                : `⚠ Pretplata ističe za ${danaPretplate} ${danaPretplate === 1 ? "dan" : "dana"}.`}
            </span>
            <Link href="/pretplata" className="btn btn-primary text-xs" style={{ padding: "6px 12px" }}>
              {uProbnom ? "Odaberi plan" : "Produži pretplatu"}
            </Link>
          </div>
        )}
        {children}
        <Link
          href="/app/tocenja/novo"
          aria-label="Unesi točenje"
          className="md:hidden btn btn-primary"
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            fontSize: 24,
            padding: 0,
            boxShadow: "0 10px 30px -8px rgba(76,141,255,0.6)",
            zIndex: 30,
          }}
        >
          ⛽
        </Link>
      </main>
    </div>
  );
}
