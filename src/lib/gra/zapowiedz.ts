"use client";

import { useEffect, useState } from "react";

// Zapowiedź quizu: godzina startu i odliczanie (ekran lokalu, TV gry, pilot).
// Start klika prowadzący (albo automat 5 minut po otwarciu poczekalni, src/lib/gra/auto.ts), więc po czasie
// odliczanie pokazuje tylko „Zaraz zaczynamy!”.

/** Zapowiedziana gra w lokalu (z `ekran_lokalu`). */
export type Zapowiedz = {
  planowany_start: string | null;
  tytul: string | null;
  okazja: string | null;
  browar: { nazwa: string; logo_url: string | null } | null;
  /** Ekran lokalu (`ekran_lokalu`): muzyka poczekalni gra już przy zapowiedzi. */
  muzyka?: boolean;
  /** Automatyczne prowadzenie: poczekalnia otworzy się sama o godzinie startu (ekran-lokalu.tsx). */
  auto?: boolean;
};

/** Godzina startu do wyświetlenia, np. „20:00”. */
export function godzinaStartu(iso: string): string {
  return new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

const W_DZIEN = ["w niedzielę", "w poniedziałek", "we wtorek", "w środę", "w czwartek", "w piątek", "w sobotę"];

/**
 * Kiedy start, do zdania „Start …”: „o 19:00” dziś, „jutro o 19:00”, „w środę 28.10 o 19:00” w tym tygodniu,
 * dalej sama data. Gra bywa zapowiedziana kilka dni wcześniej (ekran lokalu czeka na nią z muzyką).
 */
export function kiedyStart(iso: string, teraz = Date.now()): string {
  const start = new Date(iso);
  const godzina = `o ${godzinaStartu(iso)}`;
  const dzien = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dni = Math.round((dzien(start) - dzien(new Date(teraz))) / 86_400_000);
  if (dni <= 0) return godzina;
  if (dni === 1) return `jutro ${godzina}`;
  const data = start.toLocaleDateString("pl-PL", { day: "numeric", month: "2-digit" });
  return dni < 7 ? `${W_DZIEN[start.getDay()]} ${data} ${godzina}` : `${data} ${godzina}`;
}

/** Ile zostało do startu, np. „za 12:34” albo „za 2 h 05 min”. */
export function opisOdliczania(ms: number): string {
  if (ms <= 0) return "Zaraz zaczynamy!";
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  // kilka dni przed startem wystarczą dni (godzina i dzień są obok w „Start w środę 28.10 o 19:00”)
  if (h >= 48) return `za ${Math.floor(h / 24)} dni`;
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
