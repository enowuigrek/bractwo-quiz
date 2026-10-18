// Odpowiedzi funkcji gry (RPC) tak, jak widzą je przeglądarki.

/** Faza widziana przez klientów: `przygotuj` to `pytanie` przed `faza_od`. */
export type FazaWidoczna = "poczekalnia" | "przygotuj" | "pytanie" | "wynik" | "ranking" | "podium" | "koniec";

export type ZadanieWidoczne = {
  id: string;
  nr: number;
  /** Numer kolejny w quizie (numeracja `nr` może mieć dziury). */
  lp: number;
  typ: "wybor";
  tresc: string;
  grafika_url: string | null;
  czas_s: number;
  /** `poprawna` pojawia się dopiero od fazy `wynik`. */
  dane: { odpowiedzi: string[]; poprawna?: number };
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
  /** Zegar serwera w chwili odpowiedzi. */
  teraz: string;
};

export type PilotStan = StanSesji & {
  poprawna: number | null;
  liczba_odpowiedzi: number;
  ostatnie_zadanie: boolean;
};

export type AkcjaPilota = "nastepne" | "wynik" | "ranking" | "podium" | "koniec";

export type Dolaczenie = { token: string; nick: string; powrot: boolean };
