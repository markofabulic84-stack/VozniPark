"use client";

import { useActionState } from "react";
import { produziPretplatu } from "@/app/actions/pretplata";
import type { Plan } from "@/generated/prisma/enums";

const PLANOVI: { kod: Plan; naziv: string; cijena: string; opis: string }[] = [
  { kod: "STARTER", naziv: "Starter", cijena: "12 € / mj", opis: "do 5 vozila" },
  { kod: "PRO", naziv: "Pro", cijena: "27 € / mj", opis: "do 15 vozila" },
  {
    kod: "ENTERPRISE",
    naziv: "Veći vozni park",
    cijena: "po dogovoru",
    opis: "neograničeno vozila",
  },
];

export default function PretplataForm({ trenutniPlan }: { trenutniPlan: Plan }) {
  const [state, action, pending] = useActionState(produziPretplatu, undefined);

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      <div>
        <label className="field-label" htmlFor="plan">
          Plan
        </label>
        <select id="plan" name="plan" className="input" defaultValue={trenutniPlan}>
          {PLANOVI.map((p) => (
            <option key={p.kod} value={p.kod}>
              {p.naziv} — {p.cijena} ({p.opis})
            </option>
          ))}
        </select>
      </div>

      {state?.message && (
        <p
          className="text-sm"
          style={{ color: state.uspjeh ? "var(--green)" : "var(--red)" }}
        >
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Obrada..." : "Produži pretplatu za 30 dana"}
      </button>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Naplata je u ovoj fazi simulirana — pravo plaćanje karticom (Stripe)
        spaja se prije javnog lansiranja.
      </p>
    </form>
  );
}
