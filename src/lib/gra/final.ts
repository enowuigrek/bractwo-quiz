// Finał jako wyścig (od 24.10): szklanka jest `META_FINALU` kroków od startu, dobra odpowiedź to krok naprzód, zła
// krok w tył (za linię startu się nie cofa), a finaliści startują z przewagą 0–3 kroków według punktów sprzed finału
// (`gracze.start_finalu`, baza: `wewn.ustaw_start_finalu`, `wewn.meta_finalu`, `wewn.kroki_finalu`, koniec w
// `wewn.zamknij_serie_jesli_gotowe` także po wyczerpaniu puli, podium według wyścigu w `wewn.ranking`).

import type { SeriaGracz } from "./typy";

/** Musi się zgadzać z `wewn.meta_finalu()` w bazie. */
export const META_FINALU = 12;

type PostepFinalisty = Pick<SeriaGracz, "dobre" | "odpowiedzi" | "start" | "kroki">;

/**
 * Ile kroków ma finalista: z bazy (`kroki`, kolejność odpowiedzi i odbicie od startu), a bez niej w przybliżeniu
 * przewaga + dobre − złe, nie mniej niż zero.
 */
export function krokiFinalu(g: PostepFinalisty): number {
  if (g.kroki !== undefined) return g.kroki;
  return Math.max(0, (g.start ?? 0) + 2 * g.dobre - g.odpowiedzi);
}

/**
 * Ile drogi przechodzi się przed metą: krok przed szklanką to 85% drogi, a do szklanki awatar dobiega dopiero
 * na mecie (25.10, Łukasz: z perspektywy widza nikt nie stoi przy piwie przed samym końcem).
 */
const DROGA_PRZED_META = 0.85;

/** Położenie na drodze 0..1 (1 = przy szklance, tylko po dobiegnięciu do mety). */
export function naDrodzeFinalu(g: PostepFinalisty): number {
  const kroki = krokiFinalu(g);
  if (kroki >= META_FINALU) return 1;
  return (DROGA_PRZED_META * Math.max(0, kroki)) / (META_FINALU - 1);
}
