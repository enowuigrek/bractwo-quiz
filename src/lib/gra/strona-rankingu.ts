"use client";

import { useEffect, useState } from "react";
import { STRONA_RANKINGU_S, stronyRankingu } from "./wyscig";

/**
 * Która strona rankingu stoi teraz na TV (po równo, najwyżej `NA_STRONIE_RANKINGU` graczy): co `STRONA_RANKINGU_S`
 * następna, na ostatniej zostaje. Liczone od wejścia ekranu rankingu. Wspólne dla głównego i prostego ekranu.
 */
export function useStronaRankingu(graczy: number): number {
  const strony = stronyRankingu(graczy);
  const [strona, ustawStrone] = useState(0);
  useEffect(() => {
    if (strony <= 1) return;
    const id = window.setInterval(() => ustawStrone((s) => Math.min(s + 1, strony - 1)), STRONA_RANKINGU_S * 1000);
    return () => window.clearInterval(id);
  }, [strony]);
  return Math.min(strona, strony - 1);
}
