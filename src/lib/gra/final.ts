// Finał jako wyścig (od 24.10): szklanka jest `META_FINALU` kroków od startu, dobra odpowiedź to krok, a finaliści
// startują z przewagą 0–3 kroków według punktów sprzed finału (`gracze.start_finalu`, baza: `wewn.ustaw_start_finalu`,
// `wewn.meta_finalu`, koniec w `wewn.zamknij_serie_jesli_gotowe`, podium według wyścigu w `wewn.ranking`).

import type { SeriaGracz } from "./typy";

/** Musi się zgadzać z `wewn.meta_finalu()` w bazie. */
export const META_FINALU = 12;

/** Ile kroków ma finalista: przewaga + dobre odpowiedzi. */
export function krokiFinalu(g: Pick<SeriaGracz, "dobre" | "start">): number {
  return (g.start ?? 0) + g.dobre;
}

/** Położenie na drodze 0..1 (1 = przy szklance). */
export function naDrodzeFinalu(g: Pick<SeriaGracz, "dobre" | "start">): number {
  return Math.min(1, krokiFinalu(g) / META_FINALU);
}
