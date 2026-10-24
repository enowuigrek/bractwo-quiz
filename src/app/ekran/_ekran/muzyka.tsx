"use client";

import { useEffect, useRef, useState } from "react";
import { naWybuch, odblokujDzwiek } from "@/lib/gra/dzwiek";
import { GASNIECIE_S } from "@/lib/pijany";
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
 * Gesty, po których przeglądarka pozwala grać. Safari uznaje tylko kliknięcie i klawisz (nie `pointerdown`),
 * pilot TV wysyła klawisze.
 */
const GESTY = ["click", "keydown", "touchend"] as const;
/**
 * Tyle ciszy (gdy muzyka ma grać), zanim pokażemy prośbę o OK: krótsza przerwa to zwykłe ładowanie utworu.
 * Prośba tylko w poczekalni: w trakcie quizu żadnych napisów, najwyżej cisza.
 */
const PROSBA_PO_MS = 2000;

/** Który utwór pasuje do fazy: seria i pijany finał to jeden utwór, więc gra dalej bez przerwy. */
function utworFazy(stan: StanSesji): Utwor | null {
  switch (stan.faza) {
    case "poczekalnia":
      return "poczekalnia";
    case "seria":
    case "pijany":
      return "final";
    // werble to cisza (muzyka urywa się od razu): napięcie przed podium
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
 * (`preservesPitch = false`), faluje głośnością i ma krótkie dziury, a urywa się razem z gaśnięciem telefonów
 * (`GASNIECIE_S` przed końcem), żeby przed wybuchem szklanki była chwila ciszy; `naWybuch` to zapas na wypadek,
 * gdyby zegar TV się spóźniał. Bez przewijania (`currentTime`): telewizor po takim skoku potrafił ucichnąć.
 * Przeglądarka nie zagra bez gestu, więc gdy w poczekalni długo jest cicho, na dole jest prośba o OK na pilocie TV.
 */
export function MuzykaTv({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const odtwarzacze = useRef<HTMLAudioElement[]>([]);
  const aktywny = useRef<HTMLAudioElement | null>(null);
  const grany = useRef<Utwor | null>(null);
  const przenikania = useRef(new Map<HTMLAudioElement, number>());
  /** Muzyka urwana celowo (wybuch szklanki): gest jej nie wznawia, a cisza to nie blokada. */
  const zatrzymana = useRef(false);
  /**
   * Od kiedy aktywny odtwarzacz nie gra (`null`: gra). Nie polegamy na odmowie z `play()`: Safari potrafi nie
   * zagrać bez żadnego błędu, więc prośba wisi zawsze, gdy muzyka ma grać, a od chwili nic nie słychać.
   */
  const [cichoOd, ustawCichoOd] = useState<number | null>(null);
  const slychac = useRef(false);
  const [prosba, ustawProsbe] = useState(false);
  const cel = stan.muzyka ? utworFazy(stan) : null;
  // werble: stary utwór staje od razu, bez przenikania (ekran gaśnie jak wyłączany telewizor)
  const twardo = useRef(false);
  useEffect(() => {
    twardo.current = stan.faza === "werble";
  }, [stan.faza]);

  // dwa odtwarzacze na całą wizytę; gest odblokowuje oba naraz (Safari pamięta zgodę per element)
  useEffect(() => {
    const lista = [new Audio(), new Audio()];
    for (const a of lista) {
      a.preload = "auto";
      a.preservesPitch = false;
      a.volume = 0;
      // stan grania tylko z aktywnego odtwarzacza; zatrzymana taśma pijanego finału to nie blokada
      a.addEventListener("playing", () => {
        if (a !== aktywny.current) return;
        slychac.current = true;
        odblokujDzwiek();
        ustawCichoOd(null);
        ustawProsbe(false);
      });
      // brak pliku (np. jeszcze nie ma utworu na podium) to zwykła cisza, bez prośby
      a.addEventListener("error", () => {
        if (a !== aktywny.current) return;
        slychac.current = false;
        ustawCichoOd(null);
      });
      for (const zdarzenie of ["pause", "loadstart"]) {
        a.addEventListener(zdarzenie, () => {
          if (a !== aktywny.current || zatrzymana.current) return;
          slychac.current = false;
          ustawCichoOd((c) => c ?? Date.now());
        });
      }
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
      // licznik kroków: iPhone nie pozwala stronie zmieniać głośności (`volume` zostaje 1), a bez niego
      // przenikanie nie skończyłoby się nigdy i stary utwór grałby razem z nowym
      let kroki = PRZENIKANIE_MS / 50;
      const id = window.setInterval(() => {
        const nowa = a.volume + krok;
        if ((krok >= 0 && nowa >= glosnosc) || (krok < 0 && nowa <= glosnosc) || krok === 0 || --kroki <= 0) {
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
          if (aktywny.current === a) plynnie(a, GLOSNOSC);
        })
        .catch((e: Error) => {
          // brak pliku (NotSupportedError) to cisza; każda inna odmowa to od razu prośba o OK na pilocie
          if (a !== aktywny.current) return;
          if (e.name === "NotSupportedError") return ustawCichoOd(null);
          slychac.current = false;
          ustawCichoOd(0);
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
      // od teraz liczymy ciszę, aż nowy odtwarzacz naprawdę zagra (`playing`)
      slychac.current = false;
      ustawCichoOd((c) => c ?? Date.now());
      if (stary) plynnie(stary, 0, () => stary.pause());
      void wystartuj(a);
    };

    grany.current = cel;
    if (!cel) {
      const stary = aktywny.current;
      aktywny.current = null;
      if (stary && twardo.current) {
        clearInterval(przenikania.current.get(stary));
        stary.pause();
      } else if (stary) plynnie(stary, 0, () => stary.pause());
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
      // aktywny, który nie gra (stoi albo Safari po cichu go nie puścił): play() jeszcze raz, już w geście
      if (a && !a.error && !slychac.current && !zatrzymana.current) void wystartuj(a);
    };
    for (const a of odtwarzacze.current) a.addEventListener("timeupdate", petla);
    for (const g of GESTY) window.addEventListener(g, gest);
    return () => {
      for (const a of odtwarzacze.current) a.removeEventListener("timeupdate", petla);
      for (const g of GESTY) window.removeEventListener(g, gest);
    };
  }, [cel]);

  // prośba po chwili ciszy; własny minutnik, bo `teraz` poza pytaniami i serią nie tyka
  useEffect(() => {
    if (cichoOd === null) return;
    const id = window.setTimeout(() => ustawProsbe(true), Math.max(0, cichoOd + PROSBA_PO_MS - Date.now()));
    return () => window.clearTimeout(id);
  }, [cichoOd]);

  // wybuch szklanki w wideo pijanego finału: muzyka urywa się w tej samej chwili
  useEffect(
    () =>
      naWybuch(() => {
        zatrzymana.current = true;
        for (const a of odtwarzacze.current) {
          clearInterval(przenikania.current.get(a));
          a.pause();
        }
      }),
    [],
  );

  // pijany finał: rozciągana taśma, falująca głośność i krótkie dziury, coraz mocniej (co tyknięcie zegara)
  const pijany = stan.faza === "pijany" && cel === "final";
  useEffect(() => {
    const a = aktywny.current;
    if (!a) return;
    if (!pijany) {
      a.playbackRate = 1;
      return;
    }
    if (grany.current !== "final" || a.paused || zatrzymana.current || !stan.faza_od || !stan.faza_do) return;
    const od = Date.parse(stan.faza_od);
    const do_ = Date.parse(stan.faza_do);
    // telefony gasną: muzyka urywa się razem z nimi, potem cisza i wybuch szklanki
    if (do_ - teraz <= GASNIECIE_S * 1000) {
      zatrzymana.current = true;
      a.pause();
      return;
    }
    const poziom = Math.min(1, Math.max(0, (teraz - od) / Math.max(1, do_ - od)));
    a.playbackRate = Math.max(0.5, 1 - 0.3 * poziom + 0.05 * poziom * Math.sin(teraz / 700));
    // dziura trwa jedno tyknięcie (250 ms), potem głośność wraca, falując
    const dziura = Math.random() < 0.15 * poziom;
    a.volume = dziura ? 0.03 : GLOSNOSC * (1 - 0.45 * poziom * (0.5 + 0.5 * Math.sin(teraz / 260)));
  }, [pijany, teraz, stan.faza_od, stan.faza_do]);

  if (!cel || stan.faza !== "poczekalnia" || cichoOd === null || !prosba) return null;
  return (
    <p className="tv-muzyka-podpowiedz" role="status">
      🔊 Naciśnij OK na pilocie telewizora, żeby włączyć muzykę
    </p>
  );
}
