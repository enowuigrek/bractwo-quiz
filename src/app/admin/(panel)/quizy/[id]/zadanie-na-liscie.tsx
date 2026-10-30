"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { EdytorZadania } from "./zadania/edytor";

type PropsEdytora = Omit<ComponentProps<typeof EdytorZadania>, "naLiscie" | "onZapisano" | "onZwin">;

/**
 * Pytanie na liście quizu (28.10): kliknięcie rozwija edytor w tym samym miejscu, zapis albo „Zwiń” go chowa, a
 * ostatnio zapisane pytanie zostaje wyróżnione. Wcześniej edycja była osobną stroną i po powrocie Łukasz nie wiedział,
 * gdzie skończył. Edytor powstaje dopiero po rozwinięciu, więc zawsze startuje z aktualnych danych.
 */
export function ZadanieNaLiscie({
  id,
  naglowek,
  akcje,
  edytor,
}: {
  id: string;
  naglowek: ReactNode;
  akcje: ReactNode;
  edytor: PropsEdytora;
}) {
  const [otwarte, ustawOtwarte] = useState(false);
  const [zapisane, ustawZapisane] = useState(false);
  return (
    <li id={`z-${id}`} className={`zadanie-wiersz${zapisane && !otwarte ? " zapisane" : ""}`}>
      <details
        className="zadanie-rozwijane"
        open={otwarte}
        onToggle={(e) => ustawOtwarte(e.currentTarget.open)}
      >
        <summary>{naglowek}</summary>
        {otwarte && (
          <div className="zadanie-edytor">
            <EdytorZadania
              {...edytor}
              naLiscie
              onZapisano={() => {
                ustawOtwarte(false);
                ustawZapisane(true);
              }}
              onZwin={() => ustawOtwarte(false)}
            />
          </div>
        )}
      </details>
      <div className="lista-akcje">{akcje}</div>
    </li>
  );
}

/**
 * Nowe pytanie na liście (miejsce z planu etapu albo „+ Dodaj pytanie”): rozwija pusty edytor w tym miejscu, a po
 * dodaniu pytanie pojawia się na liście i formularz zwija się pusty.
 */
export function NowePytanie({
  napis,
  className,
  edytor,
}: {
  napis: string;
  className?: string;
  edytor: PropsEdytora;
}) {
  const [otwarte, ustawOtwarte] = useState(false);
  return (
    <details
      className={`zadanie-rozwijane nowe-pytanie${className ? ` ${className}` : ""}`}
      open={otwarte}
      onToggle={(e) => ustawOtwarte(e.currentTarget.open)}
    >
      {/* jak wiersz pytania (30.10): złoty „+” w kolumnie numerów, napis w miejscu treści, strzałka z prawej */}
      <summary>
        <span className="krok-nr nowe-pytanie-plus" aria-hidden>
          +
        </span>
        <span className="nowe-pytanie-napis">{napis}</span>
      </summary>
      {otwarte && (
        <div className="zadanie-edytor">
          <EdytorZadania
            {...edytor}
            naLiscie
            onZapisano={() => ustawOtwarte(false)}
            onZwin={() => ustawOtwarte(false)}
          />
        </div>
      )}
    </details>
  );
}
