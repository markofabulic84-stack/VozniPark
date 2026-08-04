"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { kreirajTocenje } from "@/app/actions/tocenja";

type Vozilo = { id: string; naziv: string; registracija: string };

const VRSTE_GORIVA = [
  { kod: "DIZEL", naziv: "Dizel" },
  { kod: "BENZIN", naziv: "Benzin" },
  { kod: "LPG", naziv: "LPG" },
  { kod: "ELEKTRICNO", naziv: "Električno" },
];

export default function TocenjeForm({
  vozila,
  odabranoId,
  zadaneVrsteGoriva,
  ocrDostupan,
}: {
  vozila: Vozilo[];
  odabranoId?: string;
  zadaneVrsteGoriva: Record<string, string | null>;
  ocrDostupan: boolean;
}) {
  const [state, action, pending] = useActionState(kreirajTocenje, undefined);
  const danas = new Date().toISOString().slice(0, 10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [skeniranje, setSkeniranje] = useState(false);
  const [ocrPoruka, setOcrPoruka] = useState<string | null>(null);
  const [racunUrl, setRacunUrl] = useState<string | null>(null);
  const [litre, setLitre] = useState("");
  const [ukupnaCijena, setUkupnaCijena] = useState("");
  const [vrstaGoriva, setVrstaGoriva] = useState(
    (odabranoId && zadaneVrsteGoriva[odabranoId]) || "",
  );
  const [vozilo, setVozilo] = useState(odabranoId ?? "");

  async function obradiSlikuRacuna(datoteka: File) {
    setSkeniranje(true);
    setOcrPoruka(null);
    try {
      const formData = new FormData();
      formData.set("slika", datoteka);
      const odgovor = await fetch("/api/racun", {
        method: "POST",
        body: formData,
      });
      if (!odgovor.ok) {
        setOcrPoruka("Slika je spremljena, ali prepoznavanje nije uspjelo — unesite podatke ručno.");
        return;
      }
      const podaci = await odgovor.json();
      setRacunUrl(podaci.racunUrl);
      if (podaci.litre) setLitre(String(podaci.litre));
      if (podaci.ukupnaCijena) setUkupnaCijena(String(podaci.ukupnaCijena));
      if (podaci.vrstaGoriva) setVrstaGoriva(podaci.vrstaGoriva);

      if (podaci.litre || podaci.ukupnaCijena) {
        setOcrPoruka("Prepoznato iz računa — provjerite vrijednosti prije spremanja.");
      } else {
        setOcrPoruka("Račun je spremljen, ali nismo uspjeli automatski očitati iznose — unesite ih ručno.");
      }
    } catch {
      setOcrPoruka("Greška pri obradi slike — unesite podatke ručno.");
    } finally {
      setSkeniranje(false);
    }
  }

  function odaberiVozilo(id: string) {
    setVozilo(id);
    if (!vrstaGoriva && zadaneVrsteGoriva[id]) {
      setVrstaGoriva(zadaneVrsteGoriva[id]!);
    }
  }

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      {ocrDostupan ? (
        <div>
          <label className="field-label" htmlFor="slikaRacuna">
            Slika računa (opcionalno)
          </label>
          <input
            ref={fileInputRef}
            id="slikaRacuna"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const datoteka = e.target.files?.[0];
              if (datoteka) obradiSlikuRacuna(datoteka);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={skeniranje}
            className="btn btn-ghost w-full"
          >
            {skeniranje
              ? "Prepoznajem račun..."
              : racunUrl
                ? "📷 Slikaj ponovno"
                : "📷 Slikaj račun"}
          </button>
          {racunUrl && (
            <div className="flex items-center gap-3 mt-3">
              <Image
                src={racunUrl}
                alt="Slika računa"
                width={56}
                height={56}
                unoptimized
                style={{ objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
              />
              <span className="text-xs" style={{ color: "var(--green)" }}>
                Račun snimljen
              </span>
            </div>
          )}
          {ocrPoruka && (
            <p className="text-xs mt-2" style={{ color: "var(--amber)" }}>
              {ocrPoruka}
            </p>
          )}
          <input type="hidden" name="racunSlika" value={racunUrl ?? ""} />
        </div>
      ) : (
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          📷 Slikanje računa uz automatsko prepoznavanje dostupno je na Pro i
          višim planovima.{" "}
          <Link href="/pretplata" className="mono" style={{ color: "var(--blue)" }}>
            Nadogradi plan →
          </Link>
        </div>
      )}

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
        <input
          id="datum"
          name="datum"
          type="date"
          className="input"
          defaultValue={danas}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="kmStanje">
          Stanje km
        </label>
        <input
          id="kmStanje"
          name="kmStanje"
          type="number"
          inputMode="numeric"
          min={0}
          className="input"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="litre">
            Litre
          </label>
          <input
            id="litre"
            name="litre"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            className="input"
            value={litre}
            onChange={(e) => setLitre(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="ukupnaCijena">
            Ukupna cijena (€)
          </label>
          <input
            id="ukupnaCijena"
            name="ukupnaCijena"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            className="input"
            value={ukupnaCijena}
            onChange={(e) => setUkupnaCijena(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="vrstaGoriva">
          Vrsta goriva
        </label>
        <select
          id="vrstaGoriva"
          name="vrstaGoriva"
          className="input"
          value={vrstaGoriva}
          onChange={(e) => setVrstaGoriva(e.target.value)}
        >
          <option value="">Nepoznato</option>
          {VRSTE_GORIVA.map((v) => (
            <option key={v.kod} value={v.kod}>
              {v.naziv}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="punSpremnik"
          defaultChecked
          style={{ accentColor: "var(--blue)" }}
        />
        Pun spremnik
      </label>

      <div>
        <label className="field-label" htmlFor="napomena">
          Napomena (opcionalno)
        </label>
        <input id="napomena" name="napomena" className="input" />
      </div>

      {state?.message && <p className="error-text">{state.message}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Spremanje..." : "Spremi točenje"}
        </button>
        <Link href="/app/vozila" className="btn btn-ghost">
          Odustani
        </Link>
      </div>
    </form>
  );
}
