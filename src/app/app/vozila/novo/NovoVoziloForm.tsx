"use client";

import Link from "next/link";
import { useActionState } from "react";
import { kreirajVozilo } from "@/app/actions/vozila";

export default function NovoVoziloForm() {
  const [state, action, pending] = useActionState(kreirajVozilo, undefined);

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      <div>
        <label className="field-label" htmlFor="naziv">
          Marka i model
        </label>
        <input
          id="naziv"
          name="naziv"
          className="input"
          placeholder="npr. Renault Kangoo"
          required
        />
      </div>

      <div>
        <label className="field-label" htmlFor="registracija">
          Registracija
        </label>
        <input
          id="registracija"
          name="registracija"
          className="input"
          placeholder="npr. ZD 118-DP"
          required
        />
      </div>

      <div>
        <label className="field-label" htmlFor="trenutniKm">
          Trenutno stanje km
        </label>
        <input
          id="trenutniKm"
          name="trenutniKm"
          type="number"
          min={0}
          className="input"
          placeholder="0"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="referentnaPotrosnja">
          Referentna potrošnja (L/100km, opcionalno)
        </label>
        <input
          id="referentnaPotrosnja"
          name="referentnaPotrosnja"
          type="number"
          step="0.1"
          min={0}
          className="input"
          placeholder="npr. 7.0"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="sljedeciServisKm">
          Sljedeći servis na (km, opcionalno)
        </label>
        <input
          id="sljedeciServisKm"
          name="sljedeciServisKm"
          type="number"
          min={0}
          className="input"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="registracijaDo">
            Registracija vrijedi do
          </label>
          <input
            id="registracijaDo"
            name="registracijaDo"
            type="date"
            className="input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="osiguranjeDo">
            Osiguranje vrijedi do
          </label>
          <input
            id="osiguranjeDo"
            name="osiguranjeDo"
            type="date"
            className="input"
          />
        </div>
      </div>

      {state?.message && <p className="error-text">{state.message}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Spremanje..." : "Spremi vozilo"}
        </button>
        <Link href="/app/vozila" className="btn btn-ghost">
          Odustani
        </Link>
      </div>
    </form>
  );
}
