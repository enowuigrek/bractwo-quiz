// Wiersze tabel tak, jak widzi je panel admina (klucz serwisowy).

export type Lokal = {
  id: string;
  nazwa: string;
  miasto: string | null;
  logo_url: string | null;
  /** Stały adres ekranu lokalu: /ekran/<adres_ekranu>. */
  adres_ekranu: string;
  /** Konto na Instagramie (bez @), do oznaczania przy udostępnianiu wyników. */
  instagram?: string | null;
};

export type Quiz = {
  id: string;
  tytul: string;
  opis: string | null;
  utworzono: string;
};

import type { ZadanieDane } from "./zadania";

export type { DaneWybor } from "./zadania";

/** Zadanie quizu: `typ` + `dane` (kształt zależny od typu, patrz src/lib/zadania.ts). */
export type Zadanie = {
  id: string;
  quiz_id: string;
  nr: number;
  tresc: string;
  grafika_url: string | null;
  /** Nieużywane od czasu „czas przy grze” (zostaje w tabeli). */
  czas_s: number | null;
} & ZadanieDane;

/** Nagroda za miejsce w grze. `instrukcja`: jak odebrać, np. „Pokaż ten ekran barmanowi”. */
export type Nagroda = { miejsce: 1 | 2 | 3; nagroda: string; instrukcja: string | null };

export type Faza = "poczekalnia" | "pytanie" | "wynik" | "odpowiedzi" | "ranking" | "podium" | "tabela" | "koniec";

export type Sesja = {
  id: string;
  kod: string;
  quiz_id: string;
  lokal_id: string | null;
  okazja: string | null;
  grafika_url: string | null;
  tryb: "solo" | "druzyny";
  bonus_czas: boolean;
  /** Czas na odpowiedź w s, jeden dla wszystkich pytań; `null`: bez limitu. */
  czas_s: number | null;
  /** Nagrody za miejsca; `null`: bez nagród. */
  nagrody: Nagroda[] | null;
  /** Gościnny browar przy grze (kranoprzejęcie), opcjonalny. */
  browar_nazwa: string | null;
  browar_logo_url: string | null;
  browar_instagram: string | null;
  /** Zapowiedź: planowana godzina startu i czy poczekalnia (QR, dołączanie) jest już otwarta. */
  planowany_start: string | null;
  poczekalnia_otwarta: boolean;
  max_graczy: number;
  faza: Faza;
  zadanie_nr: number;
  faza_od: string | null;
  host_token: string;
  utworzono: string;
};

export const NAZWY_FAZ: Record<Faza, string> = {
  poczekalnia: "poczekalnia",
  pytanie: "pytanie",
  wynik: "wynik",
  odpowiedzi: "odpowiedzi",
  ranking: "ranking",
  podium: "podium",
  tabela: "tabela",
  koniec: "zakończona",
};

/** Stan formularza zwracany przez Server Actions panelu. */
export type StanFormularza = { blad?: string; ok?: string };
