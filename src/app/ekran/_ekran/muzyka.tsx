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
  poczekalnia: { plik: "/muzyka/poczekalnia.mp3", petlaOd: 2.5 },
  etap1: { plik: "/muzyka/etap-1.mp3", petlaOd: 0 },
  etap2: { plik: "/muzyka/etap-2.mp3", petlaOd: 4 },
  etap3: { plik: "/muzyka/etap-3.mp3", petlaOd: 0 },
  // walka o finał (etap przed finałem): smyczki i trąbki, napięcie przed finałem
  etap4: { plik: "/muzyka/etap-4.mp3", petlaOd: 4 },
  final: { plik: "/muzyka/final.mp3", petlaOd: 3.6 },
  podium: { plik: "/muzyka/podium.mp3", petlaOd: null },
} as const;

type Utwor = keyof typeof UTWORY;

const GLOSNOSC = 0.55;
const PRZENIKANIE_MS = 1500;
/**
 * Pętla bez nakładania (na TV było słychać koniec i początek naraz): w ostatnich `WYCISZENIE_S` sekundach utwór
 * cichnie, gra do końca pliku, chwila ciszy (`PRZERWA_PETLI_MS`) i ten sam utwór wchodzi powoli od `petlaOd`
 * (24.10: 0,7 s ciszy i 1,5 s wejścia to wciąż było za szybko).
 */
const WYCISZENIE_S = 1.2;
const PRZERWA_PETLI_MS = 2000;
const WEJSCIE_PO_PETLI_MS = 3500;
/** Koniec etapu (ranking po ostatnim pytaniu etapu): muzyka powoli gaśnie przed planszą następnego etapu. */
const WYCISZENIE_ETAPU_MS = 4000;
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

/** Co z gry jest potrzebne muzyce (ekran lokalu przy zapowiedzi podaje samą poczekalnię). */
type StanMuzyki = Pick<StanSesji, "faza" | "muzyka" | "etap" | "faza_od" | "faza_do" | "ostatnie_w_etapie">;

/**
 * Wspólne dla całej strony: dwa odtwarzacze i to, co gra. Zostają, gdy komponent się wymienia (ekran lokalu
 * przechodzi z zapowiedzi do gry), więc utwór gra dalej bez przerwy i nie traci zgody przeglądarki.
 */
type Wspolne = {
  odtwarzacze: HTMLAudioElement[];
  aktywny: HTMLAudioElement | null;
  grany: Utwor | null;
  przenikania: Map<HTMLAudioElement, number>;
  /** Muzyka urwana celowo (gaśnięcie przed wybuchem szklanki): gest jej nie wznawia, a cisza to nie blokada. */
  zatrzymana: boolean;
  slychac: boolean;
  zamontowane: number;
};
let wspolne: Wspolne | null = null;

function strona(): Wspolne {
  if (!wspolne) {
    const odtwarzacze = [new Audio(), new Audio()];
    for (const a of odtwarzacze) {
      a.preload = "auto";
      a.preservesPitch = false;
      a.volume = 0;
    }
    wspolne = {
      odtwarzacze,
      aktywny: null,
      grany: null,
      przenikania: new Map(),
      zatrzymana: false,
      slychac: false,
      zamontowane: 0,
    };
  }
  return wspolne;
}

/** Który utwór pasuje do fazy: seria i pijany finał to jeden utwór, więc gra dalej bez przerwy. */
function utworFazy(stan: StanMuzyki): Utwor | null {
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
      // ranking po ostatnim pytaniu etapu: cisza (powoli), następny etap wejdzie ze swoją muzyką od nowa
      if (stan.faza === "ranking" && stan.ostatnie_w_etapie && !stan.etap?.finalowy) return null;
      // plansza etapu, pytania, wyniki i ranking: według etapu (na planszy to etap, który się zaczyna).
      // Narasta z etapu na etap: noir lekko, noir z napięciem, noir z lekkim napięciem w 3. i dalszych,
      // walka o finał (smyczki i trąbki) i finał. Quiz bez etapów: etap-1.
      if (stan.etap?.finalowy) return "final";
      if (stan.etap?.final_po_etapie) return "etap4";
      if ((stan.etap?.nr ?? 1) >= 3) return "etap3";
      return stan.etap?.nr === 2 ? "etap2" : "etap1";
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
 * Ekran lokalu gra muzykę poczekalni już przy zapowiedzi (godzina i odliczanie), a po otwarciu poczekalni ten
 * sam utwór gra dalej (odtwarzacze są wspólne dla strony, `strona()`).
 */
export function MuzykaTv({ stan, teraz }: { stan: StanMuzyki; teraz: number }) {
  /**
   * Od kiedy aktywny odtwarzacz nie gra (`null`: gra). Nie polegamy na odmowie z `play()`: Safari potrafi nie
   * zagrać bez żadnego błędu, więc prośba wisi zawsze, gdy muzyka ma grać, a od chwili nic nie słychać.
   */
  const [cichoOd, ustawCichoOd] = useState<number | null>(null);
  const [prosba, ustawProsbe] = useState(false);
  const cel = stan.muzyka ? utworFazy(stan) : null;
  // werble: stary utwór staje od razu, bez przenikania (ekran gaśnie jak wyłączany telewizor)
  const twardo = useRef(false);
  // koniec etapu: gaśnie powoli (WYCISZENIE_ETAPU_MS), a nie w zwykłe 1,5 s
  const powoli = useRef(false);
  useEffect(() => {
    twardo.current = stan.faza === "werble";
    powoli.current = stan.faza === "ranking";
  }, [stan.faza]);

  // dwa odtwarzacze na całą stronę; gest odblokowuje oba naraz (Safari pamięta zgodę per element)
  useEffect(() => {
    const w = strona();
    w.zamontowane++;
    const sluchacze: [HTMLAudioElement, string, () => void][] = [];
    for (const a of w.odtwarzacze) {
      // stan grania tylko z aktywnego odtwarzacza; zatrzymana taśma pijanego finału to nie blokada
      sluchacze.push([
        a,
        "playing",
        () => {
          if (a !== w.aktywny) return;
          w.slychac = true;
          odblokujDzwiek();
          ustawCichoOd(null);
          ustawProsbe(false);
        },
      ]);
      // brak pliku (np. jeszcze nie ma utworu) to zwykła cisza, bez prośby
      sluchacze.push([
        a,
        "error",
        () => {
          if (a !== w.aktywny) return;
          w.slychac = false;
          ustawCichoOd(null);
        },
      ]);
      for (const zdarzenie of ["pause", "loadstart"]) {
        sluchacze.push([
          a,
          zdarzenie,
          () => {
            if (a !== w.aktywny || w.zatrzymana) return;
            w.slychac = false;
            ustawCichoOd((c) => c ?? Date.now());
          },
        ]);
      }
    }
    for (const [a, z, f] of sluchacze) a.addEventListener(z, f);
    return () => {
      for (const [a, z, f] of sluchacze) a.removeEventListener(z, f);
      w.zamontowane--;
      // cisza dopiero, gdy po chwili nikt nie przejął muzyki (zapowiedź → gra to wymiana komponentu)
      window.setTimeout(() => {
        if (w.zamontowane > 0) return;
        w.przenikania.forEach((id) => clearInterval(id));
        w.odtwarzacze.forEach((a) => a.pause());
        w.aktywny = null;
        w.grany = null;
      }, 300);
    };
  }, []);

  // zmiana utworu (albo wyłączenie): nowy rusza na wolnym odtwarzaczu, stary cichnie
  useEffect(() => {
    const w = strona();
    const plynnie = (a: HTMLAudioElement, glosnosc: number, potem?: () => void, ms = PRZENIKANIE_MS) => {
      clearInterval(w.przenikania.get(a));
      const krok = (glosnosc - a.volume) / (ms / 50);
      // licznik kroków: iPhone nie pozwala stronie zmieniać głośności (`volume` zostaje 1), a bez niego
      // przenikanie nie skończyłoby się nigdy i stary utwór grałby razem z nowym
      let kroki = ms / 50;
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
      w.przenikania.set(a, id);
    };

    const wystartuj = (a: HTMLAudioElement, wejscieMs = PRZENIKANIE_MS) =>
      a
        .play()
        .then(() => {
          if (w.aktywny === a) plynnie(a, GLOSNOSC, undefined, wejscieMs);
        })
        .catch((e: Error) => {
          // brak pliku (NotSupportedError) to cisza; każda inna odmowa to od razu prośba o OK na pilocie
          if (a !== w.aktywny) return;
          if (e.name === "NotSupportedError") return ustawCichoOd(null);
          w.slychac = false;
          ustawCichoOd(0);
        });

    const zagraj = (utwor: Utwor, od: number, wejscieMs = PRZENIKANIE_MS) => {
      const stary = w.aktywny;
      const a = w.odtwarzacze.find((o) => o !== stary) ?? w.odtwarzacze[0];
      clearInterval(w.przenikania.get(a));
      const plik = UTWORY[utwor].plik;
      if (!a.src.endsWith(plik)) a.src = plik;
      a.currentTime = od;
      a.volume = 0;
      a.playbackRate = stary?.playbackRate ?? 1;
      w.aktywny = a;
      w.zatrzymana = false;
      // od teraz liczymy ciszę, aż nowy odtwarzacz naprawdę zagra (`playing`)
      w.slychac = false;
      ustawCichoOd((c) => c ?? Date.now());
      if (stary) plynnie(stary, 0, () => stary.pause());
      void wystartuj(a, wejscieMs);
    };

    // ten sam utwór już gra (np. zapowiedź przeszła w poczekalnię): gra dalej, bez startu od nowa
    const juzGra = cel !== null && cel === w.grany && !!w.aktywny && !w.aktywny.paused;
    w.grany = cel;
    if (!cel) {
      const stary = w.aktywny;
      w.aktywny = null;
      if (stary && twardo.current) {
        clearInterval(w.przenikania.get(stary));
        stary.pause();
      } else if (stary) {
        plynnie(stary, 0, () => stary.pause(), powoli.current ? WYCISZENIE_ETAPU_MS : PRZENIKANIE_MS);
      }
      return;
    }
    if (!juzGra) zagraj(cel, 0);

    // pętla: tuż przed końcem pliku wyciszenie, po końcu chwila ciszy i ten sam utwór od `petlaOd`
    const wyciszane = new WeakSet<HTMLAudioElement>();
    const petla = (e: Event) => {
      const a = e.currentTarget as HTMLAudioElement;
      if (a !== w.aktywny || a.paused || UTWORY[cel].petlaOd === null || !a.duration || wyciszane.has(a)) return;
      if (a.duration - a.currentTime <= WYCISZENIE_S) {
        wyciszane.add(a);
        plynnie(a, 0);
      }
    };
    let przerwa = 0;
    const koniecPliku = (e: Event) => {
      const a = e.currentTarget as HTMLAudioElement;
      const od = UTWORY[cel].petlaOd;
      if (a !== w.aktywny || od === null) return;
      przerwa = window.setTimeout(() => {
        wyciszane.delete(a);
        if (w.aktywny === a && w.grany === cel && !w.zatrzymana) zagraj(cel, od, WEJSCIE_PO_PETLI_MS);
      }, PRZERWA_PETLI_MS);
    };
    // gest: każdy odtwarzacz dostaje play() w czasie gestu (Safari odblokowuje je osobno): wolny cicho
    // i od razu staje, a stojący aktywny rusza na nowo
    const gest = () => {
      const a = w.aktywny;
      for (const o of w.odtwarzacze) {
        if (o === a || !o.paused) continue;
        if (!o.src) o.src = UTWORY[cel].plik;
        o.volume = 0;
        void o
          .play()
          .then(() => {
            if (o !== w.aktywny) o.pause();
          })
          .catch(() => undefined);
      }
      // aktywny, który nie gra (stoi albo Safari po cichu go nie puścił): play() jeszcze raz, już w geście
      if (a && !a.error && !w.slychac && !w.zatrzymana) void wystartuj(a);
    };
    for (const a of w.odtwarzacze) {
      a.addEventListener("timeupdate", petla);
      a.addEventListener("ended", koniecPliku);
    }
    for (const g of GESTY) window.addEventListener(g, gest);
    return () => {
      window.clearTimeout(przerwa);
      for (const a of w.odtwarzacze) {
        a.removeEventListener("timeupdate", petla);
        a.removeEventListener("ended", koniecPliku);
      }
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
        const w = strona();
        w.zatrzymana = true;
        for (const a of w.odtwarzacze) {
          clearInterval(w.przenikania.get(a));
          a.pause();
        }
      }),
    [],
  );

  // pijany finał: rozciągana taśma, falująca głośność i krótkie dziury, coraz mocniej (co tyknięcie zegara)
  const pijany = stan.faza === "pijany" && cel === "final";
  useEffect(() => {
    const w = strona();
    const a = w.aktywny;
    if (!a) return;
    if (!pijany) {
      a.playbackRate = 1;
      return;
    }
    if (w.grany !== "final" || a.paused || w.zatrzymana || !stan.faza_od || !stan.faza_do) return;
    const od = Date.parse(stan.faza_od);
    const do_ = Date.parse(stan.faza_do);
    // telefony gasną: muzyka urywa się razem z nimi, potem cisza i wybuch szklanki
    if (do_ - teraz <= GASNIECIE_S * 1000) {
      w.zatrzymana = true;
      a.pause();
      return;
    }
    const poziom = Math.min(1, Math.max(0, (teraz - od) / Math.max(1, do_ - od)));
    // pierwsza połowa dogrywki gra czysto (jak dalsza seria), psucie rośnie dopiero od połowy
    const psucie = Math.max(0, (poziom - 0.5) / 0.5);
    a.playbackRate = Math.max(0.5, 1 - 0.3 * psucie + 0.05 * psucie * Math.sin(teraz / 700));
    // dziura trwa jedno tyknięcie (250 ms), potem głośność wraca, falując
    const dziura = Math.random() < 0.15 * psucie;
    a.volume = dziura ? 0.03 : GLOSNOSC * (1 - 0.45 * psucie * (0.5 + 0.5 * Math.sin(teraz / 260)));
  }, [pijany, teraz, stan.faza_od, stan.faza_do]);

  if (!cel || stan.faza !== "poczekalnia" || cichoOd === null || !prosba) return null;
  return (
    <p className="tv-muzyka-podpowiedz" role="status">
      🔊 Naciśnij OK na pilocie telewizora, żeby włączyć muzykę
    </p>
  );
}
