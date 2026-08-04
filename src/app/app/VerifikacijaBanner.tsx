"use client";

import { useActionState } from "react";
import { ponovnoPosaljiVerifikaciju } from "@/app/actions/verifikacija";

export default function VerifikacijaBanner() {
  const [state, action, pending] = useActionState(
    async () => ponovnoPosaljiVerifikaciju(),
    undefined,
  );

  return (
    <div
      className="card p-3 mb-6 flex items-center justify-between flex-wrap gap-2 text-sm"
      style={{ borderColor: "var(--blue)" }}
    >
      <span>
        ✉ Potvrdite svoju email adresu klikom na poveznicu koju smo vam
        poslali.
        {state?.message && (
          <span style={{ color: "var(--muted)" }}> {state.message}</span>
        )}
      </span>
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-ghost text-xs"
          style={{ padding: "6px 12px" }}
        >
          {pending ? "Slanje..." : "Pošalji ponovno"}
        </button>
      </form>
    </div>
  );
}
