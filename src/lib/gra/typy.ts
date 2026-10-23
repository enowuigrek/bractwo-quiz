// Odpowiedzi funkcji gry (RPC) tak, jak widzą je przeglądarki.

import type { Nagroda } from "../typy";
import type { DaneOdpowiedzi, DaneWidoczne, TypZadania } from "../zadania";

export type { Nagroda };

/** Faza widziana przez klientów: `przygotuj` to `pytanie` przed `faza_od`. */
export type FazaWidoczna =
  | "poczekalnia"
  | "etap"
  | "przygotuj"
  | "pytanie"
  | "wynik"
  | "odpowiedzi"
  | "ranking"
  | "podium"
  | "tabela"
  | "koniec";

export type ZadanieWidoczne = {
  id: string;
  nr: number;
  /** Numer kolejny w quizie (numeracja `nr` może mieć dziury). */
  lp: number;
  typ: TypZadania;
  tresc: string;
  grafika_url: string | null;
  /** `null`: bez limitu czasu. */
  czas_s: number | null;
  /** `poprawna` pojawia się dopiero od fazy `wynik`. Kształt zależy od typu (src/lib/zadania.ts). */
  dane: DaneWidoczne;
  /** Podpowiedzi, które już się odsłoniły (kolejna co `podpowiedzi_co_s` od startu pytania). */
  podpowiedzi: string[];
  liczba_podpowiedzi: number;
  podpowiedzi_co_s: number | null;
  /**
   * Statystyki, od fazy `wynik`: ile osób wybrało każdą odpowiedź,
   * a w szacowaniu wszystkie podane liczby (rosnąco, bez nicków).
   */
  rozklad?: number[] | null;
  liczba_poprawnych?: number;
  najszybszy?: { nick: string; czas_ms: number } | null;
  /** Szacowanie: do trzech graczy najbliżej poprawnej liczby. */
  najblizej?: { nick: string; liczba: number }[] | null;
};

/** Etap quizu (tabela `etapy`): plansza przed pierwszym pytaniem, mnożnik punktów, czas, finał trójki. */
export type EtapWidoczny = {
  id: string;
  /** Numer etapu 1..liczba. */
  nr: number;
  liczba: number;
  nazwa: string;
  opis: string | null;
  mnoznik: number;
  /** Czas na odpowiedź w etapie (z etapu albo gry), null: bez limitu. */
  czas_s: number | null;
  /** Finał: odpowiadają tylko trzej najlepsi (`StanSesji.finalisci`). */
  finalowy: boolean;
  liczba_pytan: number;
  /** Rodzaje pytań w etapie, w kolejności pierwszego wystąpienia. */
  typy: TypZadania[];
};

export type StanSesji = {
  kod: string;
  tryb: "solo" | "druzyny";
  okazja: string | null;
  grafika_url: string | null;
  bonus_czas: boolean;
  /** Nagrody za miejsca (null: bez nagród). Nie są tajne. */
  nagrody: Nagroda[] | null;
  /** Gościnny browar (kranoprzejęcie): logo obok Bractwa i lokalu. */
  browar: { nazwa: string; logo_url: string | null; instagram?: string | null } | null;
  /** Zapowiedź: planowana godzina startu (null: bez zapowiedzi). */
  planowany_start: string | null;
  /** Fałsz: gra zapowiedziana, TV pokazuje godzinę i odliczanie zamiast QR, dołączać jeszcze nie można. */
  poczekalnia_otwarta: boolean;
  /** Ranking po pytaniu na TV: tabela albo wyścig (src/lib/gra/wyscig.ts). */
  widok_rankingu: "tabela" | "wyscig";
  max_graczy: number;
  lokal: { nazwa: string; miasto: string | null; logo_url: string | null; instagram?: string | null } | null;
  quiz: { tytul: string; liczba_zadan: number; liczba_etapow: number } | null;
  /** Etap bieżącego pytania, a w fazie `etap` ten, który się zaczyna (null: quiz bez etapów). */
  etap: EtapWidoczny | null;
  /** Finał trójki: kto odpowiada (null: wszyscy). */
  finalisci: GraczNaLiscie[] | null;
  faza: FazaWidoczna;
  faza_od: string | null;
  faza_do: string | null;
  zadanie: ZadanieWidoczne | null;
  liczba_graczy: number;
  /** Ile osób odpowiedziało na bieżące zadanie. */
  liczba_odpowiedzi: number;
  /** Zegar serwera w chwili odpowiedzi. */
  teraz: string;
};

export type PilotStan = StanSesji & {
  /** Rozwiązanie bieżącego zadania (kształt jak `dane.poprawna`). */
  poprawna: number | number[] | null;
  ostatnie_zadanie: boolean;
  /** Rodzaj następnego pytania (null po ostatnim): prowadzący uprzedza graczy przed startem. */
  nastepne_typ: TypZadania | null;
  /** Następne pytanie zaczyna nowy etap (null: ten sam etap albo quiz bez etapów). */
  nastepny_etap: EtapWidoczny | null;
  /** Wszystkie podpowiedzi bieżącego pytania (prowadzący widzi je od początku). */
  wszystkie_podpowiedzi: string[];
};

/** Wiersz `pilot_gracze`: token służy do QR, którym gracz wraca do gry na innym telefonie. */
export type GraczPilota = {
  nick: string;
  zdjecie: string | null;
  token: string;
  punkty: number;
  odpowiedzial: boolean;
};

export type AkcjaPilota =
  "otworz" | "nastepne" | "wynik" | "odpowiedzi" | "ranking" | "podium" | "tabela" | "koniec" | "plansze";

/** Wiersz `lista_graczy`: nick i adres selfie (null: bez zdjęcia). */
export type GraczNaLiscie = { nick: string; zdjecie: string | null };

export type Dolaczenie = { token: string; nick: string; powrot: boolean };

/** Odpowiedź `zapisz_odpowiedz`. Nie mówi, czy odpowiedź jest poprawna. */
export type ZapisOdpowiedzi =
  | { przyjeta: true; czas_ms: number }
  | {
      przyjeta: false;
      powod: "nie_teraz" | "inne_zadanie" | "za_wczesnie" | "po_czasie" | "juz_odpowiedziano" | "kibic";
    };

/** `moj_wynik`: odpowiedź gracza na bieżące zadanie, suma punktów i miejsce. */
export type MojWynik = {
  kod: string;
  nick: string;
  zdjecie: string | null;
  faza: FazaWidoczna;
  zadanie_nr: number;
  /** `poprawna` i `punkty` dopiero od fazy `wynik`. */
  odpowiedz: { dane: DaneOdpowiedzi; czas_ms: number; poprawna?: boolean; punkty?: number; ocena?: number } | null;
  /** Kiedy obsługa potwierdziła odbiór nagrody (null: jeszcze nie). */
  nagroda_odebrana: string | null;
  punkty: number;
  miejsce: number;
  liczba_graczy: number;
};

/**
 * Wiersz funkcji `odpowiedzi_zadania` (od fazy `wynik`): kto i jak odpowiedział na bieżące zadanie.
 * Kolejność z bazy: dobre od najszybszej, złe od najszybszej, bez odpowiedzi (`poprawna` = null).
 */
export type WierszOdpowiedzi = {
  nick: string;
  zdjecie: string | null;
  dane: DaneOdpowiedzi | null;
  poprawna: boolean | null;
  /** Ocena 0..1 (częściowa w nowych typach). */
  ocena: number | null;
  czas_ms: number | null;
  punkty: number | null;
};

/** Wiersz funkcji `ranking`. `poprzednie_miejsce` i `zdobyte` dotyczą ostatniego jawnego pytania. */
export type WierszRankingu = {
  nick: string;
  zdjecie: string | null;
  punkty: number;
  miejsce: number;
  poprzednie_miejsce: number;
  zdobyte: number;
};
