"use client";

import { useEffect, useRef, useState } from "react";
import { Werble } from "@/components/werble";
import type { StanSesji } from "@/lib/gra/typy";
import {
  czasReakcjiPijanej,
  GASNIECIE_S,
  KOMENTARZE_OGOLNE,
  zegarPijany,
  type PijanePytanie,
} from "@/lib/pijany";
import { supabase } from "@/lib/supabase/przegladarka";

/** Po ilu sekundach „Prawda” klika się sama w pytaniu z efektem `samoklik`. */
const SAMOKLIK_S = 3.2;
/** Jedno trzęsienie albo mignięcie reakcji; dłuższa reakcja to więcej powtórzeń, nie wolniejszy ruch. */
const TAKT_MS = 450;

/** Reakcja na odpowiedź: kolor losowy (tu nic nie jest dobre ani złe), komentarz z pytania albo ogólny. */
type Reakcja = { dobrze: boolean; wybrana: 0 | 1; komentarz: string | null; ms: number; strona: 1 | -1 };

/**
 * Telefon w trybie „Pijany finał” (faza `pijany`): dogrywka po finale, która nic nie liczy. Tryb jest ukryty
 * przed graczami: telefon wygląda jak dalsza seria, tylko numeracja leci za koniec (pytanie 15/14, 16/14…).
 * Każdy odpowiada we własnym tempie na pytania z `pijane_pytania` (cała pula, a gdy się skończy, od nowa);
 * odpowiedzi nigdzie nie idą. Po każdej odpowiedzi reakcja: błysk w losowym kolorze, drżenie albo puls
 * przycisku i czasem przelatujący komentarz („Serio?”), coraz dłużej (1 s → 3,5 s), więc nie da się tego
 * przeklikać. Cały ekran faluje coraz mocniej z upływem czasu (`--poziom` 0..1), a każde pytanie ma swój
 * przeszkadzacz (src/lib/pijany.ts). Koniec według zegara, wszystkim naraz: `GASNIECIE_S` przed końcem
 * ekran gaśnie z błyskiem (bez napisu, żeby spojrzeli na TV, gdzie zaraz wybucha szklanka), potem werble.
 */
export function PijanyFinal({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const [pytania, ustawPytania] = useState<PijanePytanie[] | null>(null);
  const [nr, ustawNr] = useState(0);
  const [reakcja, ustawReakcja] = useState<Reakcja | null>(null);
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

  const liczba = pytania?.length ?? 0;
  // pula się skończyła: od nowa (w tym chaosie nikt nie zauważy)
  const p = pytania && liczba > 0 ? pytania[nr % liczba] : null;
  const poziom = Math.min(1, Math.max(0, (teraz - od) / Math.max(1, do_ - od)));

  function odpowiedz(prawda: boolean) {
    if (!p || reakcja) return;
    const ms = czasReakcjiPijanej(poziom);
    const wlasny = prawda ? p.komentarz_prawda : p.komentarz_falsz;
    // bez własnego komentarza ogólny, coraz częściej
    const ogolny =
      Math.random() < 0.3 + 0.6 * poziom
        ? KOMENTARZE_OGOLNE[Math.floor(Math.random() * KOMENTARZE_OGOLNE.length)]
        : null;
    ustawReakcja({
      dobrze: Math.random() < 0.5,
      wybrana: prawda ? 0 : 1,
      komentarz: wlasny ?? ogolny,
      ms,
      strona: Math.random() < 0.5 ? 1 : -1,
    });
    setTimeout(() => {
      ustawNr((n) => n + 1);
      ustawReakcja(null);
    }, ms);
  }

  // samoklik: „Prawda” klika się sama, gdy „Fałsz” już zniknie
  const odpowiedzRef = useRef(odpowiedz);
  useEffect(() => {
    odpowiedzRef.current = odpowiedz;
  });
  const samoklik = p?.efekt === "samoklik";
  useEffect(() => {
    if (!samoklik) return;
    const zegar = setTimeout(() => odpowiedzRef.current(true), SAMOKLIK_S * 1000);
    return () => clearTimeout(zegar);
  }, [samoklik, nr]);

  // jak w serii: pasek i sekundy, tylko zegar wariuje jak na TV (w górę, w kółko, znika) i pasek razem z nim
  const calosc = Math.max(1, (do_ - od) / 1000);
  const zegar = zegarPijany((teraz - od) / 1000, calosc);
  const pasek = (
    <div className="gra-czas" aria-hidden>
      <div style={{ transform: `scaleX(${Math.min(1, (zegar ?? 0) / calosc)})` }} />
    </div>
  );

  // koniec: ekran gaśnie jak wyłączany telewizor, bez napisu; werble przyjdą z końcem fazy (gracz.tsx)
  if (do_ - teraz <= GASNIECIE_S * 1000) return <Werble napis={false} />;

  const powtorzenia = reakcja ? Math.max(1, Math.round(reakcja.ms / TAKT_MS)) : 1;
  const zmienneReakcji = reakcja
    ? ({ "--ocena-ms": `${reakcja.ms}ms`, "--powtorzenia": powtorzenia, "--strona": reakcja.strona } as React.CSSProperties)
    : undefined;

  return (
    <>
      {/* poza `.pijany`, bo jego transformacje przesunęłyby warstwy na całym ekranie */}
      {reakcja && (
        <>
          <div
            key={`blysk-${nr}`}
            className={`seria-blysk pijany-blysk ${reakcja.dobrze ? "dobrze" : "zle"}`}
            style={zmienneReakcji}
            aria-hidden
          />
          {reakcja.komentarz && (
            <p key={`komentarz-${nr}`} className="pijany-komentarz" style={zmienneReakcji} role="status">
              {reakcja.komentarz}
            </p>
          )}
        </>
      )}
      <div className={`pijany${p ? ` efekt-${p.efekt}` : ""}`} style={{ "--poziom": poziom } as React.CSSProperties}>
        {!p ? (
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
            <div
              className={`odp-pf okragle pijane-przyciski${reakcja ? (reakcja.dobrze ? " ocena-dobrze" : " ocena-zle") : ""}`}
              style={zmienneReakcji}
            >
              {([0, 1] as const).map((i) => (
                <button
                  key={i}
                  className={`odp-pf-przycisk ${i === 0 ? "prawda" : "falsz"}${
                    reakcja ? (reakcja.wybrana === i ? " wybrana" : " przygaszona") : ""
                  }`}
                  disabled={!!reakcja}
                  onClick={() => odpowiedz(i === 0)}
                  aria-label={i === 0 ? "Prawda" : "Fałsz"}
                >
                  <span aria-hidden>{i === 0 ? "✓" : "✗"}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
