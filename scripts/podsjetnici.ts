// Dnevni podsjetnici na rokove (servis / registracija / osiguranje).
// Pokretanje: npm run podsjetnici   (iz crona na klasičnom serveru; na
// Vercelu isti posao radi Vercel Cron kroz /api/podsjetnici rutu)
import "dotenv/config";
import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { napraviAdapter } from "../src/lib/db-adapter";
import { pripremiPodsjetnike } from "../src/lib/podsjetnici-core";

const prisma = new PrismaClient({ adapter: napraviAdapter() });

const FROM = process.env.EMAIL_FROM ?? "VozniPark <noreply@voznipark.hr>";

// Ista logika kao src/lib/email.ts, ali bez "server-only" oznake jer se
// skripta pokreće izravno node-om, izvan Next.js servera.
async function posaljiEmail(poruka: { to: string; subject: string; text: string }) {
  if (process.env.SMTP_URL) {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport(process.env.SMTP_URL);
    await transport.sendMail({ from: FROM, ...poruka });
    return;
  }
  const outbox = path.join(process.cwd(), "mail-outbox");
  await mkdir(outbox, { recursive: true });
  await appendFile(
    path.join(outbox, "outbox.txt"),
    `Datum: ${new Date().toISOString()}\nOd: ${FROM}\nZa: ${poruka.to}\nNaslov: ${poruka.subject}\n\n${poruka.text}\n\n----------------------------------------\n\n`,
    "utf8",
  );
  console.log(`[email → ${poruka.to}] ${poruka.subject}`);
}

async function main() {
  const poruke = await pripremiPodsjetnike(prisma);
  for (const poruka of poruke) {
    await posaljiEmail(poruka);
  }
  console.log(`Gotovo — poslano ${poruke.length} podsjetnika.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
