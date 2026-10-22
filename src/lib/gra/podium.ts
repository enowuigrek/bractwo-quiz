// Wspólne czasy podium dla TV i telefonów: telefon odsłania miejsce dopiero wtedy,
// gdy TV pokazuje ten stopień, żeby nie psuć napięcia.

/** Po ilu sekundach od wejścia w fazę `podium` wjeżdża stopień (indeks = miejsce − 1): 3. → 2. → 1. */
export const WJAZD_PODIUM_S = [3.4, 1.8, 0.6] as const;

/** Po ilu sekundach pokazujemy miejsca od 4. w dół. */
export const RESZTA_PODIUM_S = WJAZD_PODIUM_S[0] + 1.2;

/** Kiedy (s od początku podium) gracz z danym miejscem może zobaczyć swój wynik. */
export function odslonaPodiumS(miejsce: number): number {
  return miejsce >= 1 && miejsce <= 3 ? WJAZD_PODIUM_S[miejsce - 1] : RESZTA_PODIUM_S;
}
