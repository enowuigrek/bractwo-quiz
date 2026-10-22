"use client";
/* eslint-disable @next/next/no-img-element -- logo z /public skalowane CSS-em na scenie 1920×1080 */

import { useEffect, useState } from "react";
import { Loga } from "./tv";

/** Co ile ms zmienia się plansza na ekranie lokalu bez gry. */
const ZMIANA_MS = 10_000;
const LICZBA_PLANSZ = 3;

type Props = { lokal: { nazwa: string; logo_url: string | null } };

/**
 * Ekran lokalu, gdy nie ma gry: plansze zmieniane co 10 s.
 * Własne plansze z panelu (zapowiedzi, grafiki) są w POMYSLY.md.
 */
export function Plansze({ lokal }: Props) {
  const [nr, ustawNr] = useState(0);
  useEffect(() => {
    const zegar = setInterval(() => ustawNr((n) => (n + 1) % LICZBA_PLANSZ), ZMIANA_MS);
    return () => clearInterval(zegar);
  }, []);

  return (
    <div className="plansze">
      <div key={nr} className="plansza">
        {nr === 0 && (
          <div className="plansza-srodek">
            <div className="plansza-loga">
              <Loga lokal={lokal} />
            </div>
            <h1 className="plansza-tytul">Quiz Bractwa Piwnego</h1>
            <p className="tv-okazja">Wkrótce start · {lokal.nazwa}</p>
          </div>
        )}
        {nr === 1 && (
          <div className="plansza-jak">
            <h1 className="plansza-tytul">Jak grać?</h1>
            <ol className="plansza-kroki">
              <li>
                <span>1</span> Zeskanuj telefonem kod QR, który pojawi się na tym ekranie.
              </li>
              <li>
                <span>2</span> Wpisz swój nick albo nazwę drużyny.
              </li>
              <li>
                <span>3</span> Odpowiadaj na telefonie. Im szybciej dobrze odpowiesz, tym więcej punktów!
              </li>
            </ol>
          </div>
        )}
        {nr === 2 && (
          <div className="plansza-srodek">
            <img src="/loga/bractwo.svg" alt="Bractwo Piwne" className="logo-bractwo plansza-logo-duze" />
            <h1 className="plansza-haslo">Piwu Cześć!</h1>
          </div>
        )}
      </div>
      <ol className="plansze-kropki" aria-hidden>
        {Array.from({ length: LICZBA_PLANSZ }, (_, i) => (
          <li key={i} className={i === nr ? "teraz" : undefined} />
        ))}
      </ol>
    </div>
  );
}
