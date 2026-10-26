"use client";
/* eslint-disable @next/next/no-img-element -- grafika pytania z bucketu Supabase */

import { useLayoutEffect, useRef } from "react";

/**
 * Grafika pytania na TV, która wyostrza się z czasem (`dane.odslaniaj`, `rozmycie` w px jak `filter: blur`). Samsung nie
 * stosował `filter: blur` (26.10: na telefonie chmiel się wyostrzał, na TV był od razu ostry), więc rozmycie robi
 * płótno: obraz narysowany w małej rozdzielczości i rozciągnięty na wymiary obrazka, który pod spodem trzyma układ
 * (niewidoczny, póki jest rozmyty). Bez rozmycia zwykły obrazek.
 */
export function GrafikaOdslaniana({ src, rozmycie, className }: { src: string; rozmycie: number; className: string }) {
  const obraz = useRef<HTMLImageElement>(null);
  const plotno = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const img = obraz.current;
    const c = plotno.current;
    if (!img || !c || !rozmycie) return;
    const rysuj = () => {
      if (!img.naturalWidth) return;
      // im mocniejsze rozmycie, tym mniej pikseli; rozciągnięcie wygładza je w plamy
      const skala = Math.max(0.015, 1 / (1 + rozmycie * 0.9));
      c.width = Math.max(2, Math.round(img.naturalWidth * skala));
      c.height = Math.max(2, Math.round(img.naturalHeight * skala));
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      Object.assign(c.style, {
        left: `${img.offsetLeft}px`,
        top: `${img.offsetTop}px`,
        width: `${img.offsetWidth}px`,
        height: `${img.offsetHeight}px`,
      });
    };
    rysuj();
    img.addEventListener("load", rysuj);
    return () => img.removeEventListener("load", rysuj);
  }, [rozmycie, src]);

  return (
    <>
      <img ref={obraz} src={src} alt="" className={className} style={rozmycie ? { visibility: "hidden" } : undefined} />
      {rozmycie > 0 && <canvas ref={plotno} className="tv-grafika-plotno" aria-hidden />}
    </>
  );
}
