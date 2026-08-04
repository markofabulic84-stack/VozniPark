import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { imaZnacajku } from "@/lib/planovi";
import TocenjeForm from "./TocenjeForm";

export default async function NovoTocenjePage({
  searchParams,
}: {
  searchParams: Promise<{ vozilo?: string }>;
}) {
  const { vozilo } = await searchParams;
  const user = await getCurrentUser();

  const vozila = await prisma.vehicle.findMany({
    where: { companyId: user.companyId, aktivno: true },
    orderBy: { naziv: "asc" },
    select: { id: true, naziv: true, registracija: true, zadanaVrstaGoriva: true },
  });

  const zadaneVrsteGoriva = Object.fromEntries(
    vozila.map((v) => [v.id, v.zadanaVrstaGoriva]),
  );

  return (
    <div className="max-w-lg">
      <h1 className="display text-2xl mb-6">Unesi točenje</h1>
      <TocenjeForm
        vozila={vozila}
        odabranoId={vozilo}
        zadaneVrsteGoriva={zadaneVrsteGoriva}
        ocrDostupan={imaZnacajku(user.company, "ocr_racuna")}
      />
    </div>
  );
}
