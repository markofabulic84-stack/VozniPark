"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { kreirajZamjenuGuma } from "@/app/actions/gume";

type Vozilo = { id: string; naziv: string; registracija: string; trenutniKm: number };

export default function ZamjenaGumaForm({
  vozila,
  odabranoId,
}: {
  vozila: Vozilo[];
  odabranoId?: string;
}) {
  const [state, action, pending] = useActionState(kreirajZamjenuGuma, undefined);
  const danas = new Date().toISOString().slice(0, 10);

  const kmZaVozilo = (id: string) =>
    vozila.find((v) => v.id === id)?.trenutniKm ?? "";

  const [vozilo, setVozilo] = useState(odabranoId ?? "");
  const [kmStanje, setKmStanje] = useState(
    odabranoId ? String(kmZaVozilo(odabranoId)) : "",
  );

  function odaberiVozilo(id: string) {
    setVozilo(id);
    if (!kmStanje) setKmStanje(String(kmZaVozilo(id)));
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
        <label className="field-label" htmlFor="vrsta">
          Vrsta guma
        </label>
        <select id="vrsta" name="vrsta" className="input" defaultValue="" required>
          <option value="" disabled>
            Odaberite vrstu
          </option>
          <option value="ZIMSKE">Zimske</option>
          <option value="LJETNE">Ljetne</option>
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="datum">
          Datum
        </label>
        <input id="datum" name="datum" type="date" className="input" defaultValue={danas} />
      </div>

      <div>
        <label className="field-label" htmlFor="kmStanje">
          Stanje km (opcionalno)
        </label>
        <input
          id="kmStanje"
          name="kmStanje"
          type="number"
          inputMode="numeric"
          min={0}
          className="input"
          value={kmStanje}
          onChange={(e) => setKmStanje(e.target.value)}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="napomena">
          Napomena (opcionalno)
        </label>
        <input id="napomena" name="napomena" className="input" placeholder="npr. servis/vulkanizer" />
      </div>

      {state?.message && <p className="error-text">{state.message}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Spremanje..." : "Spremi"}
        </button>
        <Link href="/app/gume" className="btn btn-ghost">
          Odustani
        </Link>
      </div>
    </form>
  );
}
