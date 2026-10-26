// Limity pól quizu i zadania. Wspólne dla formularzy i walidacji w Server Actions.
export const LIMITY = {
  tytul: 120,
  opis: 500,
  tresc: 300,
  odpowiedz: 120,
  minOdpowiedzi: 2,
  maxOdpowiedzi: 6,
  maxPodpowiedzi: 4,
  minCzas: 5,
  maxCzas: 300,
  /** Do wyboru przy uruchamianiu gry; `null` = bez limitu (domyślnie: etapy i tak mają własny czas). */
  czasyGry: [null, 20, 30, 45] as (number | null)[],
  domyslnyCzas: null as number | null,
  nagroda: 80,
  instrukcja: 160,
} as const;

/** „1 pytanie”, „3 pytania”, „5 pytań”. */
export function liczbaPytan(n: number): string {
  if (n === 1) return "1 pytanie";
  const r10 = n % 10;
  const r100 = n % 100;
  return `${n} ${r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14) ? "pytania" : "pytań"}`;
}
