"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Menu panelu na telefonie (26.10, Łukasz: zakładki, „Uruchom”, ustawienia i „Wyloguj” w jednym rzędzie robiły
 * bałagan). Obok logo trzy kreski (bez kółka), które po kliknięciu zamieniają się w krzyżyk, a z prawej wysuwa się
 * panel na całą wysokość: gra (uruchomienie i rozgrywki), przygotowanie (quizy, lokale) i na dole wylogowanie.
 * Na komputerze zostaje pasek nawigacji (nawigacja.tsx).
 */
export function MenuPanelu({ wyloguj }: { wyloguj: () => Promise<void> }) {
  const sciezka = usePathname();
  const [otwarte, ustawOtwarte] = useState(false);
  const zamknij = () => ustawOtwarte(false);
  const uruchamianie = sciezka.startsWith("/admin/gry/nowa");

  // otwarty panel: strona pod spodem się nie przewija, a Escape go zamyka
  useEffect(() => {
    if (!otwarte) return;
    const przewijanie = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const klawisz = (e: KeyboardEvent) => {
      if (e.key === "Escape") ustawOtwarte(false);
    };
    window.addEventListener("keydown", klawisz);
    return () => {
      document.body.style.overflow = przewijanie;
      window.removeEventListener("keydown", klawisz);
    };
  }, [otwarte]);

  const pozycja = (href: string, tekst: string, opis: string, aktywna = sciezka.startsWith(href)) => (
    <Link href={href} onClick={zamknij} aria-current={aktywna ? "page" : undefined} className="panel-menu-pozycja">
      <strong>{tekst}</strong>
      <span>{opis}</span>
    </Link>
  );

  return (
    <div className={`panel-menu${otwarte ? " otwarte" : ""}`}>
      <button
        type="button"
        className="panel-menu-przycisk"
        aria-expanded={otwarte}
        aria-controls="panel-menu-szuflada"
        aria-label={otwarte ? "Zamknij menu" : "Menu"}
        onClick={() => ustawOtwarte((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>
      {/* zawsze w drzewie, żeby wysuwanie i przyciemnienie miały przejście w obie strony */}
      <div className="panel-menu-tlo" aria-hidden onClick={zamknij} />
      <nav id="panel-menu-szuflada" className="panel-menu-szuflada" aria-label="Panel" inert={!otwarte}>
        <section>
          <p className="etykieta">Gra</p>
          <Link href="/admin/gry/nowa" onClick={zamknij} className="przycisk zloty panel-menu-start">
            ▶ Uruchom quiz
          </Link>
          {pozycja("/admin/gry", "Rozgrywki", "trwające gry i historia", sciezka.startsWith("/admin/gry") && !uruchamianie)}
        </section>
        <section>
          <p className="etykieta">Przygotowanie</p>
          {pozycja("/admin/quizy", "Quizy", "pytania, etapy, kosz")}
          {pozycja("/admin/lokale", "Lokale", "logo, ekran lokalu")}
        </section>
        <form action={wyloguj} className="panel-menu-wyloguj">
          <button type="submit" className="przycisk">
            Wyloguj
          </button>
        </form>
      </nav>
    </div>
  );
}
