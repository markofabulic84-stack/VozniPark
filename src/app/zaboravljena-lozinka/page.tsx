"use client";

import Link from "next/link";
import { useActionState } from "react";
import { zatraziResetLozinke } from "@/app/actions/lozinka";

export default function ZaboravljenaLozinkaPage() {
  const [state, action, pending] = useActionState(zatraziResetLozinke, undefined);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="mono text-sm" style={{ color: "var(--blue)" }}>
            &lt;/&gt; VozniPark
          </Link>
          <h1 className="display text-2xl mt-4">Zaboravljena lozinka</h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
            Poslat ćemo vam poveznicu za postavljanje nove lozinke.
          </p>
        </div>

        {state?.poslano ? (
          <div className="card p-6 text-sm text-center" style={{ color: "var(--green)" }}>
            {state.message}
          </div>
        ) : (
          <form action={action} className="card p-6 flex flex-col gap-5">
            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="vasa@firma.com"
                required
              />
            </div>
            {state?.message && <p className="error-text">{state.message}</p>}
            <button type="submit" disabled={pending} className="btn btn-primary w-full">
              {pending ? "Slanje..." : "Pošalji poveznicu"}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
          <Link href="/prijava" style={{ color: "var(--blue)" }}>
            ← Natrag na prijavu
          </Link>
        </p>
      </div>
    </main>
  );
}
