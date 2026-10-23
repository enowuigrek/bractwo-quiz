import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DaneOdpowiedzi, ZadanieDane } from "@/lib/zadania";

/** Wiersz tabeli końcowej gry w panelu. */
export type WynikGracza = {
  id: string;
  nick: string;
  punkty: number;
  /** Remisy dzielą miejsce, jak w rankingu na TV. */
  miejsce: number;
  dobre: number;
  odpowiedzi: number;
  /** Średni czas odpowiedzi (dobrych i złych), null gdy gracz nic nie odpowiedział. */
  sredniCzasMs: number | null;
  /** Kiedy gracz potwierdził odbiór nagrody (null: nie odebrał albo bez nagrody). */
  nagrodaOdebrana: string | null;
  /** Selfie (znika po 7 dniach). */
  zdjecie: string | null;
};

export type ZadanieGry = { id: string; nr: number; tresc: string; czas_s: number | null } & ZadanieDane;

export type OdpowiedzGracza = {
  gracz_id: string;
  zadanie_id: string;
  dane: DaneOdpowiedzi;
  czas_ms: number;
  poprawna: boolean;
  /** Ocena 0..1 (częściowa w nowych typach pytań). */
  ocena: number | null;
  punkty: number;
};

/**
 * Pytania rozegrane w grze: zadania quizu do `zadanie_nr`, na którym gra stanęła.
 * Gdy quiz zmieniono po grze, treści są w obecnej wersji (odpowiedzi graczy zostają w bazie).
 */
export async function zadaniaGry(db: SupabaseClient, quizId: string, doNr: number): Promise<ZadanieGry[]> {
  const { data } = await db
    .from("zadania")
    .select("id, nr, tresc, czas_s, typ, dane")
    .eq("quiz_id", quizId)
    .lte("nr", doNr)
    .order("nr")
    .returns<ZadanieGry[]>();
  return data ?? [];
}

/** Tabela końcowa: wszyscy gracze gry z punktami, miejscem i liczbą dobrych odpowiedzi. */
export async function wynikiGry(db: SupabaseClient, sesjaId: string): Promise<WynikGracza[]> {
  const [{ data: gracze }, { data: odpowiedzi }] = await Promise.all([
    db
      .from("gracze")
      .select("id, nick, nagroda_odebrana, zdjecie_url")
      .eq("sesja_id", sesjaId)
      .returns<{ id: string; nick: string; nagroda_odebrana: string | null; zdjecie_url: string | null }[]>(),
    db
      .from("odpowiedzi")
      .select("gracz_id, czas_ms, poprawna, punkty")
      .eq("sesja_id", sesjaId)
      .returns<Pick<OdpowiedzGracza, "gracz_id" | "czas_ms" | "poprawna" | "punkty">[]>(),
  ]);

  const wiersze = (gracze ?? []).map((g) => {
    const jego = (odpowiedzi ?? []).filter((o) => o.gracz_id === g.id);
    return {
      id: g.id,
      nick: g.nick,
      punkty: jego.reduce((s, o) => s + o.punkty, 0),
      miejsce: 0,
      dobre: jego.filter((o) => o.poprawna).length,
      odpowiedzi: jego.length,
      sredniCzasMs: jego.length ? jego.reduce((s, o) => s + o.czas_ms, 0) / jego.length : null,
      nagrodaOdebrana: g.nagroda_odebrana,
      zdjecie: g.zdjecie_url,
    };
  });

  wiersze.sort((a, b) => b.punkty - a.punkty || a.nick.localeCompare(b.nick, "pl"));
  wiersze.forEach((w, i) => {
    w.miejsce = i > 0 && wiersze[i - 1].punkty === w.punkty ? wiersze[i - 1].miejsce : i + 1;
  });
  return wiersze;
}
