// Mjeri koliko traju upiti najprometnijih stranica na realnom opterećenju
// (30 vozila × 5 godina točenja). Pokretanje: npx tsx scripts/load-test.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { napraviAdapter } from "../src/lib/db-adapter";
import { svaUpozorenja } from "../src/lib/upozorenja";

const prisma = new PrismaClient({ adapter: napraviAdapter() });

const BROJ_VOZILA = 30;
const TOCENJA_PO_VOZILU = 500;
const ID = "load-test-co";

async function ocisti() {
  await prisma.company.deleteMany({ where: { id: ID } });
}

async function napuni() {
  const firma = await prisma.company.create({
    data: {
      id: ID,
      naziv: "Load Test d.o.o.",
      plan: "ENTERPRISE",
      pretplataDo: new Date(Date.now() + 30 * 86400000),
      naPocetnomProbnom: false,
    },
  });

  for (let v = 0; v < BROJ_VOZILA; v++) {
    const vozilo = await prisma.vehicle.create({
      data: {
        companyId: firma.id,
        naziv: `Vozilo ${v + 1}`,
        registracija: `ZD ${String(v + 1).padStart(3, "0")}-LT`,
        trenutniKm: TOCENJA_PO_VOZILU * 500,
        registracijaDo: new Date(Date.now() + 20 * 86400000),
      },
    });

    const tocenja = Array.from({ length: TOCENJA_PO_VOZILU }, (_, i) => ({
      vehicleId: vozilo.id,
      datum: new Date(Date.now() - (TOCENJA_PO_VOZILU - i) * 3 * 86400000),
      kmStanje: (i + 1) * 500,
      litre: 40 + (i % 10),
      ukupnaCijena: 62 + (i % 10),
      punSpremnik: i % 3 !== 0,
      napomena: "load test zapis s nešto teksta da red bude realne veličine",
    }));
    await prisma.fuelEntry.createMany({ data: tocenja });

    await prisma.tireChange.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        vehicleId: vozilo.id,
        datum: new Date(Date.now() - i * 180 * 86400000),
        vrsta: (i % 2 === 0 ? "ZIMSKE" : "LJETNE") as "ZIMSKE" | "LJETNE",
      })),
    });
  }
}

async function mjeri(naziv: string, fn: () => Promise<unknown>) {
  // Prvi prolaz zagrijava plan cache, mjeri se drugi.
  await fn();
  const t0 = performance.now();
  await fn();
  const ms = performance.now() - t0;
  const oznaka = ms < 300 ? "OK" : ms < 1000 ? "GRANICNO" : "SPORO";
  console.log(`${naziv.padEnd(46)} ${ms.toFixed(0).padStart(6)} ms   ${oznaka}`);
  return ms;
}

async function main() {
  await ocisti();
  console.log(
    `Punim ${BROJ_VOZILA} vozila × ${TOCENJA_PO_VOZILU} točenja = ${BROJ_VOZILA * TOCENJA_PO_VOZILU} zapisa...`,
  );
  const t0 = performance.now();
  await napuni();
  console.log(`Napunjeno u ${((performance.now() - t0) / 1000).toFixed(1)} s\n`);

  console.log("UPIT                                            TRAJANJE   STATUS");
  console.log("-".repeat(70));

  await mjeri("Pregled (dashboard) — upit + izračun", async () => {
    const vozila = await prisma.vehicle.findMany({
      where: { companyId: ID, aktivno: true },
      include: {
        fuelEntries: {
          select: { kmStanje: true, litre: true, punSpremnik: true, datum: true },
        },
        zamjeneGuma: { orderBy: { datum: "desc" }, take: 1 },
      },
      orderBy: { naziv: "asc" },
    });
    return svaUpozorenja(
      vozila.map((v) => ({ ...v, zadnjaZamjenaGuma: v.zamjeneGuma[0] ?? null })),
    );
  });

  await mjeri("Detalj vozila (najviše točenja)", async () => {
    const v = await prisma.vehicle.findFirst({ where: { companyId: ID } });
    return prisma.vehicle.findFirst({
      where: { id: v!.id, companyId: ID },
      include: {
        fuelEntries: { orderBy: { kmStanje: "desc" } },
        zamjeneGuma: { orderBy: { datum: "desc" }, take: 1 },
      },
    });
  });

  await mjeri("Rokovi", () =>
    prisma.vehicle.findMany({
      where: { companyId: ID, aktivno: true },
      orderBy: { naziv: "asc" },
    }),
  );

  await mjeri("Kilometraža (100 zadnjih)", () =>
    prisma.dailyLog.findMany({
      where: { vehicle: { companyId: ID } },
      include: { vehicle: true, user: true },
      orderBy: { datum: "desc" },
      take: 100,
    }),
  );

  await mjeri("CSV izvoz (sva točenja firme)", () =>
    prisma.fuelEntry.findMany({
      where: { vehicle: { companyId: ID } },
      include: { vehicle: true, user: true },
      orderBy: { datum: "asc" },
    }),
  );

  console.log("-".repeat(70));
  await ocisti();
  console.log("\nTestni podaci obrisani.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
