/**
 * Hasła kibiców w serii finału (ustalone z Łukaszem 23.10, na stałe w kodzie). W bazie (`okrzyki.haslo`)
 * jest tylko numer hasła 0..7, więc kolejności nie zmieniamy, a nowe hasło wymaga też zmiany `check` w bazie.
 * Każde hasło to tekst przed awatarem finalisty i po nim: „Dawaj [awatar]!”.
 */
export const HASLA: readonly (readonly [string, string])[] = [
  ["Dawaj ", "!"],
  ["", ", piwo czeka!"],
  ["Biegnij, ", "!"],
  ["Wierzę w ", "!"],
  ["Jeszcze trochę, ", "!"],
  ["", " po złoto!"],
  ["Nie zawiedź, ", "!"],
  ["Jedziesz, ", "!"],
];

/** Najwyżej jeden okrzyk na tyle ms na kibica (pilnuje `kibicuj` w bazie). */
export const ODSTEP_OKRZYKOW_MS = 3000;
