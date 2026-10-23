// Etapy quizu: szablony do panelu i opisy wspólne dla panelu, pilota, TV i telefonów.
// Zasady w bazie: tabela `etapy` i faza `etap` (supabase/migrations/20261023112811_etapy.sql).

import type { TypZadania } from "./zadania";

export const LIMITY_ETAPU = { nazwa: 60, opis: 240 } as const;

/** Mnożniki do wyboru w panelu. */
export const MNOZNIKI = [1, 1.5, 2, 3] as const;

/** Czasy etapu do wyboru; null = jak w ustawieniach gry. */
export const CZASY_ETAPU: (number | null)[] = [null, 8, 10, 15, 20, 30, 45, 60, 90, 120];

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
};

/** Szablony etapów: wypełniają formularz, a potem wszystko można zmienić. */
export const SZABLONY_ETAPOW: SzablonEtapu[] = [
  {
    klucz: "rozgrzewka",
    nazwa: "Rozgrzewka",
    opis: "Jedna dobra odpowiedź. Im szybciej, tym więcej punktów.",
    mnoznik: 1,
    czas_s: null,
    finalowy: false,
    seria: false,
    typy: ["wybor"],
  },
  {
    klucz: "blyskawica",
    nazwa: "Błyskawica",
    opis: "Prawda czy fałsz? Mało czasu, nie zastanawiaj się długo.",
    mnoznik: 1,
    czas_s: 10,
    finalowy: false,
    seria: false,
    typy: ["prawda_falsz"],
  },
  {
    klucz: "kilka",
    nazwa: "Kilka dobrych",
    opis: "Dobrych odpowiedzi może być kilka. Zaznacz wszystkie, za złe tracisz część punktów pytania.",
    mnoznik: 1.5,
    czas_s: null,
    finalowy: false,
    seria: false,
    typy: ["wielokrotny"],
  },
  {
    klucz: "szacowanie",
    nazwa: "Strzał liczbowy",
    opis: "Podaj liczbę. Trafienie to pełne punkty, a im bliżej, tym więcej.",
    mnoznik: 1.5,
    czas_s: null,
    finalowy: false,
    seria: false,
    typy: ["szacowanie"],
  },
  {
    klucz: "laczenie",
    nazwa: "Połącz i ułóż",
    opis: "Łączenie w pary i układanie po kolei. Punkty za każdy dobry kawałek.",
    mnoznik: 2,
    czas_s: null,
    finalowy: false,
    seria: false,
    typy: ["pary", "kolejnosc"],
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
    klucz: "final",
    nazwa: "Finał",
    opis: "Trzej najlepsi odpowiadają na serię pytań we własnym tempie. Na TV widać na żywo, kto jest bliżej piwa.",
    mnoznik: 2,
    czas_s: 60,
    finalowy: true,
    seria: true,
    typy: ["prawda_falsz"],
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

/** Szablony nowego quizu: gotowy zestaw etapów z liczbą pytań, do zmiany przed utworzeniem i potem. */
export const SZABLONY_QUIZU: SzablonQuizu[] = [
  {
    klucz: "klasyczny",
    nazwa: "Klasyczny pub quiz",
    opis: "Ok. 45 minut: od łatwych pytań do finału trójki.",
    etapy: [
      { szablon: "rozgrzewka", pytania: 6 },
      { szablon: "blyskawica", pytania: 4 },
      { szablon: "kilka", pytania: 3 },
      { szablon: "szacowanie", pytania: 3 },
      { szablon: "laczenie", pytania: 3 },
      { szablon: "final", pytania: 2 },
    ],
  },
  {
    klucz: "krotki",
    nazwa: "Krótki",
    opis: "Ok. 20 minut, np. jako przerywnik wieczoru.",
    etapy: [
      { szablon: "rozgrzewka", pytania: 5 },
      { szablon: "blyskawica", pytania: 4 },
      { szablon: "final", pytania: 2 },
    ],
  },
  {
    klucz: "degustacja",
    nazwa: "Degustacja",
    opis: "Z etapem na ślepo: lokal podaje deskę próbek.",
    etapy: [
      { szablon: "rozgrzewka", pytania: 4 },
      { szablon: "degustacja", pytania: 4 },
      { szablon: "szacowanie", pytania: 2 },
      { szablon: "final", pytania: 2 },
    ],
  },
  {
    klucz: "bez",
    nazwa: "Bez etapów",
    opis: "Same pytania po kolei, jak dawniej.",
    etapy: [],
  },
];

export const MAX_ETAPOW = 10;
export const MAX_PLAN_PYTAN = 50;
