"use client";

import { useEffect, useRef, useState } from "react";
import { naWybuch, odblokujDzwiek } from "@/lib/gra/dzwiek";
import { GASNIECIE_S } from "@/lib/pijany";
import { zagrajMuzykePijana } from "@/lib/gra/muzyka-pijana";
import type { StanSesji } from "@/lib/gra/typy";
import { IkonaGlosnik } from "@/components/ikony";

/**
 * Utwory na TV (instrumentalne, z Suno), w `public/muzyka/`. Brakujący plik po prostu nie gra, więc można
 * je dodawać po kolei. Podium gra raz, reszta w pętli (`petla`).
 */
const UTWORY = {
  poczekalnia: { plik: "/muzyka/poczekalnia.mp3", petla: true },
  etap1: { plik: "/muzyka/etap-1.mp3", petla: true },
  etap2: { plik: "/muzyka/etap-2.mp3", petla: true },
  etap3: { plik: "/muzyka/etap-3.mp3", petla: true },
  // walka o finał (etap przed finałem): smyczki i trąbki, napięcie przed finałem
  etap4: { plik: "/muzyka/etap-4.mp3", petla: true },
  final: { plik: "/muzyka/final.mp3", petla: true },
  podium: { plik: "/muzyka/podium.mp3", petla: false },
} as const satisfies Record<string, { plik: string; petla: boolean }>;

type Utwor = keyof typeof UTWORY;

const GLOSNOSC = 0.55;
/** Muzyka pijanego finału (Web Audio) gra z tą częścią `GLOSNOSC`. */
const PIJANA_CISZEJ = 0.7;
/** Stary utwór cichnie przy zmianie tyle ms. Nowy wchodzi od razu na pełną głośność: utwory mają własne wstępy. */
const PRZENIKANIE_MS = 1500;
/**
 * Pętla bez nakładania (na TV było słychać koniec i początek naraz): w ostatnich `WYCISZENIE_S` sekundach utwór
 * cichnie, gra do końca pliku, chwila ciszy (`PRZERWA_PETLI_MS`) i ten sam utwór wchodzi powoli od początku
 * (24.10: 0,7 s ciszy i 1,5 s wejścia to wciąż było za szybko). Od początku, bo plik wczytujemy na nowo zamiast
 * przewijać: Samsung po skoku `currentTime` na wolnym odtwarzaczu potrafił już nie zagrać (25.10: pętla utworu
 * finału wypadła w pijanym finale i muzyka ucichła do końca).
 */
const WYCISZENIE_S = 1.2;
const PRZERWA_PETLI_MS = 2000;
const WEJSCIE_PO_PETLI_MS = 3500;
/**
 * Tyle muzyka czeka po zniknięciu komponentu, zanim ucichnie. Ekran lokalu przy otwarciu poczekalni wymienia
 * planszę zapowiedzi na ekran gry, który włącza muzykę dopiero po pobraniu stanu gry; przy 0,3 s zapasu utwór
 * poczekalni czasem gasł i zaczynał się od nowa (25.10).
 */
const ZAPAS_WYMIANY_MS = 5000;
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
type StanMuzyki = Pick<StanSesji, "faza" | "muzyka" | "etap" | "faza_od" | "faza_do" | "ostatnie_w_etapie"> & {
  /** Klasyczny pub quiz (bez etapów) ma własną muzykę (z `quiz` gry albo `klasyczny` z zapowiedzi lokalu). */
  quiz?: StanSesji["quiz"];
  klasyczny?: boolean;
};

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
  // klasyczny pub quiz na razie bez muzyki (26.10, Łukasz: utwory z promptów nie pasowały), efekty grają
  const klasyczny = stan.klasyczny ?? (!!stan.quiz && stan.quiz.liczba_etapow === 0);
  if (klasyczny) return null;
  switch (stan.faza) {
    case "poczekalnia":
    case "wstep":
      return "poczekalnia";
    case "seria":
    case "pijany":
      return "final";
    // werble to cisza (muzyka urywa się od razu): napięcie przed podium
    case "werble":
      return null;
    case "podium":
    case "tabela":
      return "podium";
    // „Zakończ grę”: muzyka szybko cichnie (ekran lokalu wraca do logo)
    case "koniec":
      return null;
    default:
      // ranking po ostatnim pytaniu etapu: cisza (urywa się z dzwonkiem), następny etap wejdzie ze swoją muzyką od nowa
      if (stan.faza === "ranking" && stan.ostatnie_w_etapie && !stan.etap?.finalowy) return null;
      // plansza etapu, pytania, wyniki i ranking: według etapu (na planszy to etap, który się zaczyna).
      // Narasta z etapu na etap: noir lekko, noir z napięciem, noir z lekkim napięciem w 3. i dalszych,
      // walka o finał (smyczki i trąbki) i finał.
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
 * W pijanym finale utwór finału gra dalej przez Web Audio z płynnym kołysaniem tempa (muzyka-pijana.ts), a urywa się
 * razem z gaśnięciem telefonów
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
  // werble i koniec etapu: stary utwór urywa się od razu, bez wyciszania (werble: ekran gaśnie jak wyłączany
  // telewizor; koniec etapu: razem z dzwonkiem „ostatnia kolejka”, efekty.tsx)
  const twardo = useRef(false);
  useEffect(() => {
    twardo.current = stan.faza === "werble" || stan.faza === "ranking";
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
      // brak pliku (np. jeszcze nie ma utworu): zwykła cisza bez prośby
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
      }, ZAPAS_WYMIANY_MS);
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

    // wejscieMs 0: od razu pełna głośność (nowy utwór ma własny wstęp); więcej tylko po powrocie pętli
    const wystartuj = (a: HTMLAudioElement, wejscieMs = 0) =>
      a
        .play()
        .then(() => {
          if (w.aktywny !== a) return;
          if (wejscieMs > 0) plynnie(a, GLOSNOSC, undefined, wejscieMs);
          else a.volume = GLOSNOSC;
        })
        .catch((e: Error) => {
          // brak pliku (NotSupportedError) to cisza; każda inna odmowa to od razu prośba o OK na pilocie
          if (a !== w.aktywny) return;
          if (e.name === "NotSupportedError") return ustawCichoOd(null);
          w.slychac = false;
          ustawCichoOd(0);
        });

    const zagraj = (utwor: Utwor, wejscieMs = 0) => {
      const stary = w.aktywny;
      const a = w.odtwarzacze.find((o) => o !== stary) ?? w.odtwarzacze[0];
      clearInterval(w.przenikania.get(a));
      const plik = UTWORY[utwor].plik;
      // zawsze wczytanie od nowa (także tego samego pliku), nigdy przewijanie (patrz WYCISZENIE_S)
      a.src = plik;
      a.volume = 0;
      if (a.playbackRate !== 1) a.playbackRate = 1;
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
        plynnie(stary, 0, () => stary.pause());
      }
      return;
    }
    if (!juzGra) zagraj(cel);

    // pętla: tuż przed końcem pliku wyciszenie, po końcu chwila ciszy i ten sam utwór od początku
    const wyciszane = new WeakSet<HTMLAudioElement>();
    const petla = (e: Event) => {
      const a = e.currentTarget as HTMLAudioElement;
      if (a !== w.aktywny || a.paused || !UTWORY[cel].petla || !a.duration || wyciszane.has(a)) return;
      if (a.duration - a.currentTime <= WYCISZENIE_S) {
        wyciszane.add(a);
        plynnie(a, 0);
      }
    };
    let przerwa = 0;
    const koniecPliku = (e: Event) => {
      const a = e.currentTarget as HTMLAudioElement;
      if (a !== w.aktywny || !UTWORY[cel].petla) return;
      przerwa = window.setTimeout(() => {
        wyciszane.delete(a);
        if (w.aktywny === a && w.grany === cel && !w.zatrzymana) zagraj(cel, WEJSCIE_PO_PETLI_MS);
      }, PRZERWA_PETLI_MS);
    };
    // gest: każdy odtwarzacz dostaje play() w czasie gestu (Safari odblokowuje je osobno): wolny cicho
    // i od razu staje, a stojący aktywny rusza na nowo. Tylko gdy muzyki nie słychać: Samsung gra jeden odtwarzacz
    // naraz, więc play() wolnego zatrzymywał grającą muzykę (25.10: OK na pilocie, żeby OLED nie gasł, ją wyłączał)
    const gest = () => {
      if (w.slychac) return;
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

  // muzyka pijanego finału na Web Audio (niżej): uciszenie i flaga startu, żeby nie startowała dwa razy
  const kolysanie = useRef<{ zatrzymaj: (() => void) | null; startuje: boolean }>({ zatrzymaj: null, startuje: false });
  const zatrzymajKolysanie = () => {
    kolysanie.current.zatrzymaj?.();
    kolysanie.current.zatrzymaj = null;
  };

  // wybuch szklanki pijanego finału: muzyka urywa się w tej samej chwili
  useEffect(
    () =>
      naWybuch(() => {
        const w = strona();
        kolysanie.current.zatrzymaj?.();
        kolysanie.current.zatrzymaj = null;
        w.zatrzymana = true;
        for (const a of w.odtwarzacze) {
          clearInterval(w.przenikania.get(a));
          a.pause();
        }
      }),
    [],
  );

  // pijany finał: utwór finału przechodzi z odtwarzacza na Web Audio (muzyka-pijana.ts), gdzie tempo kołysze się
  // płynnie. Zmiany `playbackRate` odtwarzacza robiły na Samsungu dziury (26.10). Gdy przejęcie się nie uda
  // (utwór niezdekodowany, brak zgody na dźwięk), gra dalej zwykły odtwarzacz, bez kołysania.
  const pijany = stan.faza === "pijany" && cel === "final";
  useEffect(() => {
    const w = strona();
    const a = w.aktywny;
    if (!pijany) {
      zatrzymajKolysanie();
      return;
    }
    if (!a || w.grany !== "final" || !stan.faza_od || !stan.faza_do) return;
    const do_ = Date.parse(stan.faza_do);
    // telefony gasną: muzyka urywa się razem z nimi, potem cisza i wybuch szklanki
    if (do_ - teraz <= GASNIECIE_S * 1000) {
      zatrzymajKolysanie();
      w.zatrzymana = true;
      a.pause();
      return;
    }
    if (kolysanie.current.zatrzymaj || kolysanie.current.startuje || w.zatrzymana || a.paused) return;
    kolysanie.current.startuje = true;
    // ciszej niż odtwarzacz: przez Web Audio ta sama głośność brzmiała na TV wyraźnie głośniej (26.10)
    void zagrajMuzykePijana(() => a.currentTime, GLOSNOSC * PIJANA_CISZEJ, (do_ - teraz) / 1000 - GASNIECIE_S).then((zatrzymaj) => {
      kolysanie.current.startuje = false;
      if (!zatrzymaj) return;
      kolysanie.current.zatrzymaj = zatrzymaj;
      // odtwarzacz milknie celowo (gest go nie wznawia), dalej gra Web Audio
      w.zatrzymana = true;
      a.pause();
    });
  }, [pijany, teraz, stan.faza_od, stan.faza_do]);
  useEffect(() => () => zatrzymajKolysanie(), []);

  if (!cel || stan.faza !== "poczekalnia" || cichoOd === null || !prosba) return null;
  return (
    <p className="tv-muzyka-podpowiedz" role="status">
      <IkonaGlosnik /> Naciśnij OK na pilocie telewizora, żeby włączyć muzykę
    </p>
  );
}
