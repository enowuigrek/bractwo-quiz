"use client";

import { useEffect, useRef, useState } from "react";
import type { StanSesji } from "@/lib/gra/typy";
import type { PijanePytanie } from "@/lib/pijany";
import { supabase } from "@/lib/supabase/przegladarka";

/** Po ilu sekundach „Prawda” klika się sama w pytaniu z efektem `samoklik`. */
const SAMOKLIK_S = 3.2;

/**
 * Telefon w trybie „Pijany finał” (faza `pijany`): dogrywka po finale, która nic nie liczy. Tryb jest ukryty
 * przed graczami: telefon wygląda jak dalsza seria, tylko numeracja leci za koniec (pytanie 15/14, 16/14…),
 * a na końcu „Odpowiedzi: 22 z 14”. Każdy odpowiada we własnym tempie na pytania z `pijane_pytania`;
 * odpowiedzi nigdzie nie idą. Z każdym pytaniem cały ekran faluje mocniej (`--poziom` 0..1), a każde pytanie
 * ma swój przeszkadzacz (src/lib/pijany.ts). Pęknięcia szybki zostają do końca fazy; po czasie albo
 * przycisku pilota przychodzą werble.
 */
export function PijanyFinal({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const [pytania, ustawPytania] = useState<PijanePytanie[] | null>(null);
  const [nr, ustawNr] = useState(0);
  const [pekniecia, ustawPekniecia] = useState(0);
  const [klik, ustawKlik] = useState(false);
  const od = stan.faza_od ? Date.parse(stan.faza_od) : teraz;
  const do_ = stan.faza_do ? Date.parse(stan.faza_do) : teraz;
  // numeracja ciągnie się dalej po serii: 15/14, 16/14…
  const wSerii = stan.etap?.liczba_pytan ?? 0;

  useEffect(() => {
    let anuluj = false;
    void supabase()
      .rpc("pijane_pytania", { p_kod: stan.kod })
      .then(({ data }) => {
        if (!anuluj && Array.isArray(data)) ustawPytania(data as PijanePytanie[]);
      });
    return () => {
      anuluj = true;
    };
  }, [stan.kod]);

  const p = pytania?.[nr] ?? null;

  function odpowiedz() {
    if (!p || klik) return;
    ustawKlik(true);
    // pytanie o osobę za barem i „wszystko naraz” kończą się pękniętą szybką
    if (p.efekt === "samoklik" || p.efekt === "chaos") ustawPekniecia((n) => n + 1);
    setTimeout(() => {
      ustawNr((n) => n + 1);
      ustawKlik(false);
    }, 450);
  }

  // samoklik: „Prawda” klika się sama, gdy „Fałsz” już zniknie
  const odpowiedzRef = useRef(odpowiedz);
  useEffect(() => {
    odpowiedzRef.current = odpowiedz;
  });
  const samoklik = p?.efekt === "samoklik";
  useEffect(() => {
    if (!samoklik) return;
    const zegar = setTimeout(() => odpowiedzRef.current(), SAMOKLIK_S * 1000);
    return () => clearTimeout(zegar);
  }, [samoklik, nr]);

  const liczba = pytania?.length ?? 0;
  const poziom = liczba > 1 ? Math.min(1, nr / (liczba - 1)) : 1;
  const zostalo = Math.max(0, do_ - teraz);
  const skonczone = pytania !== null && (nr >= liczba || zostalo <= 0);
  // jak w serii: pasek i sekundy, tylko czas dogrywki (pasek wraca do pełna, kolejny smaczek)
  const pasek = (
    <div className="gra-czas" aria-hidden>
      <div style={{ transform: `scaleX(${do_ > od ? Math.min(1, zostalo / (do_ - od)) : 0})` }} />
    </div>
  );

  return (
    <>
      <div
        className={`pijany${p && !skonczone ? ` efekt-${p.efekt}` : ""}`}
        style={{ "--poziom": skonczone ? 1 : poziom } as React.CSSProperties}
      >
        {!pytania ? (
          // chwila ładowania: sam pasek, bez napisu, który zdradzałby dogrywkę
          pasek
        ) : skonczone || !p ? (
          <>
            {pasek}
            <div className="werdykt czesciowo">
              <span className="werdykt-tytul">{nr < liczba ? "Koniec czasu!" : "Gotowe!"}</span>
              <span className="pomocniczy">
                Odpowiedzi: {wSerii + nr} z {wSerii || liczba}. Czekamy na resztę.
              </span>
            </div>
          </>
        ) : (
          <div key={nr}>
            <p className="etykieta gra-pasek">
              <span>
                Seria · pytanie {wSerii + nr + 1}/{wSerii || liczba}
                {p.efekt !== "brak" && <span className="seria-utrudnienie"> · utrudnienie!</span>}
              </span>
              <span className="gra-kod">{Math.ceil(zostalo / 1000)} s</span>
            </p>
            {pasek}
            <h2 className="gra-pytanie seria-pytanie pijany-pytanie">{p.tresc}</h2>
            <div className="odp-pf okragle pijane-przyciski">
              <button className="odp-pf-przycisk prawda" disabled={klik} onClick={odpowiedz} aria-label="Prawda">
                <span aria-hidden>✓</span>
              </button>
              <button className="odp-pf-przycisk falsz" disabled={klik} onClick={odpowiedz} aria-label="Fałsz">
                <span aria-hidden>✗</span>
              </button>
            </div>
          </div>
        )}
      </div>
      {pekniecia > 0 && <PeknietaSzybka ile={pekniecia} />}
    </>
  );
}

/** Pęknięcia od uderzenia: kolejne pękniecie dokłada kolejną gwiazdę rys (najwyżej trzy). */
const RYSY = [
  {
    x: 72,
    y: 58,
    linie: ["72,58 40,30 22,8", "72,58 98,40", "72,58 88,96 92,130", "72,58 48,84 20,120", "72,58 66,20 70,0"],
  },
  { x: 24, y: 140, linie: ["24,140 0,118", "24,140 60,128 100,150", "24,140 30,176 18,200", "24,140 50,104 64,88"] },
  { x: 60, y: 176, linie: ["60,176 80,200", "60,176 100,170", "60,176 34,196", "60,176 54,140 40,110"] },
];

function PeknietaSzybka({ ile }: { ile: number }) {
  return (
    <svg className="pijany-szybka" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden>
      {RYSY.slice(0, ile).map((r, i) => (
        <g key={i} className="pijany-rysa">
          <circle cx={r.x} cy={r.y} r="2.2" />
          {r.linie.map((l) => (
            <polyline key={l} points={l} />
          ))}
        </g>
      ))}
    </svg>
  );
}
