import Link from "next/link";
import { zahtijevajAdmina } from "@/lib/dal";
import { imaZnacajku } from "@/lib/planovi";
import UvozForm from "./UvozForm";

export default async function UvozPage() {
  const admin = await zahtijevajAdmina();

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="display text-2xl">Uvoz podataka</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Prenesite postojeću Excel evidenciju točenja goriva u VozniPark.
        </p>
      </div>
      {imaZnacajku(admin.company, "csv_uvoz") ? (
        <UvozForm />
      ) : (
        <div className="card p-6 text-sm" style={{ color: "var(--muted)" }}>
          Uvoz iz Excel/CSV dostupan je samo na Enterprise planu.{" "}
          <Link href="/pretplata" className="mono" style={{ color: "var(--blue)" }}>
            Nadogradi plan →
          </Link>
        </div>
      )}
    </div>
  );
}
