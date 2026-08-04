import { zahtijevajAdmina } from "@/lib/dal";
import NovoVoziloForm from "./NovoVoziloForm";

export default async function NovoVoziloPage() {
  await zahtijevajAdmina();

  return (
    <div className="max-w-lg">
      <h1 className="display text-2xl mb-6">Dodaj vozilo</h1>
      <NovoVoziloForm />
    </div>
  );
}
