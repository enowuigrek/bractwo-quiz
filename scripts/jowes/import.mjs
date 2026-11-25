// Import danych z `eksport.mjs` do NOWEJ bazy Supabase (25.11, docs/JOWES-WDROZENIE.md). Baza musi już mieć schemat
// (tabele, funkcje, wyzwalacze ze zrzutu bazy Bractwa). Skrypt:
// - zakłada bucket `grafiki` (jeśli go nie ma) i wgrywa do niego pliki z eksportu pod tymi samymi ścieżkami,
// - podmienia w danych adresy plików ze starej bazy na nową,
// - wstawia wiersze z tymi samymi id (upsert po `id`, więc można go puścić drugi raz),
// - autora quizu albo gry, którego konta nie ma w eksporcie (np. twórca z Bractwa), zostawia pustego.
//
// Uruchamianie (adres i klucz NOWEJ bazy tylko w poleceniu, nie w plikach):
//   node scripts/jowes/import.mjs ../jowes-eksport --na-sucho
//       sam plan: co i ile trafi do bazy, bez łączenia z nią
//   CEL_SUPABASE_URL=https://<nowy>.supabase.co CEL_SUPABASE_SECRET_KEY=<klucz> \
//     node scripts/jowes/import.mjs ../jowes-eksport --na-sucho
//       sprawdza połączenie, tabele i bucket w nowej bazie, nic nie zapisuje
//   CEL_SUPABASE_URL=… CEL_SUPABASE_SECRET_KEY=… node scripts/jowes/import.mjs ../jowes-eksport
//       właściwy import

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const argumenty = process.argv.slice(2);
const naSucho = argumenty.includes("--na-sucho");
const katalog = argumenty.find((a) => !a.startsWith("--"));
if (!katalog) {
  console.error("Podaj katalog z eksportem, np. ../jowes-eksport");
  process.exit(1);
}
const dane = JSON.parse(await readFile(path.join(katalog, "dane.json"), "utf8"));
const CEL_URL = process.env.CEL_SUPABASE_URL?.replace(/\/$/, "");
const CEL_KLUCZ = process.env.CEL_SUPABASE_SECRET_KEY;
const BUCKET = "grafiki";
const znacznik = (url) => `${url}/storage/v1/object/public/${BUCKET}/`;

if (CEL_URL && (CEL_URL === dane.zrodlo.replace(/\/$/, "") || CEL_URL === process.env.NEXT_PUBLIC_SUPABASE_URL)) {
  console.error("Docelowa baza to ta sama baza, z której był eksport. Import tylko do NOWEJ bazy.");
  process.exit(1);
}
if (!naSucho && (!CEL_URL || !CEL_KLUCZ)) {
  console.error("Brak CEL_SUPABASE_URL albo CEL_SUPABASE_SECRET_KEY (nowa baza). Bez nich tylko --na-sucho.");
  process.exit(1);
}

// --- przygotowanie danych (bez bazy) ---------------------------------------------------------------------------
const stary = znacznik(dane.zrodlo.replace(/\/$/, ""));
const nowy = CEL_URL ? znacznik(CEL_URL) : stary;
/** Kopia tabel z podmienionymi adresami plików (w każdym napisie, także w JSON-ie `zadania.dane`). */
const tabele = JSON.parse(JSON.stringify(dane.tabele), (_, w) =>
  typeof w === "string" ? w.split(stary).join(nowy) : w,
);

const konta = new Set(tabele.konta.map((k) => k.id));
const lokale = new Set(tabele.lokale.map((l) => l.id));
let bezAutora = 0;
for (const t of ["quizy", "sesje"]) {
  for (const w of tabele[t]) {
    if (w.autor_konto_id && !konta.has(w.autor_konto_id)) {
      w.autor_konto_id = null;
      bezAutora++;
    }
  }
}
// rola lokalu spoza eksportu nie ma do czego wskazywać
const roleWszystkie = tabele.konta_role.length;
tabele.konta_role = tabele.konta_role.filter((r) => !r.lokal_id || lokale.has(r.lokal_id));

console.log(`Import marki ${dane.marka} z eksportu ${dane.utworzono} (${dane.zrodlo})`);
console.log(`  do: ${CEL_URL ?? "(nie podano, sam plan)"}${naSucho ? " [na sucho]" : ""}`);
for (const [t, w] of Object.entries(tabele)) console.log(`  ${t}: ${w.length}`);
console.log(`  pliki: ${dane.pliki.length}`);
if (bezAutora) console.log(`  autor spoza eksportu → pusty: ${bezAutora}`);
if (roleWszystkie !== tabele.konta_role.length)
  console.log(`  pominięte role lokali spoza eksportu: ${roleWszystkie - tabele.konta_role.length}`);
if (!CEL_URL) process.exit(0);

// --- nowa baza ---------------------------------------------------------------------------------------------------
const db = createClient(CEL_URL, CEL_KLUCZ, { auth: { persistSession: false } });

// schemat musi już być: każda tabela odpowiada
for (const t of Object.keys(tabele)) {
  const { error } = await db.from(t).select("id", { head: true, count: "exact" });
  if (error) {
    console.error(`W nowej bazie brak tabeli ${t} albo dostępu do niej (${error.message}). Najpierw wgraj schemat.`);
    process.exit(1);
  }
}
const { data: bucket } = await db.storage.getBucket(BUCKET);
console.log(`  bucket ${BUCKET}: ${bucket ? "jest" : "do założenia"}`);
if (naSucho) {
  console.log("Na sucho: nowa baza odpowiada, nic nie zapisano.");
  process.exit(0);
}

if (!bucket) {
  const { error } = await db.storage.createBucket(BUCKET, dane.bucket ?? { public: true });
  if (error) throw new Error(`Nie udało się założyć bucketu: ${error.message}`);
}
const TYPY = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
};
for (const s of dane.pliki) {
  const zawartosc = await readFile(path.join(katalog, "pliki", s));
  const typ = TYPY[s.split(".").pop().toLowerCase()] ?? "application/octet-stream";
  const { error } = await db.storage.from(BUCKET).upload(s, zawartosc, { upsert: true, contentType: typ });
  if (error) throw new Error(`Plik ${s}: ${error.message}`);
}
console.log(`  wgrane pliki: ${dane.pliki.length}`);

for (const [t, wiersze] of Object.entries(tabele)) {
  for (let i = 0; i < wiersze.length; i += 500) {
    const { error } = await db.from(t).upsert(wiersze.slice(i, i + 500), { onConflict: "id" });
    if (error) throw new Error(`${t}: ${error.message}`);
  }
  console.log(`  ${t}: wstawione ${wiersze.length}`);
}
console.log("Gotowe. Sprawdź w panelu nowego wdrożenia lokal, quizy i gry.");
