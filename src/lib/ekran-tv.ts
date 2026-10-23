"use client";

import { useEffect, useState } from "react";

// Telewizor w lokalu ma świecić cały wieczór: bez wygaszacza i bez wypalania OLED.

/**
 * Prosi przeglądarkę, żeby nie wygaszała ekranu (Screen Wake Lock), a na wypadek, gdy jej to nie
 * wystarcza albo jej nie zna, odtwarza niewidoczne, wyciszone wideo 2×2 px z płótna. Telewizory
 * (np. przeglądarka LG webOS) zwykle nie włączają wygaszacza, dopóki coś się odtwarza.
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

    // wideo z płótna, które co sekundę zmienia kolor o jeden odcień (inaczej strumień stoi)
    const plotno = document.createElement("canvas");
    plotno.width = 2;
    plotno.height = 2;
    const ctx = plotno.getContext("2d");
    let klatka = 0;
    const rysuj = () => {
      if (!ctx) return;
      ctx.fillStyle = klatka++ % 2 ? "#000000" : "#010101";
      ctx.fillRect(0, 0, 2, 2);
    };
    rysuj();
    const zegar = setInterval(rysuj, 1000);

    const wideo = document.createElement("video");
    wideo.muted = true;
    wideo.loop = true;
    wideo.playsInline = true;
    wideo.setAttribute("aria-hidden", "true");
    wideo.style.cssText = "position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0.01;pointer-events:none";
    if ("captureStream" in plotno) {
      wideo.srcObject = plotno.captureStream(1);
      document.body.appendChild(wideo);
      void wideo.play().catch(() => undefined);
    }

    return () => {
      zamkniete = true;
      document.removeEventListener("visibilitychange", poPowrocie);
      void blokada?.release().catch(() => undefined);
      clearInterval(zegar);
      wideo.pause();
      wideo.srcObject = null;
      wideo.remove();
    };
  }, []);
}

/** Kolejne położenia sceny w pikselach sceny (ok. 3 px w każdą stronę), zmieniane co 2 minuty. */
const POLOZENIA: [number, number][] = [
  [0, 0],
  [3, 1],
  [2, -2],
  [-1, -3],
  [-3, -1],
  [-2, 2],
  [1, 3],
];
const ZMIANA_POLOZENIA_MS = 120_000;

/**
 * Lekkie przesuwanie całej sceny, żeby stałe elementy (logo w rogu, kropki plansz) nie stały
 * ciągle na tych samych pikselach OLED. Kilka pikseli co 2 minuty, niezauważalnie dla oka.
 */
export function usePrzesuniecieOled(): [number, number] {
  const [nr, ustawNr] = useState(0);
  useEffect(() => {
    const zegar = setInterval(() => ustawNr((n) => (n + 1) % POLOZENIA.length), ZMIANA_POLOZENIA_MS);
    return () => clearInterval(zegar);
  }, []);
  return POLOZENIA[nr];
}
