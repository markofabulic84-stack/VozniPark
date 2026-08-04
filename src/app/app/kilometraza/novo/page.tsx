import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import DnevnaVoznjaForm from "./DnevnaVoznjaForm";

export default async function NovaDnevnaVoznjaPage({
  searchParams,
}: {
  searchParams: Promise<{ vozilo?: string }>;
}) {
  const { vozilo } = await searchParams;
  const user = await getCurrentUser();

  const vozila = await prisma.vehicle.findMany({
    where: { companyId: user.companyId, aktivno: true },
    orderBy: { naziv: "asc" },
    select: { id: true, naziv: true, registracija: true, trenutniKm: true },
  });

  return (
    <div className="max-w-lg">
      <h1 className="display text-2xl mb-6">Nova dnevna voznja</h1>
      <DnevnaVoznjaForm vozila={vozila} odabranoId={vozilo} />
    </div>
  );
}
