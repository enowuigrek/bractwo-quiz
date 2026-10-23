// Wyścig zamiast tabeli rankingu. Ile zostało liderowi do mety, pokazuje postęp quizu: po pytaniu lp z n
// jest na 12% + 88% · lp/n trasy, więc jedzie równymi krokami i na mecie staje po ostatnim pytaniu
// (wcześniej startował z 55% i potem ledwo się ruszał). Reszta stoi za liderem proporcjonalnie do punktów.

/** Ile torów mieści wyścig na TV; przy większej liczbie graczy zostaje tabela. */
export const MAX_W_WYSCIGU = 12;

/**
 * Ranking po pytaniu na TV (i szklanka na telefonie): w quizie z etapami zawsze wyścig po piwo, o ile gracze
 * mieszczą się na torach; prosty quiz bez etapów pokazuje tabelę. Prowadzący już tego nie wybiera.
 */
export function rankingJakoWyscig(liczbaEtapow: number, liczbaGraczy: number): boolean {
  return liczbaEtapow > 0 && liczbaGraczy > 0 && liczbaGraczy <= MAX_W_WYSCIGU;
}

/** Gdzie jest lider, zanim padnie pierwsze pytanie (część trasy). */
const START_LIDERA = 0.12;

/** Położenie na trasie 0..1. */
export function naTrasie(punkty: number, lider: number, lp: number, liczbaPytan: number): number {
  if (lider <= 0 || liczbaPytan <= 0) return 0;
  const lidera = START_LIDERA + (1 - START_LIDERA) * Math.min(1, lp / liczbaPytan);
  return Math.max(0, Math.min(1, lidera * (punkty / lider)));
}
