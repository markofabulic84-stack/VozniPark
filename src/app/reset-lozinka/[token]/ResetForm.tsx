"use client";

import Link from "next/link";
import { useActionState } from "react";
import { postaviNovuLozinku } from "@/app/actions/lozinka";

export default function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(postaviNovuLozinku, undefined);

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="field-label" htmlFor="password">
          Nova lozinka
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          minLength={8}
          required
        />
      </div>
      {state?.message && (
        <div>
          <p className="error-text">{state.message}</p>
          <p className="text-sm mt-2">
            <Link href="/zaboravljena-lozinka" style={{ color: "var(--blue)" }}>
              Zatraži novu poveznicu
            </Link>
          </p>
        </div>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Spremanje..." : "Postavi novu lozinku"}
      </button>
    </form>
  );
}
