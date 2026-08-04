"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { kreirajDnevnuVoznju } from "@/app/actions/kilometraza";

type Vozilo = { id: string; naziv: string; registracija: string; trenutniKm: number };

export default function DnevnaVoznjaForm({
  vozila,
  odabranoId,
}: {
  vozila: Vozilo[];
  odabranoId?: string;
}) {
  const [state, action, pending] = useActionState(kreirajDnevnuVoznju, undefined);
  const danas = new Date().toISOString().slice(0, 10);

  const pocetniZaVozilo = (id: string) =>
    vozila.find((v) => v.id === id)?.trenutniKm ?? "";

  const [vozilo, setVozilo] = useState(odabranoId ?? "");
  const [pocetniKm, setPocetniKm] = useState(
    odabranoId ? String(pocetniZaVozilo(odabranoId)) : "",
  );
  const [zavrsniKm, setZavrsniKm] = useState("");

  const ukupno =
    pocetniKm && zavrsniKm && Number(zavrsniKm) >= Number(pocetniKm)
      ? Number(zavrsniKm) - Number(pocetniKm)
      : null;

  function odaberiVozilo(id: string) {
    setVozilo(id);
    if (!pocetniKm) {
      setPocetniKm(String(pocetniZaVozilo(id)));
    }
  }

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      <div>
        <label className="field-label" htmlFor="vehicleId">
          Vozilo
        </label>
        <select
          id="vehicleId"
          name="vehicleId"
          className="input"
          value={vozilo}
          onChange={(e) => odaberiVozilo(e.target.value)}
          required
        >
          <option value="" disabled>
            Odaberite vozilo
          </option>
          {vozila.map((v) => (
            <option key={v.id} value={v.id}>
              {v.naziv} — {v.registracija}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="datum">
          Datum
        </label>
        <input id="datum" name="datum" type="date" className="input" defaultValue={danas} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="pocetniKm">
            Početni km
          </label>
          <input
            id="pocetniKm"
            name="pocetniKm"
            type="number"
            inputMode="numeric"
            min={0}
            className="input"
            value={pocetniKm}
            onChange={(e) => setPocetniKm(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="zavrsniKm">
            Završni km
          </label>
          <input
            id="zavrsniKm"
            name="zavrsniKm"
            type="number"
            inputMode="numeric"
            min={0}
            className="input"
            value={zavrsniKm}
            onChange={(e) => setZavrsniKm(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="card p-4" style={{ background: "var(--panel-2)" }}>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          Ukupno prijeđeno
        </div>
        <div className="display text-xl mt-1 mono">
          {ukupno != null ? `${ukupno.toLocaleString("hr-HR")} km` : "—"}
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="napomena">
          Napomena (opcionalno)
        </label>
        <input id="napomena" name="napomena" className="input" placeholder="npr. relacija" />
      </div>

      {state?.message && <p className="error-text">{state.message}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Spremanje..." : "Spremi unos"}
        </button>
        <Link href="/app/kilometraza" className="btn btn-ghost">
          Odustani
        </Link>
      </div>
    </form>
  );
}
