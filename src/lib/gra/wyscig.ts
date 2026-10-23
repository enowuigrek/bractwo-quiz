// Wyścig zamiast tabeli rankingu. Lider od początku jedzie daleko (ponad połowa trasy), a ile zostało mu
// do mety, pokazuje postęp quizu: po pytaniu lp z n jest na 55% + 45% · lp/n trasy, więc na mecie staje
// po ostatnim pytaniu. Reszta stoi za liderem proporcjonalnie do swoich punktów.

/** Ile torów mieści wyścig na TV; przy większej liczbie graczy zostaje tabela. */
export const MAX_W_WYSCIGU = 12;

/** Gdzie jest lider, zanim padnie pierwsze pytanie (część trasy). */
const START_LIDERA = 0.55;

/** Położenie na trasie 0..1. */
export function naTrasie(punkty: number, lider: number, lp: number, liczbaPytan: number): number {
  if (lider <= 0 || liczbaPytan <= 0) return 0;
  const lidera = START_LIDERA + (1 - START_LIDERA) * Math.min(1, lp / liczbaPytan);
  return Math.max(0, Math.min(1, lidera * (punkty / lider)));
}
