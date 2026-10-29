import { supabase } from "@/lib/supabase/przegladarka";

/**
 * Zapis odpowiedzi z telefonu z ponowieniem (29.10). W grze AZKJ pierwsza fala odpowiedzi na 1. pytanie dostała
 * błąd 500 z bazy, a telefon od razu czyścił wybór i gracze klikali drugi raz. Teraz błąd (sieć, baza) ponawiamy
 * po chwili, zanim pokażemy go graczowi. Podwójny zapis nie grozi: baza przyjmuje jedną odpowiedź na pytanie
 * (`on conflict do nothing`), a powtórka po udanym zapisie wraca jako „juz_odpowiedziano”.
 */
export async function zapiszZPonowieniem(
  funkcja: "zapisz_odpowiedz" | "zapisz_odpowiedz_serii",
  argumenty: Record<string, unknown>,
) {
  const przerwy = [400, 1200];
  let wynik = await supabase().rpc(funkcja, argumenty);
  for (const ms of przerwy) {
    if (!wynik.error) break;
    await new Promise((r) => setTimeout(r, ms));
    wynik = await supabase().rpc(funkcja, argumenty);
  }
  return wynik;
}
