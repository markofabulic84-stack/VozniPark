// Zakonska obveza zimske opreme u Hrvatskoj: 15.11. – 15.4.
export function trebajuZimskeGume(datum: Date = new Date()): boolean {
  const mjesec = datum.getMonth() + 1; // 1-12
  const dan = datum.getDate();

  if (mjesec > 11 || mjesec < 4) return true;
  if (mjesec === 11 && dan >= 15) return true;
  if (mjesec === 4 && dan <= 15) return true;
  return false;
}

export type ZadnjaZamjenaGuma = { vrsta: "LJETNE" | "ZIMSKE"; datum: Date } | null;

export type StatusGuma =
  | { status: "ok" }
  | { status: "upozorenje" | "kritično"; poruka: string };

export function statusGuma(
  zadnja: ZadnjaZamjenaGuma,
  sada: Date = new Date(),
): StatusGuma {
  const sezonaZimska = trebajuZimskeGume(sada);

  if (sezonaZimska && zadnja?.vrsta !== "ZIMSKE") {
    return {
      status: "kritično",
      poruka: zadnja
        ? "postavljene su ljetne gume, a zakonski je obavezna zimska oprema (15.11.–15.4.)"
        : "nema evidencije o zimskim gumama, a zakonski je obavezna zimska oprema (15.11.–15.4.)",
    };
  }

  if (!sezonaZimska && zadnja?.vrsta === "ZIMSKE") {
    return {
      status: "upozorenje",
      poruka: "još su postavljene zimske gume izvan sezone — brže se troše na toploj cesti",
    };
  }

  return { status: "ok" };
}
