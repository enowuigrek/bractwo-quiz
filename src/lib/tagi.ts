// Tematyczne oznaczenia quizów (`quizy.tagi`): wpisywane po przecinku w panelu, do filtrowania listy quizów
// i wyboru quizu przy uruchamianiu gry.

export const MAX_TAGOW = 6;
export const MAX_DLUGOSC_TAGU = 30;

/** „Filmy, lata 90.,  filmy” → ["filmy", "lata 90."]: małe litery, bez pustych i powtórzeń, najwyżej `MAX_TAGOW`. */
export function czytajTagi(tekst: string): string[] {
  const tagi = tekst
    .split(/[,;\n]/)
    .map((t) => t.trim().replace(/^#/, "").replace(/\s+/g, " ").toLocaleLowerCase("pl").slice(0, MAX_DLUGOSC_TAGU))
    .filter(Boolean);
  return [...new Set(tagi)].slice(0, MAX_TAGOW);
}

/**
 * Rodzaj quizu: klasyczny pub quiz nie ma etapów (wtedy też bez finału, szklanki i pijanego finału), wyścig po piwo
 * ma etapy, a degustacja (02.11) to same piwa do oceny (`quizy.degustacja`).
 */
export type RodzajQuizu = "wyscig" | "klasyczny" | "degustacja";

export const RODZAJE_QUIZOW: readonly RodzajQuizu[] = ["wyscig", "klasyczny", "degustacja"];

export const NAZWY_RODZAJOW: Record<RodzajQuizu, string> = {
  wyscig: "Wyścig po piwo",
  klasyczny: "Pub quiz",
  degustacja: "Degustacja",
};

/** „Nowy wyścig po piwo”, „Nowy pub quiz”, „Nowa degustacja”: przycisk i nagłówek nowego quizu z nazwy zakładki (30.10). */
export const nowyQuiz = (rodzaj: RodzajQuizu) =>
  `${rodzaj === "degustacja" ? "Nowa" : "Nowy"} ${NAZWY_RODZAJOW[rodzaj].toLowerCase()}`;

/** Rodzaje, które rola widzi: degustacja tylko z `mozeDegustacje` (03.11). */
export const rodzajeQuizow = (zDegustacja: boolean): readonly RodzajQuizu[] =>
  zDegustacja ? RODZAJE_QUIZOW : RODZAJE_QUIZOW.filter((r) => r !== "degustacja");

/** Rodzaj z adresu (`?rodzaj=`), domyślnie wyścig (także degustacja dla roli, która jej nie widzi). */
export function rodzajZAdresu(wartosc: unknown, zDegustacja: boolean): RodzajQuizu {
  return wartosc === "klasyczny" || (zDegustacja && wartosc === "degustacja") ? wartosc : "wyscig";
}

/** Rodzaj quizu z jego wiersza: znacznik degustacji, a bez niego etapy. */
export function rodzajQuizu(q: { degustacja?: boolean | null; etapy?: { count: number }[] }): RodzajQuizu {
  if (q.degustacja) return "degustacja";
  return (q.etapy?.[0]?.count ?? 0) > 0 ? "wyscig" : "klasyczny";
}

/** Lista quizów na zakładce rodzaju (z `?` albo `&` na końcu, do dopisania parametrów). */
export const listaQuizow = (rodzaj: RodzajQuizu) =>
  rodzaj === "wyscig" ? "/admin/quizy?" : `/admin/quizy?rodzaj=${rodzaj}&`;

/** Wszystkie tagi z listy quizów, alfabetycznie. */
export function wszystkieTagi(quizy: { tagi: string[] }[]): string[] {
  return [...new Set(quizy.flatMap((q) => q.tagi))].sort((a, b) => a.localeCompare(b, "pl"));
}
