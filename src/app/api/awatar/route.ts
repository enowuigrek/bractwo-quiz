import { supabaseAdmin } from "@/lib/supabase/serwer";

// Selfie przerobione przez API obrazów OpenAI w stylu Bractwa (ciepłe złote światło, ciemny bar),
// zanim gracz dołączy do gry: telefon wysyła zdjęcie z kodem gry, dostaje przeróbkę i gracz sam wybiera,
// które zdjęcie dodać (zgoda: zdjęcie trafia na chwilę do OpenAI). Nic tu nie zapisujemy w magazynie,
// wybrane zdjęcie idzie potem zwykłą drogą (/api/zdjecie). Koszt pilnuje limit na grę (tabela
// `przerobki_ai`) i niska jakość (awatar ma na TV najwyżej 200 px), ok. 0,02 $ za zdjęcie.

export const maxDuration = 90;

const LIMIT_GRY = 40;
/** Telefon wysyła kwadrat 512×512 JPEG (ok. 60 KB); zapas na inne przeglądarki. */
const MAX_B = 1.5 * 1024 * 1024;

const PROMPT =
  "Turn this selfie into a stylish portrait avatar for a craft beer pub quiz. Keep the person exactly recognizable: " +
  "same face, likeness, hairstyle, expression, glasses and clothing colors. Head and shoulders, centered. " +
  "Warm golden rim light, dark moody bar background with soft amber bokeh, rich contrast, subtle illustrative polish. " +
  "No text, no logos, no extra people.";

function blad(tekst: string, status = 400) {
  return Response.json({ ok: false, blad: tekst }, { status });
}

/** `kod` gry i `plik` (selfie JPEG). Zwraca `{ ok, obraz }`: przeróbka jako data URL (WebP). */
export async function POST(request: Request) {
  const klucz = process.env.OPENAI_API_KEY;
  if (!klucz) return blad("Przeróbka zdjęć nie jest włączona.", 503);

  const dane = await request.formData().catch(() => null);
  const kod = String(dane?.get("kod") ?? "")
    .trim()
    .toUpperCase();
  const plik = dane?.get("plik");
  if (!/^[A-Z]{4}$/.test(kod)) return blad("Nie ma takiej gry.", 404);
  if (!(plik instanceof File) || plik.type !== "image/jpeg") return blad("Brak zdjęcia.");
  if (plik.size > MAX_B) return blad("Zdjęcie jest za duże.");

  const db = supabaseAdmin();
  const { data: sesja } = await db
    .from("sesje")
    .select("id, faza, poczekalnia_otwarta")
    .eq("kod", kod)
    .maybeSingle<{ id: string; faza: string; poczekalnia_otwarta: boolean }>();
  if (!sesja || sesja.faza === "koniec" || !sesja.poczekalnia_otwarta)
    return blad("Do tej gry nie można teraz dołączyć.", 409);

  const { count } = await db
    .from("przerobki_ai")
    .select("id", { count: "exact", head: true })
    .eq("sesja_id", sesja.id)
    .eq("rodzaj", "awatar");
  if ((count ?? 0) >= LIMIT_GRY) return blad("W tej grze skończył się limit przeróbek zdjęć.", 429);
  // liczymy przed wywołaniem, żeby równoległe prośby nie ominęły limitu
  await db.from("przerobki_ai").insert({ sesja_id: sesja.id, rodzaj: "awatar" });

  const prosba = new FormData();
  prosba.append("model", "gpt-image-1");
  prosba.append("image", plik, "selfie.jpg");
  prosba.append("prompt", PROMPT);
  prosba.append("size", "1024x1024");
  prosba.append("quality", "low");
  // twarz ma zostać rozpoznawalna
  prosba.append("input_fidelity", "high");
  // domyślny filtr często odrzuca zwykłe selfie; „low” to nadal filtr OpenAI, tylko mniej ostry
  prosba.append("moderation", "low");
  prosba.append("output_format", "webp");
  prosba.append("output_compression", "75");

  try {
    const odp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${klucz}` },
      body: prosba,
      signal: AbortSignal.timeout(85_000),
    });
    const wynik = await odp.json();
    if (!odp.ok) {
      const kodBledu: string = wynik.error?.code ?? "";
      console.error("OpenAI (awatar):", odp.status, kodBledu, wynik.error?.message);
      if (kodBledu === "moderation_blocked" || /safety/i.test(wynik.error?.message ?? "")) {
        return blad("OpenAI odrzuciło to zdjęcie (filtr bezpieczeństwa). Zrób inne albo zostaw zwykłe.", 422);
      }
      return blad("Przeróbka się nie udała. Spróbuj jeszcze raz albo zostaw zwykłe zdjęcie.", 502);
    }
    const b64: string | undefined = wynik.data?.[0]?.b64_json;
    if (!b64) return blad("Przeróbka się nie udała. Spróbuj jeszcze raz albo zostaw zwykłe zdjęcie.", 502);
    return Response.json({ ok: true, obraz: `data:image/webp;base64,${b64}` });
  } catch {
    return blad("Przeróbka trwała za długo. Spróbuj jeszcze raz albo zostaw zwykłe zdjęcie.", 504);
  }
}
