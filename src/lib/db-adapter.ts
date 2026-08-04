// PostgreSQL je jedini podržani provider (i lokalno i u produkciji) —
// Prisma 7 peče SQL dijalekt u generirani query compiler prema
// `datasource.provider` iz schema.prisma u trenutku "prisma generate", pa
// prebacivanje adaptera po DATABASE_URL u runtimeu NE bi radilo (klijent
// generiran za sqlite ne zna generirati ispravan Postgres SQL, i obrnuto).
// Lokalno se koristi embedded-postgres (scripts/pg-local.ts) da razvoj i
// produkcija dijele isti dijalekt bez potrebe za vanjskim računom/Homebrewom.
import { PrismaPg } from "@prisma/adapter-pg";
import type { SqlDriverAdapterFactory } from "@prisma/driver-adapter-utils";

export function napraviAdapter(): SqlDriverAdapterFactory {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL nije postavljen. Lokalno: pokrenite `npm run db:local` " +
        "u zasebnom terminalu i postavite DATABASE_URL iz njegovog ispisa.",
    );
  }
  return new PrismaPg({ connectionString: url });
}
