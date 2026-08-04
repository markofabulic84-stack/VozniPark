"use client";

import { useActionState } from "react";
import { azurirajVozilo } from "@/app/actions/vozila";
import type { VehicleModel } from "@/generated/prisma/models/Vehicle";

function zaInputDatum(datum: Date | null) {
  if (!datum) return "";
  return datum.toISOString().slice(0, 10);
}

export default function EditVoziloForm({ vozilo }: { vozilo: VehicleModel }) {
  const [state, action, pending] = useActionState(azurirajVozilo, undefined);

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      <input type="hidden" name="id" value={vozilo.id} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="naziv">
            Marka i model
          </label>
          <input
            id="naziv"
            name="naziv"
            className="input"
            defaultValue={vozilo.naziv}
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
            defaultValue={vozilo.registracija}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            defaultValue={vozilo.trenutniKm}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="referentnaPotrosnja">
            Referentna potrošnja (L/100km)
          </label>
          <input
            id="referentnaPotrosnja"
            name="referentnaPotrosnja"
            type="number"
            step="0.1"
            min={0}
            className="input"
            defaultValue={vozilo.referentnaPotrosnja ?? ""}
            placeholder="automatski iz povijesti"
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="sljedeciServisKm">
          Sljedeći servis na (km)
        </label>
        <input
          id="sljedeciServisKm"
          name="sljedeciServisKm"
          type="number"
          min={0}
          className="input"
          defaultValue={vozilo.sljedeciServisKm ?? ""}
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
            defaultValue={zaInputDatum(vozilo.registracijaDo)}
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
            defaultValue={zaInputDatum(vozilo.osiguranjeDo)}
          />
        </div>
      </div>

      {state?.message && (
        <p
          className="text-sm"
          style={{
            color:
              state.message === "Spremljeno." ? "var(--green)" : "var(--red)",
          }}
        >
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Spremanje..." : "Spremi promjene"}
      </button>
    </form>
  );
}
