// Tryb „Pijany finał”: dogrywka po finale serią, która nic nie liczy. Pytania są w tabeli `pijane_pytania`
// (edycja: panel → Quizy → Pijany finał), a każde ma swój przeszkadzacz. Do tego cały ekran telefonu faluje
// coraz mocniej z każdym pytaniem. Wstawki w treści: {za_barem} (pole w kreatorze gry) i {lokal}.

export const EFEKTY_PIJANE = {
  brak: "bez dodatkowego (tylko falowanie)",
  drzenie: "pytanie drży",
  odwrocone_kolory: "✓ czerwone, ✗ zielone",
  pion: "przyciski jeden nad drugim",
  samoklik: "„Fałsz” maleje i znika, „Prawda” klika się sama",
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

/**
 * Sekundy na zegarze w pijanym finale (TV i telefon pokazują to samo, bo liczą z czasu serwera). Zegar
 * coraz bardziej wariuje: najpierw liczy normalnie w dół, potem leci w górę, potem co chwilę zmienia
 * kierunek, a pod koniec miga przypadkowymi liczbami i znika. `null`: w tej sekundzie zegara nie ma.
 * `minelo` i `calosc` w sekundach (cała dogrywka: `faza_do` − `faza_od`).
 */
export function zegarPijany(minelo: number, calosc: number): number | null {
  const s = Math.max(0, Math.floor(minelo));
  const [gora, zakrety, miganie] = [0.2, 0.45, 0.75].map((u) => Math.round(u * calosc));
  if (s < gora) return calosc - s;
  // w górę od miejsca, w którym przestał liczyć w dół
  const odGory = calosc - gora;
  if (s < zakrety) return odGory + (s - gora);
  // zmiany kierunku: 4 s w dół, 2 s w górę, i tak w kółko (powoli schodzi)
  const odZakretow = odGory + (zakrety - gora);
  if (s < miganie) {
    const k = s - zakrety;
    const r = k % 6;
    return Math.max(1, odZakretow - 2 * Math.floor(k / 6) - (r < 4 ? r : 6 - r));
  }
  // co druga sekunda pusto, w pozostałych liczby z kosmosu
  return s % 2 ? null : (s * 37) % 100;
}
