"use client";
/* eslint-disable @next/next/no-img-element -- SVG z public, skalowane CSS-em */

import { LOGO_NEUTRALNE } from "@/lib/motyw";
import { useNeutralny } from "./motyw";

/**
 * Logo Bractwa na ekranach gry. W motywie neutralnym (src/lib/motyw.ts) zamiast niego logo motywu, a bez niego nic.
 * `className` to klasy położenia i rozmiaru; białe logo Bractwa dostaje dodatkowo `.logo-bractwo`.
 */
export function LogoBractwa({ className, biale }: { className?: string; biale?: boolean }) {
  const neutralny = useNeutralny();
  if (neutralny) {
    if (!LOGO_NEUTRALNE) return null;
    return <img src={LOGO_NEUTRALNE} alt="" className={`logo-motywu ${className ?? ""}`} />;
  }
  return (
    <img
      src={biale ? "/loga/bractwo-biale.svg" : "/loga/bractwo.svg"}
      alt="Bractwo Piwne"
      className={biale ? className : `logo-bractwo ${className ?? ""}`}
    />
  );
}
