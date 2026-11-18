"use client";

import { createContext, useContext } from "react";
import type { Motyw } from "@/lib/motyw";

const KontekstMotywu = createContext<Motyw>("bractwo");

/** Motyw z root layoutu (z adresu żądania) dla komponentów klienckich. */
export function DostawcaMotywu({ motyw, children }: { motyw: Motyw; children: React.ReactNode }) {
  return <KontekstMotywu.Provider value={motyw}>{children}</KontekstMotywu.Provider>;
}

export function useMotyw(): Motyw {
  return useContext(KontekstMotywu);
}

export function useNeutralny(): boolean {
  return useContext(KontekstMotywu) === "neutralny";
}

/** „ Piwu Cześć!” (ze spacją na początku) na końcu tekstu, w motywie neutralnym nic. */
export function PiwuCzesc() {
  return useNeutralny() ? null : <> Piwu Cześć!</>;
}
