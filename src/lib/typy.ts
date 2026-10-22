// Wiersze tabel tak, jak widzi je panel admina (klucz serwisowy).

export type Lokal = {
  id: string;
  nazwa: string;
  miasto: string | null;
  logo_url: string | null;
  /** Stały adres ekranu lokalu: /ekran/<adres_ekranu>. */
  adres_ekranu: string;
};

export type Quiz = {
  id: string;
  tytul: string;
  opis: string | null;
  utworzono: string;
};

/** Dane zadania typu `wybor`. Poprawna odpowiedź to indeks w `odpowiedzi`. */
export type DaneWybor = { odpowiedzi: string[]; poprawna: number };

export type Zadanie = {
  id: string;
  quiz_id: string;
  nr: number;
  typ: "wybor";
  tresc: string;
  grafika_url: string | null;
  /** `null`: bez limitu czasu. */
  czas_s: number | null;
  dane: DaneWybor;
};

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
  max_graczy: number;
  faza: Faza;
  zadanie_nr: number;
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
