"use client";

import { useEffect, useRef, useState } from "react";
import { odblokujDzwiek } from "@/lib/gra/dzwiek";
import type { StanSesji } from "@/lib/gra/typy";

/**
 * Utwory na TV (instrumentalne, z Suno), w `public/muzyka/`. Brakujący plik po prostu nie gra, więc można
 * je dodawać po kolei. Podium gra raz, reszta w pętli.
 */
const UTWORY = {
  poczekalnia: "/muzyka/poczekalnia.mp3",
  pytania: "/muzyka/pytania.mp3",
  przedFinalem: "/muzyka/przed-finalem.mp3",
  final: "/muzyka/final.mp3",
  podium: "/muzyka/podium.mp3",
} as const;

type Utwor = keyof typeof UTWORY;

const GLOSNOSC = 0.55;
const PRZENIKANIE_MS = 1500;
/**
 * Pijany finał: w ostatnich sekundach taśma staje (zwalnia do zera) tuż przed wideo pękającej szklanki,
 * które przy klipie 5 s rusza 4 s przed końcem (ekran/_ekran/pijany.tsx). Sekundy do `faza_do`.
 */
const TASMA_START_S = 5.8;
const TASMA_STOP_S = 4.2;

/** Który utwór pasuje do fazy: seria i pijany finał to jeden utwór, więc gra dalej bez przerwy. */
function utworFazy(stan: StanSesji): Utwor | null {
  switch (stan.faza) {
    case "poczekalnia":
      return "poczekalnia";
    case "seria":
    case "pijany":
      return "final";
    // werble to cisza: napięcie przed podium
    case "werble":
      return null;
    case "podium":
    case "tabela":
    case "koniec":
      return "podium";
    default:
      // plansza etapu, pytania, wyniki i ranking: według etapu (na planszy to etap, który się zaczyna)
      if (stan.etap?.final_po_etapie) return "przedFinalem";
      if (stan.etap?.finalowy) return "final";
      return "pytania";
  }
}

/**
 * Muzyka na TV, gdy prowadzący włączy ją w pilocie (`sesje.muzyka`). Utwory przenikają się przy zmianie
 * fazy albo etapu. W pijanym finale muzyka coraz bardziej się psuje: zwalnia i obniża się jak rozciągana
 * taśma (`preservesPitch = false`), faluje i zacina się, a na koniec staje tuż przed wybuchem w wideo.
 * Przeglądarka nie zagra bez gestu, więc gdy odmówi, na dole jest prośba o OK na pilocie TV.
 */
export function MuzykaTv({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const odtwarzacze = useRef(new Map<Utwor, HTMLAudioElement>());
  const przenikania = useRef(new Map<HTMLAudioElement, number>());
  const ostatnieZaciecie = useRef(0);
  const [zablokowana, ustawZablokowana] = useState(false);
  const cel = stan.muzyka ? utworFazy(stan) : null;

  // zmiana utworu: stary cichnie i staje, nowy rusza od zera głośności
  useEffect(() => {
    const plynnie = (a: HTMLAudioElement, glosnosc: number, potem?: () => void) => {
      clearInterval(przenikania.current.get(a));
      const krok = (glosnosc - a.volume) / (PRZENIKANIE_MS / 50);
      const id = window.setInterval(() => {
        const nowa = a.volume + krok;
        if ((krok >= 0 && nowa >= glosnosc) || (krok < 0 && nowa <= glosnosc) || krok === 0) {
          a.volume = glosnosc;
          clearInterval(id);
          potem?.();
        } else {
          a.volume = nowa;
        }
      }, 50);
      przenikania.current.set(a, id);
    };

    for (const [nazwa, a] of odtwarzacze.current) {
      if (nazwa !== cel) plynnie(a, 0, () => a.pause());
    }
    if (!cel) return;
    let a = odtwarzacze.current.get(cel);
    if (!a) {
      a = new Audio(UTWORY[cel]);
      a.loop = cel !== "podium";
      a.preload = "auto";
      a.preservesPitch = false;
      a.volume = 0;
      odtwarzacze.current.set(cel, a);
    }
    a.playbackRate = 1;
    const utwor = a;
    const graj = () =>
      utwor
        .play()
        .then(() => {
          odblokujDzwiek();
          ustawZablokowana(false);
          plynnie(utwor, GLOSNOSC);
        })
        .catch((e: Error) => {
          // brak pliku (NotSupportedError) to cisza; brak zgody przeglądarki to prośba o OK na pilocie
          if (e.name === "NotAllowedError") ustawZablokowana(true);
        });
    void graj();

    // pierwszy gest na TV (OK na pilocie, kliknięcie) odblokowuje dźwięk
    const ponow = () => void graj();
    window.addEventListener("keydown", ponow);
    window.addEventListener("pointerdown", ponow);
    return () => {
      window.removeEventListener("keydown", ponow);
      window.removeEventListener("pointerdown", ponow);
    };
  }, [cel]);

  // koniec strony: cisza
  useEffect(() => {
    const odtwarzaczeTeraz = odtwarzacze.current;
    const przenikaniaTeraz = przenikania.current;
    return () => {
      przenikaniaTeraz.forEach((id) => clearInterval(id));
      odtwarzaczeTeraz.forEach((a) => a.pause());
    };
  }, []);

  // pijany finał: rozciągana taśma, falowanie, zacięcia, a na koniec stop przed wybuchem
  const pijany = stan.faza === "pijany" && cel === "final";
  useEffect(() => {
    const a = odtwarzacze.current.get("final");
    if (!a) return;
    if (!pijany) {
      a.playbackRate = 1;
      return;
    }
    if (a.paused || !stan.faza_od || !stan.faza_do) return;
    const od = Date.parse(stan.faza_od);
    const do_ = Date.parse(stan.faza_do);
    const poziom = Math.min(1, Math.max(0, (teraz - od) / Math.max(1, do_ - od)));
    const doKonca = (do_ - teraz) / 1000;
    const tempo = 1 - 0.3 * poziom + 0.05 * poziom * Math.sin(teraz / 700);
    if (doKonca <= TASMA_STOP_S) {
      a.pause();
    } else if (doKonca <= TASMA_START_S) {
      const u = (TASMA_START_S - doKonca) / (TASMA_START_S - TASMA_STOP_S);
      a.playbackRate = Math.max(0.1, tempo * (1 - u));
    } else {
      a.playbackRate = Math.max(0.1, tempo);
      // zacięcie: cofnięcie o ułamek sekundy, coraz częściej
      const sekunda = Math.floor(teraz / 1000);
      const coIle = Math.max(2, Math.round(8 - 6 * poziom));
      if (poziom > 0.2 && sekunda !== ostatnieZaciecie.current && sekunda % coIle === 0) {
        ostatnieZaciecie.current = sekunda;
        a.currentTime = Math.max(0, a.currentTime - 0.35);
      }
    }
  }, [pijany, teraz, stan.faza_od, stan.faza_do]);

  if (!stan.muzyka || !zablokowana) return null;
  return (
    <p className="tv-muzyka-podpowiedz" role="status">
      🔊 Naciśnij OK na pilocie telewizora, żeby włączyć muzykę
    </p>
  );
}
