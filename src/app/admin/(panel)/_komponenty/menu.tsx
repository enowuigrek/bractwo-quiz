"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Menu panelu na telefonie (26.10, Łukasz: zakładki, „Uruchom”, ustawienia i „Wyloguj” w jednym rzędzie robiły
 * bałagan). Obok logo sam przycisk z trzema kreskami, a po rozwinięciu: gra (rozgrywki i skrót do uruchomienia),
 * przygotowanie (quizy, lokale) i wylogowanie. Na komputerze zostaje pasek nawigacji (nawigacja.tsx).
 */
export function MenuPanelu({ wyloguj }: { wyloguj: () => Promise<void> }) {
  const sciezka = usePathname();
  const [otwarte, ustawOtwarte] = useState(false);
  const zamknij = () => ustawOtwarte(false);
  const pozycja = (href: string, tekst: string, aktywna = sciezka.startsWith(href)) => (
    <Link href={href} onClick={zamknij} aria-current={aktywna ? "page" : undefined}>
      {tekst}
    </Link>
  );
  const uruchamianie = sciezka.startsWith("/admin/gry/nowa");

  return (
    <div className="panel-menu">
      <button
        type="button"
        className="przycisk-maly ikona panel-menu-przycisk"
        aria-expanded={otwarte}
        aria-controls="panel-menu-lista"
        aria-label={otwarte ? "Zamknij menu" : "Menu"}
        onClick={() => ustawOtwarte((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
          {otwarte ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {otwarte && (
        <>
          <button type="button" className="panel-menu-tlo" aria-label="Zamknij menu" onClick={zamknij} />
          <nav id="panel-menu-lista" className="panel-menu-lista" aria-label="Panel">
            <p className="etykieta">Gra</p>
            {pozycja("/admin/gry", "Rozgrywki", sciezka.startsWith("/admin/gry") && !uruchamianie)}
            <Link href="/admin/gry/nowa" onClick={zamknij} className="przycisk zloty">
              ▶ Uruchom quiz
            </Link>
            <p className="etykieta">Przygotowanie</p>
            {pozycja("/admin/quizy", "Quizy")}
            {pozycja("/admin/lokale", "Lokale")}
            <form action={wyloguj}>
              <button type="submit" className="przycisk">
                Wyloguj
              </button>
            </form>
          </nav>
        </>
      )}
    </div>
  );
}
