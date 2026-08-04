# VozniPark

Multi-tenant web aplikacija za praćenje voznog parka: potrošnja goriva
(puno-u-puno), rokovi (servis / registracija / osiguranje), dnevna
kilometraža, zamjena ljetnih/zimskih guma, OCR računa, CSV izvoz i pretplate
po firmi.

## Uloge

- **Administrator**: sve, uključujući dodavanje/uređivanje/deaktiviranje
  vozila, korisnike, uvoz podataka
- **Vozač**: unos točenja goriva, dnevne kilometraže i zamjene guma;
  pregled vozila bez mogućnosti uređivanja

## Pokretanje (lokalno)

Baza je PostgreSQL (isti dijalekt lokalno i u produkciji — Prisma peče SQL
dijalekt u generirani klijent u trenutku `prisma generate`, pa SQLite
lokalno + Postgres u produkciji ne bi ispravno radilo). Lokalno se koristi
`embedded-postgres` — pravi Postgres binarni fajl kao npm paket, bez
Homebrewa ili sudo prava.

```bash
npm install
npm run db:local   # u zasebnom terminalu — pokreće lokalni Postgres, ispisuje DATABASE_URL
```

Kopirajte ispisani `DATABASE_URL` u `.env` (ili iskopirajte `.env.example`
u `.env` — zadana vrijednost već odgovara `db:local` postavkama), pa u
drugom terminalu:

```bash
npx prisma migrate dev   # kreira tablice
npm run db:seed          # demo firma + 4 vozila
npm run dev              # http://localhost:3000
```

Demo prijava: `admin@vozni-park.hr` / `lozinka123` (administrator) ili
`vozac@vozni-park.hr` / `lozinka123` (vozač).

## Skripte

| Naredba | Opis |
| --- | --- |
| `npm run dev` | razvojni server |
| `npm run build` | produkcijski build (`postinstall` prije toga pokreće `prisma generate`) |
| `npm test` | vitest testovi poslovne logike |
| `npm run test:e2e` | Playwright E2E testovi kroz pravi preglednik (koristi već pokrenut `npm run dev` ako postoji) |
| `npm run lint` | ESLint |
| `npm run db:local` | lokalni PostgreSQL (embedded-postgres), pokrenuti u zasebnom terminalu prije rada |
| `npm run db:seed` | demo podaci |
| `npm run podsjetnici` | slanje email podsjetnika na rokove (za cron na klasičnom serveru — na Vercelu to radi `/api/podsjetnici` kroz `vercel.json`) |

## Konfiguracija (.env)

Predložak je u `.env.example`.

| Varijabla | Opis |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (lokalno iz `npm run db:local`; u produkciji iz Neon/Vercel Postgres) |
| `SESSION_SECRET` | tajni ključ za JWT sesije — generirati `openssl rand -base64 32`, različit po okruženju |
| `SMTP_URL` | npr. `smtp://user:pass@smtp.example.com:587` — bez ove varijable emailovi se zapisuju u `mail-outbox/outbox.txt` umjesto slanja |
| `EMAIL_FROM` | adresa pošiljatelja (zadano `VozniPark <noreply@voznipark.hr>`) |
| `APP_URL` | javni URL aplikacije, koristi se u email, Creem i Stripe poveznicama |
| `CREEM_API_KEY` / `CREEM_WEBHOOK_SECRET` / `CREEM_PRODUCT_STARTER` / `CREEM_PRODUCT_PRO` | s njima gumb "Produži pretplatu" vodi na Creem Checkout — ima prioritet nad Stripeom; bez njih pokušava Stripe, pa simulaciju. Testni ključ (`creem_test_…`) automatski gađa `test-api.creem.io` |
| `STRIPE_SECRET_KEY` | koristi se samo ako Creem nije postavljen; s njim gumb "Produži pretplatu" vodi na pravi Stripe Checkout, bez njega (i bez Creema) je naplata simulirana (samo za razvoj!) |
| `BLOB_READ_WRITE_TOKEN` | s njim se slike računa spremaju na Vercel Blob; bez njega idu na lokalni disk (ne radi na Vercelu) — postavlja se automatski kad se Blob store poveže s projektom |
| `CRON_SECRET` | štiti `/api/podsjetnici` da je ne može okinuti bilo tko izvana; Vercel ga automatski šalje uz Cron pozive kad je postavljen |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | s njima je uključeno praćenje grešaka (Sentry) na serveru/edge odnosno u pregledniku; bez njih ostaje isključeno |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | opcionalno, samo za automatski upload source mapova prilikom builda |

## Pretplata

Svaka firma dobiva 30 dana probnog perioda pri registraciji
(`Company.pretplataDo`). Nakon isteka sve stranice i akcije unutar `/app`
preusmjeravaju na `/pretplata`, gdje administrator produžuje pretplatu.
Podaci firme se ne brišu.

### Naplata: Creem ili Stripe

Dva naplatna posrednika, s prioritetom Creem → Stripe → simulacija:

- **Creem** (`src/lib/creem.ts`) je *Merchant of Record* — oni su pravno
  prodavatelj i vode PDV/porez, pa primaju pojedince bez registrirane firme.
  Proizvodi su **recurring (mjesečni)**: svaka uspješna naplata produljuje
  `pretplataDo`, a otkazivanje se namjerno ne obrađuje — pretplata istekne
  na datum do kojeg je plaćena i aplikacija se sama zaključa.
  Postavite `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET` i
  `CREEM_PRODUCT_STARTER`/`_PRO`. Potvrda plaćanja stiže **push webhookom**
  na `/api/webhook/creem` (`checkout.completed` za prvu uplatu i
  `subscription.paid` za obnove; HMAC-SHA256 potpis u `creem-signature`
  headeru provjerava `src/lib/creem-potpis.ts`) — radi pouzdano i ako
  korisnik zatvori tab prije povratka na `/pretplata`. `CreemUplata` tablica
  ključana ID-em eventa sprječava dvostruku obradu retry webhooka.
- **Stripe Checkout** (`src/lib/stripe.ts`) koristi se samo ako Creem nije
  postavljen — zahtijeva registriranu firmu za Stripe ugovor, pa dolazi u
  obzir tek nakon osnivanja pravnog subjekta. Jednokratna naplata (30 dana);
  povratna ruta `/api/stripe-potvrda` provjerava status plaćanja izravno na
  Stripe API-ju i idempotentna je (`StripeUplata` tablica).

**Bez ijednog ključa naplata je simulirana i to je izričito označeno u
sučelju — ne puštati u produkciju bez ključa.**

Live naplata na Creemu radi tek nakon verifikacije računa (dashboard →
Balances → Payout Account); do tada koristiti testni ključ.

## Sigurnost

- Rate limiting (u bazi, radi i na serverless okruženjima): prijava 5
  pokušaja / 15 min po IP+email, registracija 5/h po IP-u, reset lozinke
  5/h po IP-u, ponovno slanje verifikacije 3/h
- Promjena lozinke poništava sve postojeće sesije korisnika
  (`User.sessionVersion` u JWT payloadu, provjera u DAL-u)
- Registracija šalje email s poveznicom za potvrdu adrese (24 h); dok
  adresa nije potvrđena aplikacija prikazuje banner s opcijom ponovnog
  slanja
- Reset tokeni se čuvaju kao SHA-256 hash, jednokratni su i vremenski
  ograničeni; odgovor na zahtjev za reset ne otkriva postoji li račun
- Prijavljeni korisnik može promijeniti lozinku u `/app/postavke` — poništava
  sesije na svim ostalim uređajima, ovaj uređaj ostaje prijavljen

## Praćenje grešaka (Sentry)

Bez `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` praćenje je isključeno (isti obrazac
kao Stripe/SMTP — uključi se dodavanjem env varijable, bez promjene koda).
Postavljanje: besplatan projekt na [sentry.io](https://sentry.io), Next.js
platforma, kopirati DSN u oba varijable (`NEXT_PUBLIC_` inačica je obavezna da
bi Next.js vrijednost ugradio u kod za preglednik). Server/edge inicijalizacija
je u `src/instrumentation.ts`, preglednik u `src/instrumentation-client.ts`.

## Deploy na Vercel

1. **Baza**: kreirati besplatnu PostgreSQL bazu (Vercel Postgres ili Neon —
   oba se dodaju izravno iz Vercel dashboarda) i postaviti `DATABASE_URL`,
   pa `npx prisma migrate deploy` (jednom, s produkcijskim `DATABASE_URL`-om)
2. **Slike računa**: dodati Vercel Blob store projektu — `BLOB_READ_WRITE_TOKEN`
   se postavlja automatski, kod ga već koristi kad postoji
   (`src/app/api/racun/route.ts`)
3. **OCR**: ruta ima `maxDuration = 60`; na Hobby planu maksimalni limit
   funkcije je ionako niži (provjeriti trenutna Vercel ograničenja) — ako
   OCR treperi na sporijim slikama, Pro plan ili prebacivanje OCR-a u
   preglednik (tesseract.js radi i client-side) rješava to
4. **Podsjetnici**: `vercel.json` već definira dnevni Cron na
   `/api/podsjetnici` (07:00) — postaviti `CRON_SECRET` da ruta prihvaća
   samo Vercelove pozive
5. **Emailovi**: postaviti `SMTP_URL` (ili zamijeniti `src/lib/email.ts`
   providerom poput Resend/Postmark)
6. **`SESSION_SECRET`**: generirati novi za produkciju, različit od lokalnog
7. **Naplata**: postaviti Creem env varijable (vidi tablicu gore), pa u
   Creem dashboardu (Developers → Webhook) dodati webhook na
   `{APP_URL}/api/webhook/creem` za `checkout.completed` i
   `subscription.paid` evente, s istim secretom kao `CREEM_WEBHOOK_SECRET`
8. **Sentry** (opcionalno, ali preporučeno): postaviti `SENTRY_DSN` i
   `NEXT_PUBLIC_SENTRY_DSN` da se produkcijske greške vide bez čekanja da ih
   korisnik prijavi

Rate limiting i idempotencija naplate (Creem/Stripe) namjerno idu
kroz bazu (ne memoriju), pa rade ispravno i kad Vercel istovremeno vrti više
instanci funkcije.

## Performanse

`npx tsx scripts/load-test.ts` puni bazu s 30 vozila × 500 točenja (gornja
granica ciljane veličine flote, ~5 godina rada) i mjeri upite najprometnijih
stranica. Referentne vrijednosti na lokalnom Postgresu:

| Upit | Trajanje |
| --- | --- |
| Pregled (dashboard) | ~120 ms |
| Detalj vozila | ~10 ms |
| Rokovi | ~2 ms |
| Kilometraža | ~5 ms |
| CSV izvoz (15.000 zapisa) | ~350 ms |

Na upravljanoj bazi (Neon) očekivati 2–3× više zbog mrežnog puta. Ako
dashboard ikad pređe ~1 s, prvo mjesto za pogledati je `referentnaPotrosnja`
u `src/lib/potrosnja.ts` — ona prosječuje **sve** dosadašnje intervale, pa
dashboard mora učitati cijelu povijest točenja. Ograničavanje na klizni
prozor (npr. zadnjih 12 mjeseci) riješilo bi to, ali mijenja izračunatu
referentnu vrijednost, pa nije napravljeno bez potrebe.

## CI

`.github/workflows/ci.yml` na svaki push/PR pokreće lint, vitest, build i
Playwright E2E testove uz efemerni Postgres servisni kontejner (GitHub
Actions), odvojen od baze korištene za razvoj ili produkciju.

## E2E testovi

`e2e/*.spec.ts` — svaki test sam registrira svoju firmu (jedinstveni email po
pokretanju), pa ne ovisi o `npm run db:seed` niti ostavlja podatke koji smetaju
sljedećem pokretanju. Pokrivaju: registraciju/prijavu/odjavu, limiter prijave
(6. pogrešan pokušaj blokiran), izolaciju podataka između firmi, dodavanje
vozila + dva puna točenja + automatski izračun potrošnje s upozorenjem, i
promjenu lozinke (stara prestaje raditi, trenutni uređaj ostaje prijavljen).
`src/app/api/test/ocisti-rate-limit/route.ts` čisti limiter prije svakog testa
(zaključano izvan produkcije — `NODE_ENV=production` vraća 404).

## Tehnologije

Next.js 16 (App Router) · Prisma 7 + PostgreSQL · jose (JWT) · bcryptjs ·
Tailwind v4 · Zod · tesseract.js (OCR) · SheetJS (uvoz Excela) · Stripe ·
Sentry · vitest · Playwright
