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

/** Rodzaj quizu z jego etapów: klasyczny pub quiz nie ma etapów (wtedy też bez finału, szklanki i pijanego finału). */
export type RodzajQuizu = "wyscig" | "klasyczny";

export const NAZWY_RODZAJOW: Record<RodzajQuizu, string> = {
  wyscig: "Wyścig po piwo",
  klasyczny: "Pub quiz",
};

/** Wszystkie tagi z listy quizów, alfabetycznie. */
export function wszystkieTagi(quizy: { tagi: string[] }[]): string[] {
  return [...new Set(quizy.flatMap((q) => q.tagi))].sort((a, b) => a.localeCompare(b, "pl"));
}
