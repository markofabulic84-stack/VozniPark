// Datum iz <input type="date"> stiže kao tekst i NIJE zajamčeno ispravan —
// server akcija prima obični FormData, pa vrijednost može biti prazna,
// krivo formatirana ili namjerno podmetnuta. `new Date("bilo što")` u tom
// slučaju vrati Invalid Date, koji Prisma odbije tek pri INSERT-u i sruši
// zahtjev s 500 umjesto da korisnik dobije poruku. Zato se svaki datum iz
// forme provlači kroz ovu funkciju.
export function parsirajDatum(vrijednost: FormDataEntryValue | null): Date | null {
  const tekst = String(vrijednost ?? "").trim();
  if (!tekst) return null;
  const datum = new Date(tekst);
  return Number.isNaN(datum.getTime()) ? null : datum;
}

// Datum unosa: prazno polje znači "danas", ali neispravan tekst je greška
// koju treba prijaviti, a ne tiho zamijeniti današnjim datumom.
export function parsirajDatumUnosa(
  vrijednost: FormDataEntryValue | null,
): { ok: true; datum: Date } | { ok: false } {
  const tekst = String(vrijednost ?? "").trim();
  if (!tekst) return { ok: true, datum: new Date() };
  const datum = new Date(tekst);
  if (Number.isNaN(datum.getTime())) return { ok: false };
  return { ok: true, datum };
}
