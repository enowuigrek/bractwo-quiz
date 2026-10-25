"use client";

import { useEffect, useState } from "react";

// Telewizor w lokalu ma świecić cały wieczór: bez wygaszacza. Przesuwania sceny przeciw wypalaniu OLED nie ma od 25.10:
// ekrany i tak ciągle się zmieniają (tła, animacje, kolejne plansze).

/**
 * Prosi przeglądarkę, żeby nie wygaszała ekranu (Screen Wake Lock). Działa na laptopie i przystawce HDMI z
 * Chromium. Przeglądarka Samsunga go nie ma, a wygaszacza OLED Samsunga (2 min bez pilota) strona nie wyłączy
 * niczym (wideo czuwania w tle nie pomagało i 25.10 zniknęło; badanie w docs/PLAN.md).
 */
export function useBezWygaszacza() {
  useEffect(() => {
    let blokada: WakeLockSentinel | null = null;
    let zamkniete = false;

    async function zablokuj() {
      if (zamkniete || document.visibilityState !== "visible" || !("wakeLock" in navigator)) return;
      try {
        blokada = await navigator.wakeLock.request("screen");
      } catch {
        // brak zgody albo nieobsługiwane: zostaje wideo
      }
    }
    // blokada znika, gdy karta jest w tle, więc po powrocie prosimy jeszcze raz
    const poPowrocie = () => void zablokuj();
    document.addEventListener("visibilitychange", poPowrocie);
    void zablokuj();

    return () => {
      zamkniete = true;
      document.removeEventListener("visibilitychange", poPowrocie);
      void blokada?.release().catch(() => undefined);
    };
  }, []);
}

/** Wersja tego kodu (commit z builda na Vercelu); lokalnie pusta i wtedy niczego nie sprawdzamy. */
const WERSJA = process.env.NEXT_PUBLIC_WERSJA ?? "";
const SPRAWDZ_WERSJE_MS = 60_000;

/**
 * Ekran TV wisi otwarty cały wieczór, więc po wdrożeniu dalej działa na starym kodzie (np. 23.10 pokazywał
 * tabelę zamiast wyścigu, bo nowy pilot nie miał już przełącznika). Co minutę porównuje swoją wersję
 * z `/api/wersja` i przy nowej przeładowuje się sam, ale dopiero gdy `moznaOdswiezyc` (nie w trakcie
 * pytania, serii ani odsłony podium).
 */
export function useNowaWersja(moznaOdswiezyc: boolean) {
  const [nowa, ustawNowa] = useState(false);
  useEffect(() => {
    if (!WERSJA) return;
    const sprawdz = () =>
      fetch("/api/wersja", { cache: "no-store" })
        .then((odp) => odp.json())
        .then((d: { wersja?: string }) => {
          if (d.wersja && d.wersja !== WERSJA) ustawNowa(true);
        })
        .catch(() => undefined);
    const zegar = setInterval(sprawdz, SPRAWDZ_WERSJE_MS);
    return () => clearInterval(zegar);
  }, []);
  useEffect(() => {
    if (nowa && moznaOdswiezyc) window.location.reload();
  }, [nowa, moznaOdswiezyc]);
}
