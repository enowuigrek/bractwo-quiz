// Tryb „Pijany finał”: dogrywka po finale serią, która nic nie liczy. Pytania są w tabeli `pijane_pytania`
// (edycja: panel → Quizy → Pijany finał) w dwóch grupach: piwne lecą najpierw, potem reszta, w każdej losowo.
// Każde ma komentarze po ✓ i ✗. Przeszkadzacze nie zależą od pytania: idą zawsze w tej samej, narastającej
// kolejności według pozycji w dogrywce (`KOLEJNOSC_EFEKTOW`), a cały ekran telefonu faluje coraz mocniej z upływem
// czasu. Wstawki w treści: {za_barem} (pole w kreatorze gry) i {lokal}.

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

/**
 * Przeszkadzacz na kolejnych pozycjach dogrywki (od 0: pierwsze pytanie po finale), niezależnie od pytania, żeby
 * zawsze narastało tak samo: na starcie spokojnie (wejście quizu), potem pojedyncze utrudnienia, na końcu chaos.
 */
export const KOLEJNOSC_EFEKTOW: readonly EfektPijany[] = [
  "brak",
  "brak",
  "drzenie",
  "brak",
  "odwrocone_kolory",
  "pion",
  "drzenie",
  "mgla",
  "samoklik",
  "ucieczka",
  "odwrocone_kolory",
  "obrot",
  "mgla",
  "ucieczka",
  "pion",
  "obrot",
];

/** Przeszkadzacz pytania na pozycji `i`; za listą już tylko chaos. */
export function efektNaPozycji(i: number): EfektPijany {
  return KOLEJNOSC_EFEKTOW[i] ?? "chaos";
}

/**
 * Pytanie pijanego finału, jak wydaje je baza (`pijane_pytania`), z podstawionymi wstawkami. Komentarze
 * przelatują przez ekran po odpowiedzi ✓ albo ✗ (bez własnego: czasem losowy z `KOMENTARZE_OGOLNE`).
 * `piwne` ma tylko wspólna pula w panelu (grupa, która leci najpierw).
 */
export type PijanePytanie = {
  nr: number;
  tresc: string;
  komentarz_prawda: string | null;
  komentarz_falsz: string | null;
  piwne?: boolean;
};

/** `pytan`: wspólna pula, `wejscie`: pytania wejścia jednego quizu (lecą przed pulą). */
export const LIMITY_PIJANE = { pytan: 60, wejscie: 5, tresc: 200, komentarz: 80 } as const;

/** Komentarze do pytań bez własnego komentarza po danej odpowiedzi (wszystkie z 25.10 mają własne). */
export const KOMENTARZE_OGOLNE = [
  "Serio?",
  "Na pewno?",
  "Hmm…",
  "Odważnie.",
  "Ta, jasne.",
  "Zapisuję…",
  "Barman widział.",
  "Tak myślałem.",
  "Sprawdzam…",
  "Nie wierzę.",
  "Dobrze ci idzie. Chyba.",
  "Jeszcze raz?",
] as const;

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
export const GASNIECIE_S = 7.5;
export const WYBUCH_PRZED_S = 3;

/**
 * Wideo pękającej szklanki na koniec dogrywki (TV, `ekran/_ekran/pijany.tsx`). Pilot (`werble`) skraca fazę
 * do `teraz + 9 s` (`WYLEWANIE_S`, musi się zgadzać z bazą), więc i wtedy mieści się gaśnięcie, cisza i wybuch.
 * Między zgaszeniem telefonów a wybuchem 4,5 s ciszy (24.10: 2,5 s to było za szybko).
 * TV startuje klip tak, żeby wybuch (`WYBUCH_S` klipu) wypadł `WYBUCH_PRZED_S` przed końcem fazy.
 * Nowy klip wystarczy podmienić w `public/wideo/pekniecie.mp4`, a przy innym momencie wybuchu zmienić `WYBUCH_S`.
 */
export const WYLEWANIE_S = 9;
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
