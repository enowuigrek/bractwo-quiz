/** Czas odpowiedzi do wyświetlenia, np. „3,4 s” (telefon, TV i historia w panelu). */
export function sekundy(ms: number): string {
  return `${(ms / 1000).toLocaleString("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
}
