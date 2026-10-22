// Limity pól quizu i zadania. Wspólne dla formularzy i walidacji w Server Actions.
export const LIMITY = {
  tytul: 120,
  opis: 500,
  tresc: 300,
  odpowiedz: 120,
  minOdpowiedzi: 2,
  maxOdpowiedzi: 6,
  minCzas: 5,
  maxCzas: 300,
  /** Do wyboru przy uruchamianiu gry; `null` = bez limitu. */
  czasyGry: [10, 20, 30, 45, null] as (number | null)[],
  domyslnyCzas: 20,
} as const;

/** „1 pytanie”, „3 pytania”, „5 pytań”. */
export function liczbaPytan(n: number): string {
  if (n === 1) return "1 pytanie";
  const r10 = n % 10;
  const r100 = n % 100;
  return `${n} ${r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14) ? "pytania" : "pytań"}`;
}
