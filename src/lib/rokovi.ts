export type StatusRoka = "ok" | "upozorenje" | "kritično";

const DAN_MS = 24 * 60 * 60 * 1000;
const UPOZORENJE_DANA = 30;
const UPOZORENJE_KM = 500;

export function statusDatuma(
  datum: Date | null,
  danas: Date = new Date(),
): { danaDo: number; status: StatusRoka } | null {
  if (!datum) return null;
  const danaDo = Math.round((datum.getTime() - danas.getTime()) / DAN_MS);
  let status: StatusRoka = "ok";
  if (danaDo < 0) status = "kritično";
  else if (danaDo <= UPOZORENJE_DANA) status = "upozorenje";
  return { danaDo, status };
}

export function statusServisa(
  sljedeciServisKm: number | null,
  trenutniKm: number,
): { kmDo: number; status: StatusRoka } | null {
  if (sljedeciServisKm == null) return null;
  const kmDo = sljedeciServisKm - trenutniKm;
  let status: StatusRoka = "ok";
  if (kmDo < 0) status = "kritično";
  else if (kmDo <= UPOZORENJE_KM) status = "upozorenje";
  return { kmDo, status };
}
