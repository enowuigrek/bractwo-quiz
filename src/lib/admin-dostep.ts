import "server-only";
import { notFound } from "next/navigation";
import { lokalRoli, ukryteLokale, widziWszystko, jestTworca, type Rola } from "./admin";
import { supabaseAdmin } from "./supabase/serwer";

// Kto co widzi w panelu (od 26.10, konta od 30.10). Twórca: wszystko. Bractwo: wszystko poza lokalem testowym
// (`lokale.testowy`, Kwadrat). Quiz jest prywatny (widzi go tylko autor i twórca) albo udostępniony
// (`quizy.udostepniony`, oko na liście, 30.10). Lokal:
// - quizy: swojego lokalu do zmian, a udostępnione quizy Bractwa (`lokal_id` null) tylko do grania i podglądu;
// - gry: rozegrane w swoim lokalu; gry Bractwa (`tylko_glowny`) w swoim lokalu tylko na listach, do podglądu
//   i zwolnienia ekranu przed startem (28.10), bez pilota i strony gry;
// - lokale: tylko swój (logo, Instagram, hasło).
// Strona bez dostępu pokazuje 404, a akcja kończy się błędem. Listy filtrują `filtrQuizow` / `filtrGier`.

type ZFiltrem<Q> = { or(filtr: string): Q };

/** Filtr PostgREST dla Bractwa: bez lokalu testowego. */
function filtrBractwa(rola: Rola): string {
  const ukryte = ukryteLokale(rola);
  return ukryte.length ? `lokal_id.is.null,lokal_id.not.in.(${ukryte.join(",")})` : "lokal_id.is.null,lokal_id.not.is.null";
}

/** Rzecz z lokalu, którego rola nie widzi (Bractwo i lokal testowy). */
const ukryteDlaBractwa = (rola: Rola, d: { lokal_id: string | null }) =>
  !!d.lokal_id && ukryteLokale(rola).includes(d.lokal_id);

/** Lokale na listach i w filtrach: lokal testowy widzi tylko twórca. */
export function filtrLokaliRoli<Q>(zapytanie: Q, rola: Rola): Q {
  // bez ograniczenia typu: pełny typ zapytania Supabase w ograniczeniu generyka przekracza głębokość TS
  return jestTworca(rola) ? zapytanie : (zapytanie as unknown as { eq(k: string, w: boolean): Q }).eq("testowy", false);
}

/**
 * Konta twórcy, których rola nie widzi wśród osób lokalu (30.10, Łukasz: ma dostęp do lokali, żeby pomagać, ale
 * przed ludźmi jest tylko Bractwem). Twórca widzi wszystkich.
 */
export async function ukryteOsobyLokali(rola: Rola): Promise<string[]> {
  if (jestTworca(rola)) return [];
  const { data } = await supabaseAdmin().from("konta_role").select("konto_id").eq("rola", "tworca");
  return (data ?? []).map((r) => r.konto_id as string);
}

/** Widzi go: udostępniony albo własny (autor). */
const widocznyQuiz = (rola: Rola) => `or(udostepniony.is.true,autor_konto_id.eq.${rola.konto.id})`;

/** Quizy, które rola widzi na listach i w kreatorze (`wlasne`: tylko te, które może zmieniać, np. w koszu). */
export function filtrQuizow<Q extends ZFiltrem<Q>>(zapytanie: Q, rola: Rola, wlasne = false): Q {
  const lokal = lokalRoli(rola);
  if (jestTworca(rola)) return zapytanie;
  if (!lokal) return zapytanie.or(`and(${widocznyQuiz(rola)},or(${filtrBractwa(rola)}))`);
  const swoje = `and(lokal_id.eq.${lokal},${widocznyQuiz(rola)})`;
  return zapytanie.or(wlasne ? swoje : `${swoje},and(lokal_id.is.null,udostepniony.is.true)`);
}

/**
 * Gry, które rola widzi na listach. `zBractwa`: lokal widzi też gry Bractwa (`tylko_glowny`) w swoim lokalu, bo
 * zajmują jego ekran (tylko listy rozgrywek; menu ze skrótem do pilota ich nie bierze).
 */
export function filtrGier<Q extends ZFiltrem<Q>>(zapytanie: Q, rola: Rola, zBractwa = false): Q {
  const lokal = lokalRoli(rola);
  if (jestTworca(rola)) return zapytanie;
  if (!lokal) return zapytanie.or(filtrBractwa(rola));
  return zapytanie.or(zBractwa ? `lokal_id.eq.${lokal}` : `and(lokal_id.eq.${lokal},tylko_glowny.is.false)`);
}

/**
 * Dostęp do quizu. `podglad`: wystarczy móc go oglądać i grać (quiz Bractwa u lokalu), inaczej trzeba móc go
 * zmieniać. Zwraca, czy rola może quiz zmieniać.
 */
export async function wymagajQuizu(rola: Rola, quizId: string, podglad = false): Promise<{ mozeZmieniac: boolean }> {
  if (jestTworca(rola)) return { mozeZmieniac: true };
  const lokal = lokalRoli(rola);
  const { data } = await supabaseAdmin()
    .from("quizy")
    .select("lokal_id, udostepniony, autor_konto_id")
    .eq("id", quizId)
    .maybeSingle<{ lokal_id: string | null; udostepniony: boolean; autor_konto_id: string | null }>();
  // prywatny quiz widzi tylko autor (i twórca)
  if (!data || (!data.udostepniony && data.autor_konto_id !== rola.konto.id)) notFound();
  if (!lokal) {
    if (ukryteDlaBractwa(rola, data)) notFound();
    return { mozeZmieniac: true };
  }
  if (data.lokal_id === lokal) return { mozeZmieniac: true };
  if (podglad && data.lokal_id === null) return { mozeZmieniac: false };
  notFound();
}

export async function wymagajGry(rola: Rola, sesjaId: string, podglad = false): Promise<{ gosc: boolean }> {
  if (jestTworca(rola)) return { gosc: false };
  const lokal = lokalRoli(rola);
  const { data } = await supabaseAdmin()
    .from("sesje")
    .select("lokal_id, tylko_glowny, faza")
    .eq("id", sesjaId)
    .maybeSingle<{ lokal_id: string | null; tylko_glowny: boolean; faza: string }>();
  if (!lokal) {
    if (!data || ukryteDlaBractwa(rola, data)) notFound();
    return { gosc: false };
  }
  if (!data || data.lokal_id !== lokal) notFound();
  // zakończona gra Bractwa w swoim lokalu: lokal ogląda wyniki i pobiera grafiki, ale nic nie zmienia (28.10)
  if (data.tylko_glowny) {
    if (podglad && data.faza === "koniec") return { gosc: true };
    notFound();
  }
  return { gosc: false };
}

/** Ustawienia lokalu: twórca każdego, Bractwo każdego poza testowym, lokal tylko swojego. */
export function wymagajLokalu(rola: Rola, lokalId: string): void {
  const lokal = lokalRoli(rola);
  if (lokal && lokal !== lokalId) notFound();
  if (widziWszystko(rola) && ukryteLokale(rola).includes(lokalId)) notFound();
}

/**
 * Profil osoby (30.10): twórca i Bractwo oglądają wszystkich, lokal tylko ludzi ze swojego lokalu. Dla innych 404.
 * Siebie każdy może obejrzeć.
 */
export async function wymagajOsoby(rola: Rola, kontoId: string): Promise<void> {
  if (widziWszystko(rola) || rola.konto.id === kontoId) return;
  const lokal = lokalRoli(rola);
  const { data } = await supabaseAdmin()
    .from("konta_role")
    .select("id")
    .eq("konto_id", kontoId)
    .eq("rola", "lokal")
    .eq("lokal_id", lokal ?? "")
    .limit(1);
  if (!data?.length) notFound();
}
