import { czyAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";

// Zdjęcie nagrody przerobione przez API obrazów OpenAI w stylu ekranów Bractwa (bez tła, złote światło).
// Tylko z panelu (ciasteczko admina), z dziennym limitem, bo każda przeróbka kosztuje (ok. 0,05 $).
// Zapisuje oryginał i przeróbkę w `grafiki/nagrody/<dzień>/`, a kreator gry wybiera, którą pokazać.

// przeróbka trwa zwykle 15–40 s
export const maxDuration = 90;

const BUCKET = "grafiki";
/** Przeglądarka zmniejsza zdjęcie do 1024 px (ok. 200–400 KB); zapas na inne telefony. */
const MAX_B = 3 * 1024 * 1024;
const TYPY: Record<string, string> = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" };
/** Najwyżej tyle przeróbek dziennie (wszyscy razem), żeby nikt nie nabił rachunku. */
const LIMIT_DZIENNY = 40;

// Poświatę dodaje CSS na TV; w samym obrazie prosimy o czyste tło, bo AI dorysowywało smugi światła.
const PROMPT =
  "Cut out the main object from this photo (a bottle, can, glass of beer, voucher, merchandise or similar prize) " +
  "and reproduce it faithfully: identical shape, colors, label, logos and printed text exactly as in the photo. " +
  "Never add any text, letters, logos, stickers or decorations that are not in the photo; " +
  "if the object has no label, it must stay without a label. " +
  "Output only the object on a fully transparent background with clean, sharp edges and nothing else: " +
  "no light streaks, no lines, no glow, no shadow, no floor. Centered, entirely in frame with a small margin. " +
  "Warm golden studio lighting on the object itself, rich contrast, premium product photo look.";

function blad(tekst: string, status = 400) {
  return Response.json({ ok: false, blad: tekst }, { status });
}

/** `plik`: zdjęcie nagrody. Zwraca `{ ok, oryginal, przerobione }` (publiczne adresy). */
export async function POST(request: Request) {
  if (!(await czyAdmin())) return blad("Zaloguj się do panelu.", 401);
  const klucz = process.env.OPENAI_API_KEY;
  if (!klucz) return blad("Przeróbka zdjęć nie jest włączona (brak klucza OpenAI na serwerze).", 503);

  const dane = await request.formData().catch(() => null);
  const plik = dane?.get("plik");
  if (!(plik instanceof File)) return blad("Brak zdjęcia.");
  if (!TYPY[plik.type]) return blad("Zdjęcie musi być w formacie JPEG, PNG albo WebP.");
  if (plik.size > MAX_B) return blad("Zdjęcie jest za duże.");

  const storage = supabaseAdmin().storage.from(BUCKET);
  const dzien = new Date().toISOString().slice(0, 10);
  const katalog = `nagrody/${dzien}`;
  const { data: dzis } = await storage.list(katalog, { limit: 1000 });
  const przerobek = (dzis ?? []).filter((f) => f.name.startsWith("ai-")).length;
  if (przerobek >= LIMIT_DZIENNY)
    return blad(`Dzisiejszy limit przeróbek (${LIMIT_DZIENNY}) się skończył. Użyj zdjęcia bez przeróbki.`, 429);

  const id = crypto.randomUUID();
  const sciezkaOryginalu = `${katalog}/${id}.${TYPY[plik.type]}`;
  const { error: bladOryginalu } = await storage.upload(sciezkaOryginalu, plik, {
    contentType: plik.type,
    cacheControl: "31536000",
  });
  if (bladOryginalu) return blad("Nie udało się zapisać zdjęcia.", 500);
  const oryginal = storage.getPublicUrl(sciezkaOryginalu).data.publicUrl;

  const prosba = new FormData();
  prosba.append("model", "gpt-image-1");
  prosba.append("image", plik, `nagroda.${TYPY[plik.type]}`);
  prosba.append("prompt", PROMPT);
  prosba.append("size", "1024x1024");
  prosba.append("quality", "medium");
  // napisy na etykiecie mają zostać czytelne
  prosba.append("input_fidelity", "high");
  prosba.append("background", "transparent");
  prosba.append("output_format", "webp");
  prosba.append("output_compression", "85");

  let b64: string | undefined;
  try {
    const odp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${klucz}` },
      body: prosba,
      signal: AbortSignal.timeout(85_000),
    });
    const wynik = await odp.json();
    if (!odp.ok) {
      console.error("OpenAI:", wynik.error?.message ?? odp.status);
      return Response.json(
        { ok: false, blad: "Przeróbka się nie udała. Możesz użyć zdjęcia bez przeróbki.", oryginal },
        { status: 502 },
      );
    }
    b64 = wynik.data?.[0]?.b64_json;
  } catch {
    return Response.json(
      { ok: false, blad: "Przeróbka trwała za długo. Spróbuj jeszcze raz albo użyj zdjęcia bez przeróbki.", oryginal },
      { status: 504 },
    );
  }
  if (!b64) return Response.json({ ok: false, blad: "OpenAI nie zwróciło obrazu.", oryginal }, { status: 502 });

  const sciezka = `${katalog}/ai-${id}.webp`;
  const { error } = await storage.upload(sciezka, Buffer.from(b64, "base64"), {
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (error) return Response.json({ ok: false, blad: "Nie udało się zapisać przeróbki.", oryginal }, { status: 500 });
  return Response.json({ ok: true, oryginal, przerobione: storage.getPublicUrl(sciezka).data.publicUrl });
}
