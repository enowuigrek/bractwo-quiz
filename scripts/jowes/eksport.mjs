// Eksport danych jednej marki (domyślnie JOWES) z bazy Bractwa do katalogu, przed przeniesieniem na osobny Supabase
// (25.11, docs/JOWES-WDROZENIE.md). Bierze wszystko z `marka = <marka>`: lokale, konta z rolami, quizy z etapami
// i pytaniami, gry z graczami, odpowiedziami i okrzykami, a do tego pliki z bucketu `grafiki`, na które wskazują.
//
// Uruchamianie (klucz z .env.local, nie trafia do repo; katalog z danymi musi być POZA repo, bo są w nim nicki,
// zdjęcia graczy i skróty haseł):
//   node --env-file=.env.local scripts/jowes/eksport.mjs ../jowes-eksport
//   node --env-file=.env.local scripts/jowes/eksport.mjs ../jowes-eksport bractwo   (inna marka)
//
// Wynik: <katalog>/dane.json (tabele w kolejności importu) i <katalog>/pliki/<ścieżka w buckecie>.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const [katalog, marka = "jowes"] = process.argv.slice(2);
const URL_BAZY = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KLUCZ = process.env.SUPABASE_SECRET_KEY;
if (!katalog) {
  console.error("Podaj katalog na eksport (poza repo), np. ../jowes-eksport");
  process.exit(1);
}
if (!URL_BAZY || !KLUCZ) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL albo SUPABASE_SECRET_KEY (uruchom z --env-file=.env.local).");
  process.exit(1);
}
const cel = path.resolve(katalog);
if (!path.relative(process.cwd(), cel).startsWith("..")) {
  console.error(`Katalog ${cel} jest w repo. Dane osobowe nie mogą trafić do repo: podaj katalog poza nim.`);
  process.exit(1);
}

const db = createClient(URL_BAZY, KLUCZ, { auth: { persistSession: false } });
const BUCKET = "grafiki";
const ZNACZNIK = `/storage/v1/object/public/${BUCKET}/`;

/** Wszystkie wiersze zapytania, stronami po 1000 (limit PostgREST). */
async function wszystkie(tabela, filtr) {
  const wiersze = [];
  for (let od = 0; ; od += 1000) {
    const { data, error } = await filtr(db.from(tabela).select("*"))
      .order("id")
      .range(od, od + 999);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    wiersze.push(...data);
    if (data.length < 1000) return wiersze;
  }
}

/** Wiersze, których kolumna jest na liście (pusta lista = brak wierszy). */
const wedlug = (tabela, kolumna, ids) => (ids.length ? wszystkie(tabela, (q) => q.in(kolumna, ids)) : []);
const idy = (wiersze) => wiersze.map((w) => w.id);

const lokale = await wszystkie("lokale", (q) => q.eq("marka", marka));
const konta = await wszystkie("konta", (q) => q.eq("marka", marka));
const kontaRole = await wedlug("konta_role", "konto_id", idy(konta));
const quizy = await wszystkie("quizy", (q) => q.eq("marka", marka));
const etapy = await wedlug("etapy", "quiz_id", idy(quizy));
const zadania = await wedlug("zadania", "quiz_id", idy(quizy));
const pijanePytaniaQuizu = await wedlug("pijane_pytania_quizu", "quiz_id", idy(quizy));
const sesje = await wszystkie("sesje", (q) => q.eq("marka", marka));
const gracze = await wedlug("gracze", "sesja_id", idy(sesje));
const graczeUsunieci = await wedlug("gracze_usunieci", "sesja_id", idy(sesje));
const odpowiedzi = await wedlug("odpowiedzi", "sesja_id", idy(sesje));
const okrzyki = await wedlug("okrzyki", "sesja_id", idy(sesje));

// kolejność = kolejność importu (najpierw to, na co wskazują klucze obce)
const dane = {
  zrodlo: URL_BAZY,
  marka,
  utworzono: new Date().toISOString(),
  tabele: {
    lokale,
    konta,
    konta_role: kontaRole,
    quizy,
    etapy,
    zadania,
    pijane_pytania_quizu: pijanePytaniaQuizu,
    sesje,
    gracze,
    gracze_usunieci: graczeUsunieci,
    odpowiedzi,
    okrzyki,
  },
};

// pliki z bucketu: każdy napis z adresem bucketu w dowolnej kolumnie (także w `zadania.dane`)
const sciezki = new Set();
JSON.stringify(dane.tabele, (_, w) => {
  if (typeof w === "string") {
    for (const m of w.matchAll(new RegExp(`${ZNACZNIK.replace(/[/.]/g, "\\$&")}([^"#?\\s]+)`, "g"))) {
      sciezki.add(decodeURIComponent(m[1]));
    }
  }
  return w;
});

await mkdir(path.join(cel, "pliki"), { recursive: true });
let pobrane = 0;
const brakujace = [];
for (const s of sciezki) {
  const { data, error } = await db.storage.from(BUCKET).download(s);
  if (error) {
    brakujace.push(s);
    continue;
  }
  const plik = path.join(cel, "pliki", s);
  await mkdir(path.dirname(plik), { recursive: true });
  await writeFile(plik, Buffer.from(await data.arrayBuffer()));
  pobrane++;
}
dane.pliki = [...sciezki].filter((s) => !brakujace.includes(s));
// ustawienia bucketu, żeby import założył taki sam (publiczny, z tymi samymi limitami)
const { data: bucket } = await db.storage.getBucket(BUCKET);
dane.bucket = bucket
  ? { public: bucket.public, fileSizeLimit: bucket.file_size_limit, allowedMimeTypes: bucket.allowed_mime_types }
  : { public: true };
await writeFile(path.join(cel, "dane.json"), JSON.stringify(dane, null, 2));

console.log(`Eksport marki ${marka} do ${cel}`);
for (const [t, w] of Object.entries(dane.tabele)) console.log(`  ${t}: ${w.length}`);
console.log(
  `  pliki: ${pobrane}${brakujace.length ? `, brak w buckecie: ${brakujace.length} (${brakujace.join(", ")})` : ""}`,
);
