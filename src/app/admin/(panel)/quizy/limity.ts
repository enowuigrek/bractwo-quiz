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
} as const;
