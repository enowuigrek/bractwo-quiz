"use client";

import { useEffect, useRef, useState } from "react";
import { Werble } from "@/components/werble";
import type { StanSesji } from "@/lib/gra/typy";
import { zegarPijany, type PijanePytanie } from "@/lib/pijany";
import { supabase } from "@/lib/supabase/przegladarka";

/** Po ilu sekundach „Prawda” klika się sama w pytaniu z efektem `samoklik`. */
const SAMOKLIK_S = 3.2;

/**
 * Telefon w trybie „Pijany finał” (faza `pijany`): dogrywka po finale, która nic nie liczy. Tryb jest ukryty
 * przed graczami: telefon wygląda jak dalsza seria, tylko numeracja leci za koniec (pytanie 15/14, 16/14…).
 * Każdy odpowiada we własnym tempie na pytania z `pijane_pytania`; odpowiedzi nigdzie nie idą. Z każdym
 * pytaniem cały ekran faluje mocniej (`--poziom` 0..1), a każde pytanie ma swój przeszkadzacz
 * (src/lib/pijany.ts). Kto pierwszy dojdzie do końca, gasi wszystkim ekrany (`zakoncz_pijany`): od razu
 * werble, bez ekranu „Gotowe!”. Tak samo po czasie albo przycisku pilota.
 */
export function PijanyFinal({ stan, teraz, token }: { stan: StanSesji; teraz: number; token: string }) {
  const [pytania, ustawPytania] = useState<PijanePytanie[] | null>(null);
  const [nr, ustawNr] = useState(0);
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

  // ostatnie pytanie za nami: werble dla wszystkich (baza zmienia fazę, reszta ekranów idzie za nią)
  const doKonca = pytania !== null && liczba > 0 && nr >= liczba;
  useEffect(() => {
    if (!doKonca) return;
    void supabase()
      .rpc("zakoncz_pijany", { p_token: token })
      .then(() => undefined);
  }, [doKonca, token]);
  // jak w serii: pasek i sekundy, tylko zegar wariuje jak na TV (w górę, w kółko, znika) i pasek razem z nim
  const calosc = Math.max(1, (do_ - od) / 1000);
  const zegar = zegarPijany((teraz - od) / 1000, calosc);
  const pasek = (
    <div className="gra-czas" aria-hidden>
      <div style={{ transform: `scaleX(${Math.min(1, (zegar ?? 0) / calosc)})` }} />
    </div>
  );

  // koniec pytań albo czasu: ekran od razu gaśnie jak przy werblach, zanim baza zmieni fazę
  if (skonczone) return <Werble />;

  return (
    <div className={`pijany${p ? ` efekt-${p.efekt}` : ""}`} style={{ "--poziom": poziom } as React.CSSProperties}>
      {!pytania || !p ? (
        // chwila ładowania: sam pasek, bez napisu, który zdradzałby dogrywkę
        pasek
      ) : (
        <div key={nr}>
          <p className="etykieta gra-pasek">
            <span>
              Seria · pytanie {wSerii + nr + 1}/{wSerii || liczba}
            </span>
            <span className="gra-kod" style={zegar === null ? { visibility: "hidden" } : undefined}>
              {zegar} s
            </span>
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
  );
}
