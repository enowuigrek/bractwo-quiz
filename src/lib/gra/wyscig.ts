// Wyścig zamiast tabeli rankingu. Położenie zależy tylko od własnych punktów w stałej skali (część maksimum
// do zdobycia przed finałem), więc zła odpowiedź = stoisz w miejscu, a szybka dobra = większy krok niż wolna.
// Do 24.10 skala szła za liderem i przesuwała wszystkich, także tych, którzy odpowiedzieli źle.

/** Ile torów mieści wyścig na TV; przy większej liczbie graczy tory ma czołówka, a reszta stoi w pasku pod nimi. */
export const MAX_W_WYSCIGU = 12;

/** Ilu graczy ma tor, gdy wszyscy się nie mieszczą (reszta w pasku małych awatarów). */
export const NA_TORACH_W_TLOKU = 10;

/** Klasyczny pub quiz: quiz bez etapów (bez finału, szklanki i wyścigu, src/lib/tagi.ts). */
export function quizKlasyczny(stan: { quiz: { liczba_etapow: number } | null }): boolean {
  return (stan.quiz?.liczba_etapow ?? 0) === 0;
}

/**
 * Ranking po pytaniu na TV (i szklanka na telefonie): wyścig po piwo przy każdej liczbie graczy (od 24.10;
 * wcześniej powyżej 12 graczy była tabela). Klasyczny pub quiz ma zwykłą tabelę, bez szklanki (26.10).
 */
export function rankingJakoWyscig(stan: { quiz: { liczba_etapow: number } | null }, liczbaGraczy: number): boolean {
  return liczbaGraczy > 0 && !quizKlasyczny(stan);
}

/**
 * Przed finałem nikt nie dobiega do szklanki: komplet punktów (1000 × mnożnik za pytanie) to 90% drogi, żeby lider
 * nie wyglądał na zwycięzcę przed finałem. Do 25.10 szklankę osiągało się przy 75% maksimum i bardzo dobry gracz stał
 * przy niej kilka pytań przed finałem (test: 33 tys. z 41,5 tys. po 27 pytaniach).
 */
const DROGA_PRZED_FINALEM = 0.9;

/** Położenie na trasie 0..1 w zwykłych etapach: tylko z własnych punktów, najwyżej 0,9. */
export function naTrasie(punkty: number, maxPrzedFinalem: number): number {
  if (maxPrzedFinalem <= 0) return 0;
  return DROGA_PRZED_FINALEM * Math.max(0, Math.min(1, punkty / maxPrzedFinalem));
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

/** Tyle szklanki jest nalane po ostatnim pytaniu przed finałem: pełna jest dopiero w finale. */
const NALANE_PRZED_FINALEM = 0.95;

/**
 * Ile szklanki jest nalane po pytaniu `lp` (0..1): według pytań przed finałem (`liczba_przed_finalem`), nie
 * wszystkich, bo pula finału to drugie tyle i szklanka była przed finałem w połowie (26.10, Łukasz). Przed finałem
 * dochodzi do 95%, a pełna jest w finale. Quiz bez finału: według wszystkich pytań, do pełna.
 */
export function nalanieSzklanki(
  quiz: { liczba_zadan: number; liczba_przed_finalem?: number } | null,
  lp: number,
): number {
  const wszystkie = quiz?.liczba_zadan ?? 0;
  const przed = quiz?.liczba_przed_finalem ?? wszystkie;
  if (przed <= 0) return 0;
  const zFinalem = przed < wszystkie;
  return Math.max(0, Math.min(1, (lp / przed) * (zFinalem ? NALANE_PRZED_FINALEM : 1)));
}
