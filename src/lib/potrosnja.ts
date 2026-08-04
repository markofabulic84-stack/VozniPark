type Tocenje = {
  kmStanje: number;
  litre: number;
  punSpremnik: boolean;
  datum: Date;
};

export type Interval = {
  odKm: number;
  doKm: number;
  datum: Date;
  litre: number;
  potrosnja: number;
};

// Full-to-full metoda: potrošnja između dva puna spremnika = zbroj litara
// svih točenja između njih (uključivo drugo puno točenje) / prijeđeni km * 100.
export function izracunajIntervale(tocenja: Tocenje[]): Interval[] {
  const sortirano = [...tocenja].sort((a, b) => a.kmStanje - b.kmStanje);
  const puniIndeksi = sortirano
    .map((t, i) => (t.punSpremnik ? i : -1))
    .filter((i) => i !== -1);

  const intervali: Interval[] = [];
  for (let n = 0; n < puniIndeksi.length - 1; n++) {
    const od = puniIndeksi[n];
    const doIdx = puniIndeksi[n + 1];
    const odKm = sortirano[od].kmStanje;
    const doKm = sortirano[doIdx].kmStanje;
    const distanca = doKm - odKm;
    if (distanca <= 0) continue;

    const litre = sortirano
      .slice(od + 1, doIdx + 1)
      .reduce((zbroj, t) => zbroj + t.litre, 0);

    intervali.push({
      odKm,
      doKm,
      datum: sortirano[doIdx].datum,
      litre,
      potrosnja: (litre / distanca) * 100,
    });
  }
  return intervali;
}

export function referentnaPotrosnja(
  rucnaReferenca: number | null,
  intervali: Interval[],
): number | null {
  if (rucnaReferenca != null) return rucnaReferenca;
  if (intervali.length < 2) return null;
  const preth = intervali.slice(0, -1);
  return preth.reduce((z, i) => z + i.potrosnja, 0) / preth.length;
}

export type StatusOdstupanja = "ok" | "upozorenje" | "kritično";

export function odstupanjeStatus(
  aktualna: number,
  referentna: number,
): { postotak: number; status: StatusOdstupanja } {
  const postotak = ((aktualna - referentna) / referentna) * 100;
  let status: StatusOdstupanja = "ok";
  if (postotak >= 25) status = "kritično";
  else if (postotak >= 10) status = "upozorenje";
  return { postotak, status };
}
