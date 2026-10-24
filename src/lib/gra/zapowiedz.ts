"use client";

import { useEffect, useState } from "react";

// Zapowiedź quizu: godzina startu i odliczanie (ekran lokalu, TV gry, pilot).
// Start i tak klika prowadzący, więc po czasie odliczanie pokazuje tylko „Zaraz zaczynamy!”.

/** Zapowiedziana gra w lokalu (z `ekran_lokalu`). */
export type Zapowiedz = {
  planowany_start: string | null;
  tytul: string | null;
  okazja: string | null;
  browar: { nazwa: string; logo_url: string | null } | null;
  /** Ekran lokalu (`ekran_lokalu`): muzyka poczekalni gra już przy zapowiedzi. */
  muzyka?: boolean;
};

/** Godzina startu do wyświetlenia, np. „20:00”. */
export function godzinaStartu(iso: string): string {
  return new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

/** Ile zostało do startu, np. „za 12:34” albo „za 2 h 05 min”. */
export function opisOdliczania(ms: number): string {
  if (ms <= 0) return "Zaraz zaczynamy!";
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  if (h > 0) return `za ${h} h ${String(min).padStart(2, "0")} min`;
  return `za ${min}:${String(s % 60).padStart(2, "0")}`;
}

/** Milisekundy do `cel` według zegara serwera (`przesuniecie`), odświeżane co sekundę. */
export function useDoStartu(cel: string | null, przesuniecie = 0): number | null {
  const [teraz, ustawTeraz] = useState(() => Date.now());
  useEffect(() => {
    if (!cel) return;
    const zegar = setInterval(() => ustawTeraz(Date.now()), 1000);
    return () => clearInterval(zegar);
  }, [cel]);
  return cel ? Date.parse(cel) - (teraz + przesuniecie) : null;
}
