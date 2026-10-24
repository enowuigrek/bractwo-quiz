"use client";

import { useEffect, useRef, useState } from "react";
import { odblokujDzwiek } from "@/lib/gra/dzwiek";
import type { StanSesji } from "@/lib/gra/typy";

/**
 * Utwory na TV (instrumentalne, z Suno), w `public/muzyka/`. Brakujący plik po prostu nie gra, więc można
 * je dodawać po kolei. Podium gra raz, reszta w pętli. `petlaOd`: od której sekundy wraca pętla (za cichym
 * wstępem utworu, żeby przy powrocie nie było dołka).
 */
const UTWORY = {
  poczekalnia: { plik: "/muzyka/poczekalnia.mp3", petlaOd: 0 },
  pytania: { plik: "/muzyka/pytania.mp3", petlaOd: 0 },
  przedFinalem: { plik: "/muzyka/przed-finalem.mp3", petlaOd: 4 },
  final: { plik: "/muzyka/final.mp3", petlaOd: 3.6 },
  podium: { plik: "/muzyka/podium.mp3", petlaOd: null },
} as const;

type Utwor = keyof typeof UTWORY;

const GLOSNOSC = 0.55;
const PRZENIKANIE_MS = 1500;
/** Pętla: tyle sekund przed końcem pliku rusza ten sam utwór na drugim odtwarzaczu i oba się przenikają. */
const ZAKLADKA_S = 2.5;
/**
 * Pijany finał: w ostatnich sekundach taśma staje (zwalnia do zera) tuż przed wideo pękającej szklanki,
 * które przy klipie 5 s rusza 4 s przed końcem (ekran/_ekran/pijany.tsx). Sekundy do `faza_do`.
 */
const TASMA_START_S = 5.8;
const TASMA_STOP_S = 4.2;
/**
 * Gesty, po których przeglądarka pozwala grać. Safari uznaje tylko kliknięcie i klawisz (nie `pointerdown`),
 * pilot TV wysyła klawisze.
 */
const GESTY = ["click", "keydown", "touchend"] as const;

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
 * Muzyka na TV, gdy jest włączona (`sesje.muzyka`, domyślnie tak; pilot może wyłączyć). Dwa stałe odtwarzacze
 * na zmianę: zmiana utworu i powrót pętli to przenikanie z jednego na drugi, więc nie ma dziury na końcu pliku.
 * Stałe, bo Safari pozwala grać tylko elementom, które raz zagrały po geście; nowy element zostałby zablokowany.
 * W pijanym finale muzyka coraz bardziej się psuje: zwalnia i obniża się jak rozciągana taśma
 * (`preservesPitch = false`), faluje i zacina się, a na koniec staje tuż przed wybuchem w wideo.
 * Przeglądarka nie zagra bez gestu, więc gdy odmówi, na dole jest prośba o OK na pilocie TV.
 */
export function MuzykaTv({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const odtwarzacze = useRef<HTMLAudioElement[]>([]);
  const aktywny = useRef<HTMLAudioElement | null>(null);
  const grany = useRef<Utwor | null>(null);
  const przenikania = useRef(new Map<HTMLAudioElement, number>());
  const ostatnieZaciecie = useRef(0);
  /** Pijany finał zatrzymał taśmę przed wybuchem: gest jej nie wznawia. */
  const zatrzymana = useRef(false);
  const [zablokowana, ustawZablokowana] = useState(false);
  const cel = stan.muzyka ? utworFazy(stan) : null;

  // dwa odtwarzacze na całą wizytę; gest odblokowuje oba naraz (Safari pamięta zgodę per element)
  useEffect(() => {
    const lista = [new Audio(), new Audio()];
    for (const a of lista) {
      a.preload = "auto";
      a.preservesPitch = false;
      a.volume = 0;
    }
    odtwarzacze.current = lista;
    const przenikaniaTeraz = przenikania.current;
    return () => {
      przenikaniaTeraz.forEach((id) => clearInterval(id));
      lista.forEach((a) => a.pause());
    };
  }, []);

  // zmiana utworu (albo wyłączenie): nowy rusza na wolnym odtwarzaczu, stary cichnie
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

    const wystartuj = (a: HTMLAudioElement) =>
      a
        .play()
        .then(() => {
          odblokujDzwiek();
          ustawZablokowana(false);
          if (aktywny.current === a) plynnie(a, GLOSNOSC);
        })
        .catch((e: Error) => {
          // brak pliku (NotSupportedError) to cisza; brak zgody przeglądarki to prośba o OK na pilocie
          if (e.name === "NotAllowedError") ustawZablokowana(true);
        });

    const zagraj = (utwor: Utwor, od: number) => {
      const stary = aktywny.current;
      const a = odtwarzacze.current.find((o) => o !== stary) ?? odtwarzacze.current[0];
      if (!a) return;
      clearInterval(przenikania.current.get(a));
      const plik = UTWORY[utwor].plik;
      if (!a.src.endsWith(plik)) a.src = plik;
      a.currentTime = od;
      a.volume = 0;
      a.playbackRate = stary?.playbackRate ?? 1;
      aktywny.current = a;
      zatrzymana.current = false;
      if (stary) plynnie(stary, 0, () => stary.pause());
      void wystartuj(a);
    };

    grany.current = cel;
    if (!cel) {
      const stary = aktywny.current;
      aktywny.current = null;
      if (stary) plynnie(stary, 0, () => stary.pause());
      return;
    }
    zagraj(cel, 0);

    // pętla: przed końcem pliku ten sam utwór od `petlaOd` na drugim odtwarzaczu
    const petla = (e: Event) => {
      const a = e.currentTarget as HTMLAudioElement;
      const od = UTWORY[cel].petlaOd;
      if (a !== aktywny.current || a.paused || od === null || !a.duration) return;
      if (a.duration - a.currentTime <= ZAKLADKA_S) zagraj(cel, od);
    };
    // gest: każdy odtwarzacz dostaje play() w czasie gestu (Safari odblokowuje je osobno): wolny cicho
    // i od razu staje, a stojący aktywny rusza na nowo
    const gest = () => {
      const a = aktywny.current;
      for (const o of odtwarzacze.current) {
        if (o === a || !o.paused) continue;
        if (!o.src) o.src = UTWORY[cel].plik;
        o.volume = 0;
        void o
          .play()
          .then(() => {
            if (o !== aktywny.current) o.pause();
          })
          .catch(() => undefined);
      }
      if (a?.paused && !zatrzymana.current) void wystartuj(a);
    };
    for (const a of odtwarzacze.current) a.addEventListener("timeupdate", petla);
    for (const g of GESTY) window.addEventListener(g, gest);
    return () => {
      for (const a of odtwarzacze.current) a.removeEventListener("timeupdate", petla);
      for (const g of GESTY) window.removeEventListener(g, gest);
    };
  }, [cel]);

  // pijany finał: rozciągana taśma, falowanie, zacięcia, a na koniec stop przed wybuchem
  const pijany = stan.faza === "pijany" && cel === "final";
  useEffect(() => {
    const a = aktywny.current;
    if (!a) return;
    if (!pijany) {
      a.playbackRate = 1;
      return;
    }
    if (grany.current !== "final" || a.paused || !stan.faza_od || !stan.faza_do) return;
    const od = Date.parse(stan.faza_od);
    const do_ = Date.parse(stan.faza_do);
    const poziom = Math.min(1, Math.max(0, (teraz - od) / Math.max(1, do_ - od)));
    const doKonca = (do_ - teraz) / 1000;
    const tempo = 1 - 0.3 * poziom + 0.05 * poziom * Math.sin(teraz / 700);
    if (doKonca <= TASMA_STOP_S) {
      zatrzymana.current = true;
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
