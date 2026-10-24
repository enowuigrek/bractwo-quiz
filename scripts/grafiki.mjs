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

// gpt-image-1 przestał działać przy generowaniu (24.10: „model does not exist”), stąd gpt-image-2
const MODEL = process.env.MODEL_OBRAZOW ?? "gpt-image-2";

const STYL =
  "Photorealistic product render, studio lighting with warm golden rim light, rich amber and gold tones, " +
  "premium craft beer brand aesthetic, crisp detail, no text, no logos, no people.";

// Tła nastrojów etapów (src/lib/gra/nastroj.ts): na TV mocno przygaszone, pod tekstem, więc środek kadru ma
// zostać ciemny i pusty. Średnia jakość wystarcza (i jest kilka razy tańsza), bo i tak są przyciemnione.
const STYL_TLA =
  "Wide cinematic photograph, low-key lighting, very dark overall, shallow depth of field, soft focus, " +
  "the center of the frame stays dark and uncluttered so text can be placed over it, " +
  "no text, no letters, no signs with writing, no logos, no people.";

/** Tło na całą scenę TV: przycięte do 16:9 i zmniejszone do 1920×1080. */
const obrobkaTla = (img) => img.resize({ width: 1920, height: 1080, fit: "cover" }).webp({ quality: 70 });

const tlo = (plik, opis) => ({
  plik,
  rozmiar: "1536x1024",
  tlo: "opaque",
  jakosc: "medium",
  obrobka: obrobkaTla,
  opis: `${opis} ${STYL_TLA}`,
});

// Grafiki do pytań i ciekawostek (zadania.grafika_url = /grafiki/pytania/…): pokazywane na TV i telefonach
// razem z pytaniem, więc wysoka jakość i zero napisów, które zdradzałyby odpowiedź.
const STYL_ZDJECIA =
  "Cinematic documentary photograph, natural light, rich detail, warm tones, " +
  "no text, no letters, no labels, no logos, no people.";

/** Grafika pytania albo ciekawostki: 1280 px szerokości, lekka dla telefonów. */
const zdjecie = (plik, opis, styl = STYL) => ({
  plik: `pytania/${plik}`,
  rozmiar: "1536x1024",
  tlo: "opaque",
  obrobka: (img) => img.resize({ width: 1280 }).webp({ quality: 78 }),
  opis: `${opis} ${styl}`,
});

/**
 * Ikona etapu: jeden przedmiot przycięty do treści, 360 px. gpt-image-2 nie robi przezroczystego tła, więc
 * przedmiot stoi na jednolitej magencie (w piwie jej nie ma), a skrypt zamienia ją na przezroczystość.
 */
const ikona = (plik, opis) => ({
  plik: `etapy/${plik}`,
  rozmiar: "1024x1024",
  tlo: "opaque",
  obrobka: async (img) =>
    (await przytnijDoTresci(await bezMagenty(img)))
      .resize({ width: 360, height: 360, fit: "inside" })
      .webp({ quality: 85, alphaQuality: 90 }),
  opis:
    `${opis} Centered, the whole object visible with some margin, on a perfectly flat solid pure magenta ` +
    "(#FF00FF) background with no shadows, no gradient and no reflections of the background. " +
    STYL.replace("studio lighting with warm golden rim light", "even studio lighting"),
});

/** Magentowe tło na przezroczystość: im bliżej koloru #FF00FF, tym bardziej przezroczysty piksel. */
async function bezMagenty(img) {
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // magenta: dużo czerwieni i niebieskiego, mało zieleni
    const magenta = Math.min(r, b) - g;
    if (magenta > 120) data[i + 3] = 0;
    else if (magenta > 60) {
      data[i + 3] = Math.round(((120 - magenta) / 60) * 255);
      // przebarwienie krawędzi: zabierz różowy nalot
      data[i] = Math.min(r, g + 40);
      data[i + 2] = Math.min(b, g + 40);
    }
  }
  return sharp(data, { raw: info });
}

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
  "pyt-chmiel": zdjecie(
    "chmiel.webp",
    "Extreme close-up of fresh green hop cones hanging on the bine, tiny dew drops, backlit by warm light, " +
      "very dark background.",
  ),
  "pyt-kriek": zdjecie(
    "kriek.webp",
    "A tulip-shaped glass of Belgian kriek cherry beer, deep ruby red with a pink foam head, a few fresh cherries " +
      "beside it on a dark wooden bar, warm side light, dark background.",
  ),
  "pyt-weizen": zdjecie(
    "weizen.webp",
    "A tall curved vase-shaped wheat beer glass (weizen glass) filled with cloudy golden hefeweizen and a big fluffy " +
      "foam head, standing on a dark bar, warm light, dark background, the whole glass visible.",
  ),
  "ciek-grodzisk": zdjecie(
    "grodzisk.webp",
    "Historic red-brick brewery building in a small town in Greater Poland at dusk, 19th-century industrial " +
      "architecture with a tall brick chimney, cobblestone street, warm light in the windows, gentle evening mist.",
    STYL_ZDJECIA,
  ),
  "ciek-opactwo": zdjecie(
    "opactwo.webp",
    "A Belgian Trappist abbey at dusk, old stone walls and a bell tower, warm light glowing in the windows, " +
      "quiet monastery courtyard with a few old wooden beer barrels by the wall.",
    STYL_ZDJECIA,
  ),
  // quiz „Muzyka ponadczasowa”
  // ikony etapów (etapy.ikona = /grafiki/etapy/…): wieczór w barze, na przezroczystym tle jak szklanka
  "etap-na-jedno": ikona(
    "na-jedno.webp",
    "A single American shaker pint glass (straight conical sides, no handle) filled with golden beer and a white " +
      "foam head.",
  ),
  "etap-jednak-wiecej": ikona(
    "jednak-wiecej.webp",
    "A wooden beer tasting flight paddle holding four small tasting glasses with different beers: pale golden, amber, " +
      "ruby red and almost black stout.",
  ),
  "etap-ile": ikona(
    "ile.webp",
    "A tall laboratory glass measuring beaker with plain graduation lines but no numbers, filled two thirds with golden " +
      "beer and a foam head.",
  ),
  "etap-poskladaj-sie": ikona(
    "poskladaj-sie.webp",
    "Four jigsaw puzzle pieces cut from a thick round cardboard beer coaster, three fitted together and the fourth " +
      "floating just above its gap, warm amber and cream coloured cardboard without any print.",
  ),
  "etap-jeszcze-zdaze": ikona(
    "jeszcze-zdaze.webp",
    "An antique hourglass with a polished brass frame and turned wooden posts, golden beer with a little white foam " +
      "instead of sand: the top bulb almost empty, a thin stream of beer running into the nearly full bottom bulb.",
  ),
  "muz-saksofon": zdjecie(
    "saksofon.webp",
    "A golden alto saxophone lying on a dark velvet surface, dramatic warm side light, smoky jazz club atmosphere, " +
      "very dark background, the whole instrument visible.",
  ),
  "muz-kaseta": zdjecie(
    "kaseta.webp",
    "A vintage audio compact cassette tape on a dark wooden table, the magnetic tape and two reels visible through " +
      "the window, blank label without any writing, warm light, dark background.",
  ),
  "muz-organy": zdjecie(
    "organy.webp",
    "Close view of the tall metal pipes of a grand church pipe organ, rows of shiny pipes, warm candle light, " +
      "dark cathedral interior.",
  ),
  "muz-chopin": zdjecie(
    "chopin.webp",
    "A black grand piano with an open lid in an elegant 19th-century salon lit by candles, sheet music on the stand " +
      "without readable notes, tall windows, warm evening light.",
    STYL_ZDJECIA,
  ),
  "muz-woodstock": zdjecie(
    "woodstock.webp",
    "An empty muddy festival field on a gentle hillside at dawn after a huge rock festival, a simple wooden stage " +
      "in the distance, morning mist, scattered blankets, summer 1969 atmosphere.",
    STYL_ZDJECIA,
  ),
  // Piwny quiz, dokładka 24.10: ciekawostki po pytaniach (porter, fermentacja spontaniczna) i dwa pytania z grafiką
  "ciek-powodz": zdjecie(
    "powodz.webp",
    "A narrow cobblestone street in London in 1814 at dusk, completely flooded knee-deep with dark brown porter beer " +
      "with creamy foam, the flood flowing between Georgian brick houses, floating wooden debris, gas lamps " +
      "reflected in the beer. No barrels, no vats, no casks.",
    STYL_ZDJECIA,
  ),
  "ciek-koelschip": zdjecie(
    "koelschip.webp",
    "The attic of an old Belgian brewery at night, a wide shallow rectangular open copper vat (coolship) filled with " +
      "steaming amber wort, old wooden roof beams, wooden louvred shutters open to the cold night air, steam rising.",
    STYL_ZDJECIA,
  ),
  "pyt-jeczmien": zdjecie(
    "jeczmien.webp",
    "Close-up of ripe golden two-row barley ears with long awns in a field at sunset, shallow depth of field.",
    STYL_ZDJECIA,
  ),
  "pyt-pinta": zdjecie(
    "pinta.webp",
    "A full British nonic pint glass (smooth tall glass with the characteristic bulge a few centimetres below the rim, " +
      "no facets, no handle) of amber ale with a creamy head, standing on a dark wooden bar counter of a traditional " +
      "English pub, brass beer taps and warm lights blurred behind.",
  ),
  "pyt-tripel": zdjecie(
    "tripel.webp",
    "A Belgian tripel, hazy deep golden strong ale with a thick white foam head, in a stemmed Belgian tulip glass on " +
      "a dark wooden table of a cosy Belgian café, warm lights blurred behind.",
  ),
  "pyt-mass": zdjecie(
    "mass.webp",
    "A one-litre dimpled thick glass Bavarian beer mug with a big handle (Masskrug), full of golden lager with a thick " +
      "white foam head, standing on a wooden table, blurred warm lights of a festival tent behind.",
  ),
  "tlo-poczekalnia": tlo(
    "tlo-poczekalnia.webp",
    "Cozy craft beer pub interior at night, warm golden pendant lamps, rows of beer taps and bottles softly out of focus " +
      "in the background, dark wooden bar, a few candles, deep shadows, inviting and calm atmosphere.",
  ),
  "tlo-noir1": tlo(
    "tlo-noir1.webp",
    "Film noir style empty bar interior at night, slanted light through venetian blinds casting striped shadows across " +
      "the wall and a wooden bar counter, cool bluish moonlight, thin wisps of smoke, mostly dark.",
  ),
  "tlo-noir2": tlo(
    "tlo-noir2.webp",
    "Darker film noir bar corner at night, heavy shadows, a single dim lamp, venetian blind shadows on the wall, " +
      "thick slowly drifting smoke, rain-streaked window, cold blue tones, mysterious and tense.",
  ),
  "tlo-neon": tlo(
    "tlo-neon.webp",
    "Rain-streaked bar window at night seen from inside, blurred red neon glow from a sign outside without any readable " +
      "letters, wet reflections on the glass, dark interior with venetian blinds, noir mood, deep red and black.",
  ),
  "tlo-walka": tlo(
    "tlo-walka.webp",
    "Dramatic dark pub interior set up like a stage before a showdown, deep crimson light seeping in from the edges, " +
      "haze in the air, narrow spotlights from above, intense tension, the middle almost black.",
  ),
  "tlo-podium": tlo(
    "tlo-podium.webp",
    "Celebration in a dark pub, warm golden light, sparkling bokeh, floating golden confetti and glowing light particles, " +
      "beer glasses gleaming far in the blurred background, triumphant and festive.",
  ),
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
      model: MODEL,
      prompt: g.opis,
      size: g.rozmiar,
      quality: g.jakosc ?? "high",
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
  await writeFile(`public/grafiki/${g.plik}`, await (await g.obrobka(sharp(Buffer.from(b64, "base64")))).toBuffer());
  console.log(`zapisano public/grafiki/${g.plik}`);
}

await mkdir("public/grafiki/pytania", { recursive: true });
await mkdir("public/grafiki/etapy", { recursive: true });
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
