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
