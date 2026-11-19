"use client";

import { createContext, useContext } from "react";
import { MARKI, type IdMarki, type Marka } from "@/lib/marka";
import type { Motyw } from "@/lib/motyw";

const KontekstMarki = createContext<IdMarki>("bractwo");

/** Marka z root layoutu (z adresu żądania) dla komponentów klienckich. Z serwera idzie samo `id`. */
export function DostawcaMarki({ marka, children }: { marka: IdMarki; children: React.ReactNode }) {
  return <KontekstMarki.Provider value={marka}>{children}</KontekstMarki.Provider>;
}

export function useMarka(): Marka {
  return MARKI[useContext(KontekstMarki)];
}

/** Dawny podział na motywy, do czasu przejścia wszystkich miejsc na `useMarka()`. */
export function useMotyw(): Motyw {
  return useContext(KontekstMarki) === "bractwo" ? "bractwo" : "neutralny";
}

/** Dawny podział na motywy, do czasu przejścia wszystkich miejsc na `useMarka()`. */
export function useNeutralny(): boolean {
  return useContext(KontekstMarki) !== "bractwo";
}

/** Pożegnanie marki (ze spacją na początku) na końcu tekstu, np. „ Piwu Cześć!”. */
export function PiwuCzesc() {
  const pozegnanie = useMarka().teksty.pozegnanie;
  return pozegnanie ? <> {pozegnanie}</> : null;
}
