import { getCurrentUser } from "@/lib/dal";
import { PLAN_NAZIVI } from "@/lib/planovi";
import LozinkaForm from "./LozinkaForm";

export default async function PostavkePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="display text-2xl">Postavke</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Vaš račun i sigurnost.
        </p>
      </div>

      <div className="card p-6">
        <div className="text-sm">{user.ime}</div>
        <div className="text-xs mono mt-1" style={{ color: "var(--muted)" }}>
          {user.email}
        </div>
        <div className="text-xs mt-3" style={{ color: "var(--muted)" }}>
          {user.company.naziv} · plan {PLAN_NAZIVI[user.company.plan]} ·{" "}
          {user.role === "ADMIN" ? "administrator" : "vozač"}
        </div>
      </div>

      <LozinkaForm />

      <div className="card p-6 text-sm">
        <div style={{ color: "var(--muted)" }}>Podrška</div>
        <a
          href="mailto:podrska.voznipark@gmail.com"
          className="mono mt-1 block"
          style={{ color: "var(--blue)" }}
        >
          podrska.voznipark@gmail.com
        </a>
      </div>
    </div>
  );
}
