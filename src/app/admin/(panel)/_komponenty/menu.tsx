"use client";
/* eslint-disable @next/next/no-img-element -- logo lokalu z bucketu Supabase */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Menu panelu na telefonie (26.10, Łukasz: zakładki, „Uruchom”, ustawienia i „Wyloguj” w jednym rzędzie robiły
 * bałagan). Obok logo trzy kreski (bez kółka), które po kliknięciu zamieniają się w krzyżyk, a z prawej wysuwa się
 * panel na całą wysokość: gra (uruchomienie albo skrót do trwającej gry, rozgrywki), przygotowanie (quizy, lokale)
 * i na dole wylogowanie. W panelu na komputerze zostaje pasek nawigacji (nawigacja.tsx), w pilocie menu jest zawsze.
 */
/** Trwająca gra: w menu skrót do jej pilota zamiast „Uruchom quiz” (kilku naraz zwykle nie prowadzimy). */
export type GraWMenu = {
  href: string;
  tytul: string;
  kod: string;
  faza: string;
  poczekalniaOtwarta: boolean;
  lokal: { nazwa: string; logo_url: string | null } | null;
};

type KolorStatusu = "szary" | "zielony" | "zloty" | "czerwony" | "niebieski";

/** Status gry w menu: krótki napis i kolor pastylki, żeby stan było widać bez czytania (26.10). */
export function statusGry(faza: string, poczekalniaOtwarta: boolean): { napis: string; kolor: KolorStatusu } {
  if (faza === "poczekalnia") {
    return poczekalniaOtwarta ? { napis: "Poczekalnia", kolor: "zielony" } : { napis: "Zapowiedź", kolor: "szary" };
  }
  if (faza === "wstep" || faza === "etap") return { napis: "Plansza", kolor: "zloty" };
  if (faza === "przygotuj" || faza === "pytanie") return { napis: "Pytanie", kolor: "zloty" };
  if (faza === "wynik" || faza === "odpowiedzi" || faza === "ranking") return { napis: "Wyniki pytania", kolor: "zloty" };
  if (faza === "seria") return { napis: "Finał", kolor: "czerwony" };
  if (faza === "pijany") return { napis: "Pijany finał", kolor: "czerwony" };
  if (faza === "werble") return { napis: "Werble", kolor: "czerwony" };
  if (faza === "podium" || faza === "tabela") return { napis: "Podium", kolor: "niebieski" };
  return { napis: "Zakończona", kolor: "szary" };
}

export function MenuPanelu({
  wyloguj,
  gra = null,
  ustawienia = "/admin/lokale",
  lokal = false,
}: {
  wyloguj: () => Promise<void>;
  gra?: GraWMenu | null;
  /** Lista lokali u głównego, strona własnego lokalu w panelu lokalu. */
  ustawienia?: string;
  lokal?: boolean;
}) {
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
          {gra ? (
            <Link href={gra.href} onClick={zamknij} className="panel-menu-gra">
              {gra.lokal?.logo_url ? (
                <img src={gra.lokal.logo_url} alt="" />
              ) : (
                <span className="miniatura-pusta" aria-hidden />
              )}
              <span className="panel-menu-gra-opis">
                <span className="panel-menu-gra-tytul">
                  <strong>{gra.tytul}</strong>
                  <span className="gra-kod">{gra.kod}</span>
                </span>
                {gra.lokal && <span className="panel-menu-gra-lokal">{gra.lokal.nazwa}</span>}
                <span className={`status-gry ${statusGry(gra.faza, gra.poczekalniaOtwarta).kolor}`}>
                  {statusGry(gra.faza, gra.poczekalniaOtwarta).napis}
                </span>
              </span>
            </Link>
          ) : (
            <Link href="/admin/gry/nowa" onClick={zamknij} className="przycisk zloty panel-menu-start">
              ▶ Uruchom quiz
            </Link>
          )}
          {pozycja("/admin/gry", "Rozgrywki", "trwające gry i historia", sciezka.startsWith("/admin/gry") && !uruchamianie)}
        </section>
        <section>
          <p className="etykieta">Przygotowanie</p>
          {pozycja("/admin/quizy", "Quizy", "pytania, etapy, kosz")}
          {lokal
            ? pozycja(ustawienia, "Mój lokal", "logo, hasło, ekran lokalu", sciezka.startsWith("/admin/lokale"))
            : pozycja("/admin/lokale", "Lokale", "logo, hasła, ekrany lokali")}
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
