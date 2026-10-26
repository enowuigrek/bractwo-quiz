"use client";

import { useEffect, useRef } from "react";
import { wczytajEfekty, wznowEfekty, zagraj, type Efekt } from "@/lib/gra/efekty";
import { useDzwiekOdblokowany } from "@/lib/gra/dzwiek";
import { fazaTeraz, sekundaOdliczania } from "@/lib/gra/nasluch";
import { quizKlasyczny } from "@/lib/gra/wyscig";
import type { StanSesji } from "@/lib/gra/typy";

/** Tyle ostatnich sekund pytania tyka zegar. */
const TYKANIE_S = 5;
/**
 * Dźwięki odliczania i zegara grają o tyle wcześniej niż zmiana cyfry na ekranie: telewizor odtwarza dźwięk
 * z opóźnieniem bufora audio, więc bez wyprzedzenia cyfra była pierwsza (25.10, Łukasz: minimalnie, ale słychać).
 */
const WYPRZEDZENIE_MS = 150;
const GESTY = ["click", "keydown", "touchend"] as const;
const WSZYSTKIE: Efekt[] = [
  "pop",
  "odliczanie",
  "start",
  "tik",
  "gong",
  "ding",
  "ciekawostka",
  "odpowiedzi",
  "nalewanie",
  "zamiana",
  "dzwonek",
  "krok",
  "pudlo",
  "werble",
];

/** Co z chwili poprzedniego renderu porównujemy z bieżącą. */
type Migawka = {
  faza: string;
  zadanie: string | null;
  gracze: number;
  /** Przed pytaniem: sekundy do startu (3, 2, 1), w pytaniu: sekundy do końca (z wyprzedzeniem dźwięku). */
  sekunda: number | null;
  /** Pytanie już się zaczęło (z wyprzedzeniem dźwięku: chwilę przed odsłoną). */
  start: boolean;
  czasMinal: boolean;
  seria: Map<string, { odpowiedzi: number; dobre: number }>;
};

/**
 * Efekty dźwiękowe na TV (src/lib/gra/efekty.ts), wyzwalane zmianami tego, co TV i tak już wie (faza, zegar,
 * liczba graczy, postęp serii), bez nowych komunikatów z bazy. Grają razem z muzyką i wyłącza je ten sam
 * przełącznik w pilocie (`stan.muzyka`). Pierwszy stan po wczytaniu strony niczego nie odtwarza (TV
 * przeładowany w trakcie pytania nie gra zaległych dźwięków). Ekran lokalu między grami jest cichy.
 */
export function EfektyTv({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const poprzednia = useRef<Migawka | null>(null);
  const werble = useRef<(() => void) | null>(null);

  // ten sam gest co muzyka (OK na pilocie TV) pozwala grać efekty
  useEffect(() => {
    wczytajEfekty(WSZYSTKIE);
    const gest = () => wznowEfekty();
    for (const g of GESTY) window.addEventListener(g, gest);
    return () => {
      for (const g of GESTY) window.removeEventListener(g, gest);
      werble.current?.();
    };
  }, []);

  // muzyka już gra, więc przeglądarka pozwala na dźwięk: efekty też, bez czekania na gest. Po przeładowaniu TV
  // (nowa wersja) muzyka potrafiła ruszyć sama, a efekty milczały do najbliższego OK na pilocie (25.10)
  const odblokowany = useDzwiekOdblokowany();
  useEffect(() => {
    if (odblokowany) wznowEfekty();
  }, [odblokowany]);

  const { faza, doStartu, doKonca, czasMinal, bezLimitu } = fazaTeraz(stan, teraz);
  const sekunda =
    faza === "przygotuj"
      ? sekundaOdliczania(doStartu - WYPRZEDZENIE_MS)
      : faza === "pytanie" && !bezLimitu
        ? Math.ceil((doKonca - WYPRZEDZENIE_MS) / 1000)
        : null;
  const biezaca: Migawka = {
    faza,
    zadanie: stan.zadanie?.id ?? null,
    gracze: stan.liczba_graczy,
    sekunda,
    start: faza === "pytanie" || (faza === "przygotuj" && doStartu <= WYPRZEDZENIE_MS),
    czasMinal,
    seria: new Map((stan.seria ?? []).map((g) => [g.nick, { odpowiedzi: g.odpowiedzi, dobre: g.dobre }])),
  };

  useEffect(() => {
    const p = poprzednia.current;
    const b = biezaca;
    poprzednia.current = b;
    // werble trwają, aż zmieni się faza (podium albo cokolwiek innego)
    if (b.faza !== "werble" && werble.current) {
      werble.current();
      werble.current = null;
    }
    if (!p || !stan.muzyka) return;
    // inne pytanie: to nie jest ciąg dalszy poprzedniego (np. pilot przeskoczył)
    const nowaFaza = p.zadanie !== b.zadanie;

    if (b.faza === "poczekalnia" && b.gracze > p.gracze) zagraj("pop");

    if (b.faza === "przygotuj" && b.sekunda !== p.sekunda && b.sekunda !== null && b.sekunda >= 1 && b.sekunda <= 3) {
      zagraj("odliczanie");
    }
    if (b.start && !p.start && p.faza === "przygotuj" && !nowaFaza) zagraj("start");
    if (
      b.faza === "pytanie" &&
      p.faza === "pytanie" &&
      b.sekunda !== null &&
      b.sekunda !== p.sekunda &&
      b.sekunda >= 1 &&
      b.sekunda <= TYKANIE_S
    ) {
      zagraj("tik");
    }
    if (b.czasMinal && !p.czasMinal && p.zadanie === b.zadanie) zagraj("gong");
    // ciekawostka to w bazie też „wynik”, ale ma swój dźwięk
    if (b.faza === "wynik" && p.faza !== "wynik") zagraj(stan.zadanie?.typ === "ciekawostka" ? "ciekawostka" : "ding");
    if (b.faza === "odpowiedzi" && p.faza !== "odpowiedzi") zagraj("odpowiedzi");

    // klasyczny pub quiz nie ma szklanki, więc ranking bez nalewania (26.10)
    if (b.faza === "ranking" && p.faza !== "ranking" && !quizKlasyczny(stan)) {
      // koniec etapu (nie finału): dzwonek „ostatnia kolejka”; zwykły ranking: nalewanie (jeśli jest plik)
      zagraj(stan.ostatnie_w_etapie && !stan.etap?.finalowy ? "dzwonek" : "nalewanie");
    }

    // finał serią: krok naprzód za dobrą, cofnięcie za złą (najwyżej jeden każdego rodzaju naraz)
    if (b.faza === "seria" && p.faza === "seria") {
      let dobra = false;
      let zla = false;
      for (const [nick, g] of b.seria) {
        const s = p.seria.get(nick);
        if (!s || g.odpowiedzi <= s.odpowiedzi) continue;
        if (g.dobre > s.dobre) dobra = true;
        else zla = true;
      }
      if (dobra) zagraj("krok");
      if (zla) zagraj("pudlo");
    }

    if (b.faza === "werble" && p.faza !== "werble") werble.current = zagraj("werble");
    // podium bez fanfary (25.10, Łukasz: głupio brzmiała): od razu gra muzyka podium (muzyka.tsx)
  });

  return null;
}
