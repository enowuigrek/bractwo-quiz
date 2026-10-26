"use client";
/* eslint-disable @next/next/no-img-element -- grafika pytania z bucketu Supabase */

import { useLayoutEffect, useRef } from "react";

/**
 * Wysokość grafiki pytania na telefonie (`.gra-grafika`, max-height 220 px), gdzie rozmycie to `blur(rozmycie / 2)`.
 * TV rozmywa tak samo względem rozmiaru obrazka, więc oba ekrany wyostrzają się jednakowo.
 */
const WYSOKOSC_NA_TELEFONIE = 220;

/**
 * Grafika pytania na TV, która wyostrza się z czasem (`dane.odslaniaj`, `rozmycie` jak na telefonie). Samsung nie
 * stosował CSS `filter: blur` (26.10: na telefonie chmiel się wyostrzał, na TV był od razu ostry), więc rozmywa
 * płótno: filtrem rysowania (`ctx.filter`), a gdyby go nie było, płynnym zmniejszeniem i powiększeniem (bez pikseli).
 * Obrazek pod spodem trzyma układ i jest niewidoczny, póki grafika jest rozmyta.
 */
export function GrafikaOdslaniana({ src, rozmycie, className }: { src: string; rozmycie: number; className: string }) {
  const obraz = useRef<HTMLImageElement>(null);
  const plotno = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const img = obraz.current;
    const c = plotno.current;
    if (!img || !c || !rozmycie) return;
    const rysuj = () => {
      const w = img.offsetWidth;
      const h = img.offsetHeight;
      const ctx = c.getContext("2d");
      if (!img.naturalWidth || !w || !h || !ctx) return;
      Object.assign(c.style, { left: `${img.offsetLeft}px`, top: `${img.offsetTop}px`, width: `${w}px`, height: `${h}px` });
      c.width = w;
      c.height = h;
      // to samo rozmycie co na telefonie, przeliczone na wysokość obrazka na TV
      const px = (rozmycie / 2) * (h / WYSOKOSC_NA_TELEFONIE);
      ctx.clearRect(0, 0, w, h);
      // starsze przeglądarki nie znają `ctx.filter` (wtedy nie ma tej właściwości)
      if (typeof (ctx as { filter?: unknown }).filter === "string") {
        ctx.filter = `blur(${px.toFixed(1)}px)`;
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = "none";
        return;
      }
      // zapas bez `ctx.filter`: obraz zmniejszony o tyle, ile wynosi rozmycie, i płynnie powiększony z powrotem
      const skala = Math.max(0.02, 1 / Math.max(1, px));
      const maly = document.createElement("canvas");
      maly.width = Math.max(2, Math.round(w * skala));
      maly.height = Math.max(2, Math.round(h * skala));
      const m = maly.getContext("2d");
      if (!m) return;
      m.imageSmoothingQuality = "high";
      m.drawImage(img, 0, 0, maly.width, maly.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(maly, 0, 0, w, h);
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
