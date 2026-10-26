// Etapy quizu: szablony do panelu i opisy wspólne dla panelu, pilota, TV i telefonów.
// Zasady w bazie: tabela `etapy` i faza `etap` (supabase/migrations/20261023112811_etapy.sql).

import type { TypZadania } from "./zadania";

export const LIMITY_ETAPU = { nazwa: 60, opis: 240 } as const;

/** Mnożniki do wyboru w panelu. */
export const MNOZNIKI = [1, 1.5, 2, 3] as const;

/** Czasy etapu do wyboru; null = jak w ustawieniach gry. */
export const CZASY_ETAPU: (number | null)[] = [null, 8, 10, 15, 20, 30, 45, 60, 90, 120, 180];

/** „×1,5” */
export function napisMnoznika(m: number): string {
  return `×${m.toLocaleString("pl-PL")}`;
}

export type SzablonEtapu = {
  klucz: string;
  nazwa: string;
  opis: string;
  mnoznik: number;
  czas_s: number | null;
  finalowy: boolean;
  /** Seria: wszystkie pytania naraz, każdy we własnym tempie, `czas_s` na całą serię. */
  seria: boolean;
  /** Jakie pytania tu pasują (podpowiedź w panelu). */
  typy: TypZadania[];
  /** Ikona etapu na planszy TV (`etapy.ikona`). */
  ikona?: string;
};

/**
 * Szablony etapów: konkurencje „Wyścigu po piwo” jak w Piwnym quizie Bractwa (nazwy, opisy i ikony z bazy, 26.10)
 * i degustacja. Wypełniają formularz etapu, a potem wszystko można zmienić.
 */
export const SZABLONY_ETAPOW: SzablonEtapu[] = [
  {
    klucz: "na-jedno",
    nazwa: "Na jedno",
    opis: "Jedna dobra odpowiedź, jak to jedno piwo. Im szybciej, tym więcej punktów.",
    mnoznik: 1,
    czas_s: null,
    finalowy: false,
    seria: false,
    typy: ["wybor"],
    ikona: "/grafiki/etapy/na-jedno.webp",
  },
  {
    klucz: "jednak-wiecej",
    nazwa: "Jednak więcej",
    opis: "Dobrych odpowiedzi może być więcej. Zaznacz wszystkie, za złe tracisz część punktów pytania.",
    mnoznik: 1.5,
    czas_s: null,
    finalowy: false,
    seria: false,
    typy: ["wielokrotny"],
    ikona: "/grafiki/etapy/jednak-wiecej.webp",
  },
  {
    klucz: "ile",
    nazwa: "Ile?",
    opis: "Podaj liczbę. Trafienie to pełne punkty, a im bliżej, tym więcej.",
    mnoznik: 2,
    czas_s: null,
    finalowy: false,
    seria: false,
    typy: ["szacowanie"],
    ikona: "/grafiki/etapy/ile.webp",
  },
  {
    klucz: "jakos-sie-ulozy",
    nazwa: "Jakoś się ułoży",
    opis: "Ułóż pary i kolejność. Punkty za każdy dobry kawałek, a do finału wchodzi tylko trójka.",
    mnoznik: 2,
    czas_s: null,
    finalowy: false,
    seria: false,
    typy: ["pary", "kolejnosc"],
    ikona: "/grafiki/etapy/poskladaj-sie.webp",
  },
  {
    klucz: "degustacja",
    nazwa: "Degustacja na ślepo",
    opis: "Spróbuj próbek A, B, C… od prowadzącego i odpowiedz, co jest w szkle.",
    mnoznik: 2,
    czas_s: 45,
    finalowy: false,
    seria: false,
    typy: ["wybor", "pary"],
  },
  {
    klucz: "jeszcze-zdaze",
    nazwa: "Jeszcze zdążę",
    opis:
      "Trzej najlepsi ścigają się do piwa: dobra odpowiedź to krok naprzód, zła to krok w tył, więc nie klikaj na oślep. Lider ma kilka kroków przewagi. Kto pierwszy dobiegnie, wygrywa.",
    mnoznik: 2,
    czas_s: 180,
    finalowy: true,
    seria: true,
    typy: ["prawda_falsz"],
    ikona: "/grafiki/etapy/jeszcze-zdaze.webp",
  },
];

/** Rodzaj pytania podsuwany przy dodawaniu pytania do etapu z tego szablonu. */
export function typDomyslny(s: SzablonEtapu): TypZadania {
  return s.typy[0] ?? "wybor";
}

export type SzablonQuizu = {
  klucz: string;
  nazwa: string;
  opis: string;
  /** Etapy po kolei: klucz z `SZABLONY_ETAPOW` i ile pytań. */
  etapy: { szablon: string; pytania: number }[];
};

/**
 * Szablony nowego quizu (25–26.10, Łukasz): „Wyścig po piwo” ma stały zestaw konkurencji jak Piwny quiz (kreator
 * ich nie zmienia, poprawki potem na stronie quizu), klasyczny pub quiz to same pytania po kolei, bez finału.
 */
export const SZABLONY_QUIZU: SzablonQuizu[] = [
  {
    klucz: "wyscig",
    nazwa: "Wyścig po piwo",
    opis: "Konkurencje jak w Piwnym quizie, a na koniec trójka ściga się do piwa.",
    etapy: [
      { szablon: "na-jedno", pytania: 10 },
      { szablon: "jednak-wiecej", pytania: 8 },
      { szablon: "ile", pytania: 5 },
      { szablon: "jakos-sie-ulozy", pytania: 6 },
      { szablon: "jeszcze-zdaze", pytania: 14 },
    ],
  },
  {
    klucz: "klasyczny",
    nazwa: "Klasyczny pub quiz",
    opis: "Same pytania po kolei, bez etapów i finału.",
    etapy: [],
  },
];

export const MAX_ETAPOW = 10;
export const MAX_PLAN_PYTAN = 50;
