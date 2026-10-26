"use client";

import { useEffect, useState } from "react";

// Wybuch szklanki na telewizorze z klatek klipu (26.10, Łukasz: wybuch z samego CSS wyglądał jak konfetti, a wideo
// na komputerze wygląda bardzo dobrze). Samsung nie pokazuje obrazu <video> nad treścią (warstwa sprzętowa), więc
// TV rysuje te same klatki na <canvas>. Klatki to `public/wideo/wybuch/NN.jpg`: klip `pekniecie.mp4` od `OD_S`,
// `FPS` na sekundę, 960×540 (`ffmpeg -ss 1.0 -to 4.8 -i pekniecie.mp4 -vf fps=15,scale=960:540 -q:v 5 %02d.jpg`).
// Przy nowym klipie trzeba je wyciąć od nowa i poprawić `ILE`.

/** Sekunda klipu, od której są klatki (w klipie wybuch jest w `WYBUCH_S`). */
export const OD_S = 1.0;
export const FPS = 15;
export const ILE = 58;

const adres = (i: number) => `/wideo/wybuch/${String(i + 1).padStart(2, "0")}.jpg`;

let wczytane: Promise<HTMLImageElement[] | null> | null = null;

/**
 * Pobiera wszystkie klatki raz na stronę (od finału serią); null, gdy któraś się nie wczytała. Zwykłe `load`, nie
 * `decode()`: w karcie w tle `decode()` potrafił nie skończyć się wcale albo zgłosić błąd.
 */
export function wczytajKlatkiWybuchu(): Promise<HTMLImageElement[] | null> {
  wczytane ??= Promise.all(
    Array.from(
      { length: ILE },
      (_, i) =>
        new Promise<HTMLImageElement>((gotowe, blad) => {
          const img = new Image();
          img.onload = () => gotowe(img);
          img.onerror = blad;
          img.src = adres(i);
        }),
    ),
  ).catch(() => {
    wczytane = null;
    return null;
  });
  return wczytane;
}

/** Klatki gotowe do rysowania albo null (jeszcze się wczytują albo się nie udało: wtedy wybuch z CSS). */
export function useKlatkiWybuchu(wlaczone: boolean): HTMLImageElement[] | null {
  const [klatki, ustawKlatki] = useState<HTMLImageElement[] | null>(null);
  useEffect(() => {
    if (!wlaczone) return;
    let aktualny = true;
    void wczytajKlatkiWybuchu().then((k) => {
      if (aktualny) ustawKlatki(k);
    });
    return () => {
      aktualny = false;
    };
  }, [wlaczone]);
  return klatki;
}
