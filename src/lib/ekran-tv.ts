"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// Telewizor w lokalu ma świecić cały wieczór: bez wygaszacza i bez wypalania OLED.

/**
 * Prosi przeglądarkę, żeby nie wygaszała ekranu (Screen Wake Lock). Telewizorom to zwykle nie
 * wystarcza: wygaszacz wyłącza dopiero prawdziwe odtwarzanie wideo, patrz `useWideoCzuwania`.
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

/**
 * Zapętlone, prawie czarne wideo (`/wideo/czuwanie.mp4`, H.264, 6 s, 3 KB) na całym ekranie pod tłem.
 * Telewizory (np. przeglądarka LG webOS) nie włączają wygaszacza, dopóki odtwarza się prawdziwy plik
 * wideo; strumień z płótna im nie wystarczał. Wideo jest wyciszone, więc może startować samo,
 * a gdyby się zatrzymało (np. po powrocie karty z tła), co 20 s wznawiamy je jeszcze raz.
 */
export function useWideoCzuwania(): RefObject<HTMLVideoElement | null> {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const wideo = ref.current;
    if (!wideo) return;
    // atrybut `muted` musi być ustawiony przed play(), inaczej przeglądarka zablokuje autostart
    wideo.muted = true;
    const graj = () => {
      if (wideo.paused) void wideo.play().catch(() => undefined);
    };
    graj();
    const zegar = setInterval(graj, 20_000);
    document.addEventListener("visibilitychange", graj);
    return () => {
      clearInterval(zegar);
      document.removeEventListener("visibilitychange", graj);
    };
  }, []);
  return ref;
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
