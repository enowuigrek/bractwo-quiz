// Szklanka wyścigu po piwo (grafika public/grafiki/szklanka.webp): gdzie w obrazku jest piwo, a gdzie piana.
// Wspólne dla TV (ekran/_ekran/wyscig.tsx) i telefonu ([kod]/moj-wyscig.tsx). Procenty wysokości obrazka od góry.

/** Szczyt czapy piany w pełnej szklance. */
export const GORA = 1;
/** Dno piwa. */
export const DNO = 92;
/** Krawędź szklanki: tu kończy się piwo, a zaczyna piana z grafiki. */
export const POD_PIANA = 24;

/**
 * Poziom piwa dla części `cz` (0..1) quizu. Do ostatniego pytania piwo rośnie tylko w samej szklance
 * (od dna do krawędzi), a czapa piany z grafiki pojawia się dopiero, gdy szklanka jest pełna.
 * Wcześniej poziom szedł od dna aż do szczytu piany, więc po ok. 70% pytań szklanka wyglądała na pełną.
 */
export function poziom(cz: number): number {
  return cz >= 1 ? GORA : DNO - (DNO - POD_PIANA) * Math.max(0, cz);
}

/** Proporcje grafiki: szerokość przez wysokość (382×713 px). */
export const PROPORCJA = 382 / 713;

/**
 * Ścianki szklanki zmierzone na grafice: [wysokość, odstęp zewnętrznej krawędzi od boku obrazka], oba w %.
 * Szklanka typu nonic: wybrzuszenie ok. 1/3 od góry, niżej zwęża się ku dnu.
 */
const SCIANKA: [number, number][] = [
  [20, 4.6],
  [26, 4.0],
  [32, 2.9],
  [35, 3.2],
  [38, 4.4],
  [41, 6.1],
  [44, 7.2],
  [50, 8.2],
  [60, 9.9],
  [70, 11.4],
  [80, 13.1],
  [92, 14.6],
];
/** Grubość szkła: piwo i piana zaczynają się trochę dalej niż zewnętrzna krawędź. */
const SZKLO = 1.2;

/** Odstęp wnętrza szklanki od boku obrazka (% szerokości) na wysokości `y` (% wysokości od góry). */
export function scianka(y: number): number {
  const [pierwszy] = SCIANKA;
  const ostatni = SCIANKA[SCIANKA.length - 1];
  if (y <= pierwszy[0]) return pierwszy[1] + SZKLO;
  if (y >= ostatni[0]) return ostatni[1] + SZKLO;
  const i = SCIANKA.findIndex(([wys]) => wys >= y);
  const [y0, x0] = SCIANKA[i - 1];
  const [y1, x1] = SCIANKA[i];
  return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0) + SZKLO;
}

/** Spłaszczenie powierzchni piwa widzianej lekko z góry: wysokość elipsy do jej szerokości. */
const SPLASZCZENIE = 0.18;

/**
 * Piana na nalewanym piwie dla części `cz` quizu: powierzchnia to elipsa od ścianki do ścianki na poziomie piwa,
 * a pod nią warstwa piany, która rośnie razem z piwem. Pionowo % wysokości szklanki, poziomo % szerokości.
 * `promien`: pionowy promień zaokrąglenia w % wysokości całej piany (góra i dół to połówki elipsy).
 */
export function pianaNaPiwie(cz: number) {
  const y = poziom(cz);
  const bok = scianka(y);
  // pół wysokości elipsy w % wysokości szklanki (szerokość elipsy liczy się w % szerokości)
  const ry = ((100 - 2 * bok) / 2) * PROPORCJA * SPLASZCZENIE;
  const grubosc = 1 + 4 * Math.max(0, cz);
  const wysokosc = 2 * ry + grubosc;
  return { top: y - ry, bok, wysokosc, promien: (ry / wysokosc) * 100, widac: cz > 0 && cz < 1 };
}

/** Górna krawędź pustej szklanki: grafika ma tu już pianę, więc pusta szklanka kończy się trochę wyżej niż piwo. */
export const KRAWEDZ = POD_PIANA - 2;

/**
 * Brzeg pustej szklanki widziany lekko z góry: elipsa na wysokości `KRAWEDZ` od zewnętrznej ścianki do ścianki
 * (wcześniej szklanka kończyła się prostym cięciem). Pionowo % wysokości szklanki, `bok` w % szerokości.
 */
export function brzegSzklanki() {
  const bok = scianka(KRAWEDZ) - SZKLO;
  const ry = ((100 - 2 * bok) / 2) * PROPORCJA * SPLASZCZENIE;
  return { top: KRAWEDZ - ry, bok, wysokosc: 2 * ry };
}
