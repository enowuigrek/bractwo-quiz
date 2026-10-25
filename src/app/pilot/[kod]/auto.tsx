"use client";

import { useEffect, useRef } from "react";
import type { AkcjaPilota, PilotStan } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";

/** Plansza (wstęp, etap, ciekawostka): dalej, gdy wszyscy kliknęli „Gotowy” (nie wcześniej niż `min` s), albo po `max` s. */
const PLANSZA = { wstep: [5, 40], etap: [6, 45], ciekawostka: [6, 40] } as const;
/** Ile sekund trwa każdy krok po pytaniu. */
const PO_PYTANIU = { wynik: 6, odpowiedzi: 6, ranking: 7, rankingKoniecEtapu: 10 } as const;
/** Pytanie bez limitu czasu: po tylu sekundach automat sam pokazuje wynik. */
const BEZ_LIMITU_S = 45;
const WERBLE_S = 7;
const PODIUM_S = 30;

/**
 * Co teraz kliknąłby prowadzący: krok pilota albo null (czekamy). Pytanie i seria kończą się same (zegar i baza),
 * a gra zatrzymuje się na pełnej tabeli (koniec prowadzący klika sam).
 */
function nastepnyKrok(stan: PilotStan, teraz: number): AkcjaPilota | null {
  const s = stan.faza_od ? (teraz - Date.parse(stan.faza_od)) / 1000 : 0;
  const plansza = ([min, max]: readonly [number, number]) => s >= max || (stan.gotowi >= stan.w_grze && s >= min);
  switch (stan.faza) {
    case "wstep":
      return plansza(PLANSZA.wstep) ? "nastepne" : null;
    case "etap":
      return plansza(PLANSZA.etap) ? "nastepne" : null;
    case "wynik":
      if (stan.zadanie?.typ === "ciekawostka") return plansza(PLANSZA.ciekawostka) ? "nastepne" : null;
      return s >= PO_PYTANIU.wynik ? "odpowiedzi" : null;
    case "odpowiedzi":
      return s >= PO_PYTANIU.odpowiedzi ? "ranking" : null;
    case "ranking":
      if (s < (stan.ostatnie_w_etapie ? PO_PYTANIU.rankingKoniecEtapu : PO_PYTANIU.ranking)) return null;
      return stan.ostatnie_zadanie ? "podium" : "nastepne";
    // w bazie zostaje `przygotuj`, choć pytanie już trwa (odsłania je zegar), więc oba
    case "przygotuj":
    case "pytanie":
      return !stan.faza_do && s >= BEZ_LIMITU_S ? "wynik" : null;
    case "werble":
      return s >= WERBLE_S ? "podium" : null;
    case "podium":
      return s >= PODIUM_S ? "tabela" : null;
    default:
      return null;
  }
}

/**
 * Automatyczne prowadzenie (`sesje.auto`, przełącznik w pilocie): co sekundę sprawdza, co kliknąłby prowadzący,
 * i klika to raz na fazę. Działa, dopóki pilot jest otwarty; ręczne przyciski dalej działają.
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
      void supabase()
        .rpc("pilot_akcja", { p_kod: kod, p_host_token: token, p_akcja: krok })
        .then(({ data, error }) => {
          // np. prowadzący kliknął w tej samej chwili: spróbujemy przy następnym stanie
          if (error) zrobione.current = "";
          else onZmiana(data as PilotStan);
        });
    }, 1000);
    return () => clearInterval(zegar);
  }, [wlaczone, kod, token, przesuniecie, onZmiana]);
}
