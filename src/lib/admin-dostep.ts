import "server-only";
import { notFound } from "next/navigation";
import { lokalRoli, type Rola } from "./admin";
import { supabaseAdmin } from "./supabase/serwer";

// Kto co widzi w panelu (od 26.10). Główny: wszystko. Lokal:
// - quizy: swoje (`quizy.lokal_id`) do zmian, a quizy Bractwa (`lokal_id` null) bez `tylko_glowny` tylko do grania
//   i podglądu, bez edycji i usuwania;
// - gry: rozegrane w swoim lokalu; gry Bractwa (`tylko_glowny`) w swoim lokalu tylko na listach, do podglądu
//   i zwolnienia ekranu przed startem (28.10), bez pilota i strony gry;
// - lokale: tylko swój (logo, Instagram, hasło).
// Strona bez dostępu pokazuje 404, a akcja kończy się błędem. Listy filtrują `filtrQuizow` / `filtrGier`.

type ZFiltrem<Q> = { or(filtr: string): Q };

/** Quizy, które rola widzi na listach i w kreatorze (`wlasne`: tylko te, które może zmieniać, np. w koszu). */
export function filtrQuizow<Q extends ZFiltrem<Q>>(zapytanie: Q, rola: Rola, wlasne = false): Q {
  const lokal = lokalRoli(rola);
  if (!lokal) return zapytanie;
  return zapytanie.or(
    wlasne ? `lokal_id.eq.${lokal}` : `lokal_id.eq.${lokal},and(lokal_id.is.null,tylko_glowny.is.false)`,
  );
}

/**
 * Gry, które rola widzi na listach. `zBractwa`: lokal widzi też gry Bractwa (`tylko_glowny`) w swoim lokalu, bo
 * zajmują jego ekran (tylko listy rozgrywek; menu ze skrótem do pilota ich nie bierze).
 */
export function filtrGier<Q extends ZFiltrem<Q>>(zapytanie: Q, rola: Rola, zBractwa = false): Q {
  const lokal = lokalRoli(rola);
  if (!lokal) return zapytanie;
  return zapytanie.or(zBractwa ? `lokal_id.eq.${lokal}` : `and(lokal_id.eq.${lokal},tylko_glowny.is.false)`);
}

/**
 * Dostęp do quizu. `podglad`: wystarczy móc go oglądać i grać (quiz Bractwa u lokalu), inaczej trzeba móc go
 * zmieniać. Zwraca, czy rola może quiz zmieniać.
 */
export async function wymagajQuizu(rola: Rola, quizId: string, podglad = false): Promise<{ mozeZmieniac: boolean }> {
  const lokal = lokalRoli(rola);
  if (!lokal) return { mozeZmieniac: true };
  const { data } = await supabaseAdmin()
    .from("quizy")
    .select("lokal_id, tylko_glowny")
    .eq("id", quizId)
    .maybeSingle<{ lokal_id: string | null; tylko_glowny: boolean }>();
  if (data?.lokal_id === lokal) return { mozeZmieniac: true };
  if (podglad && data && data.lokal_id === null && !data.tylko_glowny) return { mozeZmieniac: false };
  notFound();
}

export async function wymagajGry(rola: Rola, sesjaId: string, podglad = false): Promise<{ gosc: boolean }> {
  const lokal = lokalRoli(rola);
  if (!lokal) return { gosc: false };
  const { data } = await supabaseAdmin()
    .from("sesje")
    .select("lokal_id, tylko_glowny, faza")
    .eq("id", sesjaId)
    .maybeSingle<{ lokal_id: string | null; tylko_glowny: boolean; faza: string }>();
  if (!data || data.lokal_id !== lokal) notFound();
  // zakończona gra Bractwa w swoim lokalu: lokal ogląda wyniki i pobiera grafiki, ale nic nie zmienia (28.10)
  if (data.tylko_glowny) {
    if (podglad && data.faza === "koniec") return { gosc: true };
    notFound();
  }
  return { gosc: false };
}

/** Ustawienia lokalu: główny każdego, lokal tylko swojego. */
export function wymagajLokalu(rola: Rola, lokalId: string): void {
  const lokal = lokalRoli(rola);
  if (lokal && lokal !== lokalId) notFound();
}
