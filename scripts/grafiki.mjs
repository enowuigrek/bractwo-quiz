// Generuje grafiki do ekranów TV przez API obrazów OpenAI i zapisuje je w public/grafiki/.
// Uruchamianie (klucz z .env.local, nie trafia do repo):
//   node --env-file=.env.local scripts/grafiki.mjs            wszystkie brakujące
//   node --env-file=.env.local scripts/grafiki.mjs szklanka   jedną, nadpisując
// Grafiki są w repo, więc generujemy je raz; skrypt jest po to, żeby dało się je odtworzyć albo poprawić.

import { mkdir, writeFile, access } from "node:fs/promises";
import sharp from "sharp";

const KLUCZ = process.env.OPENAI_API_KEY;
if (!KLUCZ) {
  console.error("Brak OPENAI_API_KEY w .env.local.");
  process.exit(1);
}

const STYL =
  "Photorealistic product render, studio lighting with warm golden rim light, rich amber and gold tones, " +
  "premium craft beer brand aesthetic, crisp detail, no text, no logos, no people.";

const GRAFIKI = {
  // pełna szklanka; pusta to ta sama grafika przygaszona, piwo „nalewa się” od dołu przycięciem
  szklanka: {
    plik: "szklanka.webp",
    rozmiar: "1024x1536",
    tlo: "transparent",
    // przycięta do samej szklanki (z poświatą), żeby w CSS łatwo było ją ustawić
    obrobka: async (img) =>
      (await przytnijDoTresci(img)).resize({ width: 420 }).webp({ quality: 85, alphaQuality: 90 }),
    opis:
      "A single tall classic pint glass (nonic pint) filled to the brim with golden lager beer, thick creamy white foam head " +
      "slightly overflowing, fine natural carbonation bubbles rising irregularly, condensation droplets on the glass, " +
      "viewed straight from the front, centered, the whole glass visible with some margin, isolated on a fully transparent background. " +
      STYL,
  },
  // tor wyścigu: ciemna drewniana lada, poziomy pas do powtarzania
  lada: {
    plik: "lada.webp",
    rozmiar: "1536x1024",
    tlo: "opaque",
    obrobka: (img) => img.resize({ width: 1280 }).webp({ quality: 72 }),
    opis:
      "Top-down view of a dark, worn oak bar counter surface in an old candlelit tavern, long horizontal wood grain running left to right, " +
      "subtle scratches and beer ring stains, very dark overall (mostly deep brown and black) with soft warm highlights, " +
      "even lighting across the whole frame so it can tile horizontally, no objects on the counter. " +
      STYL,
  },
};

/**
 * Przycina obraz do pikseli prawie nieprzezroczystych, z małym marginesem, i wygasza słabą poświatę
 * dookoła (inaczej na TV widać jej prostokątną krawędź).
 */
async function przytnijDoTresci(img) {
  const { data, info } = await img.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let [x0, y0, x1, y1] = [info.width, info.height, 0, 0];
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  const m = Math.round((x1 - x0) * 0.03);
  const left = Math.max(0, x0 - m);
  const top = Math.max(0, y0 - m);
  const width = Math.min(info.width, x1 + m + 1) - left;
  const height = Math.min(info.height, y1 + m + 1) - top;
  const wyciete = await img.ensureAlpha().extract({ left, top, width, height }).raw().toBuffer({ resolveWithObject: true });
  const px = wyciete.data;
  for (let i = 3; i < px.length; i += 4) px[i] = Math.max(0, Math.min(255, Math.round(((px[i] - 90) * 255) / 150)));
  return sharp(px, { raw: wyciete.info });
}

async function generuj(nazwa) {
  const g = GRAFIKI[nazwa];
  const odp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KLUCZ}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: g.opis,
      size: g.rozmiar,
      quality: "high",
      background: g.tlo,
      output_format: "png",
      n: 1,
    }),
  });
  const dane = await odp.json();
  if (!odp.ok) throw new Error(`${nazwa}: ${dane.error?.message ?? odp.status}`);
  const b64 = dane.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${nazwa}: brak obrazu w odpowiedzi`);
  // obraz z API waży 2–3 MB, a na TV wystarczy mniejszy
  await writeFile(`public/grafiki/${g.plik}`, (await g.obrobka(sharp(Buffer.from(b64, "base64")))).toBuffer());
  console.log(`zapisano public/grafiki/${g.plik}`);
}

await mkdir("public/grafiki", { recursive: true });
const wybrane = process.argv.slice(2);
for (const nazwa of wybrane.length ? wybrane : Object.keys(GRAFIKI)) {
  if (!GRAFIKI[nazwa]) {
    console.error(`Nie znam grafiki „${nazwa}”. Są: ${Object.keys(GRAFIKI).join(", ")}`);
    continue;
  }
  const jest = await access(`public/grafiki/${GRAFIKI[nazwa].plik}`).then(() => true, () => false);
  if (jest && !wybrane.length) {
    console.log(`pomijam ${nazwa} (już jest)`);
    continue;
  }
  await generuj(nazwa);
}
