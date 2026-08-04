export const PROBNI_PERIOD_DANA = 3;
export const OBNOVA_DANA = 30;
export const UPOZORENJE_ISTEK_DANA = 7;

const DAN_MS = 24 * 60 * 60 * 1000;

export function pretplataAktivna(
  pretplataDo: Date | null,
  sada: Date = new Date(),
): boolean {
  if (!pretplataDo) return false;
  return pretplataDo.getTime() >= sada.getTime();
}

export function danaDoIsteka(
  pretplataDo: Date | null,
  sada: Date = new Date(),
): number | null {
  if (!pretplataDo) return null;
  return Math.ceil((pretplataDo.getTime() - sada.getTime()) / DAN_MS);
}

// Produljenje kreće od isteka ako pretplata još traje (korisnik ne gubi
// preostale dane), a od danas ako je već istekla.
export function noviIstek(
  pretplataDo: Date | null,
  sada: Date = new Date(),
  dana: number = OBNOVA_DANA,
): Date {
  const baza =
    pretplataDo && pretplataDo.getTime() > sada.getTime() ? pretplataDo : sada;
  return new Date(baza.getTime() + dana * DAN_MS);
}

export function probniIstek(sada: Date = new Date()): Date {
  return new Date(sada.getTime() + PROBNI_PERIOD_DANA * DAN_MS);
}
