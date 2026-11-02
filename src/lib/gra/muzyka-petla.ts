"use client";

import { kontekstEfektow } from "./efekty";
import { kolysz } from "./muzyka-pijana";

// Utwory z początkiem i pętlą (02.11, Łukasz tnie je w Reaperze): `/muzyka/<nazwa>-start.mp3` gra raz,
// a `/muzyka/<nazwa>-petla.mp3` zaraz po nim w kółko, aż do końca rundy, bez słyszalnego szwu. Odtwarzacz <audio>
// zostawiał na końcu pliku dziurę, dlatego te utwory grają przez Web Audio: oba pliki sklejone w jeden bufor, jedno
// źródło z `loopStart` na końcu początku. Kołysanie tempa w pijanym finale działa wtedy na całości jednakowo.
// Pliki robimy ffmpeg-iem z WAV (`libmp3lame`): Chromium dekoduje taki MP3 co do próbki, bez ciszy enkodera
// (sprawdzone 02.11). Utwór bez tych plików gra po staremu z jednego pliku (muzyka.tsx).

export type Petla = { bufor: AudioBuffer; petlaOd: number };

/** Wczytywane utwory (`null`: utwór nie ma plików początku i pętli). Trzymamy tylko grany i następny. */
const wczytywane = new Map<string, Promise<Petla | null>>();
const gotowe = new Map<string, Petla | null>();

async function pobierz(c: AudioContext, adres: string): Promise<AudioBuffer | null> {
  const r = await fetch(adres);
  return r.ok ? c.decodeAudioData(await r.arrayBuffer()) : null;
}

/** Początek i pętla w jednym buforze (dekodowanie przelicza oba na częstotliwość kontekstu, więc pasują). */
function sklej(c: AudioContext, start: AudioBuffer, petla: AudioBuffer): Petla {
  const kanaly = Math.max(start.numberOfChannels, petla.numberOfChannels);
  const bufor = c.createBuffer(kanaly, start.length + petla.length, c.sampleRate);
  for (let k = 0; k < kanaly; k++) {
    bufor.copyToChannel(start.getChannelData(Math.min(k, start.numberOfChannels - 1)), k, 0);
    bufor.copyToChannel(petla.getChannelData(Math.min(k, petla.numberOfChannels - 1)), k, start.length);
  }
  return { bufor, petlaOd: start.length / c.sampleRate };
}

/**
 * Pobiera i dekoduje utwór `nazwa` (raz), a z pamięci wyrzuca te spoza `zostaw` (zdekodowana minuta to ok. 20 MB,
 * a telewizor ma jej mało).
 */
export function wczytajPetle(nazwa: string, zostaw: string[]): Promise<Petla | null> {
  for (const k of [...wczytywane.keys()]) {
    if (!zostaw.includes(k)) {
      wczytywane.delete(k);
      gotowe.delete(k);
    }
  }
  const c = kontekstEfektow();
  if (!c) return Promise.resolve(null);
  let p = wczytywane.get(nazwa);
  if (!p) {
    const obietnica = Promise.all([pobierz(c, `/muzyka/${nazwa}-start.mp3`), pobierz(c, `/muzyka/${nazwa}-petla.mp3`)])
      .then(([start, petla]) => (start && petla ? sklej(c, start, petla) : null))
      .catch(() => null);
    void obietnica.then((w) => {
      if (wczytywane.get(nazwa) === obietnica) gotowe.set(nazwa, w);
    });
    p = obietnica;
    wczytywane.set(nazwa, p);
  }
  return p;
}

/** Zdekodowany utwór; `undefined`: jeszcze się wczytuje (albo nikt go nie wczytywał), `null`: nie ma plików. */
export function gotowaPetla(nazwa: string): Petla | null | undefined {
  return gotowe.get(nazwa);
}

export type GranaPetla = {
  /** Cichnie przez `ms` (0: urywa się od razu). */
  zatrzymaj: (ms: number) => void;
  /** Kołysanie tempa pijanego finału do `koniecS` sekund od teraz (muzyka-pijana.ts). */
  kolysz: (koniecS: number) => void;
};

/** Gra utwór od początku; `null`, gdy przeglądarka jeszcze nie pozwala grać (brak gestu). */
export function zagrajPetle(p: Petla, glosnosc: number): GranaPetla | null {
  const c = kontekstEfektow();
  if (!c || c.state !== "running") return null;
  const zrodlo = c.createBufferSource();
  zrodlo.buffer = p.bufor;
  zrodlo.loop = true;
  zrodlo.loopStart = p.petlaOd;
  zrodlo.loopEnd = p.bufor.duration;
  const glos = c.createGain();
  glos.gain.value = glosnosc;
  zrodlo.connect(glos).connect(c.destination);
  zrodlo.start();
  let fala: OscillatorNode | null = null;
  let koniec = false;
  return {
    zatrzymaj: (ms) => {
      if (koniec) return;
      koniec = true;
      const k = c.currentTime;
      const s = Math.max(ms, 30) / 1000;
      glos.gain.cancelScheduledValues(k);
      glos.gain.setValueAtTime(glos.gain.value, k);
      glos.gain.linearRampToValueAtTime(0, k + s);
      zrodlo.stop(k + s + 0.02);
      fala?.stop(k + s + 0.02);
    },
    kolysz: (koniecS) => {
      if (!koniec && !fala) fala = kolysz(c, zrodlo, koniecS);
    },
  };
}
