"use client";

import { useActionState, useRef, useEffect } from "react";
import { promijeniLozinku } from "@/app/actions/lozinka";

export default function LozinkaForm() {
  const [state, action, pending] = useActionState(promijeniLozinku, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.uspjeh) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card p-6 flex flex-col gap-5">
      <h2 className="display text-lg">Promjena lozinke</h2>

      <div>
        <label className="field-label" htmlFor="trenutnaLozinka">
          Trenutna lozinka
        </label>
        <input
          id="trenutnaLozinka"
          name="trenutnaLozinka"
          type="password"
          className="input"
          autoComplete="current-password"
          required
        />
      </div>

      <div>
        <label className="field-label" htmlFor="novaLozinka">
          Nova lozinka
        </label>
        <input
          id="novaLozinka"
          name="novaLozinka"
          type="password"
          className="input"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {state?.message && (
        <p
          className="text-sm"
          style={{ color: state.uspjeh ? "var(--green)" : "var(--red)" }}
        >
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-fit">
        {pending ? "Spremanje..." : "Promijeni lozinku"}
      </button>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Promjena lozinke odjavljuje sve ostale uređaje — ovaj uređaj ostaje
        prijavljen.
      </p>
    </form>
  );
}
