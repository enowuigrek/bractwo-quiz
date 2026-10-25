// Automatyczne prowadzenie (`sesje.auto`): co kliknąłby prowadzący i kiedy. Wspólne dla pilota
// (src/app/pilot/[kod]/auto.tsx) i trasy /api/auto, którą co chwilę woła TV (karta pilota w tle prawie stoi).

import type { AkcjaPilota, PilotStan } from "./typy";

/** Plansza (wstęp, etap, ciekawostka): dalej, gdy wszyscy kliknęli „Gotowy” (nie wcześniej niż `min` s), albo po `max` s. */
const PLANSZA = { wstep: [5, 40], etap: [6, 45], ciekawostka: [6, 40] } as const;
/** Ile sekund trwa każdy krok po pytaniu. */
const PO_PYTANIU = { wynik: 6, odpowiedzi: 6, ranking: 7, rankingKoniecEtapu: 10 } as const;
/** Pytanie bez limitu czasu: po tylu sekundach automat sam pokazuje wynik. */
const BEZ_LIMITU_S = 45;
const WERBLE_S = 7;
const PODIUM_S = 30;

/**
 * Co teraz kliknąłby prowadzący: krok pilota albo null (czekamy). Pytanie i seria kończą się same (zegar i baza),
 * a gra zatrzymuje się na pełnej tabeli (koniec prowadzący klika sam).
 */
export function nastepnyKrok(stan: PilotStan, teraz: number): AkcjaPilota | null {
  const s = stan.faza_od ? (teraz - Date.parse(stan.faza_od)) / 1000 : 0;
  const plansza = ([min, max]: readonly [number, number]) => s >= max || (stan.gotowi >= stan.w_grze && s >= min);
  switch (stan.faza) {
    case "wstep":
      return plansza(PLANSZA.wstep) ? "nastepne" : null;
    case "etap":
      return plansza(PLANSZA.etap) ? "nastepne" : null;
    case "wynik":
      if (stan.zadanie?.typ === "ciekawostka") return plansza(PLANSZA.ciekawostka) ? "nastepne" : null;
      return s >= PO_PYTANIU.wynik ? "odpowiedzi" : null;
    case "odpowiedzi":
      return s >= PO_PYTANIU.odpowiedzi ? "ranking" : null;
    case "ranking":
      if (s < (stan.ostatnie_w_etapie ? PO_PYTANIU.rankingKoniecEtapu : PO_PYTANIU.ranking)) return null;
      return stan.ostatnie_zadanie ? "podium" : "nastepne";
    // w bazie zostaje `przygotuj`, choć pytanie już trwa (odsłania je zegar), więc oba
    case "przygotuj":
    case "pytanie":
      return !stan.faza_do && s >= BEZ_LIMITU_S ? "wynik" : null;
    case "werble":
      return s >= WERBLE_S ? "podium" : null;
    case "podium":
      return s >= PODIUM_S ? "tabela" : null;
    default:
      return null;
  }
}
