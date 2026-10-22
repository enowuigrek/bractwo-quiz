"use client";

import confetti from "canvas-confetti";

// Kolory z design systemu: złoto, piana, chmiel, bursztyn.
const KOLORY = ["#e3ac3f", "#f0c35a", "#f3d27a", "#f4ecd8", "#8fb63a", "#c8711d"];

const wspolne = { colors: KOLORY, disableForReducedMotion: true, zIndex: 50 } as const;

/** Wybuch z obu dolnych rogów ekranu. `mocno` na TV, lżej na telefonie. */
export function wybuchKonfetti(mocno = true) {
  const ile = mocno ? 140 : 70;
  void confetti({ ...wspolne, particleCount: ile, angle: 60, spread: 70, startVelocity: mocno ? 75 : 55, origin: { x: 0, y: 0.95 } });
  void confetti({ ...wspolne, particleCount: ile, angle: 120, spread: 70, startVelocity: mocno ? 75 : 55, origin: { x: 1, y: 0.95 } });
}

/** Złoty deszcz z góry przez `ms`. Zwraca funkcję, która go przerywa. */
export function deszczKonfetti(ms: number): () => void {
  const koniec = Date.now() + ms;
  let ramka = 0;
  const krok = () => {
    void confetti({ ...wspolne, particleCount: 3, angle: 270, spread: 120, startVelocity: 10, gravity: 0.6, ticks: 400, origin: { x: Math.random(), y: -0.05 } });
    if (Date.now() < koniec) ramka = requestAnimationFrame(krok);
  };
  ramka = requestAnimationFrame(krok);
  return () => cancelAnimationFrame(ramka);
}
