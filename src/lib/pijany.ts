// Tryb „Pijany finał”: dogrywka po finale serią, która nic nie liczy. Pytania są w tabeli `pijane_pytania`
// (edycja: panel → Quizy → Pijany finał), a każde ma swój przeszkadzacz. Do tego cały ekran telefonu faluje
// coraz mocniej z każdym pytaniem. Wstawki w treści: {za_barem} (pole w kreatorze gry) i {lokal}.

export const EFEKTY_PIJANE = {
  brak: "bez dodatkowego (tylko falowanie)",
  drzenie: "pytanie drży",
  odwrocone_kolory: "✓ czerwone, ✗ zielone",
  pion: "przyciski jeden nad drugim",
  samoklik: "„Fałsz” maleje i znika, „Prawda” klika się sama, ekran pęka",
  mgla: "pytanie we mgle",
  ucieczka: "przyciski uciekają",
  obrot: "pytanie do góry nogami",
  chaos: "wszystko naraz",
} as const;

export type EfektPijany = keyof typeof EFEKTY_PIJANE;

export function czyEfektPijany(x: unknown): x is EfektPijany {
  return typeof x === "string" && x in EFEKTY_PIJANE;
}

/** Pytanie pijanego finału, jak wydaje je baza (`pijane_pytania`), z podstawionymi wstawkami. */
export type PijanePytanie = { nr: number; tresc: string; efekt: EfektPijany };

export const LIMITY_PIJANE = { pytan: 20, tresc: 200 } as const;
