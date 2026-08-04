import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { imaZnacajku } from "@/lib/planovi";
import ZamjenaGumaForm from "./ZamjenaGumaForm";

export default async function NovaZamjenaGumaPage({
  searchParams,
}: {
  searchParams: Promise<{ vozilo?: string }>;
}) {
  const { vozilo } = await searchParams;
  const user = await getCurrentUser();

  if (!imaZnacajku(user.company, "gume")) {
    redirect("/app/gume");
  }

  const vozila = await prisma.vehicle.findMany({
    where: { companyId: user.companyId, aktivno: true },
    orderBy: { naziv: "asc" },
    select: { id: true, naziv: true, registracija: true, trenutniKm: true },
  });

  return (
    <div className="max-w-lg">
      <h1 className="display text-2xl mb-6">Zabilježi zamjenu guma</h1>
      <ZamjenaGumaForm vozila={vozila} odabranoId={vozilo} />
    </div>
  );
}
