// Wyścig zamiast tabeli rankingu. Położenie zależy tylko od własnych punktów w stałej skali (część maksimum
// do zdobycia przed finałem), więc zła odpowiedź = stoisz w miejscu, a szybka dobra = większy krok niż wolna.
// Do 24.10 skala szła za liderem i przesuwała wszystkich, także tych, którzy odpowiedzieli źle.

/** Ile torów mieści wyścig na TV; przy większej liczbie graczy tory ma czołówka, a reszta stoi w pasku pod nimi. */
export const MAX_W_WYSCIGU = 12;

/** Ilu graczy ma tor, gdy wszyscy się nie mieszczą (reszta w pasku małych awatarów). */
export const NA_TORACH_W_TLOKU = 10;

/**
 * Ranking po pytaniu na TV (i szklanka na telefonie): zawsze wyścig po piwo, także w quizie bez etapów i przy
 * dużej grupie (od 24.10; wcześniej powyżej 12 graczy była tabela). Prowadzący tego nie wybiera.
 */
export function rankingJakoWyscig(liczbaGraczy: number): boolean {
  return liczbaGraczy > 0;
}

/**
 * Szklankę osiąga się przy tej części maksimum punktów przed finałem (1000 × mnożnik za pytanie): bardzo dobry
 * gracz staje przy szklance tuż przed finałem, a nie dopiero przy komplecie punktów.
 */
const SKALA_MAKSIMUM = 0.75;

/** Położenie na trasie 0..1 w zwykłych etapach: tylko z własnych punktów. */
export function naTrasie(punkty: number, maxPrzedFinalem: number): number {
  if (maxPrzedFinalem <= 0) return 0;
  return Math.max(0, Math.min(1, punkty / (SKALA_MAKSIMUM * maxPrzedFinalem)));
}

/** Gdzie jest lider, zanim padnie pierwsze pytanie (część trasy). */
const START_LIDERA = 0.12;

/**
 * Finał pytaniami (nie serią): osobny wyścig trójki do szklanki, lider jedzie równo z postępem quizu,
 * reszta za nim proporcjonalnie do punktów.
 */
export function naTrasieFinalu(punkty: number, lider: number, lp: number, liczbaPytan: number): number {
  if (lider <= 0 || liczbaPytan <= 0) return 0;
  const lidera = START_LIDERA + (1 - START_LIDERA) * Math.min(1, lp / liczbaPytan);
  return Math.max(0, Math.min(1, lidera * (punkty / lider)));
}
