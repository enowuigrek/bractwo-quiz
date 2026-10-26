import { czyAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";

// Zdjęcie nagrody z kreatora gry: zapis do `grafiki/nagrody/<dzień>/`, tylko z panelu (ciasteczko admina).
// Do 25.10 zdjęcie szło jeszcze do przeróbki przez API obrazów OpenAI (wycięcie z tła w stylu Bractwa), ale przeróbka
// nie działała na produkcji, a środki na koncie się skończyły, więc zostało samo zdjęcie.

const BUCKET = "grafiki";
/** Przeglądarka zmniejsza zdjęcie do 1024 px (ok. 200–400 KB); zapas na inne telefony. */
const MAX_B = 3 * 1024 * 1024;
const TYPY: Record<string, string> = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" };

function blad(tekst: string, status = 400) {
  return Response.json({ ok: false, blad: tekst }, { status });
}

/** `plik`: zdjęcie nagrody. Zwraca `{ ok, url }` (publiczny adres). */
/** Prowadzący z pilota (bez logowania w panelu): kod i klucz pilota gry, która jeszcze nie ruszyła. */
async function pilotPrzedStartem(kod: string, token: string): Promise<boolean> {
  if (!kod || !token) return false;
  const { data } = await supabaseAdmin()
    .from("sesje")
    .select("id")
    .eq("kod", kod.toUpperCase())
    .eq("host_token", token)
    .eq("faza", "poczekalnia")
    .maybeSingle();
  return !!data;
}

export async function POST(request: Request) {
  const dane = await request.formData().catch(() => null);
  // z kreatora (zalogowany w panelu) albo z pilota przed startem (26.10: nagrody ustalane na miejscu)
  const zPilota = await pilotPrzedStartem(String(dane?.get("kod") ?? ""), String(dane?.get("host_token") ?? ""));
  if (!zPilota && !(await czyAdmin())) return blad("Zaloguj się do panelu.", 401);

  const plik = dane?.get("plik");
  if (!(plik instanceof File)) return blad("Brak zdjęcia.");
  if (!TYPY[plik.type]) return blad("Zdjęcie musi być w formacie JPEG, PNG albo WebP.");
  if (plik.size > MAX_B) return blad("Zdjęcie jest za duże.");

  const storage = supabaseAdmin().storage.from(BUCKET);
  const sciezka = `nagrody/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${TYPY[plik.type]}`;
  const { error } = await storage.upload(sciezka, plik, { contentType: plik.type, cacheControl: "31536000" });
  if (error) return blad("Nie udało się zapisać zdjęcia.", 500);
  return Response.json({ ok: true, url: storage.getPublicUrl(sciezka).data.publicUrl });
}
