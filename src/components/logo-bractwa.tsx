"use client";
/* eslint-disable @next/next/no-img-element -- logo z public, skalowane CSS-em */

import { useMarka } from "./motyw";

/**
 * Logo marki na ekranach gry (src/lib/marka.ts): w Bractwie logo Bractwa, w JOWES logo JOWES.
 * `className` to klasy położenia i rozmiaru; zwykłe logo dostaje dodatkowo klasę marki (`logo.klasa`), a białe
 * (`biale`, tylko gdy marka je ma) same klasy położenia.
 */
export function LogoBractwa({ className, biale }: { className?: string; biale?: boolean }) {
  const { logo } = useMarka();
  const bialy = biale ? logo.biale : null;
  return (
    <img src={bialy ?? logo.plik} alt={logo.alt} className={bialy ? className : `${logo.klasa} ${className ?? ""}`} />
  );
}
