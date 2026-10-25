"use client";

import { useSyncExternalStore } from "react";

// Prosty ekran TV (ekran/_prosty): dla starszych przeglądarek telewizorów (Samsung przed 2025 = Chromium 69–108),
// na których pełny ekran zostaje czarny albo się rozjeżdża. Włącza się sam, gdy przeglądarka nie zna `color-mix()`
// (Chrome przed 111, czyli wszystko poniżej tego, czym celuje Next 16), albo ręcznie: `?prosty` w adresie.
// `?pelny` wymusza pełny ekran także na starej przeglądarce.

function czyProsty(): boolean {
  const adres = window.location.search;
  if (/[?&]pelny\b/.test(adres)) return false;
  if (/[?&]prosty\b/.test(adres)) return true;
  const css = window.CSS;
  return !(css && typeof css.supports === "function" && css.supports("color", "color-mix(in srgb, red, blue)"));
}

const bezZmian = () => () => undefined;

/** Czy ekran TV ma być prosty. Na serwerze zawsze pełny (decyduje dopiero przeglądarka). */
export function useTrybProsty(): boolean {
  return useSyncExternalStore(bezZmian, czyProsty, () => false);
}
