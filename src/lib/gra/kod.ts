/** Kod gry: 4 litery (baza losuje bez I i O, ale przyjmujemy każdą literę i pytamy bazę). */
export function poprawnyKod(kod: string): boolean {
  return /^[A-Za-z]{4}$/.test(kod);
}
