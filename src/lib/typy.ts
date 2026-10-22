// Wiersze tabel tak, jak widzi je panel admina (klucz serwisowy).

export type Lokal = {
  id: string;
  nazwa: string;
  miasto: string | null;
  logo_url: string | null;
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
