"use client";

import { kontekstEfektow } from "./efekty";

// Muzyka pijanego finału na Web Audio (26.10): utwór finału gra dalej z tego samego miejsca, ale przez kontekst
// efektów, gdzie tempo kołysze się płynnie (oscylator na `playbackRate`, zmiana co próbkę). Zmiana `playbackRate`
// odtwarzacza <audio> na Samsungu za każdym razem robiła krótką dziurę w dźwięku, a częste zmiany brzmiały jak
// przerywanie. Utwór pobiera się i dekoduje z góry, już w finale serią (`wczytajMuzykePijana`).

const PLIK = "/muzyka/final.mp3";
/** Jedno kołysanie tempa trwa tyle sekund (razem z bujaniem torów na TV, pijany.tsx). */
export const OKRES_KOLYSANIA_S = 9;
/** Pod koniec fazy tempo faluje o tyle w obie strony, a średnio jest o `ZWOLNIENIE` wolniej. */
const GLEBOKOSC = 0.05;
const ZWOLNIENIE = 0.04;

let bufor: Promise<AudioBuffer | null> | null = null;

/** Pobiera i dekoduje utwór finału (raz na stronę). Bez kontekstu Web Audio nic nie robi. */
export function wczytajMuzykePijana(): void {
  const c = kontekstEfektow();
  if (!c || bufor) return;
  bufor = fetch(PLIK)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .then((b) => (b ? c.decodeAudioData(b) : null))
    .catch(() => {
      bufor = null;
      return null;
    });
}

/**
 * Gra utwór finału od sekundy `od` z kołysaniem tempa narastającym do `koniecS` sekund od teraz. Zwraca funkcję,
 * która go wycisza, albo null, gdy się nie da (utwór jeszcze się nie zdekodował albo przeglądarka nie pozwala
 * grać): wtedy zostaje zwykły odtwarzacz bez kołysania.
 */
export async function zagrajMuzykePijana(od: () => number, glosnosc: number, koniecS: number): Promise<(() => void) | null> {
  const c = kontekstEfektow();
  if (!c || c.state !== "running" || !bufor) return null;
  const b = await bufor;
  if (!b || c.state !== "running") return null;

  const t = c.currentTime;
  const zrodlo = c.createBufferSource();
  zrodlo.buffer = b;
  zrodlo.loop = true;
  // średnie tempo zwalnia przez całą fazę, a wokół niego wolne falowanie, coraz głębsze
  zrodlo.playbackRate.setValueAtTime(1, t);
  zrodlo.playbackRate.linearRampToValueAtTime(1 - ZWOLNIENIE, t + Math.max(1, koniecS));
  const fala = c.createOscillator();
  fala.frequency.value = 1 / OKRES_KOLYSANIA_S;
  const glebokosc = c.createGain();
  glebokosc.gain.setValueAtTime(0.008, t);
  glebokosc.gain.linearRampToValueAtTime(GLEBOKOSC, t + Math.max(1, koniecS));
  fala.connect(glebokosc).connect(zrodlo.playbackRate);

  const glos = c.createGain();
  glos.gain.value = glosnosc;
  zrodlo.connect(glos).connect(c.destination);
  // ten sam moment utworu co w odtwarzaczu, który zaraz się zatrzyma
  zrodlo.start(t, od() % b.duration);
  fala.start(t);

  let zatrzymana = false;
  return () => {
    if (zatrzymana) return;
    zatrzymana = true;
    const k = c.currentTime;
    glos.gain.cancelScheduledValues(k);
    glos.gain.setValueAtTime(glos.gain.value, k);
    glos.gain.linearRampToValueAtTime(0, k + 0.12);
    zrodlo.stop(k + 0.15);
    fala.stop(k + 0.15);
  };
}
