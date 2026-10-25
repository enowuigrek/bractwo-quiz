"use client";

import { useEffect } from "react";
import type { StanSesji } from "@/lib/gra/typy";

/** Co ile TV woła /api/auto (krok automatu i odpowiedzi botów). */
const CO_MS = 1500;

/**
 * Automatyczne prowadzenie od strony TV (/api/auto): telewizor jest zawsze na wierzchu, a karta pilota w tle
 * budzi się raz na minutę. Tylko przy włączonym automacie i w trakcie gry (start i koniec klika prowadzący).
 */
export function useAutoZTv(kod: string, stan: StanSesji | null) {
  const aktywne = !!stan?.auto && !["poczekalnia", "tabela", "koniec"].includes(stan.faza);
  useEffect(() => {
    if (!aktywne) return;
    const zegar = setInterval(() => {
      void fetch("/api/auto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kod }),
      }).catch(() => undefined);
    }, CO_MS);
    return () => clearInterval(zegar);
  }, [aktywne, kod]);
}
