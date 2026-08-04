"use client";

import { useActionState, useRef, useEffect } from "react";
import { dodajKorisnika } from "@/app/actions/korisnici";

export default function DodajKorisnikaForm() {
  const [state, action, pending] = useActionState(dodajKorisnika, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message === "Korisnik dodan.") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="card p-6 flex flex-col gap-5"
    >
      <h2 className="display text-lg">Dodaj korisnika</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="ime">
            Ime
          </label>
          <input id="ime" name="ime" className="input" required />
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="password">
            Početna lozinka
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="role">
            Uloga
          </label>
          <select id="role" name="role" className="input" defaultValue="VOZAC">
            <option value="VOZAC">Vozač</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>
      </div>

      {state?.message && (
        <p
          className="text-sm"
          style={{
            color:
              state.message === "Korisnik dodan."
                ? "var(--green)"
                : "var(--red)",
          }}
        >
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Dodavanje..." : "Dodaj korisnika"}
      </button>
    </form>
  );
}
