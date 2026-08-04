import type { Plan } from "@/generated/prisma/enums";
import { pretplataAktivna } from "@/lib/pretplata";

export const PLAN_LIMITI: Record<Plan, number | null> = {
  STARTER: 5,
  PRO: 15,
  ENTERPRISE: null,
};

export const PLAN_MAX_KORISNIKA: Record<Plan, number | null> = {
  STARTER: 2,
  PRO: 10,
  ENTERPRISE: null,
};

export const PLAN_NAZIVI: Record<Plan, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Veći vozni park",
};

export type Znacajka =
  | "upozorenja_potrosnje"
  | "rokovi_dokumenti" // registracija/osiguranje
  | "gume"
  | "ocr_racuna"
  | "csv_izvoz"
  | "csv_uvoz";

export const ZNACAJKE_PO_PLANU: Record<Plan, ReadonlySet<Znacajka>> = {
  STARTER: new Set([]),
  PRO: new Set([
    "upozorenja_potrosnje",
    "rokovi_dokumenti",
    "gume",
    "ocr_racuna",
    "csv_izvoz",
  ]),
  ENTERPRISE: new Set([
    "upozorenja_potrosnje",
    "rokovi_dokumenti",
    "gume",
    "ocr_racuna",
    "csv_izvoz",
    "csv_uvoz",
  ]),
};

export const ZNACAJKA_NAZIVI: Record<Znacajka, string> = {
  upozorenja_potrosnje: "Upozorenja na odstupanje potrošnje",
  rokovi_dokumenti: "Rokovi registracije i osiguranja",
  gume: "Evidencija zamjene guma",
  ocr_racuna: "Slikanje računa (automatsko prepoznavanje)",
  csv_izvoz: "Izvoz podataka (CSV)",
  csv_uvoz: "Uvoz Excel/CSV podataka",
};

export type CompanyZaPlan = {
  plan: Plan;
  naPocetnomProbnom: boolean;
  pretplataDo: Date | null;
};

// Tijekom probnog perioda (prije prve uplate) sve je otvoreno bez obzira
// na nominalni plan — vidi napomenu uz Company.naPocetnomProbnom.
export function jeUNeogranicenomProbnom(
  company: CompanyZaPlan,
  sada: Date = new Date(),
): boolean {
  return company.naPocetnomProbnom && pretplataAktivna(company.pretplataDo, sada);
}

export function imaZnacajku(company: CompanyZaPlan, znacajka: Znacajka): boolean {
  if (jeUNeogranicenomProbnom(company)) return true;
  return ZNACAJKE_PO_PLANU[company.plan].has(znacajka);
}

export function maxVozilaZaPlan(plan: Plan): number | null {
  return PLAN_LIMITI[plan];
}

export function maxVozila(company: CompanyZaPlan): number | null {
  if (jeUNeogranicenomProbnom(company)) return null;
  return PLAN_LIMITI[company.plan];
}

export function maxKorisnika(company: CompanyZaPlan): number | null {
  if (jeUNeogranicenomProbnom(company)) return null;
  return PLAN_MAX_KORISNIKA[company.plan];
}
