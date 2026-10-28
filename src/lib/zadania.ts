// Typy zadań: kształt `dane` każdego typu, nazwy i podpowiedzi. Wspólne dla panelu, TV i telefonów.
// Rozwiązanie każdego typu jest w `dane.poprawna` i baza ukrywa je do fazy `wynik`
// (ocena: `wewn.ocena`, ostatnio w supabase/migrations/20261023112811_etapy.sql).

export const TYPY_ZADAN = [
  "wybor",
  "prawda_falsz",
  "wielokrotny",
  "kolejnosc",
  "pary",
  "szacowanie",
  "ciekawostka",
] as const;
export type TypZadania = (typeof TYPY_ZADAN)[number];

/**
 * Dodatki do pytania każdego typu: podpowiedzi odsłaniane po kolei w trakcie pytania (baza wysyła tylko
 * te, których czas już minął, w `ZadanieWidoczne.podpowiedzi`) i grafika, która na TV wyostrza się z czasem.
 */
export type Dodatki = { podpowiedzi?: string[]; odslaniaj?: boolean };

/** Jedna poprawna odpowiedź (indeks). Odpowiedź gracza: `{ odpowiedz: 2 }`. */
export type DaneWybor = { odpowiedzi: string[]; poprawna: number };
/** Prawda / fałsz: jak `wybor` z odpowiedziami „Prawda”, „Fałsz” (`poprawna` 0 albo 1). */
export type DanePrawdaFalsz = DaneWybor;
/**
 * Szacowanie liczby z zakresu `min`–`max` co `krok`. Pełne punkty za trafienie, dalej coraz mniej,
 * aż do zera w odległości `tolerancja`. Z `poprawna_do` dobry jest cały przedział `poprawna`–`poprawna_do`
 * (np. tripel 7,5–9,5%), a odległość liczy się od najbliższego brzegu. Odpowiedź gracza: `{ liczba: 1516 }`.
 */
export type DaneSzacowanie = {
  min: number;
  max: number;
  krok: number;
  tolerancja: number;
  jednostka: string | null;
  poprawna: number;
  poprawna_do?: number;
};
/** Kilka poprawnych (indeksy). Odpowiedź gracza: `{ odpowiedzi: [0, 2] }`. */
export type DaneWielokrotny = { odpowiedzi: string[]; poprawna: number[] };
/**
 * Elementy pomieszane do pokazania, `poprawna` = indeksy we właściwej kolejności. Odpowiedź: `{ kolejnosc: [..] }`.
 * Ocena: część dobrze ułożonych par sąsiadów (n − 1 par), patrz `wewn.ocena`.
 */
export type DaneKolejnosc = { elementy: string[]; poprawna: number[] };
/** `prawe` pomieszane, `poprawna[i]` = indeks prawego dla i-tego lewego. Odpowiedź: `{ pary: [..] }`. */
export type DanePary = { lewe: string[]; prawe: string[]; poprawna: number[] };
/**
 * Ciekawostka: plansza z grafiką (`grafika_url`), tytułem (`tresc`) i krótkim tekstem, bez odpowiedzi, punktów
 * i zegara. Nie liczy się do numeracji ani liczby pytań; pilot od razu przechodzi w fazę `wynik`.
 */
export type DaneCiekawostka = { tekst: string };

export type ZadanieDane =
  | { typ: "wybor"; dane: DaneWybor & Dodatki }
  | { typ: "prawda_falsz"; dane: DanePrawdaFalsz & Dodatki }
  | { typ: "wielokrotny"; dane: DaneWielokrotny & Dodatki }
  | { typ: "kolejnosc"; dane: DaneKolejnosc & Dodatki }
  | { typ: "pary"; dane: DanePary & Dodatki }
  | { typ: "szacowanie"; dane: DaneSzacowanie & Dodatki }
  | { typ: "ciekawostka"; dane: DaneCiekawostka & Dodatki };

/** Dane widziane przez TV i telefony: `poprawna` dochodzi dopiero od fazy `wynik`. */
export type DaneWidoczne = {
  odpowiedzi?: string[];
  elementy?: string[];
  lewe?: string[];
  prawe?: string[];
  min?: number;
  max?: number;
  krok?: number;
  tolerancja?: number;
  jednostka?: string | null;
  odslaniaj?: boolean;
  poprawna?: number | number[];
  /** Szacowanie z przedziałem: górny brzeg dobrych odpowiedzi (od fazy `wynik`, jak `poprawna`). */
  poprawna_do?: number;
  /** Szacowanie z przedziałem przed wynikiem: sam znacznik, bez liczb (28.10, „Celuj w widełki”). */
  przedzial?: boolean;
  /** Ciekawostka: tekst pod tytułem. */
  tekst?: string;
};

/** Odpowiedź gracza (kształt zależny od typu). */
export type DaneOdpowiedzi = {
  odpowiedz?: number;
  odpowiedzi?: number[];
  kolejnosc?: number[];
  pary?: number[];
  liczba?: number;
};

export const NAZWY_TYPOW: Record<TypZadania, string> = {
  wybor: "Jedna odpowiedź",
  prawda_falsz: "Prawda / fałsz",
  wielokrotny: "Kilka odpowiedzi",
  kolejnosc: "Kolejność",
  pary: "Pary",
  szacowanie: "Szacowanie liczby",
  ciekawostka: "Ciekawostka",
};

/** Podpowiedź dla graczy na TV i telefonie. */
export const PODPOWIEDZI_TYPOW: Record<TypZadania, string> = {
  wybor: "Wybierz jedną odpowiedź",
  prawda_falsz: "Prawda czy fałsz?",
  wielokrotny: "Zaznacz wszystkie poprawne",
  kolejnosc: "Ułóż we właściwej kolejności",
  pary: "Połącz w pary",
  szacowanie: "Podaj liczbę: im bliżej, tym więcej punktów",
  ciekawostka: "Patrz na telewizor",
};

/** Odpowiedzi pytania prawda / fałsz (kolejność jak w `dane.odpowiedzi`). */
export const PRAWDA_FALSZ = ["Prawda", "Fałsz"];

/** Typy z jedną odpowiedzią do stuknięcia (litery, rozkład głosów, „dobrze odpowiedziało”). */
export function jedenWybor(typ: TypZadania): boolean {
  return typ === "wybor" || typ === "prawda_falsz";
}

/** Liczba w polskim zapisie z jednostką, np. „1516”, „5,2 %”. */
export function liczbaZJednostka(n: number, jednostka?: string | null): string {
  const tekst = n.toLocaleString("pl-PL", { maximumFractionDigits: 2, useGrouping: Math.abs(n) >= 10000 });
  return jednostka ? `${tekst} ${jednostka}` : tekst;
}

/** Przedział dobrych odpowiedzi w szacowaniu: `[od, do]` (pojedyncza liczba: `od` = `do`). */
export function przedzialSzacowania(poprawna: number, poprawna_do?: number | null): [number, number] {
  return [poprawna, typeof poprawna_do === "number" ? Math.max(poprawna, poprawna_do) : poprawna];
}

/** Poprawna w szacowaniu do pokazania: „8,5 %” albo przedział „7,5–9,5 %”. */
export function poprawnaSzacowania(poprawna: number, poprawna_do?: number | null, jednostka?: string | null): string {
  const [od, do_] = przedzialSzacowania(poprawna, poprawna_do);
  return od === do_ ? liczbaZJednostka(od, jednostka) : `${liczbaZJednostka(od)}–${liczbaZJednostka(do_, jednostka)}`;
}

/** Plakietka nad osią i suwakiem szacowania: czy wystarczy trafić w przedział, czy trzeba w konkretną liczbę. */
export function celSzacowania(dane: DaneWidoczne): string {
  return dane.przedzial || typeof dane.poprawna_do === "number" ? "Celuj w widełki" : "Celuj w konkretną liczbę";
}

export const LITERY = "ABCDEF";

export function czyTypZadania(typ: unknown): typ is TypZadania {
  return typeof typ === "string" && (TYPY_ZADAN as readonly string[]).includes(typ);
}

/** Rozwiązanie jednym zdaniem, np. do listy pytań w panelu. */
export function opisRozwiazania(z: ZadanieDane): string {
  switch (z.typ) {
    case "wybor":
      return `Poprawna: ${LITERY[z.dane.poprawna]}. ${z.dane.odpowiedzi[z.dane.poprawna] ?? "?"}`;
    case "prawda_falsz":
      return `Poprawna: ${z.dane.odpowiedzi[z.dane.poprawna] ?? "?"}`;
    case "szacowanie":
      return `Poprawna: ${poprawnaSzacowania(z.dane.poprawna, z.dane.poprawna_do, z.dane.jednostka)} (zakres ${liczbaZJednostka(z.dane.min)}–${liczbaZJednostka(z.dane.max)})`;
    case "wielokrotny":
      return `Poprawne: ${z.dane.poprawna.map((i) => `${LITERY[i]}. ${z.dane.odpowiedzi[i]}`).join(", ")}`;
    case "kolejnosc":
      return `Kolejność: ${z.dane.poprawna.map((i) => z.dane.elementy[i]).join(" → ")}`;
    case "pary":
      return `Pary: ${z.dane.lewe.map((l, i) => `${l} – ${z.dane.prawe[z.dane.poprawna[i]]}`).join(", ")}`;
    case "ciekawostka":
      return z.dane.tekst;
  }
}

/** Odpowiedź gracza jednym zdaniem (historia gry w panelu). */
export function opisOdpowiedzi(z: ZadanieDane, o: DaneOdpowiedzi): string {
  const brak = "odpowiedź usunięta z pytania";
  switch (z.typ) {
    case "wybor":
      return o.odpowiedz === undefined ? brak : `${LITERY[o.odpowiedz]}. ${z.dane.odpowiedzi[o.odpowiedz] ?? brak}`;
    case "prawda_falsz":
      return o.odpowiedz === undefined ? brak : (z.dane.odpowiedzi[o.odpowiedz] ?? brak);
    case "szacowanie":
      return o.liczba === undefined ? brak : liczbaZJednostka(o.liczba, z.dane.jednostka);
    case "wielokrotny":
      return (o.odpowiedzi ?? []).map((i) => `${LITERY[i]}. ${z.dane.odpowiedzi[i] ?? "?"}`).join(", ");
    case "kolejnosc":
      return (o.kolejnosc ?? []).map((i) => z.dane.elementy[i] ?? "?").join(" → ");
    case "pary":
      return z.dane.lewe.map((l, i) => `${l} – ${z.dane.prawe[o.pary?.[i] ?? -1] ?? "?"}`).join(", ");
    case "ciekawostka":
      return "";
  }
}

/** Ocena 0..1 jako ułamek do pokazania, np. „3/4”. `n` = liczba części pytania. */
export function ulamek(ocena: number, n: number): string {
  return `${Math.round(ocena * n)}/${n}`;
}

/** Liczba części pytania (do „3/4”): poprawne w wielokrotnym, pary sąsiadów w kolejności (n − 1), pary. */
export function liczbaCzesci(typ: TypZadania, dane: DaneWidoczne): number {
  if (typ === "wielokrotny") return Array.isArray(dane.poprawna) ? dane.poprawna.length : 1;
  if (typ === "kolejnosc") return Math.max(1, (dane.elementy?.length ?? 2) - 1);
  if (typ === "pary") return dane.lewe?.length ?? 1;
  return 1;
}
