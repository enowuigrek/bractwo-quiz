// Degustacja (02.11, docs/DEGUSTACJA.md): karta degustacyjna gościa, słowa na kafelkach i wyniki sali.
// Wspólne dla telefonu (karta), TV (chmura, „co poczuła sala”, podium piw) i panelu (raport dla piwowara).
// Karta leży w `odpowiedzi.dane` (`zapisz_karte`), a wyniki liczymy z kart anonimowo (`karty_degustacji`).

import type { StanSesji } from "./gra/typy";

/** Karta gościa. Każde pole opcjonalne: krok można pominąć. Suwaki 0–100. */
export type KartaPiwa = {
  kolor?: number;
  klarownosc?: number;
  piana?: number;
  aromaty?: string[];
  intensywnosc?: number;
  slodycz?: number;
  goryczka?: number;
  kwasnosc?: number;
  smaki?: string[];
  nagazowanie?: number;
  pelnia?: number;
  alkohol?: number;
  finisz?: number;
  wady?: string[];
  bez_wad?: boolean;
  /** Gwiazdki 1–5 co pół. */
  ocena?: number;
  jeszcze?: boolean;
  /** Zdanie dla piwowara (tylko w raporcie w panelu i na telefonie gościa). */
  notatka?: string;
};

export type Slowo = { klucz: string; napis: string };

/** Barwa od słomkowej do czarnej (kafelki z próbką koloru). */
export const KOLORY: { napis: string; kolor: string }[] = [
  { napis: "słomkowe", kolor: "#f3e08a" },
  { napis: "złote", kolor: "#e9c24a" },
  { napis: "bursztynowe", kolor: "#d58a2c" },
  { napis: "miedziane", kolor: "#b5592a" },
  { napis: "brązowe", kolor: "#6e3a1e" },
  { napis: "czarne", kolor: "#231511" },
];

export const KLAROWNOSC = ["klarowne", "lekko zamglone", "mętne"];

/** Aromaty i smaki w grupach, z prostym opisem dla laika. */
export const GRUPY_AROMATOW: { nazwa: string; slowa: (Slowo & { opis?: string })[] }[] = [
  {
    nazwa: "Owoce",
    slowa: [
      { klucz: "cytrusy", napis: "cytrusy", opis: "grejpfrut, cytryna, pomarańcza" },
      { klucz: "tropiki", napis: "owoce tropikalne", opis: "mango, marakuja, ananas" },
      { klucz: "owoce_czerwone", napis: "owoce czerwone", opis: "wiśnia, malina, porzeczka" },
      { klucz: "owoce_pestkowe", napis: "owoce pestkowe", opis: "brzoskwinia, morela, śliwka" },
      { klucz: "suszone", napis: "owoce suszone", opis: "rodzynki, figi, suszona śliwka" },
    ],
  },
  {
    nazwa: "Chmiel i zioła",
    slowa: [
      { klucz: "kwiaty", napis: "kwiaty" },
      { klucz: "zywica", napis: "żywica i sosna" },
      { klucz: "ziola", napis: "zioła i trawa" },
    ],
  },
  {
    nazwa: "Słód",
    slowa: [
      { klucz: "chleb", napis: "chleb i herbatniki" },
      { klucz: "miod", napis: "miód" },
      { klucz: "karmel", napis: "karmel i toffi" },
      { klucz: "kawa", napis: "kawa" },
      { klucz: "czekolada", napis: "czekolada" },
      { klucz: "palone", napis: "palone, przypalone" },
    ],
  },
  {
    nazwa: "Drożdże i inne",
    slowa: [
      { klucz: "banan", napis: "banan i goździk", opis: "jak w pszenicznym" },
      { klucz: "przyprawy", napis: "przyprawy", opis: "pieprz, kolendra" },
      { klucz: "kwasne", napis: "kwaśne" },
      { klucz: "drewno", napis: "drewno i beczka", opis: "wanilia, whisky, wino" },
      { klucz: "dym", napis: "dym" },
    ],
  },
];

/** Wady z opisem, czego szukać (pełna karta, piwo domowe). */
export const WADY: (Slowo & { opis: string })[] = [
  { klucz: "diacetyl", napis: "masło, popcorn", opis: "diacetyl" },
  { klucz: "dms", napis: "gotowana kukurydza", opis: "DMS" },
  { klucz: "utlenienie", napis: "mokry karton", opis: "utlenienie" },
  { klucz: "aldehyd", napis: "zielone jabłko", opis: "aldehyd octowy" },
  { klucz: "fenole", napis: "plaster, lekarstwo", opis: "fenole" },
  { klucz: "rozpuszczalnik", napis: "rozpuszczalnik", opis: "wyższe alkohole" },
  { klucz: "siarka", napis: "zapałka, jajko", opis: "siarka" },
  { klucz: "zakazenie", napis: "ocet, kwaśne nie w stylu", opis: "zakażenie" },
];

/** Suwaki karty: pole, nazwa i podpisy końców. */
export type Suwak = { pole: keyof KartaPiwa; nazwa: string; od: string; do: string };

export const SUWAKI: Record<"wyglad" | "aromat" | "smak" | "usta", Suwak[]> = {
  wyglad: [{ pole: "piana", nazwa: "Piana", od: "prawie brak", do: "gęsta czapa" }],
  aromat: [{ pole: "intensywnosc", nazwa: "Intensywność", od: "ledwo czuć", do: "uderza w nos" }],
  smak: [
    { pole: "slodycz", nazwa: "Słodycz", od: "wytrawne", do: "słodkie" },
    { pole: "goryczka", nazwa: "Goryczka", od: "łagodne", do: "bardzo gorzkie" },
    { pole: "kwasnosc", nazwa: "Kwaśność", od: "brak", do: "mocno kwaśne" },
  ],
  usta: [
    { pole: "nagazowanie", nazwa: "Nagazowanie", od: "płaskie", do: "musujące" },
    { pole: "pelnia", nazwa: "Pełnia", od: "wodniste", do: "gęste" },
    { pole: "alkohol", nazwa: "Alkohol", od: "nie czuć", do: "rozgrzewa" },
    { pole: "finisz", nazwa: "Finisz", od: "krótki", do: "długi" },
  ],
};

const WSZYSTKIE_SLOWA: Slowo[] = [...GRUPY_AROMATOW.flatMap((g) => g.slowa), ...WADY];

/** Napis słowa po kluczu (nieznany klucz zostaje sobą). */
export function napisSlowa(klucz: string): string {
  return WSZYSTKIE_SLOWA.find((s) => s.klucz === klucz)?.napis ?? klucz;
}

/** Gra jest degustacją: quiz z piwami (`quizy.degustacja`) albo bieżące zadanie to piwo. */
export function czyDegustacja(stan: Pick<StanSesji, "zadanie" | "quiz">): boolean {
  return !!stan.quiz?.degustacja || stan.zadanie?.typ === "piwo";
}

/** Gwiazdki: „4,5”. */
export const napisOceny = (n: number) => n.toLocaleString("pl-PL", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

/** Karty jednego piwa z `karty_degustacji`. */
export type KartyPiwa = { zadanie_id: string; karty: KartaPiwa[] };

/** Słowo z liczbą osób, od najczęstszego. */
export type Licznik = { klucz: string; napis: string; ile: number };

export type WynikSuwaka = Suwak & {
  srednia: number;
  /** Ile osób w każdej piątce zakresu (0–20, 20–40… 80–100). */
  rozklad: number[];
  ile: number;
};

/** Co poczuła sala: wszystko policzone z kart jednego piwa. */
export type WynikiSali = {
  ocen: number;
  kart: number;
  srednia: number | null;
  /** Ile ocen 1, 1,5 … 5 (9 przedziałów co pół gwiazdki). */
  gwiazdki: number[];
  aromaty: Licznik[];
  smaki: Licznik[];
  wady: Licznik[];
  bezWad: number;
  /** Ile osób w ogóle odpowiedziało na krok wad (zaznaczyło wadę albo „nic nie czuję”). */
  oWadach: number;
  jeszcze: { tak: number; z: number };
  kolor: number[];
  klarownosc: number[];
  suwaki: WynikSuwaka[];
};

function policz(listy: (string[] | undefined)[]): Licznik[] {
  const mapa = new Map<string, number>();
  for (const l of listy) for (const k of new Set(l ?? [])) mapa.set(k, (mapa.get(k) ?? 0) + 1);
  return [...mapa]
    .map(([klucz, ile]) => ({ klucz, napis: napisSlowa(klucz), ile }))
    .sort((a, b) => b.ile - a.ile || a.napis.localeCompare(b.napis, "pl"));
}

const liczba = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

export function wynikiSali(karty: KartaPiwa[]): WynikiSali {
  const oceny = karty.map((k) => k.ocena).filter(liczba);
  const gwiazdki = Array.from({ length: 9 }, () => 0);
  for (const o of oceny) gwiazdki[Math.max(0, Math.min(8, Math.round((o - 1) * 2)))]++;
  const ileWybrano = (pole: "kolor" | "klarownosc", n: number) => {
    const t = Array.from({ length: n }, () => 0);
    for (const k of karty) if (liczba(k[pole]) && k[pole]! >= 0 && k[pole]! < n) t[k[pole]!]++;
    return t;
  };
  const suwaki = Object.values(SUWAKI)
    .flat()
    .map((s) => {
      const w = karty.map((k) => k[s.pole]).filter(liczba);
      const rozklad = [0, 0, 0, 0, 0];
      for (const x of w) rozklad[Math.min(4, Math.floor(x / 20))]++;
      return { ...s, srednia: w.length ? w.reduce((a, b) => a + b, 0) / w.length : 0, rozklad, ile: w.length };
    });
  const oWadach = karty.filter((k) => k.bez_wad || (k.wady?.length ?? 0) > 0).length;
  return {
    ocen: oceny.length,
    kart: karty.length,
    srednia: oceny.length ? oceny.reduce((a, b) => a + b, 0) / oceny.length : null,
    gwiazdki,
    aromaty: policz(karty.map((k) => k.aromaty)),
    smaki: policz(karty.map((k) => k.smaki)),
    wady: policz(karty.map((k) => k.wady)),
    bezWad: karty.filter((k) => k.bez_wad && !(k.wady?.length ?? 0)).length,
    oWadach,
    jeszcze: {
      tak: karty.filter((k) => k.jeszcze === true).length,
      z: karty.filter((k) => typeof k.jeszcze === "boolean").length,
    },
    kolor: ileWybrano("kolor", KOLORY.length),
    klarownosc: ileWybrano("klarownosc", KLAROWNOSC.length),
    suwaki,
  };
}

/** Słowo z suwaka do porównania na telefonie: „łagodne”, „średnio”, „bardzo gorzkie”. */
export function slowoSuwaka(s: Suwak, x: number): string {
  if (x < 34) return s.od;
  if (x > 66) return s.do;
  return "pośrodku";
}

/** Chmura aromatów i smaków razem (TV w trakcie oceniania): każde słowo raz, z liczbą osób. */
export function chmura(karty: KartaPiwa[]): Licznik[] {
  return policz(karty.map((k) => [...(k.aromaty ?? []), ...(k.smaki ?? [])]));
}

/** Pola karty, które telefon wysyła (bez pustych). */
export function czystaKarta(k: KartaPiwa): KartaPiwa {
  return Object.fromEntries(
    Object.entries(k).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)),
  ) as KartaPiwa;
}

/** „1 ocena”, „3 oceny”, „5 ocen”. */
export function liczbaOcen(n: number): string {
  if (n === 1) return "1 ocena";
  const r10 = n % 10;
  const r100 = n % 100;
  return `${n} ${r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14) ? "oceny" : "ocen"}`;
}

/** Najczęstsza odpowiedź z listy liczników (barwa, klarowność) z liczbą osób, np. „złote (3)”. */
export function najczestsza(liczniki: number[], napisy: string[]): string | null {
  const max = Math.max(0, ...liczniki);
  if (!max) return null;
  return napisy
    .filter((_, i) => liczniki[i] === max)
    .map((n) => `${n} (${max})`)
    .join(", ");
}
