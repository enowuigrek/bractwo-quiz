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
  /** Ile odpowiedzi w finale serią (każdy dostaje inną liczbę pytań z puli). */
  wSerii: number;
  /** Odpadł po etapie: który, jak się nazywał i na którym miejscu wtedy był (`odpadniecia`). */
  odpadl: { etap: number; nazwa: string; miejsce: number } | null;
  /** Średni czas odpowiedzi (dobrych i złych), null gdy gracz nic nie odpowiedział. */
  sredniCzasMs: number | null;
  /** Kiedy gracz potwierdził odbiór nagrody (null: nie odebrał albo bez nagrody). */
  nagrodaOdebrana: string | null;
  /** Selfie (znika po 7 dniach). */
  zdjecie: string | null;
};

export type ZadanieGry = {
  id: string;
  nr: number;
  tresc: string;
  czas_s: number | null;
  /** Pytanie z puli serii (finał): każdy dostaje swoje w swojej kolejności (`etapy.seria`). */
  zSerii: boolean;
} & ZadanieDane;

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
    .select("id, nr, tresc, czas_s, typ, dane, etapy(seria)")
    .eq("quiz_id", quizId)
    .lte("nr", doNr)
    .order("nr")
    .returns<(Omit<ZadanieGry, "zSerii"> & { etapy: { seria: boolean } | null })[]>();
  return (data ?? []).map(({ etapy, ...z }) => ({ ...z, zSerii: !!etapy?.seria }) as ZadanieGry);
}

/**
 * Tabela końcowa: wszyscy gracze gry z punktami, miejscem i liczbą dobrych odpowiedzi. `kod`: miejsca jak na TV
 * (`ranking`, po finale pierwsze miejsca daje wyścig, nie punkty; 28.10). `zadaniaSerii`: pytania z puli finału,
 * żeby policzyć, na ile z nich gracz odpowiedział.
 */
export async function wynikiGry(
  db: SupabaseClient,
  sesjaId: string,
  opcje: { kod?: string; zadaniaSerii?: Set<string> } = {},
): Promise<WynikGracza[]> {
  const [{ data: gracze }, { data: odpowiedzi }, { data: ranking }, { data: odpadli }] = await Promise.all([
    db
      .from("gracze")
      .select("id, nick, nagroda_odebrana, zdjecie_url")
      .eq("sesja_id", sesjaId)
      .returns<{ id: string; nick: string; nagroda_odebrana: string | null; zdjecie_url: string | null }[]>(),
    db
      .from("odpowiedzi")
      .select("gracz_id, zadanie_id, czas_ms, poprawna, punkty")
      .eq("sesja_id", sesjaId)
      .returns<Pick<OdpowiedzGracza, "gracz_id" | "zadanie_id" | "czas_ms" | "poprawna" | "punkty">[]>(),
    opcje.kod ? db.rpc("ranking", { p_kod: opcje.kod }) : Promise.resolve({ data: null }),
    db.rpc("odpadniecia", { p_sesja_id: sesjaId }),
  ]);
  const odpadlGracz = new Map(
    ((odpadli ?? []) as { gracz_id: string; etap_nr: number; etap_nazwa: string; miejsce: number }[]).map((o) => [
      o.gracz_id,
      { etap: o.etap_nr, nazwa: o.etap_nazwa, miejsce: Number(o.miejsce) },
    ]),
  );
  // `ranking` zwraca jsonb: tablicę wierszy jak na TV
  const wierszeRankingu = (Array.isArray(ranking) ? ranking : []) as { nick: string; miejsce: number }[];
  const miejsceZRankingu = new Map<string, number>(wierszeRankingu.map((r) => [r.nick, r.miejsce]));

  const wiersze = (gracze ?? []).map((g) => {
    const jego = (odpowiedzi ?? []).filter((o) => o.gracz_id === g.id);
    return {
      id: g.id,
      nick: g.nick,
      punkty: jego.reduce((s, o) => s + o.punkty, 0),
      miejsce: 0,
      dobre: jego.filter((o) => o.poprawna).length,
      odpowiedzi: jego.length,
      wSerii: opcje.zadaniaSerii ? jego.filter((o) => opcje.zadaniaSerii!.has(o.zadanie_id)).length : 0,
      odpadl: odpadlGracz.get(g.id) ?? null,
      sredniCzasMs: jego.length ? jego.reduce((s, o) => s + o.czas_ms, 0) / jego.length : null,
      nagrodaOdebrana: g.nagroda_odebrana,
      zdjecie: g.zdjecie_url,
    };
  });

  if (miejsceZRankingu.size) {
    for (const w of wiersze) w.miejsce = miejsceZRankingu.get(w.nick) ?? wiersze.length;
    wiersze.sort((a, b) => a.miejsce - b.miejsce || b.punkty - a.punkty || a.nick.localeCompare(b.nick, "pl"));
    return wiersze;
  }
  wiersze.sort((a, b) => b.punkty - a.punkty || a.nick.localeCompare(b.nick, "pl"));
  wiersze.forEach((w, i) => {
    w.miejsce = i > 0 && wiersze[i - 1].punkty === w.punkty ? wiersze[i - 1].miejsce : i + 1;
  });
  return wiersze;
}

/** Gracz usunięty przez prowadzącego w trakcie gry: wynik zapisany przed usunięciem (`gracze_usunieci`, 28.10). */
export type UsunietyGracz = {
  nick: string;
  punkty: number;
  dobre: number;
  odpowiedzi: number;
  miejsce: number | null;
  zadanie_nr: number | null;
  usunieto: string;
};

export async function usunieciGry(db: SupabaseClient, sesjaId: string): Promise<UsunietyGracz[]> {
  const { data } = await db
    .from("gracze_usunieci")
    .select("nick, punkty, dobre, odpowiedzi, miejsce, zadanie_nr, usunieto")
    .eq("sesja_id", sesjaId)
    .order("usunieto")
    .returns<UsunietyGracz[]>();
  return data ?? [];
}
