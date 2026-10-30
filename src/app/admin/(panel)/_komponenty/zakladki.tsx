"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

export type Zakladka = { href: string; napis: string; aktywna: boolean };

/**
 * Zakładki widoku strony (`.zakladki`: rodzaj quizu na listach, „Gracze / Pytania” w wynikach). Złoty pasek to jeden
 * element, który przesuwa się między zakładkami, tak jak w nawigacji nagłówka (30.10, Łukasz: ma działać tak samo);
 * przestawia się od razu po kliknięciu, nie po wczytaniu strony. Pierwsze ustawienie bez animacji.
 */
export function Zakladki({ pozycje, etykieta, przewijaj = true }: { pozycje: Zakladka[]; etykieta: string; przewijaj?: boolean }) {
  const zAdresu = pozycje.findIndex((p) => p.aktywna);
  // kliknięta zakładka przejmuje pasek od razu; gdy strona przyjdzie z nową aktywną zakładką, rządzi znowu adres
  const [klik, ustawKlik] = useState<{ z: number; i: number } | null>(null);
  const aktywna = klik && klik.z === zAdresu ? klik.i : zAdresu;

  const zakladki = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pasek, ustawPasek] = useState<{ left: number; width: number; animuj: boolean } | null>(null);
  useLayoutEffect(() => {
    const zmierz = () => {
      const el = aktywna >= 0 ? zakladki.current[aktywna] : null;
      ustawPasek((p) => (el ? { left: el.offsetLeft, width: el.offsetWidth, animuj: !!p } : null));
    };
    zmierz();
    window.addEventListener("resize", zmierz);
    return () => window.removeEventListener("resize", zmierz);
  }, [aktywna]);

  return (
    <nav className="zakladki" aria-label={etykieta}>
      {pozycje.map((p, i) => (
        <Link
          key={p.href}
          href={p.href}
          scroll={przewijaj}
          ref={(el) => {
            zakladki.current[i] = el;
          }}
          onClick={() => ustawKlik({ z: zAdresu, i })}
          aria-current={i === aktywna ? "page" : undefined}
        >
          {p.napis}
        </Link>
      ))}
      {pasek && (
        <span
          className={`zakladki-pasek${pasek.animuj ? " animuj" : ""}`}
          style={{ transform: `translateX(${pasek.left}px)`, width: pasek.width }}
          aria-hidden
        />
      )}
    </nav>
  );
}
