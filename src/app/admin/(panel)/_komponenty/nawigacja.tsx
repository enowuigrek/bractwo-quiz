"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { IkonaUstawienia } from "@/components/ikony";

// Quizy = przygotowanie pytań, Rozgrywki = uruchomione quizy (trwające i historia).
const WSPOLNE = [
  { href: "/admin/gry", tekst: "Rozgrywki" },
  { href: "/admin/quizy", tekst: "Quizy" },
];

/**
 * `ustawienia`: lista lokali u głównego, strona własnego lokalu w panelu lokalu (wtedy zamiast zębatki logo lokalu).
 */
export function Nawigacja({
  ustawienia,
  lokal = null,
  tworca = false,
}: {
  ustawienia: string;
  lokal?: { nazwa: string; logo_url: string | null } | null;
  /** twórca ma jeszcze zakładkę „Konta” (30.10) */
  tworca?: boolean;
}) {
  const sciezka = usePathname();
  const POZYCJE = tworca ? [...WSPOLNE, { href: "/admin/konta", tekst: "Konta" }] : WSPOLNE;
  const uruchamianie = sciezka.startsWith("/admin/gry/nowa");
  const zeSciezki = uruchamianie ? -1 : POZYCJE.findIndex((p) => sciezka.startsWith(p.href));
  // kliknięta zakładka przejmuje pasek od razu, zanim wczyta się nowa strona; nowa ścieżka to kasuje
  const [klik, ustawKlik] = useState<{ sciezka: string; i: number } | null>(null);
  const aktywna = klik && klik.sciezka === sciezka ? klik.i : zeSciezki;

  // złoty pasek pod wybraną zakładką to jeden element, który przesuwa się między zakładkami (29.10); leży na szarej
  // linii nagłówka. Pierwsze ustawienie bez animacji, żeby po wczytaniu strony nie wjeżdżał z boku.
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
    <nav className="panel-nawigacja" aria-label="Panel">
      {POZYCJE.map((p, i) => (
        <Link
          key={p.href}
          href={p.href}
          ref={(el) => {
            zakladki.current[i] = el;
          }}
          className="zakladka"
          onClick={() => ustawKlik({ sciezka, i })}
          aria-current={i === aktywna ? "page" : undefined}
        >
          {p.tekst}
        </Link>
      ))}
      {pasek && (
        <span
          className={`nawigacja-pasek${pasek.animuj ? " animuj" : ""}`}
          style={{ transform: `translateX(${pasek.left}px)`, width: pasek.width }}
          aria-hidden
        />
      )}
      {/* najważniejsza akcja w lokalu: zawsze pod ręką */}
      <Link
        href="/admin/gry/nowa"
        className="przycisk-maly zloty nawigacja-start"
        aria-current={uruchamianie ? "page" : undefined}
      >
        ▶ Uruchom<span className="na-szerokim"> quiz</span>
      </Link>
      <Link
        href={ustawienia}
        className="przycisk-maly ikona nawigacja-ustawienia"
        aria-label="Ustawienia lokalu"
        data-podpis={lokal ? "Mój lokal" : "Ustawienia"}
        aria-current={sciezka.startsWith("/admin/lokale") ? "page" : undefined}
      >
        {lokal?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo lokalu z bucketu Supabase
          <img src={lokal.logo_url} alt="" className="nawigacja-logo-lokalu" />
        ) : (
          <IkonaUstawienia />
        )}
      </Link>
    </nav>
  );
}
