// Lokalni PostgreSQL bez Homebrewa/sudo — koristi embedded-postgres (pravi
// postgres binarni fajl kao npm paket). Podaci se čuvaju u .pgdata/ pa
// ostaju između pokretanja. Pokrenuti u zasebnom terminalu prije "npm run dev".
import EmbeddedPostgres from "embedded-postgres";

const PORT = 55432;
const DB = "voznipark";

const pg = new EmbeddedPostgres({
  databaseDir: ".pgdata",
  user: "voznipark",
  password: "voznipark",
  port: PORT,
  persistent: true,
});

async function main() {
  try {
    await pg.initialise();
  } catch {
    // već inicijalizirano u prijašnjem pokretanju — u redu je.
  }
  await pg.start();
  try {
    await pg.createDatabase(DB);
  } catch {
    // baza već postoji — u redu je.
  }
  console.log(
    `\nPostgreSQL radi na 127.0.0.1:${PORT}/${DB}\n` +
      `DATABASE_URL="postgresql://voznipark:voznipark@127.0.0.1:${PORT}/${DB}"\n\n` +
      "Ctrl+C zaustavlja bazu.",
  );
}

let zaustavljanje = false;
async function ugasi() {
  if (zaustavljanje) return;
  zaustavljanje = true;
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", ugasi);
process.on("SIGTERM", ugasi);

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
