// Odpowiedzi funkcji gry (RPC) tak, jak widzą je przeglądarki.

/** Faza widziana przez klientów: `przygotuj` to `pytanie` przed `faza_od`. */
export type FazaWidoczna =
  | "poczekalnia"
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
  typ: "wybor";
  tresc: string;
  grafika_url: string | null;
  /** `null`: bez limitu czasu. */
  czas_s: number | null;
  /** `poprawna` pojawia się dopiero od fazy `wynik`. */
  dane: { odpowiedzi: string[]; poprawna?: number };
  /** Statystyki, od fazy `wynik`: ile osób wybrało każdą odpowiedź. */
  rozklad?: number[] | null;
  liczba_poprawnych?: number;
  najszybszy?: { nick: string; czas_ms: number } | null;
};

export type StanSesji = {
  kod: string;
  tryb: "solo" | "druzyny";
  okazja: string | null;
  grafika_url: string | null;
  bonus_czas: boolean;
  max_graczy: number;
  lokal: { nazwa: string; miasto: string | null; logo_url: string | null } | null;
  quiz: { tytul: string; liczba_zadan: number } | null;
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
  poprawna: number | null;
  ostatnie_zadanie: boolean;
};

export type AkcjaPilota = "nastepne" | "wynik" | "odpowiedzi" | "ranking" | "podium" | "tabela" | "koniec";

export type Dolaczenie = { token: string; nick: string; powrot: boolean };

/** Odpowiedź `zapisz_odpowiedz`. Nie mówi, czy odpowiedź jest poprawna. */
export type ZapisOdpowiedzi =
  | { przyjeta: true; czas_ms: number }
  | { przyjeta: false; powod: "nie_teraz" | "inne_zadanie" | "za_wczesnie" | "po_czasie" | "juz_odpowiedziano" };

/** `moj_wynik`: odpowiedź gracza na bieżące zadanie, suma punktów i miejsce. */
export type MojWynik = {
  kod: string;
  nick: string;
  faza: FazaWidoczna;
  zadanie_nr: number;
  /** `poprawna` i `punkty` dopiero od fazy `wynik`. */
  odpowiedz: { dane: { odpowiedz?: number }; czas_ms: number; poprawna?: boolean; punkty?: number } | null;
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
  dane: { odpowiedz?: number } | null;
  poprawna: boolean | null;
  czas_ms: number | null;
  punkty: number | null;
};

/** Wiersz funkcji `ranking`. `poprzednie_miejsce` i `zdobyte` dotyczą ostatniego jawnego pytania. */
export type WierszRankingu = {
  nick: string;
  punkty: number;
  miejsce: number;
  poprzednie_miejsce: number;
  zdobyte: number;
};
