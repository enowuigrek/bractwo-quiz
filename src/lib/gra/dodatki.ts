"use client";

import { useEffect, useRef } from "react";
import type { StanSesji } from "./typy";

// Dodatki pytań widoczne w trakcie pytania: podpowiedzi odsłaniane po kolei i grafika, która się wyostrza.

/**
 * Baza wysyła tylko podpowiedzi, których czas już minął, więc w chwili odsłonięcia następnej
 * pobieramy stan jeszcze raz (zamiast czekać na zapasowe odpytywanie co 5 s).
 */
export function useKolejnaPodpowiedz(stan: StanSesji | null, przesuniecie: number, pobierz: () => Promise<void>) {
  const pobierzRef = useRef(pobierz);
  useEffect(() => {
    pobierzRef.current = pobierz;
  });

  const z = stan?.zadanie;
  const widac = z?.podpowiedzi.length ?? 0;
  const ile = z?.liczba_podpowiedzi ?? 0;
  const co = z?.podpowiedzi_co_s ?? null;
  const od = stan?.faza_od ?? null;
  const trwa = stan?.faza === "przygotuj" || stan?.faza === "pytanie";

  useEffect(() => {
    if (!trwa || !od || !co || widac >= ile) return;
    // przed startem pytania baza nie pokazuje żadnej, potem kolejna co `co` sekund
    const kiedy = Date.parse(od) + widac * co * 1000 - przesuniecie + 150;
    const zegar = setTimeout(() => void pobierzRef.current(), Math.max(200, kiedy - Date.now()));
    return () => clearTimeout(zegar);
  }, [trwa, od, co, widac, ile, przesuniecie]);
}

/** Bez limitu czasu odsłonięta grafika wyostrza się przez tyle sekund. */
const ODSLANIANIE_BEZ_LIMITU_S = 20;
const MAKS_ROZMYCIE_PX = 32;

/** Rozmycie odsłanianej grafiki w pikselach (0: ostra) według zegara serwera `teraz`. */
export function rozmycie(stan: StanSesji, teraz: number): number {
  const z = stan.zadanie;
  if (!z?.dane.odslaniaj) return 0;
  if (stan.faza !== "przygotuj" && stan.faza !== "pytanie") return 0;
  const od = stan.faza_od ? Date.parse(stan.faza_od) : teraz;
  const trwanie = (z.czas_s ?? ODSLANIANIE_BEZ_LIMITU_S) * 1000;
  const postep = Math.max(0, Math.min(1, (teraz - od) / trwanie));
  return Math.round(MAKS_ROZMYCIE_PX * (1 - postep) ** 1.4 * 10) / 10;
}
