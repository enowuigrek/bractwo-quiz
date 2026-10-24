"use client";

import { useSyncExternalStore } from "react";

// Czy przeglądarka TV pozwoliła już grać dźwięk. Bez gestu użytkownika (OK na pilocie TV, kliknięcie)
// przeglądarki nie odtworzą dźwięku; pierwsze udane `play()` muzyki to odblokowuje dla całej strony,
// a wtedy także wideo pękającej szklanki gra z dźwiękiem wybuchu (ekran/_ekran/pijany.tsx).

let odblokowany = false;
const sluchacze = new Set<() => void>();

export function odblokujDzwiek(): void {
  if (odblokowany) return;
  odblokowany = true;
  sluchacze.forEach((f) => f());
}

function subskrybuj(f: () => void) {
  sluchacze.add(f);
  return () => {
    sluchacze.delete(f);
  };
}

export function useDzwiekOdblokowany(): boolean {
  return useSyncExternalStore(
    subskrybuj,
    () => odblokowany,
    () => false,
  );
}
