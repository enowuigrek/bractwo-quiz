import { usunGrafike } from "@/lib/grafiki";
import { supabaseAdmin } from "@/lib/supabase/serwer";

// Selfie gracza przerobione przez API obrazów OpenAI w stylu Bractwa (ciepłe złote światło, ciemny bar).
// Gracz sam o to prosi na telefonie (zgoda: zdjęcie trafia na chwilę do OpenAI). Koszt pilnują limity:
// raz na gracza (przerobione zdjęcie ma w nazwie `-ai-`), najwyżej LIMIT_GRY na grę i niska jakość
// (awatar ma na TV najwyżej 170 px), ok. 0,02 $ za zdjęcie.

export const maxDuration = 90;

const BUCKET = "grafiki";
const LIMIT_GRY = 40;

const PROMPT =
  "Turn this selfie into a stylish portrait avatar for a craft beer pub quiz. Keep the person exactly recognizable: " +
  "same face, likeness, hairstyle, expression, glasses and clothing colors. Head and shoulders, centered. " +
  "Warm golden rim light, dark moody bar background with soft amber bokeh, rich contrast, subtle illustrative polish. " +
  "No text, no logos, no extra people.";

function blad(tekst: string, status = 400) {
  return Response.json({ ok: false, blad: tekst }, { status });
}

/** `{ token }`: przerabia obecne selfie gracza i podmienia je. Zwraca `{ ok, zdjecie }`. */
export async function POST(request: Request) {
  const klucz = process.env.OPENAI_API_KEY;
  if (!klucz) return blad("Przeróbka zdjęć nie jest włączona.", 503);

  const { token } = ((await request.json().catch(() => null)) ?? {}) as { token?: string };
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return blad("Nieznany gracz.", 403);
  const db = supabaseAdmin();
  const { data: gracz } = await db
    .from("gracze")
    .select("id, sesja_id, zdjecie_url, sesje(faza)")
    .eq("token", token)
    .maybeSingle<{ id: string; sesja_id: string; zdjecie_url: string | null; sesje: { faza: string } | null }>();
  if (!gracz) return blad("Nieznany gracz.", 403);
  if (gracz.sesje?.faza === "koniec") return blad("Ta gra już się skończyła.", 409);
  if (!gracz.zdjecie_url?.includes(`/storage/v1/object/public/${BUCKET}/gracze/`))
    return blad("Najpierw dodaj selfie.");
  if (gracz.zdjecie_url.includes("-ai-"))
    return blad("To zdjęcie jest już przerobione. Zrób nowe selfie, żeby przerobić inne.", 409);

  const { count } = await db
    .from("gracze")
    .select("id", { count: "exact", head: true })
    .eq("sesja_id", gracz.sesja_id)
    .like("zdjecie_url", "%-ai-%");
  if ((count ?? 0) >= LIMIT_GRY) return blad("W tej grze skończył się limit przeróbek zdjęć.", 429);

  const selfie = await fetch(gracz.zdjecie_url)
    .then((o) => (o.ok ? o.blob() : null))
    .catch(() => null);
  if (!selfie) return blad("Nie udało się odczytać zdjęcia.", 500);

  const prosba = new FormData();
  prosba.append("model", "gpt-image-1");
  prosba.append("image", selfie, selfie.type === "image/webp" ? "selfie.webp" : "selfie.jpg");
  prosba.append("prompt", PROMPT);
  prosba.append("size", "1024x1024");
  prosba.append("quality", "low");
  // twarz ma zostać rozpoznawalna
  prosba.append("input_fidelity", "high");
  prosba.append("output_format", "webp");
  prosba.append("output_compression", "75");

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
      console.error("OpenAI (awatar):", wynik.error?.message ?? odp.status);
      return blad("Przeróbka się nie udała. Zostaje zwykłe zdjęcie.", 502);
    }
    b64 = wynik.data?.[0]?.b64_json;
  } catch {
    return blad("Przeróbka trwała za długo. Zostaje zwykłe zdjęcie.", 504);
  }
  if (!b64) return blad("Przeróbka się nie udała. Zostaje zwykłe zdjęcie.", 502);

  const storage = db.storage.from(BUCKET);
  const sciezka = `gracze/${gracz.sesja_id}/${gracz.id}-ai-${crypto.randomUUID()}.webp`;
  const { error: bladZapisu } = await storage.upload(sciezka, Buffer.from(b64, "base64"), {
    contentType: "image/webp",
    cacheControl: "604800",
  });
  if (bladZapisu) return blad("Nie udało się zapisać zdjęcia.", 500);
  const url = storage.getPublicUrl(sciezka).data.publicUrl;

  // gracz mógł w międzyczasie zmienić selfie: podmieniamy tylko to, które przerabialiśmy
  const { data: zmienione } = await db
    .from("gracze")
    .update({ zdjecie_url: url })
    .eq("id", gracz.id)
    .eq("zdjecie_url", gracz.zdjecie_url)
    .select("id");
  if (!zmienione?.length) {
    await usunGrafike(url);
    return blad("Zdjęcie zmieniło się w trakcie przeróbki.", 409);
  }
  await usunGrafike(gracz.zdjecie_url);
  return Response.json({ ok: true, zdjecie: url });
}
