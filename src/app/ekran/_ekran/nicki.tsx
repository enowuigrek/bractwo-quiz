"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Awatar } from "@/components/awatar";
import type { GraczNaLiscie } from "@/lib/gra/typy";

/** Wielkość awatara na kolejnych stopniach zagęszczenia (klasy `.tv-nicki.st-N` w tv.css). */
const AWATAR = [58, 46, 36, 28, 22];

/** Stopień na start według liczby graczy; dalej zmniejsza się, aż lista zmieści się w swoim polu. */
function stopienDla(n: number): number {
  if (n <= 8) return 0;
  if (n <= 14) return 1;
  if (n <= 24) return 2;
  if (n <= 40) return 3;
  return 4;
}

/**
 * Gracze w poczekalni na TV: im więcej, tym mniejsze nicki i awatary (25.10: przy 12 graczach ostatni rząd wychodził
 * za ekran). Po każdej zmianie listy sprawdza, czy lista mieści się w polu `.tv-gracze`, i w razie potrzeby zmniejsza
 * się o stopień.
 */
export function NickiPoczekalni({ gracze }: { gracze: GraczNaLiscie[] }) {
  const lista = useRef<HTMLUListElement>(null);
  const [zmniejszenie, ustawZmniejszenie] = useState({ n: gracze.length, o: 0 });
  // nowa liczba graczy: liczymy od stopnia startowego (lista mogła też zmaleć)
  const o = zmniejszenie.n === gracze.length ? zmniejszenie.o : 0;
  const stopien = Math.min(AWATAR.length - 1, stopienDla(gracze.length) + o);

  useLayoutEffect(() => {
    const ul = lista.current;
    const pole = ul?.parentElement;
    if (!ul || !pole || stopien >= AWATAR.length - 1) return;
    if (ul.getBoundingClientRect().bottom > pole.getBoundingClientRect().bottom + 1) {
      ustawZmniejszenie({ n: gracze.length, o: o + 1 });
    }
  }, [gracze.length, stopien, o]);

  return (
    <ul ref={lista} className={`tv-nicki st-${stopien}`}>
      {gracze.map((g) => (
        <li key={g.nick}>
          <Awatar nick={g.nick} zdjecie={g.zdjecie} rozmiar={AWATAR[stopien]} />
          {g.nick}
        </li>
      ))}
    </ul>
  );
}
