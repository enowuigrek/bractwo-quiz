"use client";

import { useState } from "react";
import { HasloKibica } from "@/components/haslo-kibica";
import type { Okrzyk, SeriaGracz } from "@/lib/gra/typy";
import { awatarNaDrogach, drogi, punktNaDrodze } from "./drogi";

/** Jak długo dymek wisi na TV (unosi się i znika, animacja `.okrzyk` w tv.css). */
const DYMEK_MS = 3500;
/** Starszych okrzyków nie pokazujemy (np. po przeładowaniu TV albo gdy przyszły dopiero z zapasowego odpytywania). */
const NAJSTARSZY_MS = 6000;
/** Najwyżej tyle dymków naraz przy jednym finaliście, żeby nie zasłoniły planszy. */
const NA_FINALISTE = 3;

/**
 * Dymki okrzyków kibiców nad drogami serii (kibic.tsx na telefonie, `StanSesji.okrzyki`). Dymek stoi
 * po lewej nad awatarem finalisty (za nim jest pusta droga), a przy samym starcie obok niego po prawej.
 * Czas liczymy od chwili, gdy TV pierwszy raz zobaczył okrzyk. `teraz`: zegar serwera.
 */
export function OkrzykiNaDrogach({
  okrzyki,
  gracze,
  polozenie,
  teraz,
}: {
  okrzyki: Okrzyk[];
  gracze: SeriaGracz[];
  /** Położenie 0..1 finalisty na drodze, w kolejności `gracze`. */
  polozenie: number[];
  teraz: number;
}) {
  // kiedy TV pierwszy raz zobaczył okrzyk; liczone przy każdej nowej liście z bazy (ostatnie 8 s)
  const [znane, ustawZnane] = useState<{ lista: Okrzyk[]; od: Record<string, number> }>({ lista: [], od: {} });
  if (okrzyki !== znane.lista) {
    const od: Record<string, number> = {};
    for (const o of okrzyki) {
      // zbyt stare od razu jako „już pokazane”
      od[o.id] = znane.od[o.id] ?? (teraz - Date.parse(o.utworzono) < NAJSTARSZY_MS ? teraz : 0);
    }
    ustawZnane({ lista: okrzyki, od });
  }
  const widoczne = okrzyki.filter((o) => teraz - (znane.od[o.id] ?? teraz) < DYMEK_MS);

  const lista = drogi(gracze.length);
  const awatar = awatarNaDrogach(lista);

  return (
    <>
      {gracze.map((g, i) => {
        const moje = widoczne.filter((o) => o.finalista === g.nick).slice(-NA_FINALISTE);
        const p = punktNaDrodze(lista[i], polozenie[i] ?? 0);
        const zPrawej = p.x < 520;
        return moje.map((o, k) => (
          <div
            key={o.id}
            className={`okrzyk${zPrawej ? " z-prawej" : ""}`}
            style={{
              left: zPrawej ? p.x + awatar / 2 + 20 : p.x - awatar / 2 - 20,
              // przy starcie obok awatara (nad nim jest już nagłówek), dalej nad nim; nie wyżej niż 80 px od góry
              // planszy, a starsze dymki wyżej: nowe nie wchodzą na poprzednie
              top: Math.max(zPrawej ? p.y + 34 : p.y - awatar / 2, 80) - (moje.length - 1 - k) * 64,
            }}
          >
            <div className="okrzyk-dymek">
              <span className="okrzyk-kibic">{o.kibic}</span>{" "}
              <HasloKibica haslo={o.haslo} nick={g.nick} zdjecie={g.zdjecie} rozmiar={46} />
            </div>
          </div>
        ));
      })}
    </>
  );
}
