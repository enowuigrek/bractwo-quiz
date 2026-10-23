// Typy zadań: kształt `dane` każdego typu, nazwy i podpowiedzi. Wspólne dla panelu, TV i telefonów.
// Rozwiązanie każdego typu jest w `dane.poprawna` i baza ukrywa je do fazy `wynik`
// (ocena: `wewn.ocena` w supabase/migrations/20261022162605_typy_pytan.sql).

export const TYPY_ZADAN = ["wybor", "wielokrotny", "kolejnosc", "pary"] as const;
export type TypZadania = (typeof TYPY_ZADAN)[number];

/** Jedna poprawna odpowiedź (indeks). Odpowiedź gracza: `{ odpowiedz: 2 }`. */
export type DaneWybor = { odpowiedzi: string[]; poprawna: number };
/** Kilka poprawnych (indeksy). Odpowiedź gracza: `{ odpowiedzi: [0, 2] }`. */
export type DaneWielokrotny = { odpowiedzi: string[]; poprawna: number[] };
/**
 * Elementy pomieszane do pokazania, `poprawna` = indeksy we właściwej kolejności. Odpowiedź: `{ kolejnosc: [..] }`.
 * Ocena: część dobrze ułożonych par sąsiadów (n − 1 par), patrz `wewn.ocena`.
 */
export type DaneKolejnosc = { elementy: string[]; poprawna: number[] };
/** `prawe` pomieszane, `poprawna[i]` = indeks prawego dla i-tego lewego. Odpowiedź: `{ pary: [..] }`. */
export type DanePary = { lewe: string[]; prawe: string[]; poprawna: number[] };

export type ZadanieDane =
  | { typ: "wybor"; dane: DaneWybor }
  | { typ: "wielokrotny"; dane: DaneWielokrotny }
  | { typ: "kolejnosc"; dane: DaneKolejnosc }
  | { typ: "pary"; dane: DanePary };

/** Dane widziane przez TV i telefony: `poprawna` dochodzi dopiero od fazy `wynik`. */
export type DaneWidoczne = {
  odpowiedzi?: string[];
  elementy?: string[];
  lewe?: string[];
  prawe?: string[];
  poprawna?: number | number[];
};

/** Odpowiedź gracza (kształt zależny od typu). */
export type DaneOdpowiedzi = { odpowiedz?: number; odpowiedzi?: number[]; kolejnosc?: number[]; pary?: number[] };

export const NAZWY_TYPOW: Record<TypZadania, string> = {
  wybor: "Jedna odpowiedź",
  wielokrotny: "Kilka odpowiedzi",
  kolejnosc: "Kolejność",
  pary: "Pary",
};

/** Podpowiedź dla graczy na TV i telefonie. */
export const PODPOWIEDZI_TYPOW: Record<TypZadania, string> = {
  wybor: "Wybierz jedną odpowiedź",
  wielokrotny: "Zaznacz wszystkie poprawne",
  kolejnosc: "Ułóż we właściwej kolejności",
  pary: "Połącz w pary",
};

export const LITERY = "ABCDEF";

export function czyTypZadania(typ: unknown): typ is TypZadania {
  return typeof typ === "string" && (TYPY_ZADAN as readonly string[]).includes(typ);
}

/** Rozwiązanie jednym zdaniem, np. do listy pytań w panelu. */
export function opisRozwiazania(z: ZadanieDane): string {
  switch (z.typ) {
    case "wybor":
      return `Poprawna: ${LITERY[z.dane.poprawna]}. ${z.dane.odpowiedzi[z.dane.poprawna] ?? "?"}`;
    case "wielokrotny":
      return `Poprawne: ${z.dane.poprawna.map((i) => `${LITERY[i]}. ${z.dane.odpowiedzi[i]}`).join(", ")}`;
    case "kolejnosc":
      return `Kolejność: ${z.dane.poprawna.map((i) => z.dane.elementy[i]).join(" → ")}`;
    case "pary":
      return `Pary: ${z.dane.lewe.map((l, i) => `${l} – ${z.dane.prawe[z.dane.poprawna[i]]}`).join(", ")}`;
  }
}

/** Odpowiedź gracza jednym zdaniem (historia gry w panelu). */
export function opisOdpowiedzi(z: ZadanieDane, o: DaneOdpowiedzi): string {
  const brak = "odpowiedź usunięta z pytania";
  switch (z.typ) {
    case "wybor":
      return o.odpowiedz === undefined ? brak : `${LITERY[o.odpowiedz]}. ${z.dane.odpowiedzi[o.odpowiedz] ?? brak}`;
    case "wielokrotny":
      return (o.odpowiedzi ?? []).map((i) => `${LITERY[i]}. ${z.dane.odpowiedzi[i] ?? "?"}`).join(", ");
    case "kolejnosc":
      return (o.kolejnosc ?? []).map((i) => z.dane.elementy[i] ?? "?").join(" → ");
    case "pary":
      return z.dane.lewe.map((l, i) => `${l} – ${z.dane.prawe[o.pary?.[i] ?? -1] ?? "?"}`).join(", ");
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
