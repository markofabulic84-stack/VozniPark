import "server-only";
import { appendFile, mkdir } from "fs/promises";
import path from "path";

type Poruka = {
  to: string;
  subject: string;
  text: string;
};

const FROM = process.env.EMAIL_FROM ?? "VozniPark <noreply@voznipark.hr>";
const OUTBOX = path.join(process.cwd(), "mail-outbox");

// Bez SMTP_URL-a (lokalni razvoj) poruke se ne šalju nego zapisuju u
// mail-outbox/ i konzolu, pa se tok (reset lozinke, podsjetnici) može
// testirati bez mail servera. U produkciji postavite SMTP_URL, npr.
// smtp://user:pass@smtp.example.com:587
export async function posaljiEmail(poruka: Poruka): Promise<void> {
  if (process.env.SMTP_URL) {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport(process.env.SMTP_URL);
    await transport.sendMail({ from: FROM, ...poruka });
    return;
  }

  const zapis = [
    `Datum: ${new Date().toISOString()}`,
    `Od: ${FROM}`,
    `Za: ${poruka.to}`,
    `Naslov: ${poruka.subject}`,
    "",
    poruka.text,
    "\n----------------------------------------\n",
  ].join("\n");

  await mkdir(OUTBOX, { recursive: true });
  await appendFile(path.join(OUTBOX, "outbox.txt"), zapis, "utf8");
  console.log(`[email → ${poruka.to}] ${poruka.subject}\n${poruka.text}`);
}
