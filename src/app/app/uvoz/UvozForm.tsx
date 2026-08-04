"use client";

import { useState } from "react";

type Rezultat = {
  uvezeno: number;
  novihVozila: number;
  preskoceno: string[];
};

export default function UvozForm() {
  const [ucitavanje, setUcitavanje] = useState(false);
  const [rezultat, setRezultat] = useState<Rezultat | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  async function posalji(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const forma = e.currentTarget;
    setUcitavanje(true);
    setGreska(null);
    setRezultat(null);
    try {
      const odgovor = await fetch("/api/uvoz", {
        method: "POST",
        body: new FormData(forma),
      });
      const podaci = await odgovor.json();
      if (!odgovor.ok) {
        setGreska(podaci.message ?? "Uvoz nije uspio.");
      } else {
        setRezultat(podaci);
        forma.reset();
      }
    } catch {
      setGreska("Greška pri slanju datoteke.");
    } finally {
      setUcitavanje(false);
    }
  }

  return (
    <form onSubmit={posalji} className="card p-6 flex flex-col gap-5">
      <div>
        <label className="field-label" htmlFor="datoteka">
          Excel (.xlsx) ili CSV datoteka
        </label>
        <input
          id="datoteka"
          name="datoteka"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="input"
          required
        />
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          Očekivani stupci: <span className="mono">Registracija, Km, Litre,
          Cijena</span> (opcionalno <span className="mono">Datum, Pun
          spremnik</span>). Nepoznate registracije automatski postaju nova
          vozila.
        </p>
      </div>

      {greska && <p className="error-text">{greska}</p>}

      {rezultat && (
        <div className="card p-4 text-sm" style={{ background: "var(--panel-2)" }}>
          <p style={{ color: "var(--green)" }}>
            Uvezeno {rezultat.uvezeno} točenja
            {rezultat.novihVozila > 0 &&
              `, kreirano ${rezultat.novihVozila} novih vozila`}
            .
          </p>
          {rezultat.preskoceno.length > 0 && (
            <div className="mt-2" style={{ color: "var(--amber)" }}>
              Preskočeno {rezultat.preskoceno.length}:
              <ul className="mt-1" style={{ color: "var(--muted)" }}>
                {rezultat.preskoceno.slice(0, 10).map((p, i) => (
                  <li key={i}>· {p}</li>
                ))}
                {rezultat.preskoceno.length > 10 && (
                  <li>· … i još {rezultat.preskoceno.length - 10}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <button type="submit" disabled={ucitavanje} className="btn btn-primary w-fit">
        {ucitavanje ? "Uvoz u tijeku..." : "Uvezi podatke"}
      </button>
    </form>
  );
}
