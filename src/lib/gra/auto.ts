// Automatyczne prowadzenie (`sesje.auto`): co kliknąłby prowadzący i kiedy. Wspólne dla pilota
// (src/app/pilot/[kod]/auto.tsx) i trasy /api/auto, którą co chwilę woła TV (karta pilota w tle prawie stoi).

import type { AkcjaPilota, PilotStan } from "./typy";
import { STRONA_RANKINGU_S, stronyRankingu } from "./wyscig";

/** Plansza (wstęp, etap, ciekawostka): dalej, gdy wszyscy kliknęli „Gotowy” (nie wcześniej niż `min` s), albo po `max` s. */
const PLANSZA = { wstep: [5, 40], etap: [6, 45], ciekawostka: [6, 40] } as const;
/**
 * Ile sekund trwa każdy krok po pytaniu (25.10 skrócone, Łukasz: za długo). Wyścig musi zmieścić jazdę i zamianę
 * torów (ok. 3,5 s, `ekran/_ekran/wyscig.tsx`). Do tego dochodzi do 1,5 s, zanim TV zapyta o krok (/api/auto).
 */
const PO_PYTANIU = { wynik: 4, odpowiedzi: 4, ranking: 4.5, rankingKoniecEtapu: 7 } as const;
/** Pytanie bez limitu czasu: po tylu sekundach automat sam pokazuje wynik. */
const BEZ_LIMITU_S = 45;
const WERBLE_S = 7;
/**
 * Gra zapowiedziana na godzinę z automatem: godzina z kreatora to start quizu (26.10, Łukasz), a poczekalnia
 * z QR otwiera się tyle minut wcześniej, żeby gracze zdążyli dołączyć. To samo w bazie: `wewn.otworz_o_czasie`.
 */
export const NA_ZAPISY_MIN = 5;

/** Kiedy automat otworzy poczekalnię (ms): godzina startu minus czas na dołączenie. Null bez godziny albo automatu. */
export function otwarcieAutomatu(stan: { auto: boolean; planowany_start: string | null }): number | null {
  if (!stan.auto || !stan.planowany_start) return null;
  return Date.parse(stan.planowany_start) - NA_ZAPISY_MIN * 60_000;
}

/**
 * Co teraz kliknąłby prowadzący: krok pilota albo null (czekamy). Pytanie i seria kończą się same (zegar i baza),
 * a gra zatrzymuje się na podium (TV sam pokazuje na zmianę podium i tabelę, koniec prowadzący klika sam). Start sam tylko w grze zapowiedzianej na godzinę.
 */
export function nastepnyKrok(stan: PilotStan, teraz: number): AkcjaPilota | null {
  const s = stan.faza_od ? (teraz - Date.parse(stan.faza_od)) / 1000 : 0;
  const plansza = ([min, max]: readonly [number, number]) => s >= max || (stan.gotowi >= stan.gotowi_z && s >= min);
  switch (stan.faza) {
    case "poczekalnia": {
      // zapowiedź na godzinę: poczekalnia (QR na TV) chwilę przed, a o tej godzinie start, jeśli ktoś dołączył
      const otwarcie = otwarcieAutomatu(stan);
      if (otwarcie === null) return null;
      if (!stan.poczekalnia_otwarta) return teraz >= otwarcie ? "otworz" : null;
      return teraz >= Date.parse(stan.planowany_start!) && stan.w_grze > 0 ? "nastepne" : null;
    }
    case "wstep":
      // plansza startowa klasycznego quizu kończy się sama po odliczaniu (`dokoncz_pytanie`)
      if (stan.faza_do) return null;
      return plansza(PLANSZA.wstep) ? "nastepne" : null;
    case "etap":
      return plansza(PLANSZA.etap) ? "nastepne" : null;
    case "wynik":
      if (stan.zadanie?.typ === "ciekawostka") return plansza(PLANSZA.ciekawostka) ? "nastepne" : null;
      return s >= PO_PYTANIU.wynik ? "odpowiedzi" : null;
    case "odpowiedzi":
      return s >= PO_PYTANIU.odpowiedzi ? "ranking" : null;
    case "ranking":
      // każda kolejna strona rankingu (po 10 graczy) to dłuższe czekanie
      if (
        s <
        (stan.ostatnie_w_etapie ? PO_PYTANIU.rankingKoniecEtapu : PO_PYTANIU.ranking) +
          (stronyRankingu(stan.liczba_graczy) - 1) * STRONA_RANKINGU_S
      )
        return null;
      return stan.ostatnie_zadanie ? "podium" : "nastepne";
    // w bazie zostaje `przygotuj`, choć pytanie już trwa (odsłania je zegar), więc oba
    case "przygotuj":
    case "pytanie":
      return !stan.faza_do && s >= BEZ_LIMITU_S ? "wynik" : null;
    case "werble":
      return s >= WERBLE_S ? "podium" : null;
    default:
      return null;
  }
}
