"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registracija } from "@/app/actions/auth";

export default function RegistracijaPage() {
  const [state, action, pending] = useActionState(registracija, undefined);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="mono text-sm"
            style={{ color: "var(--blue)" }}
          >
            &lt;/&gt; VozniPark
          </Link>
          <h1 className="display text-2xl mt-4">Registracija firme</h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
            Prvih 5 vozila besplatno, bez kartice.
          </p>
        </div>

        <form action={action} className="card p-6 flex flex-col gap-5">
          <div>
            <label className="field-label" htmlFor="firma">
              Naziv firme
            </label>
            <input
              id="firma"
              name="firma"
              type="text"
              className="input"
              placeholder="npr. Prijevoz Zadar d.o.o."
              required
            />
            {state?.errors?.firma && (
              <p className="error-text">{state.errors.firma[0]}</p>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor="ime">
              Vaše ime
            </label>
            <input
              id="ime"
              name="ime"
              type="text"
              className="input"
              placeholder="Ime i prezime"
              required
            />
            {state?.errors?.ime && (
              <p className="error-text">{state.errors.ime[0]}</p>
            )}
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
              placeholder="vasa@firma.com"
              required
            />
            {state?.errors?.email && (
              <p className="error-text">{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              Lozinka
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              required
            />
            {state?.errors?.password && (
              <p className="error-text">{state.errors.password[0]}</p>
            )}
          </div>

          {state?.message && <p className="error-text">{state.message}</p>}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary w-full"
          >
            {pending ? "Kreiranje računa..." : "Registriraj firmu"}
          </button>
        </form>

        <p
          className="text-center text-sm mt-6"
          style={{ color: "var(--muted)" }}
        >
          Već imate račun?{" "}
          <Link href="/prijava" style={{ color: "var(--blue)" }}>
            Prijavite se
          </Link>
        </p>
      </div>
    </main>
  );
}
