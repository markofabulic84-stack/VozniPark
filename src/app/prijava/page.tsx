"use client";

import Link from "next/link";
import { useActionState } from "react";
import { prijava } from "@/app/actions/auth";

export default function PrijavaPage() {
  const [state, action, pending] = useActionState(prijava, undefined);

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
          <h1 className="display text-2xl mt-4">Prijava</h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
            Prijavite se u svoj poslovni račun.
          </p>
        </div>

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
            <p className="text-xs mt-2">
              <Link
                href="/zaboravljena-lozinka"
                style={{ color: "var(--muted)" }}
              >
                Zaboravljena lozinka?
              </Link>
            </p>
          </div>

          {state?.message && <p className="error-text">{state.message}</p>}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary w-full"
          >
            {pending ? "Prijava u tijeku..." : "Prijavi se"}
          </button>
        </form>

        <p
          className="text-center text-sm mt-6"
          style={{ color: "var(--muted)" }}
        >
          Nemate račun?{" "}
          <Link href="/registracija" style={{ color: "var(--blue)" }}>
            Registrirajte firmu
          </Link>
        </p>
      </div>
    </main>
  );
}
