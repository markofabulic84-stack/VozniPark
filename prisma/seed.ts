import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { napraviAdapter } from "../src/lib/db-adapter";

const prisma = new PrismaClient({ adapter: napraviAdapter() });

async function main() {
  const passwordHash = await bcrypt.hash("lozinka123", 10);

  const company = await prisma.company.create({
    data: {
      naziv: "Prijevoz Zadar d.o.o.",
      plan: "PRO",
      pretplataDo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      // Demo firma prikazuje stvarna Pro ograničenja, ne "sve otvoreno"
      // probnog perioda.
      naPocetnomProbnom: false,
    },
  });

  await prisma.user.create({
    data: {
      companyId: company.id,
      ime: "Ante Perić",
      email: "admin@vozni-park.hr",
      passwordHash,
      role: "ADMIN",
      emailVerificiranAt: new Date(),
    },
  });

  const vozac = await prisma.user.create({
    data: {
      companyId: company.id,
      ime: "Marin Vozač",
      email: "vozac@vozni-park.hr",
      passwordHash,
      role: "VOZAC",
      emailVerificiranAt: new Date(),
    },
  });

  const uDana = (dani: number) => new Date(Date.now() + dani * 24 * 60 * 60 * 1000);

  const kangoo = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      naziv: "Renault Kangoo",
      registracija: "ZD 118-DP",
      trenutniKm: 11000,
      registracijaDo: uDana(25),
      fuelEntries: {
        create: [
          { datum: uDana(-40), kmStanje: 10000, litre: 40, ukupnaCijena: 62, punSpremnik: true, userId: vozac.id },
          { datum: uDana(-25), kmStanje: 10200, litre: 15, ukupnaCijena: 23, punSpremnik: false, userId: vozac.id },
          { datum: uDana(-15), kmStanje: 10500, litre: 20, ukupnaCijena: 31, punSpremnik: true, userId: vozac.id },
          { datum: uDana(-2), kmStanje: 11000, litre: 35, ukupnaCijena: 54, punSpremnik: true, userId: vozac.id },
        ],
      },
    },
  });

  const dokker = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      naziv: "Dacia Dokker",
      registracija: "ZD 233-MZ",
      trenutniKm: 20500,
      osiguranjeDo: uDana(-10),
      fuelEntries: {
        create: [
          { datum: uDana(-30), kmStanje: 20000, litre: 40, ukupnaCijena: 62, punSpremnik: true, userId: vozac.id },
          { datum: uDana(-5), kmStanje: 20500, litre: 33, ukupnaCijena: 51, punSpremnik: true, userId: vozac.id },
        ],
      },
    },
  });

  const transit = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      naziv: "Ford Transit",
      registracija: "ZD 421-KL",
      trenutniKm: 5500,
      referentnaPotrosnja: 9.0,
      fuelEntries: {
        create: [
          { datum: uDana(-20), kmStanje: 5000, litre: 90, ukupnaCijena: 139, punSpremnik: true, userId: vozac.id },
          { datum: uDana(-3), kmStanje: 5500, litre: 53, ukupnaCijena: 82, punSpremnik: true, userId: vozac.id },
        ],
      },
    },
  });

  const iveco = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      naziv: "Iveco Daily",
      registracija: "ZD 902-BT",
      trenutniKm: 45000,
      sljedeciServisKm: 45330,
      fuelEntries: {
        create: [
          { datum: uDana(-18), kmStanje: 44500, litre: 60, ukupnaCijena: 93, punSpremnik: true, userId: vozac.id },
          { datum: uDana(-4), kmStanje: 45000, litre: 55, ukupnaCijena: 85, punSpremnik: true, userId: vozac.id },
        ],
      },
    },
  });

  console.log("Seed gotov:", { company: company.naziv, vozila: [kangoo.naziv, dokker.naziv, transit.naziv, iveco.naziv] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
