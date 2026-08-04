import Link from "next/link";
import "./landing.css";
import TerminalDemo from "./TerminalDemo";
import FuelCalculator from "./FuelCalculator";
import { getSessionPayload } from "@/lib/session";

export default async function Home() {
  const session = await getSessionPayload();
  const primaryHref = session ? "/app" : "/registracija";
  const primaryLabel = session
    ? "Idi na nadzornu ploču →"
    : "Registriraj firmu →";

  return (
    <div id="vp2">
      <div className="wrap">
        <nav>
          <div className="logo">
            <span className="brk">&lt;/&gt;</span>VozniPark
          </div>
          <div className="navlinks">
            <a href="#usporedba">Usporedba</a>
            <a href="#znacajke">Značajke</a>
            <a href="#cijene">Cijene</a>
            <Link
              href={primaryHref}
              className="btn btn-primary"
              style={{ padding: "9px 16px" }}
            >
              {session ? "Nadzorna ploča" : "Prijava"}
            </Link>
          </div>
        </nav>
      </div>

      <div className="wrap hero">
        <div>
          <div className="kicker">
            <span className="pulse" />
            aktivno u upotrebi · rana faza
          </div>
          <h1 className="display">
            Praćenje voznog parka
            <br />
            bez <span className="accent">.xlsx</span> datoteke koja pukne
            svaki mjesec.
          </h1>
          <p className="lead">
            Potrošnja, servisi i troškovi po vozilu — izračunato automatski,
            ne prepisano ručno. Za flote od 3 do 30 vozila.
          </p>
          <div className="hero-ctas">
            <Link href={primaryHref} className="btn btn-primary">
              {primaryLabel}
            </Link>
            <a href="#usporedba" className="btn btn-ghost">
              Vidi usporedbu
            </a>
          </div>
          <div className="hero-meta">
            <span className="chk">✓</span>
            <span>Bez instalacije hardvera</span>
            <span className="chk">✓</span>
            <span>Prvih 5 vozila besplatno</span>
          </div>
        </div>

        <TerminalDemo />
      </div>

      <section className="block" id="usporedba">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{"// usporedba"}</div>
            <h2 className="display">Excel tablica vs. VozniPark</h2>
            <p>
              Excel nije loš alat — samo nije napravljen za ono što od njega
              tražite.
            </p>
          </div>
          <div className="cmp-table">
            <div className="cmp-row head">
              <div>Mogućnost</div>
              <div>Excel</div>
              <div>VozniPark</div>
            </div>
            <div className="cmp-row">
              <div>Automatski izračun potrošnje (puno-u-puno)</div>
              <div className="no">Ručno</div>
              <div className="yes">✓</div>
            </div>
            <div className="cmp-row">
              <div>Upozorenje na odstupanje potrošnje</div>
              <div className="no">✗</div>
              <div className="yes">✓</div>
            </div>
            <div className="cmp-row">
              <div>Podsjetnik na servis / registraciju / osiguranje</div>
              <div className="no">Ako se sjetite</div>
              <div className="yes">✓</div>
            </div>
            <div className="cmp-row">
              <div>Otporno na slučajno obrisan red ili formulu</div>
              <div className="no">✗</div>
              <div className="yes">✓</div>
            </div>
            <div className="cmp-row">
              <div>Pristup s mobitela na terenu</div>
              <div className="no">Nezgrapno</div>
              <div className="yes">✓</div>
            </div>
            <div className="cmp-row">
              <div>Izvoz za knjigovodstvo (CSV/Excel)</div>
              <div className="yes">✓</div>
              <div className="yes">✓</div>
            </div>
          </div>
        </div>
      </section>

      <section className="block" id="znacajke">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{"// značajke"}</div>
            <h2 className="display">Napravljeno za male vozne parkove</h2>
          </div>
          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-tag">01 · potrošnja</div>
              <h3>Točan izračun, ne procjena</h3>
              <p>
                Računa se iz stvarnih punih spremnika, ne iz svakog
                djelomičnog točenja — bez lažnih skokova u grafu.
              </p>
            </div>
            <div className="feat-card">
              <div className="feat-tag">02 · upozorenja</div>
              <h3>Rano otkrivanje kvara</h3>
              <p>
                Kad potrošnja odstupi od referentne vrijednosti, vozilo se
                odmah označi — prije nego trošak naraste.
              </p>
            </div>
            <div className="feat-card">
              <div className="feat-tag">03 · rokovi</div>
              <h3>Servis, registracija, osiguranje</h3>
              <p>
                Sva tri roka na jednom mjestu, s upozorenjem dovoljno
                unaprijed da stignete reagirati.
              </p>
            </div>
            <div className="feat-card">
              <div className="feat-tag">04 · unos</div>
              <h3>Unos s terena za 20 sekundi</h3>
              <p>
                Vozač unese km, litre i cijenu s mobitela na pumpi — bez
                čekanja povratka u ured.
              </p>
            </div>
            <div className="feat-card">
              <div className="feat-tag">05 · izvještaji</div>
              <h3>Izvoz jednim klikom</h3>
              <p>
                CSV izvještaj za knjigovodstvo kad vam zaista treba tablica —
                a ne za svakodnevni rad.
              </p>
            </div>
            <div className="feat-card">
              <div className="feat-tag">06 · cijena</div>
              <h3>Plaćate po vozilu</h3>
              <p>
                Bez licenci po korisniku, bez skrivenih troškova instalacije
                ili hardvera.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{"// procjena"}</div>
            <h2 className="display">Koliko bi vam ovo značilo?</h2>
            <p>
              Orijentacijski izračun na temelju broja vozila i mjesečnog
              troška goriva.
            </p>
          </div>
          <FuelCalculator />
        </div>
      </section>

      <section className="block" id="cijene">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{"// cijene"}</div>
            <h2 className="display">Cijena po vozilu, ne po korisniku</h2>
            <p>
              Provjereno naspram tržišta — u skladu s cijenama sličnih alata
              bez GPS/telematike u Europi.
            </p>
          </div>
          <div className="price-grid">
            <div className="price-card">
              <h3>Starter</h3>
              <div className="per-vehicle mono">~2,4 €/vozilo/mj</div>
              <div className="price">
                12€<span> / mj</span>
              </div>
              <ul>
                <li>Do 5 vozila</li>
                <li>Praćenje goriva i servisa</li>
                <li>Osnovni izvještaji</li>
              </ul>
              <Link href="/registracija" className="btn btn-ghost">
                Prijavi se
              </Link>
            </div>
            <div className="price-card hl">
              <h3>Pro</h3>
              <div className="per-vehicle mono">~1,8 €/vozilo/mj</div>
              <div className="price">
                27€<span> / mj</span>
              </div>
              <ul>
                <li>Do 15 vozila</li>
                <li>Upozorenja na odstupanje potrošnje</li>
                <li>Registracija i osiguranje — rokovi</li>
                <li>Izvoz podataka (CSV)</li>
              </ul>
              <Link href="/registracija" className="btn btn-primary">
                Prijavi se
              </Link>
            </div>
            <div className="price-card">
              <h3>Veći vozni park</h3>
              <div className="per-vehicle mono">po dogovoru</div>
              <div className="price">Kontakt</div>
              <ul>
                <li>Preko 15 vozila</li>
                <li>Prilagođeni izvještaji</li>
                <li>Više korisničkih računa</li>
              </ul>
              <Link href="/registracija" className="btn btn-ghost">
                Kontaktiraj
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cta" id="pocetak">
        <div className="wrap">
          <div className="eyebrow" style={{ textAlign: "center" }}>
            {"// krenite odmah"}
          </div>
          <h2 className="display">Registrirajte svoju firmu</h2>
          <p>Postavljanje traje manje od dvije minute.</p>
          <Link href="/registracija" className="btn btn-primary">
            Registriraj firmu →
          </Link>
        </div>
      </section>

      <footer>
        <div
          className="wrap"
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span className="mono">VozniPark</span>
          <a href="mailto:podrska.voznipark@gmail.com" className="mono">
            podrska.voznipark@gmail.com
          </a>
          <span>Zadar, Hrvatska</span>
        </div>
      </footer>
    </div>
  );
}
