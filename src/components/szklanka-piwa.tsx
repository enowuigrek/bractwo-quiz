"use client";

import { useEffect, useState } from "react";
import { DNO, KRAWEDZ, POD_PIANA, brzegSzklanki, pianaNaPiwie, poziom } from "@/lib/gra/szklanka";

const BRZEG = brzegSzklanki();

/**
 * Bąbelki w piwie: stałe położenia i tempo (bez losowania, żeby nie skakały przy odświeżeniu),
 * `x` w procentach szerokości szklanki, `r` średnica w px, `t` czas wznoszenia, `d` opóźnienie startu.
 */
// 25.10 gęściej (Łukasz: na TV za mało): 48 zamiast 26, równiej rozłożone po szerokości i w czasie
const BABELKI = Array.from({ length: 48 }, (_, i) => ({
  x: 22 + ((i * 29) % 56),
  r: 3 + ((i * 5) % 4),
  t: 2.6 + ((i * 7) % 10) * 0.28,
  d: -((i * 0.93) % 4.6),
  w: ((i % 3) - 1) * 6,
}));

/**
 * Szklanka nalewana piwem (wyścig po piwo na TV i na telefonie). Pusta to blady zarys grafiki
 * (public/grafiki/szklanka.webp, bez jej piany), piwo rośnie od dna, a na jego powierzchni leży piana:
 * elipsa od ścianki do ścianki, jak piwo widziane lekko z góry. Poziomy: src/lib/gra/szklanka.ts.
 *
 * Bez `clip-path`: telewizor Samsunga go nie przycinał i przez cały quiz pokazywał pełną szklankę.
 * Warstwy to bloki z `overflow: hidden` i grafiką przyklejoną do dołu, a ruch robią przejścia CSS.
 * Najpierw widać stan `przed`, po `opoznienie` sekund piwo dolewa się do `teraz`.
 */
export function SzklankaPiwa({
  przed,
  teraz,
  opoznienie = 0.8,
  trwanie = 3,
  babelki = false,
}: {
  przed: number;
  teraz: number;
  opoznienie?: number;
  trwanie?: number;
  babelki?: boolean;
}) {
  const [nalewa, ustawNalewa] = useState(przed === teraz);
  useEffect(() => {
    if (nalewa) return;
    const zegar = setTimeout(() => ustawNalewa(true), opoznienie * 1000);
    return () => clearTimeout(zegar);
  }, [nalewa, opoznienie]);

  const cz = nalewa ? teraz : przed;
  const piana = pianaNaPiwie(cz);
  // bąbelki tylko w nalanym piwie, pod pianą (w pełnej szklance pod jej czapą z grafiki)
  const babelkiOd = cz >= 1 ? POD_PIANA : Math.min(DNO, poziom(cz) + 2);

  return (
    <div className="szklanka-piwa" style={{ "--nalewanie": `${trwanie}s` } as React.CSSProperties} aria-hidden>
      <div className="szklanka-warstwa szklanka-pusta" style={{ height: `${100 - KRAWEDZ}%` }} />
      <div className="szklanka-warstwa" style={{ height: `${100 - poziom(cz)}%` }} />
      {babelki && (
        <div className="szklanka-babelki" style={{ top: `${babelkiOd}%`, bottom: `${100 - DNO}%` }}>
          {BABELKI.map((b, i) => (
            <span
              key={i}
              style={
                {
                  left: `${b.x}%`,
                  "--r": `${b.r}px`,
                  "--t": `${b.t}s`,
                  "--d": `${b.d}s`,
                  "--w": `${b.w}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div
        className="szklanka-piana"
        style={{
          top: `${piana.top}%`,
          left: `${piana.bok}%`,
          right: `${piana.bok}%`,
          height: `${piana.wysokosc}%`,
          borderRadius: `50% / ${piana.promien}%`,
          opacity: piana.widac ? 1 : 0,
        }}
      >
        <span className="szklanka-piana-wierzch" style={{ height: `${2 * piana.promien}%` }} />
      </div>
      {/* brzeg szkła: w pełnej szklance zakrywa go czapa piany z grafiki */}
      <span
        className="szklanka-brzeg"
        style={{
          top: `${BRZEG.top}%`,
          left: `${BRZEG.bok}%`,
          right: `${BRZEG.bok}%`,
          height: `${BRZEG.wysokosc}%`,
          opacity: cz >= 1 ? 0 : 1,
        }}
      />
    </div>
  );
}
