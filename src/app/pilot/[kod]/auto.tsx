"use client";

import { useEffect, useRef } from "react";
import { nastepnyKrok } from "@/lib/gra/auto";
import type { PilotStan } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";

/**
 * Automatyczne prowadzenie (`sesje.auto`, przełącznik w pilocie): co sekundę sprawdza, co kliknąłby prowadzący,
 * i klika to raz na fazę; ręczne przyciski dalej działają. To samo robi TV przez /api/auto (`useAutoZTv`), bo karta
 * pilota w tle (Safari, zablokowany telefon) budzi się raz na minutę.
 */
export function useAutoProwadzenie(
  kod: string,
  token: string | null,
  stan: PilotStan | null,
  przesuniecie: number,
  onZmiana: (nowy: PilotStan) => void,
) {
  const stanRef = useRef(stan);
  const zrobione = useRef("");
  useEffect(() => {
    stanRef.current = stan;
  }, [stan]);
  const wlaczone = !!token && !!stan?.auto;

  useEffect(() => {
    if (!wlaczone || !token) return;
    const zegar = setInterval(() => {
      const s = stanRef.current;
      if (!s) return;
      const krok = nastepnyKrok(s, Date.now() + przesuniecie);
      const klucz = `${s.faza}|${s.faza_od}|${s.zadanie?.nr ?? 0}`;
      if (!krok || zrobione.current === klucz) return;
      zrobione.current = klucz;
      // `auto_krok` przechodzi tylko z fazy, którą tu widzimy: TV (/api/auto) mogło już kliknąć to samo
      void supabase()
        .rpc("auto_krok", { p_kod: kod, p_host_token: token, p_faza_od: s.faza_od, p_akcja: krok })
        .then(({ data, error }) => {
          // np. prowadzący kliknął w tej samej chwili: spróbujemy przy następnym stanie
          if (error) zrobione.current = "";
          else if (data) onZmiana(data as PilotStan);
        });
    }, 1000);
    return () => clearInterval(zegar);
  }, [wlaczone, kod, token, przesuniecie, onZmiana]);
}
