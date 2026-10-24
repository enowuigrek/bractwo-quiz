// Tryb „Pijany finał”: dogrywka po finale serią, która nic nie liczy. Pytania są w tabeli `pijane_pytania`
// (edycja: panel → Quizy → Pijany finał), a każde ma swój przeszkadzacz i komentarze po ✓ i ✗. Do tego cały
// ekran telefonu faluje coraz mocniej z upływem czasu. Wstawki w treści: {za_barem} (pole w kreatorze gry) i {lokal}.

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

/**
 * Pytanie pijanego finału, jak wydaje je baza (`pijane_pytania`), z podstawionymi wstawkami. Komentarze
 * przelatują przez ekran po odpowiedzi ✓ albo ✗ (bez własnego: czasem losowy z `KOMENTARZE_OGOLNE`).
 */
export type PijanePytanie = {
  nr: number;
  tresc: string;
  efekt: EfektPijany;
  komentarz_prawda: string | null;
  komentarz_falsz: string | null;
};

export const LIMITY_PIJANE = { pytan: 40, tresc: 200, komentarz: 80 } as const;

/** Komentarze do pytań bez własnego (do uzupełnienia razem z nowymi pytaniami). */
export const KOMENTARZE_OGOLNE = ["Serio?", "Na pewno?", "Hmm…", "Odważnie.", "Ta, jasne.", "Zapisuję…"] as const;

/**
 * Ile trwa reakcja na odpowiedź w pijanym finale (przyciski stoją zablokowane): 1 s na starcie, 3,5 s
 * pod koniec. Dzięki temu nie da się przeklikać dogrywki, a pod koniec to celowo irytuje.
 */
export function czasReakcjiPijanej(poziom: number): number {
  return Math.round(1000 + 2500 * Math.min(1, Math.max(0, poziom)));
}

/**
 * Pijany finał trwa stałe 60 s (`wewn.zakoncz_serie`), a koniec idzie według zegara serwera, wszystkim naraz:
 * `GASNIECIE_S` przed końcem telefony gasną z błyskiem i urywa się muzyka na TV, `WYBUCH_PRZED_S` przed
 * końcem szklanka wybucha w wideo na TV, a z końcem fazy przychodzą werble.
 */
export const GASNIECIE_S = 5.5;
export const WYBUCH_PRZED_S = 3;

/**
 * Wideo pękającej szklanki na koniec dogrywki (TV, `ekran/_ekran/pijany.tsx`). Pilot (`werble`) skraca fazę
 * do `teraz + 7 s` (`WYLEWANIE_S`, musi się zgadzać z bazą), więc i wtedy mieści się gaśnięcie, cisza i wybuch.
 * TV startuje klip tak, żeby wybuch (`WYBUCH_S` klipu) wypadł `WYBUCH_PRZED_S` przed końcem fazy.
 * Nowy klip wystarczy podmienić w `public/wideo/pekniecie.mp4`, a przy innym momencie wybuchu zmienić `WYBUCH_S`.
 */
export const WYLEWANIE_S = 7;
export const WIDEO_WYLEWANIA = "/wideo/pekniecie.mp4";
/** Sekunda klipu, w której szklanka wybucha: wtedy interfejs TV się rozpada (nagłówek w górę, awatary na boki). */
export const WYBUCH_S = 1.5;

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
