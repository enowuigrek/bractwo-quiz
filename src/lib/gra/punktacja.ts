// Punktacja odpowiedzi w TypeScripcie, tylko do opisu zasad w panelu (quizy/zasady). Punkty w grze liczy wyłącznie
// baza: ten plik musi się zgadzać z `wewn.punkty_odpowiedzi`, `wewn.okno_bez_limitu_ms` i `wewn.ocena`
// (migracje 20261027204332_punkty_dluzej_do_200_final_500, 20261026202041_szacowanie_przedzial,
// 20261030152715_pub_quiz_prawda_falsz_pol).

import type { TypZadania } from "../zadania";

/**
 * Pub quiz (pytania bez etapu): trudniejsze rodzaje dają więcej punktów, jak mnożniki etapów w wyścigu
 * (`wewn.waga_typu`, gdy etap nie podaje mnożnika). Prawda/fałsz za połowę (30.10): przy dwóch odpowiedziach
 * zgadywanie dawało średnio dwa razy więcej niż przy jednej z czterech.
 */
export const WAGA_TYPU: Record<Exclude<TypZadania, "ciekawostka">, number> = {
  wybor: 1,
  prawda_falsz: 0.5,
  wielokrotny: 1.5,
  szacowanie: 2,
  kolejnosc: 2,
  pary: 2,
};

/** Okno spadku punktów bez limitu czasu: 60 s przy kilku dobrych, kolejności i parach, 30 s przy reszcie. */
export function oknoMs(typ: TypZadania): number {
  return typ === "wielokrotny" || typ === "kolejnosc" || typ === "pary" ? 60000 : 30000;
}

/**
 * Punkty za odpowiedź z bonusem za szybkość (w grach zawsze włączony): `ocena` 0..1 (część dobrze), `czasMs` od
 * startu pytania, `mnoznik` etapu. Szacowanie: trafienie 900–1000 (szybkość waży 10%), blisko 850 × ocena × 0,9–1;
 * reszta: ocena × 200–1000, liniowo przez okno, potem stałe 200.
 */
export function punktyOdpowiedzi(typ: TypZadania, ocena: number, czasMs: number, mnoznik: number): number {
  const okno = oknoMs(typ);
  const szybkosc = 1 - Math.min(czasMs, okno) / okno;
  const baza =
    typ === "szacowanie"
      ? ocena >= 1
        ? 900 + 100 * szybkosc
        : 850 * ocena * (0.9 + 0.1 * szybkosc)
      : ocena * (200 + 800 * szybkosc);
  return Math.round(mnoznik * baza);
}

/** Najwięcej (od razu) i najmniej (po oknie albo na końcu limitu) za odpowiedź z daną oceną. */
export function przedzial(typ: TypZadania, ocena: number, mnoznik: number): [number, number] {
  return [punktyOdpowiedzi(typ, ocena, oknoMs(typ), mnoznik), punktyOdpowiedzi(typ, ocena, 0, mnoznik)];
}
