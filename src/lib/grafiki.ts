import "server-only";
import { supabaseAdmin } from "@/lib/supabase/serwer";

const BUCKET = "grafiki";
export const MAX_GRAFIKA_B = 5 * 1024 * 1024;

const ROZSZERZENIA: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/** Plik z pola formularza albo null, gdy nic nie wybrano. */
export function plikZFormularza(dane: FormData, pole: string): File | null {
  const plik = dane.get(pole);
  return plik instanceof File && plik.size > 0 ? plik : null;
}

/** Sprawdza plik, zanim cokolwiek zapiszemy. Zwraca opis błędu albo null. */
export function bladGrafiki(plik: File): string | null {
  if (!ROZSZERZENIA[plik.type]) return "Grafika musi być w formacie PNG, JPG, WebP albo SVG.";
  if (plik.size > MAX_GRAFIKA_B) return "Grafika może mieć najwyżej 5 MB.";
  return null;
}

/** Wysyła grafikę do publicznego bucketu i zwraca jej publiczny adres. */
export async function wyslijGrafike(plik: File, katalog: "piwiarnie" | "zadania" | "sesje"): Promise<string> {
  const blad = bladGrafiki(plik);
  if (blad) throw new Error(blad);

  const sciezka = `${katalog}/${crypto.randomUUID()}.${ROZSZERZENIA[plik.type]}`;
  const storage = supabaseAdmin().storage.from(BUCKET);
  const { error } = await storage.upload(sciezka, plik, { contentType: plik.type, cacheControl: "31536000" });
  if (error) throw new Error(`Nie udało się wysłać grafiki: ${error.message}`);
  return storage.getPublicUrl(sciezka).data.publicUrl;
}

/** Usuwa grafikę z bucketu. Adresy spoza bucketu (np. /loga/…) zostawia w spokoju. */
export async function usunGrafike(url: string | null | undefined): Promise<void> {
  const znacznik = `/storage/v1/object/public/${BUCKET}/`;
  const i = url?.indexOf(znacznik) ?? -1;
  if (!url || i < 0) return;
  // błąd sprzątania nie powinien blokować zapisu, najwyżej zostanie osierocony plik
  await supabaseAdmin().storage.from(BUCKET).remove([decodeURIComponent(url.slice(i + znacznik.length))]);
}
