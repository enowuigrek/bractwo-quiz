// Wyścig zamiast tabeli rankingu: meta to koniec quizu. Po każdym pytaniu lider przesuwa się o kolejny
// odcinek trasy (pytanie lp z n to lp/n trasy), a reszta stoi za nim proporcjonalnie do swoich punktów.
// Na końcu lider jest na mecie, nikt jej nie przekroczy i nikt nie utknie przed nią.

/** Ile torów mieści wyścig na TV; przy większej liczbie graczy zostaje tabela. */
export const MAX_W_WYSCIGU = 12;

/** Położenie na trasie 0..1. */
export function naTrasie(punkty: number, lider: number, lp: number, liczbaPytan: number): number {
  if (lider <= 0 || liczbaPytan <= 0) return 0;
  return Math.max(0, Math.min(1, (lp / liczbaPytan) * (punkty / lider)));
}
