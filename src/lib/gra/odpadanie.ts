// Odpadanie w etapach przed finałem: progi z `sesje.progi` (pilot/[kod]/progi.tsx), odcięcie w bazie
// (`wewn.odetnij`). Tu wspólne opisy dla TV i telefonów: gdzie jest kreska i co się dzieje po drodze.

import type { StanSesji, WierszRankingu } from "./typy";

/** Ilu gra dalej po bieżącym etapie: walka o finał to trójka, inaczej próg etapu (null: nikt nie odpada). */
export function odciecieEtapu(stan: StanSesji): number | null {
  if (stan.etap?.final_po_etapie) return 3;
  return stan.etap?.przechodzi ?? null;
}

/**
 * Ruch względem kreski w rankingu etapu z odcięciem: `awans` (był pod kreską, teraz nad), `spadek` (odwrotnie),
 * `zagrozony` (dalej pod kreską) albo null (nad kreską, bez zmian, albo etap bez odcięcia).
 */
export function wzgledemKreski(
  w: Pick<WierszRankingu, "miejsce" | "poprzednie_miejsce">,
  odciecie: number | null,
  grajacych: number,
): "awans" | "spadek" | "zagrozony" | null {
  if (odciecie === null || grajacych <= odciecie) return null;
  const nad = w.miejsce <= odciecie;
  const bylNad = w.poprzednie_miejsce <= odciecie;
  if (nad && !bylNad) return "awans";
  if (!nad && bylNad) return "spadek";
  return nad ? null : "zagrozony";
}

/**
 * Najbliższe odcięcie, które kogoś wyrzuci (bieżący etap albo któryś dalej przed finałem): po którym etapie,
 * ilu gra dalej i czy to wejście do finałowej trójki. Null: nikt już nie odpada (albo trwa finał).
 */
export function najblizszeOdciecie(stan: StanSesji): { poEtapie: number; ile: number; final: boolean } | null {
  if (!stan.etap || stan.etap.finalowy) return null;
  const plan = stan.plan_etapow ?? [];
  const final = plan.find((e) => e.finalowy);
  for (const e of plan) {
    if (e.nr < stan.etap.nr || e.finalowy) continue;
    if (final && e.nr === final.nr - 1) {
      if (stan.w_grze > 3) return { poEtapie: e.nr, ile: 3, final: true };
    } else if (e.przechodzi !== null && stan.w_grze > e.przechodzi) {
      return { poEtapie: e.nr, ile: e.przechodzi, final: false };
    }
  }
  return null;
}

/**
 * Ilu gra w każdym etapie i ilu przechodzi dalej (plansza wstępu, 28.10): od wszystkich grających, po etapie z progiem
 * zostaje próg, przed finałem trójka, w finale grają ci, którzy weszli. `dalej` null: nikt po tym etapie nie odpada.
 */
export function liczbyEtapow(stan: StanSesji): { nr: number; graja: number; dalej: number | null }[] {
  const plan = stan.plan_etapow ?? [];
  const final = plan.find((e) => e.finalowy);
  let graja = stan.w_grze;
  return plan.map((e) => {
    const teraz = graja;
    const prog = e.finalowy ? null : final && e.nr === final.nr - 1 ? 3 : e.przechodzi;
    const dalej = prog !== null && teraz > prog ? prog : null;
    if (dalej !== null) graja = dalej;
    return { nr: e.nr, graja: teraz, dalej };
  });
}

/** „gra 8”, „grają 4”, „przechodzi 9”, „przechodzą 3”: liczba mnoga przy 2–4 (bez 12–14), inaczej pojedyncza. */
export function zLiczba(n: number, pojedyncza: string, mnoga: string): string {
  const mn = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14);
  return `${mn ? mnoga : pojedyncza} ${n}`;
}
